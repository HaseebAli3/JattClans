import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FaSearch, FaUser, FaComment, FaThumbsUp, FaEye, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Image from 'next/image';

const api = axios.create({
  baseURL: 'https://haseebclan.pythonanywhere.com/api/',
});

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  const fetchArticles = useCallback(async () => {
    try {
      const response = await api.get(
        `articles/?search=${search}&category=${selectedCategory}&page=${page}`
      );
      setArticles(Array.isArray(response.data.results) ? response.data.results : []);
      setTotalPages(Math.ceil(response.data.count / 10));
      setError('');
    } catch (err) {
      console.error('Error fetching articles:', err.response?.data || err.message);
      setError('Failed to load articles. Please try again later.');
      setArticles([]);
    }
  }, [search, selectedCategory, page]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('categories/');
      setCategories(Array.isArray(response.data.results) ? response.data.results : response.data);
    } catch (err) {
      console.error('Error fetching categories:', err.response?.data || err.message);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchArticles(), fetchCategories()]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [fetchArticles, fetchCategories]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when search changes
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(1); // Reset to first page when category changes
  };

  const handleArticleClick = (id) => {
    router.push(`/articles/${id}`);
  };

  return (
    <>
      <Head>
        <title>جٹ کلینز - Articles</title>
        <link rel="icon" href="/jutt-icon.png" />
        <meta name="description" content="Explore articles about Jatt culture and heritage" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-100 to-coral-100">
        <Navbar currentPage="articles" />
        
        <main className="container mx-auto px-3 py-4">
          {/* Search and Filter */}
          <div className="mb-4 bg-white p-1 rounded-lg shadow-sm border border-teal-200">
            <div className="flex flex-col sm:flex-row gap-1 items-center">
              <div className="relative flex-grow w-full">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <FaSearch className="text-teal-600 text-xs" />
                </div>
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full pl-6 pr-2 py-1 border border-teal-200 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-transparent text-teal-900 placeholder-teal-400 text-xs h-7"
                  aria-label="Search articles"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="border border-teal-200 rounded-md px-1 py-0 focus:ring-1 focus:ring-teal-500 focus:border-transparent text-teal-900 bg-white text-xs h-7 w-full sm:w-32"
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

          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-md text-xs flex items-center border border-red-200">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-8" aria-label="Loading articles">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
            </div>
          )}

          {/* Articles Grid */}
          {!loading && articles.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-sm p-4 border border-teal-200">
              <p className="text-xs text-teal-700">No articles found. Try adjusting your search.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {articles.map((article) => (
                  <article 
                    key={article.id} 
                    className="bg-teal-700 rounded-lg shadow-sm overflow-hidden border border-teal-600 hover:shadow-md transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer"
                    onClick={() => handleArticleClick(article.id)}
                    aria-label={`Article: ${article.title}`}
                  >
                    {article.thumbnail && (
                      <div className="relative h-32 w-full">
                        <Image
                          src={article.thumbnail}
                          alt={article.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="p-2">
                      <h2 className="text-xs font-semibold text-white mb-1 line-clamp-2">
                        {article.title}
                      </h2>
                      <p className="text-xs text-teal-100 mb-2 line-clamp-2">
                        {article.content}
                      </p>
                      <div className="flex items-center text-xs text-teal-100 mb-1">
                        <FaUser className="mr-1" />
                        <span>{article.author?.username || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between text-xs text-teal-100 mt-2">
                        <div className="flex items-center">
                          <FaThumbsUp className="mr-1" />
                          <span>{article.likes}</span>
                        </div>
                        <div className="flex items-center">
                          <FaEye className="mr-1" />
                          <span>{article.views}</span>
                        </div>
                        <div className="flex items-center">
                          <FaComment className="mr-1" />
                          <span>{article.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex flex-row items-center justify-between gap-2 w-full">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className={`flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      page === 1 ? 'bg-teal-200 text-teal-500 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                    }`}
                    aria-label="Previous page"
                  >
                    <FaArrowLeft className="mr-1" />
                    <span>Previous</span>
                  </button>
                  
                  <span className="text-white font-medium text-xs bg-teal-600 px-2 py-1 rounded-md shadow-sm">
                    Page {page} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className={`flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      page >= totalPages ? 'bg-teal-200 text-teal-500 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                    }`}
                    aria-label="Next page"
                  >
                    <span>Next</span>
                    <FaArrowRight className="ml-1" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-teal-800 text-white py-6 sm:py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="col-span-2">
                <h3 className="text-sm sm:text-lg font-bold mb-2 sm:mb-3">Jatt Clans</h3>
                <p className="text-teal-300 text-xs sm:text-sm">
                  Preserving and celebrating Jatt heritage for future generations.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold mb-2 sm:mb-3 text-xs sm:text-sm">Navigation</h4>
                <ul className="space-y-1 sm:space-y-1.5">
                  <li><Link href="/articles" className="text-teal-300 hover:text-white transition text-xs">Articles</Link></li>
                  <li><Link href="/about" className="text-teal-300 hover:text-white transition text-xs">About</Link></li>
                  <li><Link href="/contact" className="text-teal-300 hover:text-white transition text-xs">Contact</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-2 sm:mb-3 text-xs sm:text-sm">Account</h4>
                <ul className="space-y-1 sm:space-y-1.5">
                  <li><Link href="/profile" className="text-teal-300 hover:text-white transition text-xs">Profile</Link></li>
                  <li><Link href="/admin" className="text-teal-300 hover:text-white transition text-xs">Admin</Link></li>
                  <li><Link href="/logout" className="text-teal-300 hover:text-white transition text-xs">Logout</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-teal-700 pt-3 sm:pt-4 text-center text-teal-400 text-xs">
              <p>© {new Date().getFullYear()} Jatt Clans. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}