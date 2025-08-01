import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Image from 'next/image';
import { useRouter } from 'next/router';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ bio: '' });
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Configure axios interceptors
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    response => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          const response = await axios.post('http://localhost:8000/api/token/refresh/', {
            refresh: refreshToken
          });
          
          localStorage.setItem('access_token', response.data.access);
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
          originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
          
          return api(originalRequest);
        } catch (err) {
          handleLogout();
          return Promise.reject(err);
        }
      }
      
      return Promise.reject(error);
    }
  );

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

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
      } catch (error) {
        handleError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleError = (error) => {
    if (error.response?.status === 401) {
      setError('Your session has expired. Please log in again.');
      handleLogout();
    } else {
      setError(error.response?.data?.detail || 'An error occurred. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const removeProfilePicture = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('bio', form.bio);
      
      if (fileInputRef.current?.files[0]) {
        formData.append('profile_picture', fileInputRef.current.files[0]);
      } else if (previewImage === null && user.profile?.profile_picture) {
        formData.append('remove_profile_picture', 'true');
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
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!user) return <div className="container mx-auto p-4">Redirecting to login...</div>;

  return (
    <div>
      <Navbar currentPage="profile" />
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Card */}
          <div className="md:w-1/3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden bg-gray-100">
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
                    <span className="text-2xl text-gray-500">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <h2 className="text-xl font-bold">{user.username}</h2>
                <p className="text-gray-500">{user.email}</p>
                {user.is_staff && (
                  <span className="mt-2 px-2 py-1 text-xs bg-blue-500 text-white rounded">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="md:w-2/3">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Picture
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    >
                      Change Photo
                    </button>
                    {(previewImage || user.profile?.profile_picture) && (
                      <button
                        type="button"
                        onClick={removeProfilePicture}
                        className="px-4 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block mr-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}