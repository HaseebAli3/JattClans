import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import CommentSection from '../../components/CommentSection';
import Image from 'next/image';
import { useRouter } from 'next/router';

// Create axios instance with enhanced interceptors
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Enhanced response interceptor
api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && 
        !originalRequest._retry &&
        !originalRequest.url.includes('token/')) {
      
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        handleLogout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          'http://localhost:8000/api/token/refresh/',
          { refresh: refreshToken }
        );
        
        localStorage.setItem('access_token', response.data.access);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        handleLogout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

const handleLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

const getAvatarColor = (userId) => {
  const colors = [
    'bg-red-400', 'bg-blue-400', 'bg-green-400', 
    'bg-yellow-400', 'bg-purple-400', 'bg-pink-400'
  ];
  return colors[userId % colors.length];
};

export default function ArticleDetail() {
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    if (!router.isReady || !id) {
      if (!id) setError('Invalid article ID');
      setIsLoading(false);
      return;
    }

    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`articles/${id}/`);
        setArticle(response.data);
        setError('');
      } catch (error) {
        console.error('Error fetching article:', error);
        setError(error.response?.status === 404 
          ? 'Article not found' 
          : 'Failed to load article');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [router.isReady, id]);

  const handleLikeArticle = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    try {
      setIsLiking(true);
      await api.post('like/', { article_id: article.id });
      
      // Update the article data after like action
      const updatedArticle = await api.get(`articles/${id}/`);
      setArticle(updatedArticle.data);
    } catch (err) {
      console.error('Error liking article:', err);
      setError('Failed to like article');
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentUpdate = async (commentId, updatedContent) => {
    try {
      await api.put(`comments/${commentId}/`, { content: updatedContent });
      const updatedArticle = await api.get(`articles/${id}/`);
      setArticle(updatedArticle.data);
      return true;
    } catch (error) {
      console.error('Error updating comment:', error);
      if (error.response?.status === 403) {
        setError('You are not authorized to edit this comment');
      } else {
        setError('Failed to update comment');
      }
      return false;
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      await api.delete(`comments/${commentId}/`);
      const updatedArticle = await api.get(`articles/${id}/`);
      setArticle(updatedArticle.data);
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      if (error.response?.status === 403) {
        setError('You are not authorized to delete this comment');
      } else {
        setError('Failed to delete comment');
      }
      return false;
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  if (!article) return <div className="container mx-auto p-4">Article not found</div>;

  return (
    <div>
      <Navbar currentPage="articles" />
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
          {article.author.profile?.profile_picture ? (
            <Image
              src={article.author.profile.profile_picture}
              alt={article.author.username}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full ${getAvatarColor(article.author.id)} flex items-center justify-center`}>
              <span className="text-white font-medium">
                {article.author.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium">{article.author.username}</p>
            <p className="text-sm text-gray-500">
              {new Date(article.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {article.thumbnail && (
          <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
            <Image
              src={article.thumbnail}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <span>Category: {article.category.name}</span>
          <span>Views: {article.views}</span>
          <span>Likes: {article.likes}</span>
        </div>

        {/* Like Button */}
        <div className="mb-6">
          <button
            onClick={handleLikeArticle}
            disabled={isLiking}
            className={`flex items-center gap-1 px-3 py-1 rounded-full border ${
              article.is_liked 
                ? 'bg-red-50 border-red-200 text-red-500' 
                : 'bg-gray-50 border-gray-200 text-gray-500'
            } hover:bg-gray-100 transition-colors`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill={article.is_liked ? "currentColor" : "none"} 
              stroke="currentColor"
              strokeWidth="2"
            >
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span>{article.is_liked ? 'Unlike' : 'Like'}</span>
            {isLiking && (
              <svg className="animate-spin ml-1 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
          </button>
        </div>

        <div className="prose max-w-none mb-8" dangerouslySetInnerHTML={{ __html: article.content }} />
        
        {/* Comment Section */}
        <CommentSection 
          articleId={article.id} 
          api={api} 
          currentUser={currentUser} 
          onCommentUpdate={handleCommentUpdate}
          onCommentDelete={handleCommentDelete}
          getAvatarColor={getAvatarColor}
        />
      </div>
    </div>
  );
}