import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Signup() {
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    bio: '' 
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('http://localhost:8000/api/register/', {
        username: form.username,
        email: form.email,
        password: form.password,
        bio: form.bio
      });
      
      // Store authentication tokens and user data
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      router.push('/articles');
    } catch (error) {
      if (error.response?.status === 400) {
        const errors = error.response.data;
        if (errors.username) {
          setError('Username: ' + errors.username.join(', '));
        } else if (errors.email) {
          setError('Email: ' + errors.email.join(', '));
        } else if (errors.password) {
          setError('Password: ' + errors.password.join(', '));
        } else {
          setError('Registration failed: Invalid data provided');
        }
      } else {
        setError('Registration failed: Server error');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Signup</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Username"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Password"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Bio (optional)"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
        </div>
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}