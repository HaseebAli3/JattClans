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
      'Authorization': `Bearer ${token}`,
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

      // Handle empty responses (like for DELETE requests)
      if (response.status === 204) {
        return { success: true };
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        return { 
          success: false,
          error: text || 'Invalid response from server'
        };
      }

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.detail || data.message || `Request failed with status ${response.status}`
        };
      }

      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Network error occurred'
      };
    }
  }, []);

  // Fetch data function
  const fetchData = useCallback(async (endpoint, params = {}) => {
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
  }, [makeRequest]);

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
            category: selectedCategory 
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
          category: selectedCategory 
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
    setIsEditing(prev => ({ ...prev, [type]: false }));
    setCurrentId(prev => ({ ...prev, [type]: null }));
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
    setIsEditing(prev => ({ ...prev, [type]: true }));
    setCurrentId(prev => ({ ...prev, [type]: item.id }));
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
          category: selectedCategory 
        }));
      } else if (type === 'category') {
        setCategories(await fetchData('categories'));
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
    const action = users.find(u => u.id === userId)?.is_active ? 'suspend' : 'unsuspend';
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
  const StatsCard = ({ title, value }) => (
    <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[120px]">
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      <p className="text-2xl font-bold text-blue-600 mt-1">{value}</p>
    </div>
  );

  const TabButton = ({ tab }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium ${
        activeTab === tab
          ? 'border-b-2 border-blue-500 text-blue-600'
          : 'text-gray-700 hover:text-blue-600'
      }`}
    >
      {tab.charAt(0).toUpperCase() + tab.slice(1)}
    </button>
  );

  return (
    <>
      <Head>
        <title>Admin Dashboard</title>
        <meta name="description" content="Admin dashboard for content management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="container mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

          {/* Stats Section */}
          <div className="flex flex-wrap gap-4 mb-6 overflow-x-auto pb-2">
            <StatsCard title="Total Articles" value={stats.totalArticles} />
            <StatsCard title="Total Users" value={stats.totalUsers} />
            <StatsCard title="Total Comments" value={stats.totalComments} />
            <StatsCard title="Total Categories" value={stats.totalCategories} />
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            {['articles', 'categories', 'users', 'comments'].map(tab => (
              <TabButton key={tab} tab={tab} />
            ))}
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* Articles Tab */}
          {activeTab === 'articles' && (
            <>
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  {isEditing.article ? 'Edit Article' : 'Create Article'}
                </h2>
                <form onSubmit={(e) => handleSubmit('article', e)}>
                  <div className="grid gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={articleForm.title}
                        onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={articleForm.category_id}
                        onChange={(e) => setArticleForm({...articleForm, category_id: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                      <textarea
                        value={articleForm.content}
                        onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md min-h-[200px] text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
                      <input
                        type="file"
                        onChange={(e) => setArticleForm({...articleForm, thumbnail: e.target.files[0]})}
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        accept="image/*"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    {isEditing.article && (
                      <button
                        type="button"
                        onClick={() => resetForm('article')}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Saving...' : isEditing.article ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Articles List */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                  <h2 className="text-xl font-semibold text-gray-800">Articles</h2>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md text-sm w-full text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-8 text-gray-700">Loading...</div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">No articles found</div>
                ) : (
                  <div className="space-y-4">
                    {articles.map(article => (
                      <div key={article.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">{article.title}</h3>
                            <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                              {article.content.substring(0, 200)}...
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2 text-xs">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {article.category?.name || 'No Category'}
                              </span>
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                {article.views} views
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 self-end sm:self-center">
                            <button
                              onClick={() => handleEdit('article', article)}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete('article', article.id)}
                              className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200 transition-colors"
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
            </>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <>
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  {isEditing.category ? 'Edit Category' : 'Create Category'}
                </h2>
                <form onSubmit={(e) => handleSubmit('category', e)}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    {isEditing.category && (
                      <button
                        type="button"
                        onClick={() => resetForm('category')}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Saving...' : isEditing.category ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Categories List */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Categories</h2>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-700">Loading...</div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">No categories found</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map(category => (
                      <div key={category.id} className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800">{category.name}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit('category', category)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete('category', category.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
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
            </>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Users</h2>
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-gray-700">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-600">No users found</div>
              ) : (
                <div className="space-y-4">
                  {users.map(user => (
                    <div key={user.id} className="border-b border-gray-200 pb-4 last:border-b-0 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {user.profile?.profile_picture && (
                          <Link href={`/profile/${user.id}`} className="relative w-10 h-10">
                            <Image
                              src={user.profile.profile_picture}
                              alt="Profile"
                              fill
                              className="rounded-full object-cover"
                            />
                          </Link>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/profile/${user.id}`} className="font-medium hover:text-blue-600 truncate text-gray-800">
                              {user.username}
                            </Link>
                            {user.is_staff && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded whitespace-nowrap">
                                Admin
                              </span>
                            )}
                            {!user.is_active && (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded whitespace-nowrap">
                                Suspended
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 truncate">{user.email}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {!user.is_staff && (
                            <button
                              onClick={() => handleMakeAdmin(user.id)}
                              className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200 whitespace-nowrap transition-colors"
                            >
                              Make Admin
                            </button>
                          )}
                          <button
                            onClick={() => handleSuspendUser(user.id)}
                            className={`px-3 py-1 rounded-md text-sm whitespace-nowrap transition-colors ${
                              user.is_active 
                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }`}
                          >
                            {user.is_active ? 'Suspend' : 'Unsuspend'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Comments</h2>
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search comments..."
                    value={commentSearchTerm}
                    onChange={(e) => setCommentSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-gray-700">Loading...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-600">No comments found</div>
              ) : (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0 hover:bg-gray-50 transition-colors">
                      <div className="flex gap-3">
                        {comment.user.profile?.profile_picture && (
                          <Link href={`/profile/${comment.user.id}`} className="relative w-10 h-10 flex-shrink-0">
                            <Image
                              src={comment.user.profile.profile_picture}
                              alt="Profile"
                              fill
                              className="rounded-full object-cover"
                            />
                          </Link>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/profile/${comment.user.id}`} className="font-medium hover:text-blue-600 truncate text-gray-800">
                              {comment.user.username}
                            </Link>
                            <span className="text-xs text-gray-600 whitespace-nowrap">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm mt-1 break-words text-gray-800">{comment.content}</p>
                          <Link 
                            href={`/articles/${comment.article.id}`} 
                            className="text-xs text-blue-600 hover:underline mt-1 block truncate"
                          >
                            On: {comment.article.title}
                          </Link>
                        </div>
                        <button
                          onClick={() => handleDelete('comment', comment.id)}
                          className="self-start text-red-600 hover:text-red-800 text-sm flex-shrink-0"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}