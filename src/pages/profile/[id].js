import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: 'https://haseebclan.pythonanywhere.com/api/',
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
    const action = profile.is_active ? 'suspend' : 'suspend';
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
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-teal-50 to-coral-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-coral-50">
      <Navbar />
      <div className="container mx-auto p-4">
        <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-coral-50">
      <Navbar />
      <div className="container mx-auto p-4">
        <div className="text-gray-500">Profile not found</div>
      </div>
    </div>
  );

  const isAdmin = currentUser?.is_staff;
  const isOwnProfile = currentUser?.id === parseInt(id);
  const hasProfilePicture = profile.profile?.profile_picture;
  const isSuspended = !profile.is_active;
  const isAdminProfile = profile.is_staff;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-coral-50 flex flex-col">
      <Head>
        <title>{profile.username} - Profile </title>
        <link rel="icon" href="/jutt-icon.png" />
      </Head>
      
      <Navbar />
      
      <div className="container mx-auto p-4 max-w-6xl py-8 flex-grow">
        {/* Success Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200">
            {success}
          </div>
        )}

        {/* Profile Header Section */}
        <div className="bg-white rounded-lg shadow-md border border-teal-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Avatar Section */}
            <div className="flex-shrink-0 relative">
              {hasProfilePicture ? (
                <Image
                  src={profile.profile.profile_picture}
                  alt={profile.username}
                  width={120}
                  height={120}
                  className="rounded-full object-cover w-32 h-32 border-4 border-teal-200"
                  priority
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-400 to-coral-500 flex items-center justify-center border-4 border-teal-200">
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
                  <h1 className="text-2xl font-bold text-teal-900">{profile.username}</h1>
                  <div className="flex gap-2 items-center mt-1">
                    {profile.is_staff && (
                      <span className="inline-block bg-teal-600 text-white text-xs px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                    {isSuspended ? (
                      <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Suspend
                      </span>
                    )}
                  </div>
                </div>

                {/* Admin Controls - Only for admins viewing non-admin profiles */}
                {isAdmin && !isOwnProfile && !isAdminProfile && (
                  <button
                    onClick={handleSuspendUser}
                    className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
                      profile.is_active 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-red-500 hover:bg-green-600'
                    } transition-colors shadow-md`}
                  >
                    {profile.is_active ? 'Suspend Account' : 'Suspend Account'}
                  </button>
                )}
              </div>

              <p className="text-teal-800 mt-2">{profile.email}</p>
              
              {/* Bio Section */}
              <div className="mt-4">
                <h3 className="text-sm font-medium text-teal-700">About</h3>
                <p className="text-teal-900 mt-1 whitespace-pre-line">
                  {profile.profile?.bio || 'This user has not written a bio yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Articles Section */}
          <div className="bg-white rounded-lg shadow-md border border-teal-100 p-6">
            <h2 className="text-xl font-bold mb-4 text-teal-900">Related Articles ({articles.length})</h2>
            
            {articles.length === 0 ? (
              <p className="text-teal-700">No related articles found</p>
            ) : (
              <div className="space-y-4">
                {articles.map(article => (
                  <div key={article.id} className="border-b border-teal-100 pb-4 last:border-b-0">
                    <Link 
                      href={`/articles/${article.id}`}
                      className="block hover:bg-teal-50 p-2 rounded transition-colors"
                    >
                      <h3 className="text-lg font-medium text-teal-600 hover:underline">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-teal-700">
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
          <div className="bg-white rounded-lg shadow-md border border-teal-100 p-6">
            <h2 className="text-xl font-bold mb-4 text-teal-900">Comments ({comments.length})</h2>
            
            {comments.length === 0 ? (
              <p className="text-teal-700">No comments made yet</p>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div 
                    key={comment.id} 
                    className="border-b border-teal-100 pb-4 last:border-b-0 group relative hover:bg-teal-50 p-2 rounded transition-colors"
                  >
                    <div className="flex gap-3">
                      <Link 
                        href={`/profile/${comment.user.id}`}
                        className="flex-shrink-0"
                      >
                        {comment.user.profile?.profile_picture ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-200">
                            <Image
                              src={comment.user.profile.profile_picture}
                              alt={comment.user.username}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-coral-400 flex items-center justify-center border-2 border-teal-200">
                            <span className="text-white font-medium">
                              {comment.user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </Link>
                      
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/profile/${comment.user.id}`}
                            className="font-medium text-teal-700 hover:underline"
                          >
                            {comment.user.username}
                          </Link>
                          <span className="text-xs text-teal-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        
                        <p className="text-teal-900 mt-1 whitespace-pre-line">
                          {comment.content}
                        </p>
                        
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <Link 
                            href={`/articles/${comment.article?.id || '#'}`}
                            className="text-teal-600 hover:underline flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            View Article
                          </Link>
                          
                          <span className="text-teal-700 flex items-center gap-1">
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

      {/* Simple Footer */}
      <footer className="bg-teal-700 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-teal-200 text-sm">© {new Date().getFullYear()} جٹ کلیمز - تمام حقوق محفوظ ہیں</p>
        </div>
      </footer>
    </div>
  );
}