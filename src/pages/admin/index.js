import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import Image from 'next/image';
import PropTypes from 'prop-types';
import { marked } from 'marked'; // Add marked for Markdown rendering

export default function AdminDashboard() {
  const router = useRouter();
  const API_URL = 'https://haseebclan.pythonanywhere.com/api';
  const textareaRef = useRef(null);
  const previewRef = useRef(null);

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

  // Auth check and token refresh
  const refreshToken = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) throw new Error('No refresh token available');
      const response = await fetch(`${API_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!response.ok) throw new Error('Failed to refresh token');
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      return data.access;
    } catch (err) {
      setError('Session expired. Please log in again.');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      router.push('/login');
      return null;
    }
  }, [router]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.is_staff) {
      router.push('/articles');
      return;
    }
    fetchStats();
  }, [router, refreshToken]);

  // Memoized fetch functions
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      let token = localStorage.getItem('access_token');
      const responses = await Promise.all([
        fetch(`${API_URL}/articles/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/users/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/comments/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/categories/`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      // Check for 401 and refresh token if needed
      if (responses.some((r) => r.status === 401)) {
        token = await refreshToken();
        if (!token) throw new Error('Authentication failed');
        responses = await Promise.all([
          fetch(`${API_URL}/articles/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/users/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/comments/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/categories/`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
      }

      const [articlesData, usersData, commentsData, categoriesData] = await Promise.all(
        responses.map(async (r) => {
          if (!r.ok) throw new Error(`Failed to fetch ${r.url}: ${r.statusText}`);
          return r.json();
        })
      );

      setStats({
        totalArticles: articlesData.length || 0,
        totalUsers: usersData.length || 0,
        totalComments: commentsData.length || 0,
        totalCategories: categoriesData.length || 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch statistics');
    } finally {
      setIsLoading(false);
    }
  }, [refreshToken]);

  const fetchData = useCallback(async (endpoint, search = '') => {
    setIsLoading(true);
    try {
      let token = localStorage.getItem('access_token');
      const url = search ? `${API_URL}/${endpoint}/?${search}` : `${API_URL}/${endpoint}/`;
      let response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        token = await refreshToken();
        if (!token) throw new Error('Authentication failed');
        response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch ${endpoint}: ${response.statusText}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [refreshToken]);

  // Tab data fetching
  useEffect(() => {
    const fetchTabData = async () => {
      switch (activeTab) {
        case 'articles':
          setArticles(
            await fetchData(
              'articles',
              selectedCategory ? `category=${selectedCategory}&search=${encodeURIComponent(searchTerm)}` : `search=${encodeURIComponent(searchTerm)}`
            )
          );
          setCategories(await fetchData('categories'));
          break;
        case 'categories':
          setCategories(await fetchData('categories'));
          break;
        case 'users':
          setUsers(await fetchData('users', `search=${encodeURIComponent(userSearchTerm)}`));
          break;
        case 'comments':
          setComments(await fetchData('comments', `search=${encodeURIComponent(commentSearchTerm)}`));
          break;
        default:
          break;
      }
    };

    fetchTabData();
  }, [activeTab, searchTerm, selectedCategory, userSearchTerm, commentSearchTerm, fetchData]);

  // Form handlers
  const handleSubmit = async (type, e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      let token = localStorage.getItem('access_token');
      const isEdit = isEditing[type];
      const id = currentId[type];
      let url = `${API_URL}/${type}s/`;
      let body;

      if (type === 'article') {
        const formData = new FormData();
        formData.append('title', articleForm.title);
        formData.append('content', articleForm.content);
        if (articleForm.category_id) formData.append('category_id', articleForm.category_id);
        if (articleForm.thumbnail) formData.append('thumbnail', articleForm.thumbnail);
        body = formData;
        url = isEdit ? `${url}${id}/` : url;
      } else {
        body = JSON.stringify({ name: categoryForm.name });
        url = isEdit ? `${url}${id}/` : url;
      }

      let response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(type === 'category' && { 'Content-Type': 'application/json' }),
        },
        body,
      });

      if (response.status === 401) {
        token = await refreshToken();
        if (!token) throw new Error('Authentication failed');
        response = await fetch(url, {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            ...(type === 'category' && { 'Content-Type': 'application/json' }),
          },
          body,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || `Failed to ${isEdit ? 'update' : 'create'} ${type}`);
      }

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} ${isEdit ? 'updated' : 'created'} successfully!`);
      resetForm(type);
      fetchStats();
      if (type === 'article') {
        fetchData('articles', selectedCategory ? `category=${selectedCategory}&search=${searchTerm}` : `search=${searchTerm}`);
      } else {
        fetchData('categories');
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
      let token = localStorage.getItem('access_token');
      const url = `${API_URL}/${type}s/${id}/`;
      let response = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        token = await refreshToken();
        if (!token) throw new Error('Authentication failed');
        response = await fetch(url, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || `Failed to delete ${type}`);
      }

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
      fetchStats();
      if (type === 'article') {
        fetchData('articles', selectedCategory ? `category=${selectedCategory}&search=${searchTerm}` : `search=${searchTerm}`);
      } else if (type === 'category') {
        fetchData('categories');
      } else {
        fetchData(`${type}s`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMakeAdmin = async (userId) => {
    try {
      let token = localStorage.getItem('access_token');
      let response = await fetch(`${API_URL}/users/${userId}/make-admin/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        token = await refreshToken();
        if (!token) throw new Error('Authentication failed');
        response = await fetch(`${API_URL}/users/${userId}/make-admin/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }

      setSuccess('User role updated successfully!');
      fetchData('users', `search=${encodeURIComponent(userSearchTerm)}`);
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      let token = localStorage.getItem('access_token');
      let response = await fetch(`${API_URL}/suspend-user/${userId}/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        token = await refreshToken();
        if (!token) throw new Error('Authentication failed');
        response = await fetch(`${API_URL}/suspend-user/${userId}/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }

      setSuccess('User status updated successfully!');
      fetchData('users', `search=${encodeURIComponent(userSearchTerm)}`);
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  // Formatting handlers
  const addFormatting = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = articleForm.content.substring(start, end) || 'Text';

    let formattedText;
    switch (type) {
      case 'heading':
        formattedText = `# ${selectedText}\n`;
        break;
      case 'subheading':
        formattedText = `## ${selectedText}\n`;
        break;
      case 'paragraph':
        formattedText = `${selectedText}\n\n`;
        break;
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent =
      articleForm.content.substring(0, start) +
      formattedText +
      articleForm.content.substring(end);

    setArticleForm({ ...articleForm, content: newContent });
    textarea.focus();
    textarea.setSelectionRange(start, start + formattedText.length);

    // Update preview
    if (previewRef.current) {
      previewRef.current.innerHTML = marked(newContent, { sanitize: true });
    }
  };

  // UI Components
  const StatsCard = ({ title, value }) => (
    <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[120px]">
      <h3 className="text-base font-medium text-gray-600">{title}</h3>
      <p className="text-2xl font-bold text-blue-600 mt-2">{value}</p>
    </div>
  );

  StatsCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
  };

  const TabButton = ({ tab }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-base font-medium whitespace-nowrap transition-colors duration-200 ${
        activeTab === tab
          ? 'border-b-2 border-blue-600 text-blue-700'
          : 'text-gray-600 hover:text-gray-800'
      }`}
      aria-label={`Switch to ${tab} tab`}
    >
      {tab.charAt(0).toUpperCase() + tab.slice(1)}
    </button>
  );

  TabButton.propTypes = {
    tab: PropTypes.string.isRequired,
  };

  return (
    <>
      <Head>
        <title>Admin Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-800">
            Admin Dashboard
          </h1>

          {/* Stats Section */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatsCard title="Total Articles" value={stats.totalArticles} />
            <StatsCard title="Total Users" value={stats.totalUsers} />
            <StatsCard title="Total Comments" value={stats.totalComments} />
            <StatsCard title="Total Categories" value={stats.totalCategories} />
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 mb-8 overflow-x-auto scrollbar-hidden">
            {['articles', 'categories', 'users', 'comments'].map((tab) => (
              <TabButton key={tab} tab={tab} />
            ))}
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
              <p className="text-red-700 text-base">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md">
              <p className="text-green-700 text-base">{success}</p>
            </div>
          )}

          {/* Articles Tab */}
          {activeTab === 'articles' && (
            <>
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-6">
                  {isEditing.article ? 'Edit Article' : 'Create Article'}
                </h2>
                <div className="mb-6 flex flex-wrap gap-2">
                  {[
                    { type: 'heading', label: 'Heading' },
                    { type: 'subheading', label: 'Subheading' },
                    { type: 'paragraph', label: 'Paragraph' },
                    { type: 'bold', label: 'Bold' },
                  ].map(({ type, label }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addFormatting(type)}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-base hover:bg-blue-200 transition-colors"
                      aria-label={`Apply ${label} formatting`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <form onSubmit={(e) => handleSubmit('article', e)}>
                  <div className="grid gap-6 mb-6">
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={articleForm.title}
                        onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500"
                        required
                        aria-label="Article title"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={articleForm.category_id}
                        onChange={(e) => setArticleForm({ ...articleForm, category_id: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500"
                        required
                        aria-label="Select article category"
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
                      <label className="block text-base font-medium text-gray-700 mb-2">Content</label>
                      <textarea
                        ref={textareaRef}
                        value={articleForm.content}
                        onChange={(e) => {
                          setArticleForm({ ...articleForm, content: e.target.value });
                          if (previewRef.current) {
                            previewRef.current.innerHTML = marked(e.target.value, { sanitize: true });
                          }
                        }}
                        className="w-full p-3 border border-gray-300 rounded-md min-h-[200px] text-base focus:ring-2 focus:ring-blue-500"
                        required
                        aria-label="Article content"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">Preview</label>
                      <div
                        ref={previewRef}
                        className="w-full p-3 border border-gray-300 rounded-md min-h-[200px] text-base bg-gray-50 prose"
                        dangerouslySetInnerHTML={{ __html: marked(articleForm.content, { sanitize: true }) }}
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">Thumbnail</label>
                      <input
                        type="file"
                        onChange={(e) => setArticleForm({ ...articleForm, thumbnail: e.target.files[0] })}
                        className="w-full p-3 border border-gray-300 rounded-md text-base"
                        accept="image/*"
                        aria-label="Upload article thumbnail"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    {isEditing.article && (
                      <button
                        type="button"
                        onClick={() => resetForm('article')}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md text-base hover:bg-gray-600 transition-colors"
                        aria-label="Cancel article editing"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-base disabled:bg-blue-400 hover:bg-blue-700 transition-colors"
                      aria-label={isEditing.article ? 'Update article' : 'Create article'}
                    >
                      {isLoading ? 'Saving...' : isEditing.article ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Articles List */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-2xl font-semibold">Articles</h2>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="p-3 border border-gray-300 rounded-md text-base w-full sm:w-64 focus:ring-2 focus:ring-blue-500"
                      aria-label="Search articles"
                    />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="p-3 border border-gray-300 rounded-md text-base w-full sm:w-48 focus:ring-2 focus:ring-blue-500"
                      aria-label="Filter by category"
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

                {isLoading ? (
                  <div className="text-center py-8 text-base text-gray-600">Loading...</div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-base">No articles found</div>
                ) : (
                  <div className="space-y-6">
                    {articles.map((article) => (
                      <div key={article.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{article.title}</h3>
                            <div
                              className="text-base text-gray-600 mt-2 line-clamp-3 prose"
                              dangerouslySetInnerHTML={{ __html: marked(article.content, { sanitize: true }) }}
                            />
                            <div className="flex flex-wrap gap-3 mt-3">
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                                {article.category?.name || 'No Category'}
                              </span>
                              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm">
                                {article.views} views
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-3 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleEdit('article', article)}
                              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-base hover:bg-blue-200 transition-colors"
                              aria-label={`Edit article ${article.title}`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete('article', article.id)}
                              className="px-4 py-2 bg-red-100 text-red-800 rounded-md text-base hover:bg-red-200 transition-colors"
                              aria-label={`Delete article ${article.title}`}
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
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-6">
                  {isEditing.category ? 'Edit Category' : 'Create Category'}
                </h2>
                <form onSubmit={(e) => handleSubmit('category', e)}>
                  <div className="mb-6">
                    <label className="block text-base font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500"
                      required
                      aria-label="Category name"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    {isEditing.category && (
                      <button
                        type="button"
                        onClick={() => resetForm('category')}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md text-base hover:bg-gray-600 transition-colors"
                        aria-label="Cancel category editing"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-base disabled:bg-blue-400 hover:bg-blue-700 transition-colors"
                      aria-label={isEditing.category ? 'Update category' : 'Create category'}
                    >
                      {isLoading ? 'Saving...' : isEditing.category ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Categories List */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6">Categories</h2>
                {isLoading ? (
                  <div className="text-center py-8 text-base text-gray-600">Loading...</div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-base">No categories found</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div key={category.id} className="border border-gray-200 rounded-md p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-base">{category.name}</span>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleEdit('category', category)}
                              className="text-blue-600 hover:text-blue-800 text-base transition-colors"
                              aria-label={`Edit category ${category.name}`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete('category', category.id)}
                              className="text-red-600 hover:text-red-800 text-base transition-colors"
                              aria-label={`Delete category ${category.name}`}
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-semibold">Users</h2>
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500"
                    aria-label="Search users"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-base text-gray-600">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-base">No users found</div>
              ) : (
                <div className="space-y-6">
                  {users.map((user) => (
                    <div key={user.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {user.profile?.profile_picture && (
                          <Image
                            src={user.profile.profile_picture}
                            alt={`${user.username}'s profile`}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <Link
                              href={`/profile/${user.id}`}
                              className="font-semibold text-base hover:text-blue-600 transition-colors"
                              aria-label={`View profile of ${user.username}`}
                            >
                              {user.username}
                            </Link>
                            {user.is_staff && (
                              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">
                                Admin
                              </span>
                            )}
                            {!user.is_active && (
                              <span className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded">
                                Suspended
                              </span>
                            )}
                          </div>
                          <p className="text-base text-gray-600 mt-1">{user.email}</p>
                        </div>
                        <div className="flex gap-3 self-end sm:self-center">
                          {!user.is_staff && (
                            <button
                              type="button"
                              onClick={() => handleMakeAdmin(user.id)}
                              className="px-4 py-2 bg-green-100 text-green-800 rounded-md text-base hover:bg-green-200 transition-colors"
                              aria-label={`Make ${user.username} admin`}
                            >
                              Make Admin
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSuspendUser(user.id)}
                            className="px-4 py-2 bg-red-100 text-red-800 rounded-md text-base hover:bg-red-200 transition-colors"
                            aria-label={user.is_active ? `Suspend ${user.username}` : `Unsuspend ${user.username}`}
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-semibold">Comments</h2>
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search comments..."
                    value={commentSearchTerm}
                    onChange={(e) => setCommentSearchTerm(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500"
                    aria-label="Search comments"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-base text-gray-600">Loading...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-base">No comments found</div>
              ) : (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {comment.user.profile?.profile_picture && (
                          <Image
                            src={comment.user.profile.profile_picture}
                            alt={`${comment.user.username}'s profile`}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <Link
                              href={`/profile/${comment.user.id}`}
                              className="font-semibold text-base hover:text-blue-600 transition-colors"
                              aria-label={`View profile of ${comment.user.username}`}
                            >
                              {comment.user.username}
                            </Link>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-base mt-2 line-clamp-3">{comment.content}</p>
                          <Link
                            href={`/articles/${comment.article.id}`}
                            className="text-base text-blue-600 hover:underline mt-2 block"
                            aria-label={`View article ${comment.article.title}`}
                          >
                            On: {comment.article.title}
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete('comment', comment.id)}
                          className="self-start text-red-600 hover:text-red-800 text-base transition-colors"
                          aria-label={`Delete comment by ${comment.user.username}`}
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

AdminDashboard.propTypes = {};