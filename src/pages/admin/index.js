import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../../components/Navbar';

export default function AdminDashboard() {
  const router = useRouter();
  const API_URL = 'https://haseebclan.pythonanywhere.com/api';

  // State management
  const [activeTab, setActiveTab] = useState('articles');
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalUsers: 0,
    totalComments: 0,
    totalCategories: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [commentSearchTerm, setCommentSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    category_id: '',
    thumbnail: null,
  });
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [isEditing, setIsEditing] = useState({ article: false, category: false });
  const [currentId, setCurrentId] = useState({ article: null, category: null });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth check
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      router.push('/login');
    } else if (!user.is_staff) {
      router.push('/articles');
    } else {
      fetchStats();
    }
  }, [router]);

  // Enhanced API request handler with proper token handling
  const makeRequest = useCallback(async (url, method = 'GET', body = null, isFormData = false) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      method,
      headers,
    };

    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 204) {
        return { success: true };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        return {
          success: false,
          error: text || 'Invalid response from server',
        };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.detail || data.message || `Request failed with status ${response.status}`,
        };
      }

      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Network error occurred',
      };
    }
  }, []);

  // Fetch data function
  const fetchData = useCallback(
    async (endpoint, params = {}) => {
      setIsLoading(true);
      setError('');
      try {
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_URL}/${endpoint}/${queryString ? `?${queryString}` : ''}`;
        const result = await makeRequest(url);
        if (!result.success) {
          throw new Error(result.error);
        }
        return Array.isArray(result.data) ? result.data : result.data.results || [];
      } catch (err) {
        setError(err.message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [makeRequest],
  );

  // Fetch stats function
  const fetchStats = useCallback(async () => {
    try {
      const [articlesRes, usersRes, commentsRes, categoriesRes] = await Promise.all([
        fetchData('articles'),
        fetchData('users'),
        fetchData('comments'),
        fetchData('categories'),
      ]);

      setStats({
        totalArticles: articlesRes?.length || 0,
        totalUsers: usersRes?.length || 0,
        totalComments: commentsRes?.length || 0,
        totalCategories: categoriesRes?.length || 0,
      });
    } catch (err) {
      setError('Failed to fetch statistics');
    }
  }, [fetchData]);

  // Tab data fetching
  useEffect(() => {
    const fetchTabData = async () => {
      switch (activeTab) {
        case 'articles':
          setArticles(await fetchData('articles', {
            search: searchTerm,
            category: selectedCategory,
          }));
          setCategories(await fetchData('categories'));
          break;
        case 'categories':
          setCategories(await fetchData('categories'));
          break;
        case 'users':
          setUsers(await fetchData('users', { search: userSearchTerm }));
          break;
        case 'comments':
          setComments(await fetchData('comments', { search: commentSearchTerm }));
          break;
        default:
          break;
      }
    };

    fetchTabData();
  }, [activeTab, searchTerm, selectedCategory, userSearchTerm, commentSearchTerm, fetchData]);

  // Form submission handler
  const handleSubmit = async (type, e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const isEdit = isEditing[type];
      const id = currentId[type];
      const endpoint = type === 'article' ? 'articles' : 'categories';
      const url = `${API_URL}/${endpoint}/${isEdit ? `${id}/` : ''}`;
      let body;
      let isFormData = false;

      if (type === 'article') {
        const formData = new FormData();
        formData.append('title', articleForm.title);
        formData.append('content', articleForm.content);
        if (articleForm.category_id) formData.append('category_id', articleForm.category_id);
        if (articleForm.thumbnail) formData.append('thumbnail', articleForm.thumbnail);
        body = formData;
        isFormData = true;
      } else {
        body = { name: categoryForm.name };
      }

      const method = isEdit ? 'PUT' : 'POST';
      const result = await makeRequest(url, method, body, isFormData);

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} ${isEdit ? 'updated' : 'created'} successfully!`);
      resetForm(type);
      fetchStats();

      // Refresh current tab data
      if (type === 'article') {
        setArticles(await fetchData('articles', {
          search: searchTerm,
          category: selectedCategory,
        }));
      } else {
        setCategories(await fetchData('categories'));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = (type) => {
    if (type === 'article') {
      setArticleForm({ title: '', content: '', category_id: '', thumbnail: null });
    } else {
      setCategoryForm({ name: '' });
    }
    setIsEditing((prev) => ({ ...prev, [type]: false }));
    setCurrentId((prev) => ({ ...prev, [type]: null }));
  };

  // Action handlers
  const handleEdit = (type, item) => {
    if (type === 'article') {
      setArticleForm({
        title: item.title,
        content: item.content,
        category_id: item.category?.id?.toString() || '',
        thumbnail: null,
      });
    } else {
      setCategoryForm({ name: item.name });
    }
    setIsEditing((prev) => ({ ...prev, [type]: true }));
    setCurrentId((prev) => ({ ...prev, [type]: item.id }));
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const endpoint = type === 'comment' ? 'comments' : `${type}s`;
      const url = `${API_URL}/${endpoint}/${id}/`;
      const result = await makeRequest(url, 'DELETE');

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
      fetchStats();

      // Refresh current tab data
      if (type === 'article') {
        setArticles(await fetchData('articles', {
          search: searchTerm,
          category: selectedCategory,
        }));
      } else if (type === 'comment') {
        setComments(await fetchData('comments', { search: commentSearchTerm }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMakeAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to make this user an admin?')) return;

    try {
      const url = `${API_URL}/users/${userId}/make-admin/`;
      const result = await makeRequest(url, 'POST');

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess('User promoted to admin successfully!');
      setUsers(await fetchData('users', { search: userSearchTerm }));
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSuspendUser = async (userId) => {
    const action = users.find((u) => u.id === userId)?.is_active ? 'suspend' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const url = `${API_URL}/suspend-user/${userId}/`;
      const result = await makeRequest(url, 'POST');

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(`User ${action}ed successfully!`);
      setUsers(await fetchData('users', { search: userSearchTerm }));
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  // UI Components
  const StatsCard = ({ title, value, icon, color }) => (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-6 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl`}>
      <div className="absolute -top-4 -right-4 opacity-20">
        <div className="text-6xl">{icon}</div>
      </div>
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-90">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
    </div>
  );

  const TabButton = ({ tab, icon }) => (
    <button
      type="button"
      onClick={() => {
        setActiveTab(tab);
        setIsSidebarOpen(false);
      }}
      className={`flex items-center space-x-3 w-full px-4 py-3 text-left rounded-xl transition-all duration-300 ${
        activeTab === tab
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
          : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium capitalize">{tab}</span>
    </button>
  );

  return (
    <>
      <Head>
        <title>Admin Dashboard</title>
        <meta name="description" content="Admin dashboard for content management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navbar />
        
        <div className="flex">
          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={`fixed left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 z-50 lg:relative lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">⚡</span>
                  </div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Admin Panel
                  </h1>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <span className="text-gray-500">✕</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-2">
              <TabButton tab="articles" icon="📰" />
              <TabButton tab="categories" icon="🏷️" />
              <TabButton tab="users" icon="👥" />
              <TabButton tab="comments" icon="💬" />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-screen">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
              <div className="px-4 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <span className="text-gray-600 text-xl">☰</span>
                    </button>
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Dashboard Overview
                      </h1>
                      <p className="text-gray-600 text-sm lg:text-base">Manage your content, users, and system settings</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <main className="px-4 lg:px-8 py-6 lg:py-8">
              {/* Stats Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                <StatsCard 
                  title="Total Articles" 
                  value={stats.totalArticles} 
                  icon="📰" 
                  color="from-blue-500 to-blue-600"
                />
                <StatsCard 
                  title="Total Users" 
                  value={stats.totalUsers} 
                  icon="👥" 
                  color="from-green-500 to-emerald-600"
                />
                <StatsCard 
                  title="Total Comments" 
                  value={stats.totalComments} 
                  icon="💬" 
                  color="from-orange-500 to-red-500"
                />
                <StatsCard 
                  title="Categories" 
                  value={stats.totalCategories} 
                  icon="🏷️" 
                  color="from-purple-500 to-pink-500"
                />
              </div>

              {/* Status Messages */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <span className="text-red-500 text-xl mr-3">⚠️</span>
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <span className="text-green-500 text-xl mr-3">✅</span>
                    <p className="text-green-700 font-medium">{success}</p>
                  </div>
                </div>
              )}

              {/* Articles Tab */}
              {activeTab === 'articles' && (
                <div className="space-y-6 lg:space-y-8">
                  {/* Article Form */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                      <h2 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center">
                        <span className="mr-3">📝</span>
                        {isEditing.article ? 'Edit Article' : 'Create New Article'}
                      </h2>
                      <p className="text-gray-600 mt-1">Add engaging content to your platform</p>
                    </div>
                    <div className="p-6">
                      <form onSubmit={(e) => handleSubmit('article', e)}>
                        <div className="grid gap-6">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Article Title</label>
                            <input
                              type="text"
                              value={articleForm.title}
                              onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                              className="w-full p-4 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                              placeholder="Enter a compelling title..."
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                            <select
                              value={articleForm.category_id}
                              onChange={(e) => setArticleForm({ ...articleForm, category_id: e.target.value })}
                              className="w-full p-4 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                              required
                            >
                              <option value="">Select category</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Content</label>
                            <textarea
                              value={articleForm.content}
                              onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                              className="w-full p-4 border-2 border-gray-200 rounded-xl min-h-[200px] text-gray-900 bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 resize-y"
                              placeholder="Write your article content here..."
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Thumbnail Image</label>
                            <input
                              type="file"
                              onChange={(e) => setArticleForm({ ...articleForm, thumbnail: e.target.files[0] })}
                              className="w-full p-4 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              accept="image/*"
                            />
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
                          {isEditing.article && (
                            <button
                              type="button"
                              onClick={() => resetForm('article')}
                              className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            {isLoading ? (
                              <span className="flex items-center">
                                <span className="animate-spin mr-2">⏳</span>
                                Saving...
                              </span>
                            ) : (
                              isEditing.article ? 'Update Article' : 'Create Article'
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Articles List */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                          <h2 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center">
                            <span className="mr-3">📚</span>
                            Manage Articles
                          </h2>
                          <p className="text-gray-600 mt-1">View and manage all published articles</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                          <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm w-full lg:w-64 text-gray-900 bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                          />
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm w-full sm:w-auto text-gray-900 bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                          >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      {isLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin text-4xl mb-4">⏳</div>
                          <p className="text-gray-600 font-medium">Loading articles...</p>
                        </div>
                      ) : articles.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">📰</div>
                          <h3 className="text-xl font-bold text-gray-800 mb-2">No articles found</h3>
                          <p className="text-gray-600">Create your first article to get started!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {articles.map((article) => (
                            <div key={article.id} className="border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
                              <div className="flex flex-col lg:flex-row justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                  <h3 className="font-bold text-lg lg:text-xl text-gray-800 leading-tight">{article.title}</h3>
                                  <p className="text-gray-700 leading-relaxed line-clamp-3">
                                    {article.content.substring(0, 200)}...
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      🏷️ {article.category?.name || 'No Category'}
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      👁️ {article.views} views
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 self-end lg:self-center">
                                  <button
                                    onClick={() => handleEdit('article', article)}
                                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl text-sm font-medium hover:bg-blue-200 transition-all duration-300 transform hover:scale-105"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete('article', article.id)}
                                    className="px-4 py-2 bg-red-100 text-red-800 rounded-xl text-sm font-medium hover:bg-red-200 transition-all duration-300 transform hover:scale-105"
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Categories Tab */}
              {activeTab === 'categories' && (
                <div className="space-y-6 lg:space-y-8">
                  {/* Category Form */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                      <h2 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center">
                        <span className="mr-3">🏷️</span>
                        {isEditing.category ? 'Edit Category' : 'Create New Category'}
                      </h2>
                      <p className="text-gray-600 mt-1">Organize your content with categories</p>
                    </div>
                    <div className="p-6">
                      <form onSubmit={(e) => handleSubmit('category', e)}>
                        <div className="mb-6">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Category Name</label>
                          <input
                            type="text"
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({ name: e.target.value })}
                            className="w-full p-4 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-300"
                            placeholder="Enter category name..."
                            required
                          />
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                          {isEditing.category && (
                            <button
                              type="button"
                              onClick={() => resetForm('category')}
                              className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            {isLoading ? (
                              <span className="flex items-center">
                                <span className="animate-spin mr-2">⏳</span>
                                Saving...
                              </span>
                            ) : (
                              isEditing.category ? 'Update Category' : 'Create Category'
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Categories List */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                      <h2 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center">
                        <span className="mr-3">📋</span>
                        Manage Categories
                      </h2>
                      <p className="text-gray-600 mt-1">View and manage content categories</p>
                    </div>
                    
                    <div className="p-6">
                      {isLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin text-4xl mb-4">⏳</div>
                          <p className="text-gray-600 font-medium">Loading categories...</p>
                        </div>
                      ) : categories.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">🏷️</div>
                          <h3 className="text-xl font-bold text-gray-800 mb-2">No categories found</h3>
                          <p className="text-gray-600">Create your first category to organize content!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categories.map((category) => (
                            <div
                              key={category.id}
                              className="border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-300 bg-gradient-to-br from-white to-purple-50"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                  <span className="text-2xl">🏷️</span>
                                  <span className="font-bold text-gray-800 text-lg">{category.name}</span>
                                </div>
                                <button
                                  onClick={() => handleEdit('category', category)}
                                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium hover:bg-purple-200 transition-all duration-300 transform hover:scale-105"
                                >
                                  ✏️ Edit
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div>
                        <h2 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center">
                          <span className="mr-3">👥</span>
                          Manage Users
                        </h2>
                        <p className="text-gray-600 mt-1">View and manage platform users</p>
                      </div>
                      <div className="w-full lg:w-64">
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {isLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin text-4xl mb-4">⏳</div>
                        <p className="text-gray-600 font-medium">Loading users...</p>
                      </div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No users found</h3>
                        <p className="text-gray-600">No users match your search criteria</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {users.map((user) => (
                          <div
                            key={user.id}
                            className="border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-green-200 transition-all duration-300 bg-gradient-to-r from-white to-green-50"
                          >
                            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                              <div className="flex items-center space-x-4 flex-1">
                                {user.profile?.profile_picture ? (
                                  <Link href={`/profile/${user.id}`} className="relative w-12 h-12 flex-shrink-0">
                                    <Image
                                      src={user.profile.profile_picture || "/placeholder.svg"}
                                      alt="Profile"
                                      fill
                                      className="rounded-full object-cover shadow-lg"
                                    />
                                  </Link>
                                ) : (
                                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                    {user.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <Link
                                      href={`/profile/${user.id}`}
                                      className="font-bold text-lg hover:text-green-600 truncate text-gray-800 transition-colors duration-300"
                                    >
                                      {user.username}
                                    </Link>
                                    {user.is_staff && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        👑 Admin
                                      </span>
                                    )}
                                    {!user.is_active && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        🚫 Suspended
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-600 truncate">{user.email}</p>
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                                {!user.is_staff && (
                                  <button
                                    onClick={() => handleMakeAdmin(user.id)}
                                    className="px-4 py-2 bg-green-100 text-green-800 rounded-xl text-sm font-medium hover:bg-green-200 transition-all duration-300 transform hover:scale-105"
                                  >
                                    👑 Make Admin
                                  </button>
                                )}
                                <button
                                  onClick={() => handleSuspendUser(user.id)}
                                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                                    user.is_active
                                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  }`}
                                >
                                  {user.is_active ? '🚫 Suspend' : '✅ Activate'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div>
                        <h2 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center">
                          <span className="mr-3">💬</span>
                          Manage Comments
                        </h2>
                        <p className="text-gray-600 mt-1">View and moderate user comments</p>
                      </div>
                      <div className="w-full lg:w-64">
                        <input
                          type="text"
                          placeholder="Search comments..."
                          value={commentSearchTerm}
                          onChange={(e) => setCommentSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {isLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin text-4xl mb-4">⏳</div>
                        <p className="text-gray-600 font-medium">Loading comments...</p>
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">💬</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No comments found</h3>
                        <p className="text-gray-600">No comments match your search criteria</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-orange-200 transition-all duration-300 bg-gradient-to-r from-white to-orange-50"
                          >
                            <div className="flex gap-4">
                              <div className="flex-shrink-0">
                                {comment.user.profile?.profile_picture ? (
                                  <Link
                                    href={`/profile/${comment.user.id}`}
                                    className="relative w-12 h-12"
                                  >
                                    <Image
                                      src={comment.user.profile.profile_picture || "/placeholder.svg"}
                                      alt="Profile"
                                      fill
                                      className="rounded-full object-cover shadow-lg"
                                    />
                                  </Link>
                                ) : (
                                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                    {comment.user.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <Link
                                    href={`/profile/${comment.user.id}`}
                                    className="font-bold hover:text-orange-600 truncate text-gray-800 transition-colors duration-300"
                                  >
                                    {comment.user.username}
                                  </Link>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-sm text-gray-500">
                                    {new Date(comment.created_at).toLocaleString()}
                                  </span>
                                </div>
                                
                                <p className="text-gray-800 mb-3 break-words leading-relaxed">{comment.content}</p>
                                
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                  <Link
                                    href={`/articles/${comment.article.id}`}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-all duration-300 truncate max-w-xs"
                                  >
                                    📰 {comment.article.title}
                                  </Link>
                                  
                                  <button
                                    onClick={() => handleDelete('comment', comment.id)}
                                    className="px-4 py-2 bg-red-100 text-red-800 rounded-xl text-sm font-medium hover:bg-red-200 transition-all duration-300 transform hover:scale-105"
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
