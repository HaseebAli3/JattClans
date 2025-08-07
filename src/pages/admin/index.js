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
    const action = users.find((u) => u.id === userId)?.is_active ? 'suspend' : 'activate';
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

  // Professional UI Components
  const StatsCard = ({ title, value, icon, trend, trendValue }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-50 rounded-lg">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {icon}
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {trend === 'up' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
              )}
            </svg>
            {trendValue}%
          </div>
        )}
      </div>
    </div>
  );

  const TabButton = ({ tab, icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icon}
      </svg>
      <span className="font-medium capitalize">{tab}</span>
    </button>
  );

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading...</span>
    </div>
  );

  const EmptyState = ({ icon, title, description }) => (
    <div className="text-center py-12">
      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icon}
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );

  return (
    <>
      <Head>
        <title>Admin Dashboard - Content Management System</title>
        <meta name="description" content="Professional admin dashboard for content management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="flex h-screen pt-16">
          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={`fixed left-0 top-16 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 z-50 lg:relative lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-2">
                <TabButton 
                  tab="articles" 
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2H15" />}
                  isActive={activeTab === 'articles'}
                  onClick={() => {
                    setActiveTab('articles');
                    setIsSidebarOpen(false);
                  }}
                />
                <TabButton 
                  tab="categories" 
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />}
                  isActive={activeTab === 'categories'}
                  onClick={() => {
                    setActiveTab('categories');
                    setIsSidebarOpen(false);
                  }}
                />
                <TabButton 
                  tab="users" 
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />}
                  isActive={activeTab === 'users'}
                  onClick={() => {
                    setActiveTab('users');
                    setIsSidebarOpen(false);
                  }}
                />
                <TabButton 
                  tab="comments" 
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />}
                  isActive={activeTab === 'comments'}
                  onClick={() => {
                    setActiveTab('comments');
                    setIsSidebarOpen(false);
                  }}
                />
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600">Manage your content and users</p>
                  </div>
                </div>
              </div>
            </div>

            <main className="p-6">
              {/* Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard 
                  title="Total Articles" 
                  value={stats.totalArticles} 
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2H15" />}
                  trend="up"
                  trendValue="12"
                />
                <StatsCard 
                  title="Total Users" 
                  value={stats.totalUsers} 
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />}
                  trend="up"
                  trendValue="8"
                />
                <StatsCard 
                  title="Total Comments" 
                  value={stats.totalComments} 
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />}
                  trend="down"
                  trendValue="3"
                />
                <StatsCard 
                  title="Categories" 
                  value={stats.totalCategories} 
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />}
                  trend="up"
                  trendValue="5"
                />
              </div>

              {/* Status Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-green-800 font-medium">{success}</p>
                  </div>
                </div>
              )}

              {/* Articles Tab */}
              {activeTab === 'articles' && (
                <div className="space-y-8">
                  {/* Article Form */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {isEditing.article ? 'Edit Article' : 'Create New Article'}
                      </h2>
                      <p className="text-gray-600 mt-1">Add engaging content to your platform</p>
                    </div>
                    <div className="p-6">
                      <form onSubmit={(e) => handleSubmit('article', e)} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Article Title</label>
                            <input
                              type="text"
                              value={articleForm.title}
                              onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Enter article title..."
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select
                              value={articleForm.category_id}
                              onChange={(e) => setArticleForm({ ...articleForm, category_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                          <textarea
                            value={articleForm.content}
                            onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
                            rows={8}
                            placeholder="Write your article content here..."
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail Image</label>
                          <input
                            type="file"
                            onChange={(e) => setArticleForm({ ...articleForm, thumbnail: e.target.files[0] })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            accept="image/*"
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          {isEditing.article && (
                            <button
                              type="button"
                              onClick={() => resetForm('article')}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isLoading ? 'Saving...' : (isEditing.article ? 'Update Article' : 'Create Article')}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Articles List */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">Manage Articles</h2>
                          <p className="text-gray-600 mt-1">View and manage all published articles</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                          <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full sm:w-64"
                          />
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                        <LoadingSpinner />
                      ) : articles.length === 0 ? (
                        <EmptyState 
                          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2H15" />}
                          title="No articles found"
                          description="Create your first article to get started"
                        />
                      ) : (
                        <div className="space-y-4">
                          {articles.map((article) => (
                            <div key={article.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                              <div className="flex flex-col lg:flex-row justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{article.title}</h3>
                                  <p className="text-gray-600 mb-3 line-clamp-2">
                                    {article.content.substring(0, 200)}...
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {article.category?.name || 'No Category'}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      {article.views || 0} views
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <button
                                    onClick={() => handleEdit('article', article)}
                                    className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete('article', article.id)}
                                    className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    Delete
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
                <div className="space-y-8">
                  {/* Category Form */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {isEditing.category ? 'Edit Category' : 'Create New Category'}
                      </h2>
                      <p className="text-gray-600 mt-1">Organize your content with categories</p>
                    </div>
                    <div className="p-6">
                      <form onSubmit={(e) => handleSubmit('category', e)} className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                          <input
                            type="text"
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({ name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Enter category name..."
                            required
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          {isEditing.category && (
                            <button
                              type="button"
                              onClick={() => resetForm('category')}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isLoading ? 'Saving...' : (isEditing.category ? 'Update Category' : 'Create Category')}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Categories List */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">Manage Categories</h2>
                      <p className="text-gray-600 mt-1">View and manage content categories</p>
                    </div>
                    
                    <div className="p-6">
                      {isLoading ? (
                        <LoadingSpinner />
                      ) : categories.length === 0 ? (
                        <EmptyState 
                          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />}
                          title="No categories found"
                          description="Create your first category to organize content"
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categories.map((category) => (
                            <div
                              key={category.id}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex justify-between items-center">
                                <h3 className="font-medium text-gray-900">{category.name}</h3>
                                <button
                                  onClick={() => handleEdit('category', category)}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                  Edit
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
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Manage Users</h2>
                        <p className="text-gray-600 mt-1">View and manage platform users</p>
                      </div>
                      <div className="w-full sm:w-64">
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {isLoading ? (
                      <LoadingSpinner />
                    ) : users.length === 0 ? (
                      <EmptyState 
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />}
                        title="No users found"
                        description="No users match your search criteria"
                      />
                    ) : (
                      <div className="space-y-4">
                        {users.map((user) => (
                          <div
                            key={user.id}
                            className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                              <div className="flex items-center space-x-4 flex-1">
                                {user.profile?.profile_picture ? (
                                  <Link href={`/profile/${user.id}`} className="relative w-12 h-12 flex-shrink-0">
                                    <Image
                                      src={user.profile.profile_picture || "/placeholder.svg"}
                                      alt="Profile"
                                      fill
                                      className="rounded-full object-cover"
                                    />
                                  </Link>
                                ) : (
                                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                                    {user.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <Link
                                      href={`/profile/${user.id}`}
                                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                                    >
                                      {user.username}
                                    </Link>
                                    {user.is_staff && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Admin
                                      </span>
                                    )}
                                    {!user.is_active && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Suspended
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-600 text-sm">{user.email}</p>
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-2">
                                {!user.is_staff && (
                                  <button
                                    onClick={() => handleMakeAdmin(user.id)}
                                    className="px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  >
                                    Make Admin
                                  </button>
                                )}
                                <button
                                  onClick={() => handleSuspendUser(user.id)}
                                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    user.is_active
                                      ? 'text-red-600 hover:bg-red-50'
                                      : 'text-yellow-600 hover:bg-yellow-50'
                                  }`}
                                >
                                  {user.is_active ? 'Suspend' : 'Activate'}
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
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Manage Comments</h2>
                        <p className="text-gray-600 mt-1">View and moderate user comments</p>
                      </div>
                      <div className="w-full sm:w-64">
                        <input
                          type="text"
                          placeholder="Search comments..."
                          value={commentSearchTerm}
                          onChange={(e) => setCommentSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {isLoading ? (
                      <LoadingSpinner />
                    ) : comments.length === 0 ? (
                      <EmptyState 
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />}
                        title="No comments found"
                        description="No comments match your search criteria"
                      />
                    ) : (
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex gap-4">
                              <div className="flex-shrink-0">
                                {comment.user.profile?.profile_picture ? (
                                  <Link
                                    href={`/profile/${comment.user.id}`}
                                    className="relative w-10 h-10"
                                  >
                                    <Image
                                      src={comment.user.profile.profile_picture || "/placeholder.svg"}
                                      alt="Profile"
                                      fill
                                      className="rounded-full object-cover"
                                    />
                                  </Link>
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
                                    {comment.user.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <Link
                                    href={`/profile/${comment.user.id}`}
                                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                                  >
                                    {comment.user.username}
                                  </Link>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-sm text-gray-500">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                
                                <p className="text-gray-800 mb-3">{comment.content}</p>
                                
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                  <Link
                                    href={`/articles/${comment.article.id}`}
                                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
                                  >
                                    Article: {comment.article.title}
                                  </Link>
                                  
                                  <button
                                    onClick={() => handleDelete('comment', comment.id)}
                                    className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    Delete
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
