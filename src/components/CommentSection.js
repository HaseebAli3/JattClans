import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const CommentSection = ({ articleId, api, currentUser, getAvatarColor }) => {
  // State management
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState('');
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    isSubmitting: false,
    isLiking: {},
    isDeleting: {}
  });
  const [expandedReplies, setExpandedReplies] = useState({});

  // Memoized fetch function with improved error handling
  const fetchComments = useCallback(async () => {
    if (!articleId) return;
    
    try {
      setLoadingState(prev => ({ ...prev, isLoading: true }));
      setError('');

      const { data } = await api.get('comments/', { 
        params: { 
          article: articleId, 
          expand: 'user.profile,article',
          include_likes: currentUser?.id || undefined
        } 
      });

      // Transform comments into a nested structure
      const commentsById = data.reduce((acc, comment) => {
        acc[comment.id] = { ...comment, replies: [] };
        return acc;
      }, {});

      // Build the comment tree
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
      setError(err.response?.data?.detail || 'Failed to load comments. Please try again later.');
    } finally {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }
  }, [articleId, api, currentUser]);

  // Fetch comments on mount and when articleId changes
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

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
      
      let errorMessage = 'Failed to post comment. Please try again.';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Please login to post comments';
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data?.article) {
          errorMessage = 'Invalid article reference';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoadingState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Like handler with optimistic updates
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
      setError(err.response?.status === 401 
        ? 'Please login to like comments'
        : 'Failed to like comment');
      
      // Revert optimistic update
      fetchComments();
    } finally {
      setLoadingState(prev => ({ 
        ...prev, 
        isLiking: { ...prev.isLiking, [commentId]: false } 
      }));
    }
  };

  // Delete handler with confirmation
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
      setError(err.response?.status === 403
        ? 'You are not authorized to delete this comment'
        : 'Failed to delete comment');
    } finally {
      setLoadingState(prev => ({ 
        ...prev, 
        isDeleting: { ...prev.isDeleting, [commentId]: false } 
      }));
    }
  };

  // Check if current user can modify a comment
  const canModify = (comment) => {
    return currentUser && (currentUser.id === comment.user.id || currentUser.is_staff);
  };

  // Toggle replies visibility
  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
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
          className={`rounded-full flex items-center justify-center ${getAvatarColor(user.id)}`}
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

  // Reply form component
  const ReplyForm = ({ commentId }) => {
    if (replyTo !== commentId || !currentUser) return null;

    return (
      <form onSubmit={handleSubmit} className="mt-4 ml-8 pl-4 border-l-2 border-gray-200">
        <div className="flex gap-3">
          <UserAvatar user={currentUser} size={32} />
          <div className="flex-grow">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full p-3 border rounded-lg mb-2 min-h-[80px] focus:ring-2 focus:ring-blue-500"
              placeholder="Write your reply..."
              required
              disabled={loadingState.isSubmitting}
            />
            <div className="flex justify-between items-center">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                disabled={!newComment.trim() || loadingState.isSubmitting}
              >
                {loadingState.isSubmitting ? 'Posting...' : 'Post Reply'}
              </button>
              <button 
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    );
  };

  // Comment component
  const Comment = ({ comment, isReply = false }) => (
    <div className={`${isReply ? 'ml-8 pl-4 border-l-2 border-gray-200' : 'border-b pb-6'}`}>
      <div className="flex items-start gap-3 mb-2">
        <UserAvatar user={comment.user} size={isReply ? 32 : 40} />
        
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${comment.user.id}`} className={`${isReply ? 'text-sm font-medium' : 'font-semibold'} hover:underline`}>
              {comment.user.username}
            </Link>
            {comment.user.is_staff && (
              <span className={`${isReply ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'} bg-blue-500 text-white rounded`}>
                Admin
              </span>
            )}
            <span className={`${isReply ? 'text-xs' : 'text-sm'} text-gray-400`}>
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>
          
          <p className={`${isReply ? 'text-sm' : ''} text-gray-700 whitespace-pre-line mt-1`}>
            {comment.content}
          </p>
          
          <div className={`flex items-center gap-4 mt-2 ${isReply ? 'text-xs' : ''}`}>
            <button 
              onClick={() => handleLike(comment.id)}
              disabled={loadingState.isLiking[comment.id]}
              className={`flex items-center gap-1 ${comment.is_liked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`${isReply ? 'h-4 w-4' : 'h-5 w-5'}`} viewBox="0 0 20 20" fill={comment.is_liked ? "currentColor" : "none"} stroke="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span>{comment.likes || 0}</span>
              {loadingState.isLiking[comment.id] && (
                <svg className="animate-spin ml-1 h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </button>
            
            {currentUser && (
              <button 
                onClick={() => setReplyTo(comment.id)}
                className="text-gray-500 hover:text-blue-500"
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
                  className="text-gray-500 hover:text-blue-500"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(comment.id)}
                  disabled={loadingState.isDeleting[comment.id]}
                  className="text-gray-500 hover:text-red-500"
                >
                  {loadingState.isDeleting[comment.id] ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ReplyForm commentId={comment.id} />

      {!isReply && comment.replies?.length > 0 && (
        <div className="mt-4">
          {!expandedReplies[comment.id] && comment.replies.length > 3 && (
            <button 
              onClick={() => toggleReplies(comment.id)}
              className="text-sm text-blue-500 hover:underline mb-2"
            >
              View all {comment.replies.length} replies
            </button>
          )}
          
          <div className={`space-y-4 ${!expandedReplies[comment.id] && comment.replies.length > 3 ? 'hidden' : ''}`}>
            {comment.replies.map(reply => (
              <Comment key={reply.id} comment={reply} isReply />
            ))}
          </div>
          
          {expandedReplies[comment.id] && comment.replies.length > 3 && (
            <button 
              onClick={() => toggleReplies(comment.id)}
              className="text-sm text-blue-500 hover:underline mt-2"
            >
              Hide replies
            </button>
          )}
        </div>
      )}
    </div>
  );

  // Calculate total comment count
  const totalComments = comments.reduce(
    (acc, comment) => acc + 1 + (comment.replies?.length || 0), 
    0
  );

  return (
    <div className="mt-8 border-t pt-8">
      <h2 className="text-2xl font-bold mb-6">Comments ({totalComments})</h2>
      
      {/* Main comment form */}
      {currentUser && !replyTo && (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <UserAvatar user={currentUser} size={40} />
            <div className="flex-grow">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-4 border rounded-lg mb-3 min-h-[120px] focus:ring-2 focus:ring-blue-500"
                placeholder="Share your thoughts..."
                required
                disabled={loadingState.isSubmitting}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                disabled={!newComment.trim() || loadingState.isSubmitting}
              >
                {loadingState.isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </form>
      )}

      {!currentUser && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg text-blue-800">
          Please <Link href="/login" className="text-blue-600 hover:underline">login</Link> to post comments
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
          {error}
          <button 
            onClick={() => setError('')} 
            className="float-right text-red-800 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {loadingState.isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;