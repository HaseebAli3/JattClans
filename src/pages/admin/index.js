import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', category: '', thumbnail: null });
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser.is_staff) {
        setError('Access Denied: Admin privileges required');
        router.push('/');
        return;
      }
      setUser(parsedUser);
      fetchArticles(parsedUser.access);
      fetchCategories(parsedUser.access);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, []);

  const fetchArticles = async (accessToken) => {
    try {
      const response = await axios.get('http://localhost:8000/api/articles/', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setArticles(response.data.results || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to load articles');
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        router.push('/login');
      }
    }
  };

  const fetchCategories = async (accessToken) => {
    try {
      const response = await axios.get('http://localhost:8000/api/categories/', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setCategories(response.data.results || []); // Use results array
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        router.push('/login');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('content', form.content);
    formData.append('category_id', form.category);
    if (form.thumbnail) formData.append('thumbnail', form.thumbnail);

    try {
      await axios.post('http://localhost:8000/api/articles/', formData, {
        headers: { Authorization: `Bearer ${user.access}` }
      });
      setForm({ title: '', content: '', category: '', thumbnail: null });
      setError('');
      fetchArticles(user.access);
    } catch (error) {
      console.error('Error creating article:', error);
      if (error.response?.status === 400) {
        const errors = error.response.data;
        if (errors.title) {
          setError('Title: ' + errors.title.join(', '));
        } else if (errors.content) {
          setError('Content: ' + errors.content.join(', '));
        } else if (errors.category_id) {
          setError('Category: ' + errors.category_id.join(', '));
        } else if (errors.thumbnail) {
          setError('Thumbnail: ' + errors.thumbnail.join(', '));
        } else {
          setError('Failed to create article: Invalid data');
        }
      } else if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('user');
        router.push('/login');
      } else {
        setError('Failed to create article: Server error');
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/articles/${id}/`, {
        headers: { Authorization: `Bearer ${user.access}` }
      });
      fetchArticles(user.access);
    } catch (error) {
      console.error('Error deleting article:', error);
      setError('Failed to delete article');
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        router.push('/login');
      }
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      await axios.post(`http://localhost:8000/api/suspend-user/${userId}/`, {}, {
        headers: { Authorization: `Bearer ${user.access}` }
      });
      alert('User suspended');
    } catch (error) {
      console.error('Error suspending user:', error);
      setError('Failed to suspend user');
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        router.push('/login');
      }
    }
  };

  if (!user) return <div>Loading...</div>;
  if (!user.is_staff) return <div>{error}</div>;

  return (
    <div>
      <Navbar currentPage="admin" />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        {error && <p className="text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="mb-4">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Article Title"
            className="border p-2 mb-2 w-full"
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Article Content"
            className="border p-2 mb-2 w-full"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border p-2 mb-2 w-full"
          >
            <option value="">Select Category</option>
            {Array.isArray(categories) && categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm({ ...form, thumbnail: e.target.files[0] })}
            className="mb-2"
          />
          <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">Create Article</button>
        </form>
        <h2 className="text-2xl mb-2">Articles</h2>
        {articles.map(article => (
          <div key={article.id} className="border p-4 mb-2">
            <p>{article.title}</p>
            <button onClick={() => handleDelete(article.id)} className="bg-red-500 text-white py-1 px-2">Delete</button>
          </div>
        ))}
        <h2 className="text-2xl mb-2">Suspend User</h2>
        <input
          type="number"
          placeholder="User ID"
          onChange={(e) => handleSuspendUser(e.target.value)}
          className="border p-2"
        />
      </div>
    </div>
  );
}