import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FaUser, FaLock, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post('https://haseebclan.pythonanywhere.com/api/token/', { 
        username, 
        password 
      });
      
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      router.push('/articles');
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Invalid username or password');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>جٹ کلینز - Login</title>
        <link rel="icon" href="/jutt-icon.png" />
       </Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-100 to-coral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden border border-teal-200 transition-all duration-300 hover:shadow-lg">
          <div className="bg-teal-600 p-4 text-white">
            <h1 className="text-2xl font-bold urdu-font text-center">جٹ کلینز</h1>
            <p className="text-center text-coral-100 mt-1 text-base">Login to your account</p>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-base flex items-start transition-all duration-200 hover:bg-red-100">
                <FaInfoCircle className="mt-0.5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="group">
                <label className="block text-teal-800 mb-1 text-base font-medium">Username</label>
                <div className="relative transition-all duration-200 group-hover:scale-[1.01]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-teal-500 group-hover:text-teal-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-10 p-3 border border-teal-200 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-transparent bg-white text-teal-900 transition-all duration-200 hover:border-teal-300 text-base"
                    required
                  />
                </div>
              </div>
              
              <div className="group">
                <label className="block text-teal-800 mb-1 text-base font-medium">Password</label>
                <div className="relative transition-all duration-200 group-hover:scale-[1.01]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-teal-500 group-hover:text-teal-600 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 p-3 border border-teal-200 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-transparent bg-white text-teal-900 transition-all duration-200 hover:border-teal-300 text-base"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:scale-110 transition-transform"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="text-teal-500 hover:text-teal-600 transition-colors" />
                    ) : (
                      <FaEye className="text-teal-500 hover:text-teal-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-md font-bold transition-all duration-300 min-h-[48px] z-10 ${
                  isLoading 
                    ? 'bg-teal-400 cursor-not-allowed text-coral-100' 
                    : 'bg-teal-600 hover:bg-teal-700 hover:shadow-lg transform hover:-translate-y-0.5 text-coral-100'
                } flex items-center justify-center text-lg text-shadow-sm`}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Logging in...
                  </>
                ) : 'Login'}
              </button>
            </form>

            <div className="mt-4 text-center text-teal-700 text-base">
              Don&apos;t have an account?{' '}
              <button 
                onClick={() => router.push('/signup')} 
                className="text-teal-800 font-semibold hover:underline hover:text-teal-900 transition-colors"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}