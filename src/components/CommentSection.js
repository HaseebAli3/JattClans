import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';

function CommentSection({ articleId, api, currentUser, getAvatarColor }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('comments/', { 
        params: { article: articleId } 
      });
      // Sort comments by date (newest first) and replies stay with their parents
      const sortedComments = response.data
        .filter(comment => !comment.parent) // Get only parent comments
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(parent => ({
          ...parent,
          replies: response.data
            .filter(comment => comment.parent === parent.id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        }));
      
      setComments(sortedComments);
      setError('');
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (articleId) fetchComments();
  }, [articleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      setIsSubmitting(true);
      const commentData = {
        article: articleId,
        content: newComment,
        parent: replyTo
      };
      
      await api.post('comments/create/', commentData);
      setNewComment('');
      setReplyTo(null);
      setError('');
      fetchComments(); // Refresh comments after submission
    } catch (err) {
      console.error('Error posting comment:', err);
      setError(err.response?.status === 401 
        ? 'Please login to post comments' 
        : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId) => {
    try {
      await api.post('like/', { comment_id: commentId });
      fetchComments(); // Refresh comments after like
    } catch (err) {
      console.error('Error liking comment:', err);
      setError('Failed to like comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await api.delete(`comments/${commentId}/`);
      fetchComments(); // Refresh comments after deletion
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  const canModifyComment = (comment) => {
    return currentUser && (
      currentUser.id === comment.user.id || 
      currentUser.is_staff
    );
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // User avatar component with circular design
  const UserAvatar = ({ user, size = 40 }) => {
    return (
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
  };

  // Render reply form below a specific comment
  const renderReplyForm = (commentId) => {
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
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post Reply'}
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

  return (
    <div className="mt-8 border-t pt-8">
      <h2 className="text-2xl font-bold mb-6">Comments ({comments.reduce((acc, comment) => acc + 1 + (comment.replies?.length || 0), 0)})</h2>
      
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
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
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

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b pb-6">
              <div className="flex items-start gap-3 mb-2">
                <UserAvatar user={comment.user} size={40} />
                
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${comment.user.id}`} className="font-semibold hover:underline">
                      {comment.user.username}
                    </Link>
                    {comment.user.is_staff && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                    <span className="text-sm text-gray-400">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-800 whitespace-pre-line mt-1">
                    {comment.content}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <button 
                      onClick={() => handleLike(comment.id)}
                      className={`flex items-center gap-1 ${comment.is_liked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={comment.is_liked ? "currentColor" : "none"} stroke="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span>{comment.likes || 0}</span>
                    </button>
                    
                    {currentUser && (
                      <button 
                        onClick={() => setReplyTo(comment.id)}
                        className="text-gray-500 hover:text-blue-500"
                      >
                        Reply
                      </button>
                    )}
                    
                    {canModifyComment(comment) && (
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
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Render reply form directly below this comment if it's being replied to */}
              {renderReplyForm(comment.id)}

              {/* Replies section */}
              {comment.replies?.length > 0 && (
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
                      <div key={reply.id} className="ml-8 pl-4 border-l-2 border-gray-200">
                        <div className="flex items-start gap-3 mb-2">
                          <UserAvatar user={reply.user} size={32} />
                          <div className="flex-grow">
                            <div className="flex items-center gap-2">
                              <Link href={`/profile/${reply.user.id}`} className="text-sm font-medium hover:underline">
                                {reply.user.username}
                              </Link>
                              {reply.user.is_staff && (
                                <span className="text-xs bg-blue-500 text-white px-1 py-0.5 rounded">
                                  Admin
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {new Date(reply.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-line mt-1">
                              {reply.content}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <button 
                                onClick={() => handleLike(reply.id)}
                                className={`flex items-center gap-1 text-xs ${reply.is_liked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill={reply.is_liked ? "currentColor" : "none"} stroke="currentColor">
                                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                <span>{reply.likes || 0}</span>
                              </button>
                              
                              {currentUser && (
                                <button 
                                  onClick={() => setReplyTo(reply.id)}
                                  className="text-xs text-gray-500 hover:text-blue-500"
                                >
                                  Reply
                                </button>
                              )}
                              
                              {canModifyComment(reply) && (
                                <>
                                  <button 
                                    onClick={() => {
                                      setNewComment(reply.content);
                                      setReplyTo(null);
                                    }}
                                    className="text-xs text-gray-500 hover:text-blue-500"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="text-xs text-gray-500 hover:text-red-500"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Render reply form directly below this reply if it's being replied to */}
                        {renderReplyForm(reply.id)}
                      </div>
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
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentSection;