import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaHeart, FaRegHeart, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const CommentSection = ({ articleId, api, currentUser }) => {
  // State management
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    isSubmitting: false,
    isLiking: {},
    isDeleting: {}
  });

  // Memoized fetch function
  const fetchComments = useCallback(async () => {
    if (!articleId) return;
    
    try {
      setLoadingState(prev => ({ ...prev, isLoading: true }));
      setError('');

      const { data } = await api.get('comments/', { 
        params: { 
          article: articleId,
          include_likes: currentUser?.id || undefined
        } 
      });

      // Organize comments into parent-child structure
      const commentsById = data.reduce((acc, comment) => {
        acc[comment.id] = { ...comment, replies: [] };
        return acc;
      }, {});

      const rootComments = [];
      data.forEach(comment => {
        if (comment.parent) {
          if (commentsById[comment.parent]) {
            commentsById[comment.parent].replies.push(commentsById[comment.id]);
          }
        } else {
          rootComments.push(commentsById[comment.id]);
        }
      });

      // Sort by date (newest first)
      const sortedComments = rootComments
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(comment => ({
          ...comment,
          replies: comment.replies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        }));

      setComments(sortedComments);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError(err.response?.data?.detail || 'Failed to load comments');
    } finally {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }
  }, [articleId, api, currentUser]);

  // Fetch comments on mount
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Toggle comment thread visibility
  const toggleCommentThread = (commentId) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Comment submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      setLoadingState(prev => ({ ...prev, isSubmitting: true }));
      setError('');

      await api.post('comments/create/', {
        article: articleId,
        content: newComment.trim(),
        parent: replyTo || undefined
      });

      setNewComment('');
      setReplyTo(null);
      await fetchComments();
    } catch (err) {
      console.error('Comment submission failed:', err);
      setError(err.response?.status === 401 
        ? 'Please login to post comments'
        : 'Failed to post comment');
    } finally {
      setLoadingState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Like handler
  const handleLike = async (commentId) => {
    if (!currentUser) {
      setError('Please login to like comments');
      return;
    }

    try {
      setLoadingState(prev => ({ 
        ...prev, 
        isLiking: { ...prev.isLiking, [commentId]: true } 
      }));

      // Optimistic update
      setComments(prevComments => 
        prevComments.map(comment => {
          if (comment.id === commentId) {
            const isLiked = !comment.is_liked;
            return {
              ...comment,
              is_liked: isLiked,
              likes: isLiked ? comment.likes + 1 : comment.likes - 1
            };
          }
          return comment;
        })
      );

      await api.post('like/', { comment_id: commentId });
    } catch (err) {
      console.error('Failed to like comment:', err);
      setError('Failed to like comment');
      fetchComments(); // Revert to server state
    } finally {
      setLoadingState(prev => ({ 
        ...prev, 
        isLiking: { ...prev.isLiking, [commentId]: false } 
      }));
    }
  };

  // Delete handler
  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      setLoadingState(prev => ({ 
        ...prev, 
        isDeleting: { ...prev.isDeleting, [commentId]: true } 
      }));

      await api.delete(`comments/${commentId}/`);
      await fetchComments();
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setError('Failed to delete comment');
    } finally {
      setLoadingState(prev => ({ 
        ...prev, 
        isDeleting: { ...prev.isDeleting, [commentId]: false } 
      }));
    }
  };

  // Check if user can modify comment
  const canModify = (comment) => {
    return currentUser && (currentUser.id === comment.user.id || currentUser.is_staff);
  };

  // User avatar component
  const UserAvatar = ({ user, size = 40 }) => (
    <Link href={`/profile/${user.id}`} className="flex-shrink-0">
      {user.profile?.profile_picture ? (
        <div className="rounded-full overflow-hidden" style={{ width: size, height: size }}>
          <Image
            src={user.profile.profile_picture}
            alt={user.username}
            width={size}
            height={size}
            className="object-cover"
          />
        </div>
      ) : (
        <div 
          className="rounded-full flex items-center justify-center bg-teal-500"
          style={{ 
            width: size, 
            height: size,
            fontSize: size * 0.5,
            fontWeight: 'bold',
            color: 'white'
          }}
        >
          {user.username.charAt(0).toUpperCase()}
        </div>
      )}
    </Link>
  );

  // Comment component
  const Comment = ({ comment, depth = 0 }) => {
    const isReply = depth > 0;
    const hasManyReplies = comment.replies?.length > 2;
    const showAllReplies = expandedComments[comment.id] !== false;

    return (
      <div className={`bg-white rounded-lg p-4 mb-3 ${isReply ? 'ml-8 border-l-2 border-teal-200 pl-4' : ''}`}>
        <div className="flex items-start gap-3">
          <UserAvatar user={comment.user} size={isReply ? 32 : 40} />
          
          <div className="flex-grow">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/profile/${comment.user.id}`} className="font-medium text-teal-800 hover:underline">
                {comment.user.username}
              </Link>
              {comment.user.is_staff && (
                <span className="text-xs px-2 py-0.5 bg-teal-600 text-white rounded">
                  Admin
                </span>
              )}
              <span className="text-xs text-gray-500">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>
            
            <p className="text-gray-800 whitespace-pre-line mt-1">
              {comment.content}
            </p>
            
            <div className="flex items-center gap-4 mt-2 text-sm">
              {/* Only show like button for top-level comments */}
              {!isReply && (
                <button 
                  onClick={() => handleLike(comment.id)}
                  disabled={loadingState.isLiking[comment.id]}
                  className={`flex items-center gap-1 ${comment.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                >
                  {comment.is_liked ? <FaHeart /> : <FaRegHeart />}
                  <span>{comment.likes || 0}</span>
                </button>
              )}
              
              {currentUser && (
                <button 
                  onClick={() => setReplyTo(comment.id)}
                  className="text-teal-600 hover:text-teal-800"
                >
                  Reply
                </button>
              )}
              
              {canModify(comment) && (
                <>
                  <button 
                    onClick={() => {
                      setNewComment(comment.content);
                      setReplyTo(null);
                    }}
                    className="text-teal-600 hover:text-teal-800"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(comment.id)}
                    disabled={loadingState.isDeleting[comment.id]}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>

            {/* Reply form */}
            {replyTo === comment.id && currentUser && (
              <form onSubmit={handleSubmit} className="mt-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-2 border border-teal-300 rounded mb-2 text-gray-800 bg-white"
                  placeholder="Write your reply..."
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-teal-600 text-white px-3 py-1 rounded text-sm"
                    disabled={loadingState.isSubmitting}
                  >
                    Post Reply
                  </button>
                  <button 
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="text-gray-500 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-3">
            {hasManyReplies && (
              <button
                onClick={() => toggleCommentThread(comment.id)}
                className="flex items-center text-sm text-teal-600 hover:text-teal-800 mb-2"
              >
                {showAllReplies ? (
                  <>
                    <FaChevronUp className="mr-1" />
                    Hide replies
                  </>
                ) : (
                  <>
                    <FaChevronDown className="mr-1" />
                    View {comment.replies.length} replies
                  </>
                )}
              </button>
            )}

            {showAllReplies && (
              <div className="space-y-3">
                {comment.replies.map(reply => (
                  <Comment key={reply.id} comment={reply} depth={depth + 1} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">
        Comments ({comments.reduce((acc, c) => acc + 1 + c.replies.length, 0)})
      </h3>
      
      {/* Comment form */}
      {currentUser && !replyTo && (
        <form onSubmit={handleSubmit} className="mb-6 bg-white rounded-lg p-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-3 border border-teal-300 rounded mb-3 text-gray-800 bg-white"
            placeholder="Share your thoughts..."
            required
          />
          <button
            type="submit"
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
            disabled={loadingState.isSubmitting}
          >
            Post Comment
          </button>
        </form>
      )}

      {!currentUser && (
        <div className="mb-4 p-3 bg-teal-50 text-teal-800 rounded">
          Please <Link href="/login" className="text-teal-600 font-medium">login</Link> to post comments
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {error}
          <button 
            onClick={() => setError('')} 
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Comments list */}
      {loadingState.isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;