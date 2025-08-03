import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaInfoCircle } from 'react-icons/fa';

export default function Signup() {
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    bio: '' 
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9@.\-+_]+$/;
    return usernameRegex.test(username);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateUsername(form.username)) {
      setError('Username can only contain letters, digits, and @/./+/-/_ characters. No spaces allowed.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await axios.post('https://haseebclan.pythonanywhere.com/api/register/', {
        username: form.username,
        email: form.email,
        password: form.password,
        bio: form.bio
      });
      
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      router.push('/articles');
    } catch (error) {
      if (error.response?.status === 400) {
        const errors = error.response.data;
        if (errors.username) {
          setError('Username already taken. Please choose a different username.');
        } else if (errors.email) {
          setError('Email: ' + errors.email.join(', '));
        } else if (errors.password) {
          setError('Password: ' + errors.password.join(', '));
        } else {
          setError('Registration failed: Invalid data provided.');
        }
      } else {
        setError('Registration failed: Server error. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>جٹ کلینز - Sign Up</title>
        <link rel="icon" href="/jutt-icon.png" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .urdu-font {
          font-family: 'Noto Nastaliq Urdu', serif;
        }
        input::placeholder, textarea::placeholder {
          color: #a8a29e;
          opacity: 1;
        }
        input:-ms-input-placeholder, textarea:-ms-input-placeholder {
          color: #a8a29e;
        }
        input::-ms-input-placeholder, textarea::-ms-input-placeholder {
          color: #a8a29e;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-teal-100 to-coral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-md overflow-hidden border border-teal-200 transition-all duration-300 hover:shadow-lg">
          <div className="bg-teal-600 p-4 text-white">
            <h1 className="text-xl font-bold urdu-font text-center">جٹ کلینز</h1>
            <p className="text-center text-coral-100 mt-1 text-sm">Create your account</p>
          </div>
          
          <div className="p-5">
            {error && (
              <div className="mb-3 p-2 bg-red-50 text-red-600 rounded-md text-sm flex items-start transition-all duration-200 hover:bg-red-100">
                <FaInfoCircle className="mt-0.5 mr-1.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="group">
                <label className="block text-teal-800 mb-1 text-sm font-medium">Username</label>
                <div className="relative transition-all duration-200 group-hover:scale-[1.01]">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <FaUser className="text-teal-500 group-hover:text-teal-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Enter your username"
                    className="w-full pl-9 p-2 border border-teal-200 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-transparent bg-white text-teal-900 transition-all duration-200 hover:border-teal-300 text-sm"
                    required
                    minLength={3}
                  />
                </div>
              </div>
              
              <div className="group">
                <label className="block text-teal-800 mb-1 text-sm font-medium">Email</label>
                <div className="relative transition-all duration-200 group-hover:scale-[1.01]">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <FaEnvelope className="text-teal-500 group-hover:text-teal-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Enter your email"
                    className="w-full pl-9 p-2 border border-teal-200 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-transparent bg-white text-teal-900 transition-all duration-200 hover:border-teal-300 text-sm"
                    required
                  />
                </div>
              </div>
              
              <div className="group">
                <label className="block text-teal-800 mb-1 text-sm font-medium">Password</label>
                <div className="relative transition-all duration-200 group-hover:scale-[1.01]">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <FaLock className="text-teal-500 group-hover:text-teal-600 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-9 p-2 border border-teal-200 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-transparent bg-white text-teal-900 transition-all duration-200 hover:border-teal-300 text-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-2 flex items-center hover:scale-110 transition-transform"
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
              
              <div className="group">
                <label className="block text-teal-800 mb-1 text-sm font-medium">Bio (Optional)</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                  className="w-full p-2 border border-teal-200 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-transparent bg-white text-teal-900 transition-all duration-200 hover:border-teal-300 text-sm"
                  rows="3"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-md font-bold transition-all duration-300 min-h-[44px] z-10 ${
                  isSubmitting 
                    ? 'bg-teal-400 cursor-not-allowed text-coral-100' 
                    : 'bg-teal-600 hover:bg-teal-700 hover:shadow-lg transform hover:-translate-y-0.5 text-coral-100'
                } flex items-center justify-center text-base text-shadow-sm`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-coral-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Sign Up'}
              </button>
            </form>

            <div className="mt-3 text-center text-teal-700 text-sm">
              Already have an account?{' '}
              <button 
                onClick={() => router.push('/login')} 
                className="text-teal-800 font-semibold hover:underline hover:text-teal-900 transition-colors"
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}