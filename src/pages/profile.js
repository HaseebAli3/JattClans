import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Image from 'next/image';
import { useRouter } from 'next/router';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ bio: '', profile_picture: null });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Add request interceptor
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });

  // Add response interceptor for token refresh
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
          // If refresh fails, logout the user
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          router.push('/login');
          return Promise.reject(err);
        }
      }
      
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('access_token');
      
      if (!storedUser || !accessToken) {
        router.push('/login');
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setForm({ bio: parsedUser.profile?.bio || '', profile_picture: null });
        
        // Fetch fresh profile data
        const response = await api.get('profile/');
        const updatedUser = { ...response.data, access: accessToken };
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setForm({ bio: response.data.profile?.bio || '', profile_picture: null });
      } catch (error) {
        console.error('Error loading profile:', error);
        handleAuthError(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleAuthError = (error) => {
    if (error.response?.status === 401) {
      setError('Session expired. Please log in again.');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      router.push('/login');
    } else {
      setError(error.response?.data?.detail || 'An error occurred. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData();
    formData.append('bio', form.bio);
    if (form.profile_picture) {
      formData.append('profile_picture', form.profile_picture);
    }

    try {
      setIsLoading(true);
      const response = await api.put('profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const updatedUser = { ...response.data, access: localStorage.getItem('access_token') };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setForm({ bio: response.data.profile?.bio || '', profile_picture: null });
      setError('');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="container mx-auto p-4">Loading profile...</div>;
  if (!user) return <div className="container mx-auto p-4">Redirecting to login...</div>;

  return (
    <div>
      <Navbar currentPage="profile" />
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col items-center">
                {user.profile?.profile_picture ? (
                  <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden">
                    <Image
                      src={user.profile.profile_picture}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-2xl">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <h2 className="text-xl font-bold">{user.username}</h2>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="md:w-2/3">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Profile Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm({ ...form, profile_picture: e.target.files[0] })}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}