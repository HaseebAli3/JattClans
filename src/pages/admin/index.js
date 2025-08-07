'use client'

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
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  // Fetch data function with improved search
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
        let data = Array.isArray(result.data) ? result.data : result.data.results || [];
        
        // Client-side filtering for better search functionality
        if (endpoint === 'articles' && params.search) {
          data = data.filter(item => 
            item.title.toLowerCase().startsWith(params.search.toLowerCase()) ||
            item.content.toLowerCase().includes(params.search.toLowerCase())
          );
        } else if (endpoint === 'users' && params.search) {
          data = data.filter(item => 
            item.username.toLowerCase().startsWith(params.search.toLowerCase()) ||
            item.email.toLowerCase().startsWith(params.search.toLowerCase())
          );
        } else if (endpoint === 'comments' && params.search) {
          data = data.filter(item => 
            item.content.toLowerCase().includes(params.search.toLowerCase()) ||
            item.user.username.toLowerCase().startsWith(params.search.toLowerCase())
          );
        }
        
        return data;
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
      setShowCreateForm(false);
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
      setShowCreateForm(true);
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

  // Mobile-optimized UI Components with Black/White/Dark Blue theme
  const StatsCard = ({ title, value, icon, gradient, trend }) => (
    <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300 group`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 sm:p-3 bg-white/20 rounded-lg backdrop-blur-sm">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
          </svg>
        </div>
        {trend && (
          <div className="flex items-center text-xs sm:text-sm bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            +{trend}%
          </div>
        )}
      </div>
      <h3 className="text-sm sm:text-base font-medium opacity-90 mb-1">{title}</h3>
      <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );

  const TabButton = ({ tab, icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`group flex items-center space-x-3 w-full px-4 py-3 text-left rounded-xl transition-all duration-300 ${
        isActive
          ? 'bg-slate-900 text-white shadow-lg'
          : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
      }`}
    >
      <div className={`p-2 rounded-lg transition-all duration-300 ${
        isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-white'
      }`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <span className="font-medium capitalize">{tab}</span>
    </button>
  );

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-slate-900 rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">Loading content...</p>
    </div>
  );

  const EmptyState = ({ icon, title, description }) => (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4 transform hover:scale-110 transition-transform duration-300">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 max-w-md mx-auto">{description}</p>
    </div>
  );

  return (
    <>
      <Head>
        <title>Admin Dashboard - Modern CMS</title>
        <meta name="description" content="Beautiful and responsive admin dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white">
        <Navbar />
        
        <div className="flex min-h-screen">
          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={`fixed left-0 top-16 h-full w-72 bg-white border-r border-gray-200 shadow-xl transform transition-all duration-300 z-50 lg:relative lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Admin Panel
                    </h2>
                    <p className="text-gray-500 text-sm">Control Center</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-2">
                <TabButton 
                  tab="articles" 
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
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
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
              <div className="px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-all duration-300"
                    >
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                        Dashboard
                      </h1>
                      <p className="text-gray-600 text-sm sm:text-base mt-1">Manage your content and users</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <main className="px-4 sm:px-6 lg:px-8 py-6">
              {/* Stats Section */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <StatsCard 
                  title="Articles" 
                  value={stats.totalArticles} 
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                  gradient="from-slate-800 to-slate-900"
                  trend="12"
                />
                <StatsCard 
                  title="Users" 
                  value={stats.totalUsers} 
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />}
                  gradient="from-blue-800 to-blue-900"
                  trend="8"
                />
                <StatsCard 
                  title="Comments" 
                  value={stats.totalComments} 
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />}
                  gradient="from-gray-700 to-gray-800"
                  trend="15"
                />
                <StatsCard 
                  title="Categories" 
                  value={stats.totalCategories} 
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />}
                  gradient="from-slate-700 to-slate-800"
                  trend="5"
                />
              </div>

              {/* Status Messages */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-green-800 font-medium">{success}</p>
                  </div>
                </div>
              )}

              {/* Articles Tab */}
              {activeTab === 'articles' && (
                <div className="space-y-6">
                  {/* Create Article Button - Mobile Optimized */}
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                      <svg className="w-6 h-6 mr-2 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Articles Management
                    </h2>
                    <button
                      onClick={() => {
                        setShowCreateForm(!showCreateForm);
                        if (!showCreateForm) {
                          resetForm('article');
                        }
                      }}
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all duration-300 shadow-lg flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {showCreateForm ? 'Cancel' : 'Create Article'}
                    </button>
                  </div>

                  {/* Article Creation Form - Mobile Optimized */}
                  {showCreateForm && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                      <div className="bg-slate-900 px-4 sm:px-6 py-4">
                        <h3 className="text-lg sm:text-xl font-bold text-white flex items-center">
                          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {isEditing.article ? 'Edit Article' : 'Create New Article'}
                        </h3>
                        <p className="text-gray-300 mt-1 text-sm">Fill in the details below</p>
                      </div>
                      <div className="p-4 sm:p-6">
                        <form onSubmit={(e) => handleSubmit('article', e)} className="space-y-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Article Title</label>
                              <input
                                type="text"
                                value={articleForm.title}
                                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-300 placeholder-gray-400"
                                placeholder="Enter article title..."
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                              <select
                                value={articleForm.category_id}
                                onChange={(e) => setArticleForm({ ...articleForm, category_id: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-300"
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
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg min-h-[200px] text-gray-900 bg-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-300 resize-y placeholder-gray-400"
                              placeholder="Write your article content here..."
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail Image</label>
                            <input
                              type="file"
                              onChange={(e) => setArticleForm({ ...articleForm, thumbnail: e.target.files[0] })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                              accept="image/*"
                            />
                          </div>
                          
                          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => {
                                resetForm('article');
                                setShowCreateForm(false);
                              }}
                              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300 font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                            >
                              {isLoading ? (
                                <span className="flex items-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                  )}

                  {/* Articles List */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-slate-900 px-4 sm:px-6 py-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center">
                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H3a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" />
                            </svg>
                            Manage Articles
                          </h3>
                          <p className="text-gray-300 text-sm">View and manage all articles</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search articles..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="px-4 py-2 pl-10 border border-white/30 rounded-lg text-white bg-white/20 backdrop-blur-sm focus:ring-2 focus:ring-white/30 focus:border-white/50 transition-all duration-300 w-full sm:w-64 placeholder-white/70"
                            />
                            <svg className="w-4 h-4 absolute left-3 top-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 border border-white/30 rounded-lg text-white bg-white/20 backdrop-blur-sm focus:ring-2 focus:ring-white/30 focus:border-white/50 transition-all duration-300"
                          >
                            <option value="" className="text-gray-800">All Categories</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id} className="text-gray-800">
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-6">
                      {isLoading ? (
                        <LoadingSpinner />
                      ) : articles.length === 0 ? (
                        <EmptyState 
                          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                          title="No articles found"
                          description="Create your first article to get started"
                        />
                      ) : (
                        <div className="space-y-4">
                          {articles.map((article, index) => (
                            <div key={article.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md hover:border-slate-300 transition-all duration-300">
                              <div className="flex flex-col lg:flex-row justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                  <h4 className="font-bold text-lg sm:text-xl text-gray-900 leading-tight hover:text-slate-700 transition-colors duration-300">{article.title}</h4>
                                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base line-clamp-2">
                                    {article.content.substring(0, 200)}...
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                      </svg>
                                      {article.category?.name || 'No Category'}
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      {article.views || 0} views
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <button
                                    onClick={() => handleEdit('article', article)}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all duration-300 shadow-sm flex items-center justify-center"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete('article', article.id)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-300 shadow-sm flex items-center justify-center"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
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
                <div className="space-y-6">
                  {/* Category Form */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-slate-900 px-4 sm:px-6 py-4">
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {isEditing.category ? 'Edit Category' : 'Create New Category'}
                      </h3>
                      <p className="text-gray-300 text-sm">Organize your content with categories</p>
                    </div>
                    <div className="p-4 sm:p-6">
                      <form onSubmit={(e) => handleSubmit('category', e)} className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                          <input
                            type="text"
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({ name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-300 placeholder-gray-400"
                            placeholder="Enter category name..."
                            required
                          />
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                          {isEditing.category && (
                            <button
                              type="button"
                              onClick={() => resetForm('category')}
                              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300 font-medium"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                          >
                            {isLoading ? (
                              <span className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-slate-900 px-4 sm:px-6 py-4">
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H3a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" />
                        </svg>
                        Manage Categories
                      </h3>
                      <p className="text-gray-300 text-sm">View and manage content categories</p>
                    </div>
                    
                    <div className="p-4 sm:p-6">
                      {isLoading ? (
                        <LoadingSpinner />
                      ) : categories.length === 0 ? (
                        <EmptyState 
                          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />}
                          title="No categories found"
                          description="Create your first category to organize content"
                        />
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categories.map((category, index) => (
                            <div
                              key={category.id}
                              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-slate-300 transition-all duration-300"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-slate-900 rounded-lg">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                  </div>
                                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                                </div>
                                <button
                                  onClick={() => handleEdit('category', category)}
                                  className="px-3 py-1 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-all duration-300 flex items-center"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
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
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-blue-900 px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center">
                          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          Manage Users
                        </h3>
                        <p className="text-blue-100 text-sm">View and manage platform users</p>
                      </div>
                      <div className="w-full sm:w-64 relative">
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 pl-10 border border-white/30 rounded-lg text-white bg-white/20 backdrop-blur-sm focus:ring-2 focus:ring-white/30 focus:border-white/50 transition-all duration-300 placeholder-white/70"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6">
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
                        {users.map((user, index) => (
                          <div
                            key={user.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all duration-300"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              <div className="flex items-center space-x-4 flex-1">
                                {user.profile?.profile_picture ? (
                                  <Link href={`/profile/${user.id}`} className="relative w-12 h-12 flex-shrink-0">
                                    <Image
                                      src={user.profile.profile_picture || "/placeholder.svg"}
                                      alt="Profile"
                                      fill
                                      className="rounded-full object-cover shadow-md ring-2 ring-blue-200"
                                    />
                                  </Link>
                                ) : (
                                  <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-blue-200">
                                    {user.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <Link
                                      href={`/profile/${user.id}`}
                                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors duration-300"
                                    >
                                      {user.username}
                                    </Link>
                                    {user.is_staff && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                        </svg>
                                        Admin
                                      </span>
                                    )}
                                    {!user.is_active && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                        </svg>
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
                                    className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-all duration-300 flex items-center justify-center"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                    Make Admin
                                  </button>
                                )}
                                <button
                                  onClick={() => handleSuspendUser(user.id)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center ${
                                    user.is_active
                                      ? 'bg-red-600 text-white hover:bg-red-700'
                                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                                  }`}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={user.is_active ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                                  </svg>
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
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-800 px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center">
                          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Manage Comments
                        </h3>
                        <p className="text-gray-300 text-sm">View and moderate user comments</p>
                      </div>
                      <div className="w-full sm:w-64 relative">
                        <input
                          type="text"
                          placeholder="Search comments..."
                          value={commentSearchTerm}
                          onChange={(e) => setCommentSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 pl-10 border border-white/30 rounded-lg text-white bg-white/20 backdrop-blur-sm focus:ring-2 focus:ring-white/30 focus:border-white/50 transition-all duration-300 placeholder-white/70"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6">
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
                        {comments.map((comment, index) => (
                          <div
                            key={comment.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-400 transition-all duration-300"
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
                                      className="rounded-full object-cover shadow-md ring-2 ring-gray-200"
                                    />
                                  </Link>
                                ) : (
                                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-gray-200">
                                    {comment.user.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <Link
                                    href={`/profile/${comment.user.id}`}
                                    className="font-medium text-gray-900 hover:text-gray-700 transition-colors duration-300"
                                  >
                                    {comment.user.username}
                                  </Link>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-sm text-gray-500 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {new Date(comment.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                
                                <p className="text-gray-800 mb-4 leading-relaxed">{comment.content}</p>
                                
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                  <Link
                                    href={`/articles/${comment.article.id}`}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 transition-all duration-300"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Article: {comment.article.title}
                                  </Link>
                                  
                                  <button
                                    onClick={() => handleDelete('comment', comment.id)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-300 flex items-center"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
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

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .backdrop-blur-xl {
          backdrop-filter: blur(16px);
        }
        
        .backdrop-blur-sm {
          backdrop-filter: blur(4px);
        }
      `}</style>
    </>
  );
}
