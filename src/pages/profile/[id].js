import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/router';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    // Check if id is null, not numeric, or negative
    if (!id || isNaN(id) || parseInt(id) <= 0) {
      setError('Invalid profile ID. Redirecting to articles page.');
      setLoading(false);
      setTimeout(() => router.push('/articles'), 2000);
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // Fetch profile data
        const profileResponse = await api.get(`profile/${id}/`);
        setProfile(profileResponse.data);

        // Fetch user's comments
        const commentsRes = await api.get(`comments/?user=${id}&expand=article`);
        
        // Handle comments response
        const commentsData = Array.isArray(commentsRes.data) 
          ? commentsRes.data 
          : commentsRes.data.results || [];
        setComments(commentsData);

        // Fetch articles where user commented
        const articleIds = [...new Set(
          commentsData
            .filter(comment => comment.article && comment.article.id)
            .map(comment => comment.article.id)
        )];

        const articlesPromises = articleIds.map(articleId => 
          api.get(`articles/${articleId}/`)
        );
        const articlesResponses = await Promise.all(articlesPromises);
        setArticles(articlesResponses.map(res => res.data));

        setError('');
      } catch (err) {
        console.error('Error fetching profile data:', err);
        if (err.response) {
          switch (err.response.status) {
            case 404:
              setError('Profile not found. The user may have been deleted or does not exist.');
              break;
            case 401:
              setError('Authentication failed. Please log in again.');
              localStorage.removeItem('access_token');
              router.push('/login');
              break;
            case 403:
              setError('You do not have permission to view this profile.');
              break;
            case 500:
              setError('Server error. Please try again later or contact support.');
              break;
            default:
              setError(`Failed to load profile data: ${err.response.data?.detail || err.message}`);
          }
        } else if (err.request) {
          setError('Network error. Please check your internet connection and try again.');
        } else {
          setError(`An unexpected error occurred: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id, router]);

  const handleSuspendUser = async () => {
    const action = profile.is_active ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${profile.username}'s account?`)) return;
    
    try {
      const suspendResponse = await api.post(`suspend-user/${id}/`);
      console.log('Suspend response:', suspendResponse.data);
      setSuccess(`User account ${action}ed successfully`);
      setTimeout(() => {
        setSuccess('');
        router.push('/articles');
      }, 2000);
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
      if (err.response) {
        switch (err.response.status) {
          case 404:
            setError('User not found. The account may have been deleted.');
            setTimeout(() => router.push('/articles'), 2000);
            break;
          case 401:
            setError('Authentication failed. Please log in again.');
            localStorage.removeItem('access_token');
            router.push('/login');
            break;
          case 403:
            setError('You do not have permission to perform this action.');
            break;
          case 500:
            setError('Server error. Please try again later or contact support.');
            break;
          default:
            setError(`Failed to ${action} user account: ${err.response.data?.error || err.message}`);
        }
      } else if (err.request) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(`An unexpected error occurred: ${err.message}`);
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="container mx-auto p-4">
      <Navbar />
      <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>
    </div>
  );

  if (!profile) return (
    <div className="container mx-auto p-4">
      <Navbar />
      <div className="text-gray-500">Profile not found</div>
    </div>
  );

  const isAdmin = currentUser?.is_staff;
  const isOwnProfile = currentUser?.id === parseInt(id);
  const hasProfilePicture = profile.profile?.profile_picture;
  const isSuspended = !profile.is_active;

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Success Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Profile Header Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Avatar Section */}
            <div className="flex-shrink-0 relative">
              {hasProfilePicture ? (
                <Image
                  src={profile.profile.profile_picture}
                  alt={profile.username}
                  width={120}
                  height={120}
                  className="rounded-full object-cover w-32 h-32"
                  priority
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-4xl text-white font-bold">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info Section */}
            <div className="flex-grow w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{profile.username}</h1>
                  <div className="flex gap-2 items-center mt-1">
                    {profile.is_staff && (
                      <span className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                    {isSuspended && (
                      <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded">
  Active
</span>

                    )}
                  </div>
                </div>

                {/* Admin Controls - Only for admins viewing other profiles */}
                {isAdmin && !isOwnProfile && (
                  <button
                    onClick={handleSuspendUser}
                    className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
                      profile.is_active 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    } transition-colors`}
                  >
                    {profile.is_active ? 'Suspend Account' : 'Activate Account'}
                  </button>
                )}
              </div>

              <p className="text-gray-600 mt-2">{profile.email}</p>
              
              {/* Bio Section */}
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">About</h3>
                <p className="text-gray-700 mt-1 whitespace-pre-line">
                  {profile.profile?.bio || 'This user has not written a bio yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Articles Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Related Articles ({articles.length})</h2>
            
            {articles.length === 0 ? (
              <p className="text-gray-500">No related articles found</p>
            ) : (
              <div className="space-y-4">
                {articles.map(article => (
                  <div key={article.id} className="border-b pb-4 last:border-b-0">
                    <Link 
                      href={`/articles/${article.id}`}
                      className="block hover:bg-gray-50 p-2 rounded transition-colors"
                    >
                      <h3 className="text-lg font-medium text-blue-600 hover:underline">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <span>{new Date(article.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{article.views} views</span>
                        <span>•</span>
                        <span>{article.likes} likes</span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Comments ({comments.length})</h2>
            
            {comments.length === 0 ? (
              <p className="text-gray-500">No comments made yet</p>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div 
                    key={comment.id} 
                    className="border-b pb-4 last:border-b-0 group relative hover:bg-gray-50 p-2 rounded transition-colors"
                  >
                    <div className="flex gap-3">
                      <Link 
                        href={`/profile/${comment.user.id}`}
                        className="flex-shrink-0"
                      >
                        {comment.user.profile?.profile_picture ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            <Image
                              src={comment.user.profile.profile_picture}
                              alt={comment.user.username}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 font-medium">
                              {comment.user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </Link>
                      
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/profile/${comment.user.id}`}
                            className="font-medium hover:underline"
                          >
                            {comment.user.username}
                          </Link>
                          <span className="text-xs text-gray-400">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mt-1 whitespace-pre-line">
                          {comment.content}
                        </p>
                        
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <Link 
                            href={`/articles/${comment.article?.id || '#'}`}
                            className="text-blue-500 hover:underline flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            View Article
                          </Link>
                          
                          <span className="text-gray-500 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            {comment.likes || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}