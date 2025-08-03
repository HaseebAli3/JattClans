import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
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
    formatting: [], // Store formatting instructions
  });
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [isEditing, setIsEditing] = useState({ article: false, category: false });
  const [currentId, setCurrentId] = useState({ article: null, category: null });

  // Auth check
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.is_staff) {
      router.push('/articles');
    } else {
      fetchStats();
    }
  }, [router]);

  // Memoized fetch functions
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const responses = await Promise.all([
        fetch(`${API_URL}/articles/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/users/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/comments/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/categories/`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [articlesData, usersData, commentsData, categoriesData] = await Promise.all(
        responses.map((r) => r.json())
      );

      setStats({
        totalArticles: articlesData.count || articlesData.length,
        totalUsers: usersData.count || usersData.length,
        totalComments: commentsData.count || commentsData.length,
        totalCategories: categoriesData.length,
      });
    } catch (err) {
      setError('Failed to fetch statistics');
    }
  }, []);

  const fetchData = useCallback(async (endpoint, search = '') => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = `${API_URL}/${endpoint}/${search ? `?search=${search}` : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);

      const data = await response.json();
      return data.results || data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Tab data fetching
  useEffect(() => {
    const fetchTabData = async () => {
      switch (activeTab) {
        case 'articles':
          setArticles(await fetchData('articles', searchTerm));
          setCategories(await fetchData('categories'));
          break;
        case 'categories':
          setCategories(await fetchData('categories'));
          break;
        case 'users':
          setUsers(await fetchData('users', userSearchTerm));
          break;
        case 'comments':
          setComments(await fetchData('comments', commentSearchTerm));
          break;
        default:
          break;
      }
    };

    fetchTabData();
  }, [activeTab, searchTerm, userSearchTerm, commentSearchTerm, fetchData]);

  // Form handlers
  const handleSubmit = async (type, e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      const isEdit = isEditing[type];
      const id = currentId[type];

      if (type === 'article') {
        formData.append('title', articleForm.title);
        formData.append('content', articleForm.content);
        formData.append('category_id', articleForm.category_id);
        formData.append('formatting', JSON.stringify(articleForm.formatting));
        if (articleForm.thumbnail) formData.append('thumbnail', articleForm.thumbnail);
      } else {
        formData.append('name', categoryForm.name);
      }

      const url = `${API_URL}/${type}s/${isEdit ? `${id}/` : ''}`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: type === 'article' ? formData : JSON.stringify(Object.fromEntries(formData)),
      });

      if (!response.ok) throw new Error(`Failed to ${isEdit ? 'update' : 'create'} ${type}`);

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} ${isEdit ? 'updated' : 'created'} successfully!`);
      resetForm(type);
      fetchStats();
      if (type === 'article') fetchData('articles', searchTerm);
      else fetchData('categories');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = (type) => {
    if (type === 'article') {
      setArticleForm({ title: '', content: '', category_id: '', thumbnail: null, formatting: [] });
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
        category_id: item.category.id.toString(),
        thumbnail: null,
        formatting: item.formatting || [],
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
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/${type}s/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Failed to delete ${type}`);

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
      fetchStats();
      if (type === 'article') fetchData('articles', searchTerm);
      else if (type === 'category') fetchData('categories');
      else fetchData(`${type}s`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMakeAdmin = async (userId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/users/${userId}/make_admin/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to update user role');

      setSuccess('User role updated successfully!');
      fetchData('users', userSearchTerm);
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/users/${userId}/suspend/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to update user status');

      setSuccess('User status updated successfully!');
      fetchData('users', userSearchTerm);
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  // Formatting handlers
  const addFormatting = (type) => {
    const selection = window.getSelection();
    if (selection.rangeCount) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      if (selectedText) {
        const formatting = [...articleForm.formatting, { type, text: selectedText }];
        setArticleForm({ ...articleForm, formatting });
      }
    }
  };

  // UI Components
  const StatsCard = ({ title, value }) => (
    <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[120px] sm:min-w-[150px]">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">{value}</p>
    </div>
  );

  const TabButton = ({ tab }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${
        activeTab === tab
          ? 'border-b-2 border-blue-500 text-blue-600'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {tab.charAt(0).toUpperCase() + tab.slice(1)}
    </button>
  );

  return (
    <>
      <Head>
        <title>Admin Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-gray-800">
            Admin Dashboard
          </h1>

          {/* Stats Section */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatsCard title="Total Articles" value={stats.totalArticles} />
            <StatsCard title="Total Users" value={stats.totalUsers} />
            <StatsCard title="Total Comments" value={stats.totalComments} />
            <StatsCard title="Total Categories" value={stats.totalCategories} />
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hidden">
            {['articles', 'categories', 'users', 'comments'].map((tab) => (
              <TabButton key={tab} tab={tab} />
            ))}
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Articles Tab */}
          {activeTab === 'articles' && (
            <>
              <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">
                  {isEditing.article ? 'Edit Article' : 'Create Article'}
                </h2>
                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addFormatting('heading')}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                  >
                    Heading
                  </button>
                  <button
                    type="button"
                    onClick={() => addFormatting('subheading')}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                  >
                    Subheading
                  </button>
                  <button
                    type="button"
                    onClick={() => addFormatting('paragraph')}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                  >
                    Paragraph
                  </button>
                </div>
                <form onSubmit={(e) => handleSubmit('article', e)}>
                  <div className="grid gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={articleForm.title}
                        onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={articleForm.category_id}
                        onChange={(e) => setArticleForm({ ...articleForm, category_id: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                      <textarea
                        value={articleForm.content}
                        onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md min-h-[150px] text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
                      <input
                        type="file"
                        onChange={(e) => setArticleForm({ ...articleForm, thumbnail: e.target.files[0] })}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    {isEditing.article && (
                      <button
                        type="button"
                        onClick={() => resetForm('article')}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-400 text-sm"
                    >
                      {isLoading ? 'Saving...' : isEditing.article ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Articles List */}
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                  <h2 className="text-lg sm:text-xl font-semibold">Articles</h2>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto"
                    />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto"
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
                  <div className="text-center py-8 text-sm">Loading...</div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">No articles found</div>
                ) : (
                  <div className="space-y-4">
                    {articles.map((article) => (
                      <div key={article.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm sm:text-base">{article.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {article.content}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2 text-xs">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {article.category.name}
                              </span>
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                {article.views} views
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleEdit('article', article)}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete('article', article.id)}
                              className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm"
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
              <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">
                  {isEditing.category ? 'Edit Category' : 'Create Category'}
                </h2>
                <form onSubmit={(e) => handleSubmit('category', e)}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    {isEditing.category && (
                      <button
                        type="button"
                        onClick={() => resetForm('category')}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-400 text-sm"
                    >
                      {isLoading ? 'Saving...' : isEditing.category ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Categories List */}
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Categories</h2>
                {isLoading ? (
                  <div className="text-center py-8 text-sm">Loading...</div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">No categories found</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div key={category.id} className="border border-gray-200 rounded-md p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm sm:text-base">{category.name}</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit('category', category)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
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
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">Users</h2>
                <div className="w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-sm">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No users found</div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        {user.profile?.profile_picture && (
                          <Image
                            src={user.profile.profile_picture}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/profile/${user.id}`}
                              className="font-medium text-sm sm:text-base hover:text-blue-600"
                            >
                              {user.username}
                            </Link>
                            {user.is_staff && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                Admin
                              </span>
                            )}
                            {!user.is_active && (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                Suspended
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <div className="flex gap-2 self-end sm:self-center">
                          {!user.is_staff && (
                            <button
                              type="button"
                              onClick={() => handleMakeAdmin(user.id)}
                              className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                            >
                              Make Admin
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSuspendUser(user.id)}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm"
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
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">Comments</h2>
                <div className="w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search comments..."
                    value={commentSearchTerm}
                    onChange={(e) => setCommentSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-sm">Loading...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No comments found</div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex flex-col sm:flex-row gap-3">
                        {comment.user.profile?.profile_picture && (
                          <Image
                            src={comment.user.profile.profile_picture}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/profile/${comment.user.id}`}
                              className="font-medium text-sm sm:text-base hover:text-blue-600"
                            >
                              {comment.user.username}
                            </Link>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm mt-1 line-clamp-3">{comment.content}</p>
                          <Link
                            href={`/articles/${comment.article.id}`}
                            className="text-xs text-blue-600 hover:underline mt-1 block"
                          >
                            On: {comment.article.title}
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete('comment', comment.id)}
                          className="self-start text-red-600 hover:text-red-800 text-sm"
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