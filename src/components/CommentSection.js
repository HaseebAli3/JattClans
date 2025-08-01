import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';

function CommentSection({ articleId, api }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('comments/', { 
        params: { article: articleId } 
      });
      // Sort comments by likes (top comments first)
      const sortedComments = response.data.sort((a, b) => b.likes - a.likes);
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
      
      const response = await api.post('comments/create/', commentData);
      setComments([response.data, ...comments]);
      setNewComment('');
      setReplyTo(null);
      setError('');
    } catch (err) {
      console.error('Error posting comment:', err);
      if (err.response?.status === 401) {
        setError('Please login to post comments');
      } else {
        setError('Failed to post comment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId) => {
    try {
      await api.post('like/', { comment_id: commentId });
      fetchComments(); // Refresh comments to update like counts
    } catch (err) {
      console.error('Error liking comment:', err);
      setError('Failed to like comment');
    }
  };

  const canModifyComment = (comment) => {
    return currentUser && (
      currentUser.id === comment.user.id || 
      currentUser.is_staff
    );
  };

  return (
    <div className="mt-8 border-t pt-8">
      <h2 className="text-2xl font-bold mb-6">Comments ({comments.length})</h2>
      
      {/* Comment form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-8">
          {replyTo && (
            <div className="mb-2 p-2 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">Replying to comment</p>
              <button 
                type="button" 
                onClick={() => setReplyTo(null)}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                Cancel reply
              </button>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-4 border rounded-lg mb-3 min-h-[120px] focus:ring-2 focus:ring-blue-500"
            placeholder={replyTo ? "Write your reply..." : "Share your thoughts..."}
            required
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? 'Posting...' : replyTo ? 'Post Reply' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg text-blue-800">
          Please <Link href="/login" className="text-blue-600 hover:underline">login</Link> to post comments
        </div>
      )}

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className={`border-b pb-6 ${comment.parent ? 'ml-8 pl-4 border-l-2 border-gray-200' : ''}`}>
              <div className="flex items-start gap-3 mb-2">
                <Link href={`/profile/${comment.user.id}`} className="flex-shrink-0">
                  {comment.user.profile?.profile_picture ? (
                    <Image
                      src={comment.user.profile.profile_picture}
                      alt={comment.user.username}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">
                        {comment.user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </Link>
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
                      className="flex items-center gap-1 text-gray-500 hover:text-blue-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
                            setReplyTo(null);
                            setNewComment(comment.content);
                            // You'll need to implement edit functionality
                          }}
                          className="text-gray-500 hover:text-blue-500"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Delete this comment?')) {
                              // Implement delete functionality
                            }
                          }}
                          className="text-gray-500 hover:text-red-500"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 space-y-4">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="ml-8 pl-4 border-l-2 border-gray-200">
                      <div className="flex items-start gap-3 mb-2">
                        <Link href={`/profile/${reply.user.id}`} className="flex-shrink-0">
                          {reply.user.profile?.profile_picture ? (
                            <Image
                              src={reply.user.profile.profile_picture}
                              alt={reply.user.username}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-500">
                                {reply.user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </Link>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <Link href={`/profile/${reply.user.id}`} className="text-sm font-medium hover:underline">
                              {reply.user.username}
                            </Link>
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
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              <span>{reply.likes || 0}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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