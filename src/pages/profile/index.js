import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

const api = axios.create({
  baseURL: 'https://haseebclan.pythonanywhere.com/api/',
});

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ bio: '' });
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [userComments, setUserComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Configure axios interceptors with cleanup
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/login');
  }, [router]);

  const handleError = useCallback((error) => {
    if (error.response?.status === 401) {
      setError('Your session has expired. Please log in again.');
      handleLogout();
    } else {
      setError(error.response?.data?.detail || 'An error occurred. Please try again.');
    }
  }, [handleLogout]);

  const fetchUserComments = useCallback(async (userId) => {
    try {
      setIsLoadingComments(true);
      const response = await api.get(`comments/?user=${userId}`);
      setUserComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        router.push('/login');
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get('profile/');
        const updatedUser = {
          ...response.data,
          access: localStorage.getItem('access_token')
        };
        
        setUser(updatedUser);
        setForm({ bio: updatedUser.profile?.bio || '' });
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        if (updatedUser.id) {
          await fetchUserComments(updatedUser.id);
        }
      } catch (error) {
        handleError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router, fetchUserComments, handleError]);

  useEffect(() => {
    if (user) {
      const bioChanged = form.bio !== (user.profile?.bio || '');
      const imageChanged = previewImage !== null || 
        (fileInputRef.current?.files?.length > 0 && !user.profile?.profile_picture);
      setHasChanges(bioChanged || imageChanged);
    }
  }, [form, previewImage, user]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  }, []);

  const handleRemovePhoto = useCallback(() => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setHasChanges(true);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!user || !hasChanges) return;

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('bio', form.bio);
      
      if (fileInputRef.current?.files[0]) {
        formData.append('profile_picture', fileInputRef.current.files[0]);
      } else if (previewImage === null && user.profile?.profile_picture) {
        formData.append('profile_picture', 'null');
      }

      const response = await api.put('profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedUser = {
        ...response.data,
        access: localStorage.getItem('access_token')
      };
      
      setUser(updatedUser);
      setForm({ bio: response.data.profile?.bio || '' });
      setPreviewImage(null);
      setHasChanges(false);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [form.bio, hasChanges, previewImage, user, handleError]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-teal-50 to-coral-50">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 bg-gradient-to-br from-teal-50 to-coral-50">
        <p className="text-teal-800 text-center text-sm">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Profile - جٹ کلینز</title>
        <link rel="icon" href="/jutt-icon.png" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-coral-50">
        <Navbar />

        <section className="container mx-auto px-4 py-12">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Profile Settings Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-teal-100 lg:w-1/3">
              <div className="bg-teal-700 p-4 text-white text-center">
                <h2 className="text-xl font-bold">Profile Settings</h2>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative w-24 h-24 mb-3 rounded-full overflow-hidden bg-teal-50 border-2 border-teal-200">
                    {previewImage ? (
                      <Image
                        src={previewImage}
                        alt="Profile preview"
                        fill
                        className="object-cover"
                      />
                    ) : user.profile?.profile_picture ? (
                      <Image
                        src={user.profile.profile_picture}
                        alt="Profile"
                        fill
                        className="object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 flex items-center justify-center ${!previewImage && !user.profile?.profile_picture ? 'flex' : 'hidden'}`}>
                      <span className="text-2xl text-teal-600 font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <h2 className="text-lg font-bold text-teal-900">{user.username}</h2>
                  <p className="text-sm text-teal-700">{user.email}</p>
                  {user.is_staff && (
                    <span className="mt-2 px-2 py-1 text-xs bg-teal-600 text-white rounded">
                      Admin
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-teal-800 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => {
                      setForm({ ...form, bio: e.target.value });
                      setHasChanges(true);
                    }}
                    className="w-full p-3 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-teal-900 text-sm placeholder-teal-400"
                    rows="4"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium text-teal-800 mb-2">
                    Profile Picture
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="w-full px-4 py-2 bg-teal-100 hover:bg-teal-200 text-teal-800 rounded-lg transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 border border-teal-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        Change Photo
                      </button>
                    </div>
                    {(previewImage || user.profile?.profile_picture) && (
                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 border border-red-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Remove Photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {hasChanges && (
                  <div className="mt-8 flex flex-col space-y-3">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-md transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Update Profile
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ bio: user.profile?.bio || '' });
                        setPreviewImage(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        setHasChanges(false);
                      }}
                      className="w-full px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium text-sm"
                    >
                      Cancel Changes
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* User Comments Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-teal-100 lg:w-2/3">
              <div className="bg-teal-700 p-4 text-white text-center">
                <h2 className="text-xl font-bold">My Comments</h2>
              </div>
              
              <div className="p-6">
                {isLoadingComments ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal-600"></div>
                  </div>
                ) : userComments.length === 0 ? (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="mt-2 text-teal-600">You haven&apos;t posted any comments yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userComments.map(comment => (
                      <div key={comment.id} className="border-b border-teal-100 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="relative w-10 h-10 rounded-full bg-teal-50 overflow-hidden">
                              {user.profile?.profile_picture ? (
                                <Image
                                  src={user.profile.profile_picture}
                                  alt="Profile"
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <span className="absolute inset-0 flex items-center justify-center text-teal-600 font-bold">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-teal-800">{user.username}</span>
                              <span className="text-xs text-teal-500">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-teal-900">{comment.content}</p>
                            
                            <div className="mt-2 text-xs text-teal-600">
                              <Link href={`/articles/${comment.article.id}`} className="hover:underline flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                {comment.article.title}
                              </Link>
                            </div>
                            
                            <div className="mt-2 flex items-center gap-3 text-xs">
                              <span className="flex items-center gap-1 text-teal-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                                {comment.likes} likes
                              </span>
                              {comment.is_liked && (
                                <span className="text-teal-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
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
        </section>

        <footer className="bg-teal-700 text-white py-4">
          <div className="container mx-auto px-4 text-center">
            <p className="text-teal-200 text-sm">© {new Date().getFullYear()} جٹ کلیمز - All Rights Reserved</p>
          </div>
        </footer>
      </div>
    </>
  );
}