import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Signup() {
  const [form, setForm] = useState({ username: '', email: '', password: '', bio: '', profile_picture: null });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('username', form.username);
    formData.append('email', form.email);
    formData.append('password', form.password);
    formData.append('bio', form.bio);
    if (form.profile_picture) formData.append('profile_picture', form.profile_picture);

    try {
      const response = await axios.post('http://localhost:8000/api/register/', formData);
      // Store the entire user object including access token
      localStorage.setItem('user', JSON.stringify({ ...response.data.user, access: response.data.access }));
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
      <form onSubmit={handleSubmit} className="max-w-md">
        <input
          type="text"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="Username"
          className="border p-2 mb-2 w-full"
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          className="border p-2 mb-2 w-full"
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password"
          className="border p-2 mb-2 w-full"
        />
        <textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Bio"
          className="border p-2 mb-2 w-full"
        />
        <input
          type="file"
          onChange={(e) => setForm({ ...form, profile_picture: e.target.files[0] })}
          accept="image/*"
          className="mb-2"
        />
        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">Signup</button>
      </form>
    </div>
  );
}