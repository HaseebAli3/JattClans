import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';

export default function AdminDashboard() {
  const router = useRouter();
  const API_URL = 'http://localhost:8000/api';

  // State management
  const [activeTab, setActiveTab] = useState('articles');
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
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
    }
  }, [activeTab]);

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
      const response = await fetch(`${API_URL}/categories/`);
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

    try {
      const token = localStorage.getItem('access_token');
      const formDataToSend = new FormData();
      formDataToSend.append('title', articleForm.title);
      formDataToSend.append('content', articleForm.content);
      formDataToSend.append('category_id', articleForm.category_id);
      if (articleForm.thumbnail) {
        formDataToSend.append('thumbnail', articleForm.thumbnail);
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
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save article');
      }

      // Reset form and refresh articles
      setArticleForm({
        title: '',
        content: '',
        category_id: '',
        thumbnail: null
      });
      setIsEditingArticle(false);
      setCurrentArticleId(null);
      fetchArticles();
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
      category_id: article.category.id,
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
      
      fetchArticles();
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

      // Reset form and refresh categories
      setCategoryForm({ name: '' });
      setIsEditingCategory(false);
      setCurrentCategoryId(null);
      fetchCategories();
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
      
      fetchCategories();
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

      if (!response.ok) throw new Error('Failed to suspend user');
      
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUserSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'articles' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('articles')}
        >
          Articles
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'categories' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Articles Tab */}
      {activeTab === 'articles' && (
        <>
          {/* Search and Filter */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-8">
            <form onSubmit={(e) => { e.preventDefault(); fetchArticles(); }} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Search articles..."
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="self-end">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>

          {/* Article Form */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {isEditingArticle ? 'Edit Article' : 'Create New Article'}
            </h2>
            <form onSubmit={handleArticleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={articleForm.title}
                    onChange={handleArticleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category_id"
                    value={articleForm.category_id}
                    onChange={handleArticleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  name="content"
                  value={articleForm.content}
                  onChange={handleArticleInputChange}
                  className="w-full p-2 border border-gray-300 rounded min-h-[150px]"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleArticleFileChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex justify-end gap-2">
                {isEditingArticle && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingArticle(false);
                      setArticleForm({
                        title: '',
                        content: '',
                        category_id: '',
                        thumbnail: null
                      });
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {isLoading ? 'Saving...' : isEditingArticle ? 'Update Article' : 'Create Article'}
                </button>
              </div>
            </form>
          </div>

          {/* Articles List */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Articles</h2>
            {isLoading ? (
              <div className="text-center py-8">Loading articles...</div>
            ) : articles.length === 0 ? (
              <div className="text-center py-8">No articles found</div>
            ) : (
              <div className="space-y-4">
                {articles.map(article => (
                  <div key={article.id} className="border-b border-gray-200 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium">{article.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">
                          Category: {article.category.name} | 
                          Views: {article.views} | 
                          Likes: {article.likes} | 
                          Comments: {article.comments.length}
                        </p>
                        <p className="text-gray-700 line-clamp-2">{article.content}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditArticle(article)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
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
          <div className="bg-white p-4 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {isEditingCategory ? 'Edit Category' : 'Create New Category'}
            </h2>
            <form onSubmit={handleCategorySubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={categoryForm.name}
                  onChange={handleCategoryInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                {isEditingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingCategory(false);
                      setCategoryForm({ name: '' });
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {isLoading ? 'Saving...' : isEditingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>

          {/* Categories List */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            {isLoading ? (
              <div className="text-center py-8">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8">No categories found</div>
            ) : (
              <div className="space-y-4">
                {categories.map(category => (
                  <div key={category.id} className="border-b border-gray-200 pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium">{category.name}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
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
          <div className="bg-white p-4 rounded-lg shadow-md mb-8">
            <form onSubmit={handleUserSearch} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Search by username..."
                />
              </div>
              <div className="self-end">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Users List */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Registered Users</h2>
            {isLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">No users found</div>
            ) : (
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user.id} className="border-b border-gray-200 pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium">{user.username}</h3>
                        <p className="text-sm text-gray-500">
                          Email: {user.email} | 
                          Joined: {new Date(user.date_joined).toLocaleDateString()} | 
                          Status: {user.is_active ? 'Active' : 'Suspended'} | 
                          Role: {user.is_staff ? 'Admin' : 'User'}
                        </p>
                        {user.profile && (
                          <p className="text-sm text-gray-500">Bio: {user.profile.bio || 'No bio'}</p>
                        )}
                      </div>
                      {!user.is_staff && (
                        <button
                          onClick={() => handleSuspendUser(user.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          {user.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}