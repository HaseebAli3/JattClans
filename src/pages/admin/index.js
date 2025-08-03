import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import Image from 'next/image';


export default function AdminDashboard() {
  const router = useRouter();
  const API_URL = 'https://haseebclan.pythonanywhere.com/api/';

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
    totalCategories: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [commentSearchTerm, setCommentSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Article form state
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    category_id: '',
    thumbnail: null
  });
  const [isEditingArticle, setIsEditingArticle] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState(null);

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: ''
  });
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState(null);

  // Check authentication and admin status
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.is_staff) {
      router.push('/login');
    } else {
      fetchStats();
    }
  }, [router]);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'articles') {
      fetchArticles();
      fetchCategories();
    } else if (activeTab === 'categories') {
      fetchCategories();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'comments') {
      fetchComments();
    }
  }, [activeTab]);

  // Fetch website statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const [articlesRes, usersRes, commentsRes, categoriesRes] = await Promise.all([
        fetch(`${API_URL}/articles/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/users/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/comments/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/categories/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [articlesData, usersData, commentsData, categoriesData] = await Promise.all([
        articlesRes.json(),
        usersRes.json(),
        commentsRes.json(),
        categoriesRes.json()
      ]);

      setStats({
        totalArticles: articlesData.count || articlesData.length,
        totalUsers: usersData.count || usersData.length,
        totalComments: commentsData.count || commentsData.length,
        totalCategories: categoriesData.length
      });
    } catch (err) {
      setError('Failed to fetch statistics');
    }
  };

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      let url = `${API_URL}/articles/`;
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch articles');
      
      const data = await response.json();
      setArticles(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/categories/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      let url = `${API_URL}/users/`;
      
      if (userSearchTerm) {
        url += `?search=${userSearchTerm}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      let url = `${API_URL}/comments/`;
      
      if (commentSearchTerm) {
        url += `?search=${commentSearchTerm}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch comments');
      
      const data = await response.json();
      setComments(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Format content with line breaks
  const formatContent = (content) => {
    if (!content) return '';
    return content.split('\n').map(paragraph => {
      return paragraph.match(/.{1,80}(\s|$)/g)?.join('\n') || paragraph;
    }).join('\n');
  };

  // Article handlers
  const handleArticleInputChange = (e) => {
    const { name, value } = e.target;
    setArticleForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArticleFileChange = (e) => {
    setArticleForm(prev => ({
      ...prev,
      thumbnail: e.target.files[0]
    }));
  };

  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('title', articleForm.title);
      formData.append('content', articleForm.content);
      formData.append('category_id', articleForm.category_id);

      if (articleForm.thumbnail) {
        formData.append('thumbnail', articleForm.thumbnail);
      }

      let url = `${API_URL}/articles/`;
      let method = 'POST';
      
      if (isEditingArticle && currentArticleId) {
        url = `${API_URL}/articles/${currentArticleId}/`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || Object.values(errorData)[0]?.[0] || 'Failed to save article');
      }

      setArticleForm({
        title: '',
        content: '',
        category_id: '',
        thumbnail: null
      });
      setIsEditingArticle(false);
      setCurrentArticleId(null);
      setSuccess(isEditingArticle ? 'Article updated successfully!' : 'Article created successfully!');
      fetchArticles();
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditArticle = (article) => {
    setArticleForm({
      title: article.title,
      content: article.content,
      category_id: article.category.id.toString(),
      thumbnail: null
    });
    setIsEditingArticle(true);
    setCurrentArticleId(article.id);
  };

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/articles/${articleId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete article');
      
      setSuccess('Article deleted successfully!');
      fetchArticles();
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  // Category handlers
  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const data = {
        name: categoryForm.name
      };

      let url = `${API_URL}/categories/`;
      let method = 'POST';

      if (isEditingCategory && currentCategoryId) {
        url = `${API_URL}/categories/${currentCategoryId}/`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save category');
      }

      setCategoryForm({ name: '' });
      setIsEditingCategory(false);
      setCurrentCategoryId(null);
      setSuccess(isEditingCategory ? 'Category updated successfully!' : 'Category created successfully!');
      fetchCategories();
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setCategoryForm({
      name: category.name
    });
    setIsEditingCategory(true);
    setCurrentCategoryId(category.id);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/categories/${categoryId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete category');
      
      setSuccess('Category deleted successfully!');
      fetchCategories();
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  // User handlers
  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/suspend-user/${userId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to suspend user');
      }

      const result = await response.json();
      setSuccess(result.message);
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMakeAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to make this user an admin?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/users/${userId}/make-admin/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_staff: true })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to make user admin');
      }

      const result = await response.json();
      setSuccess(result.message);
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUserSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCommentSearch = (e) => {
    e.preventDefault();
    fetchComments();
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/comments/${commentId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete comment');
      
      setSuccess('Comment deleted successfully!');
      fetchComments();
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-10 text-gray-900">Admin Dashboard</h1>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { title: 'Total Articles', value: stats.totalArticles },
            { title: 'Total Users', value: stats.totalUsers },
            { title: 'Total Comments', value: stats.totalComments },
            { title: 'Total Categories', value: stats.totalCategories },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-700">{stat.title}</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          {['articles', 'categories', 'users', 'comments'].map(tab => (
            <button
              key={tab}
              className={`py-3 px-6 font-medium text-sm uppercase tracking-wide ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              } transition-colors duration-200`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Articles Tab */}
        {activeTab === 'articles' && (
          <>
            {/* Search and Filter */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Articles</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                    placeholder="Search articles..."
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => fetchArticles()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Article Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">
                {isEditingArticle ? 'Edit Article' : 'Create New Article'}
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={articleForm.title}
                      onChange={handleArticleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      name="category_id"
                      value={articleForm.category_id}
                      onChange={handleArticleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    name="content"
                    value={articleForm.content}
                    onChange={handleArticleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg min-h-[150px] focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleArticleFileChange}
                    className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  {isEditingArticle && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingArticle(false);
                        setArticleForm({ title: '', content: '', category_id: '', thumbnail: null });
                        setCurrentArticleId(null);
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleArticleSubmit}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:bg-blue-300 transition-colors"
                  >
                    {isLoading ? 'Saving...' : isEditingArticle ? 'Update Article' : 'Create Article'}
                  </button>
                </div>
              </div>
            </div>

            {/* Articles List */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">Articles</h2>
              {isLoading ? (
                <div className="text-center py-10 text-gray-600">Loading articles...</div>
              ) : articles.length === 0 ? (
                <div className="text-center py-10 text-gray-600">No articles found</div>
              ) : (
                <div className="space-y-6">
                  {articles.map(article => (
                    <div key={article.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Category: {article.category.name} | Views: {article.views} | Likes: {article.likes} | Comments: {article.comments.length}
                          </p>
                          <p className="text-gray-700 mt-2 whitespace-pre-wrap break-words">
                            {formatContent(article.content).substring(0, 200)}...
                          </p>
                        </div>
                        <div className="flex gap-3 ml-4">
                          <button
                            onClick={() => handleEditArticle(article)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(article.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
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
            {/* Category Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">
                {isEditingCategory ? 'Edit Category' : 'Create New Category'}
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={categoryForm.name}
                    onChange={handleCategoryInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  {isEditingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingCategory(false);
                        setCategoryForm({ name: '' });
                        setCurrentCategoryId(null);
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCategorySubmit}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:bg-blue-300 transition-colors"
                  >
                    {isLoading ? 'Saving...' : isEditingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </div>
            </div>

            {/* Categories List */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">Categories</h2>
              {isLoading ? (
                <div className="text-center py-10 text-gray-600">Loading categories...</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-10 text-gray-600">No categories found</div>
              ) : (
                <div className="space-y-6">
                  {categories.map(category => (
                    <div key={category.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
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
          <>
            {/* User Search */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                    placeholder="Search by username..."
                  />
                </div>
                <button
                  onClick={handleUserSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">Registered Users</h2>
              {isLoading ? (
                <div className="text-center py-10 text-gray-600">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-10 text-gray-600">No users found</div>
              ) : (
                <div className="space-y-6">
                  {users.map(user => (
                    <div key={user.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          {user.profile?.profile_picture && (
                            <Image
                              src={user.profile.profile_picture} 
                              alt="Profile" 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <Link href={`/profile/${user.id}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                              {user.username}
                            </Link>
                            <p className="text-sm text-gray-600 mt-1">
                              Email: {user.email} | Joined: {new Date(user.date_joined).toLocaleDateString()} | 
                              Status: <span className={user.is_active ? 'text-green-600' : 'text-red-600'}>
                                {user.is_active ? 'Active' : 'Suspended'}
                              </span> | 
                              Role: <span className={user.is_staff ? 'text-blue-600' : 'text-gray-600'}>
                                {user.is_staff ? 'Admin' : 'User'}
                              </span>
                            </p>
                            {user.profile && (
                              <p className="text-sm text-gray-600 mt-1">Bio: {user.profile.bio || 'No bio'}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSuspendUser(user.id)}
                            className={`px-4 py-2 rounded-lg text-sm text-white ${
                              user.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-red-500 hover:bg-red-600'
                            } transition-colors`}
                          >
                            {user.is_active ? 'Suspend' : 'Suspend'}
                          </button>
                          {!user.is_staff && (
                            <button
                              onClick={() => handleMakeAdmin(user.id)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                            >
                              Make Admin
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <>
            {/* Comment Search */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Comments</label>
                  <input
                    type="text"
                    value={commentSearchTerm}
                    onChange={(e) => setCommentSearchTerm(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                    placeholder="Search comment content..."
                  />
                </div>
                <button
                  onClick={handleCommentSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">Recent Comments</h2>
              {isLoading ? (
                <div className="text-center py-10 text-gray-600">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10 text-gray-600">No comments found</div>
              ) : (
                <div className="space-y-6">
                  {comments.map(comment => (
                    <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {comment.user.profile?.profile_picture && (
                              <Image 
                                src={comment.user.profile.profile_picture} 
                                alt="Profile" 
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <Link href={`/profile/${comment.user.id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                {comment.user.username}
                              </Link>
                              <span className="text-sm text-gray-500 ml-2">
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 mt-2 whitespace-pre-wrap break-words">
                            {comment.content}
                          </p>
                          <Link 
                            href={`/articles/${comment.article.id}`} 
                            className="text-sm text-blue-600 hover:underline mt-2 block"
                          >
                            On article: {comment.article.title}
                          </Link>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}