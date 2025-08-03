import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FaSearch, FaUser, FaComment, FaThumbsUp, FaEye, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

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

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [articlesRes, categoriesRes] = await Promise.all([
          axios.get(`https://haseebclan.pythonanywhere.com/api/articles/?search=${search}&category=${selectedCategory}&page=${page}`),
          axios.get('https://haseebclan.pythonanywhere.com/api/categories/')
        ]);
        
        setArticles(Array.isArray(articlesRes.data.results) ? articlesRes.data.results : []);
        setTotalPages(Math.ceil(articlesRes.data.count / 10));
        setCategories(Array.isArray(categoriesRes.data.results) ? categoriesRes.data.results : categoriesRes.data);
        setError('');
      } catch (err) {
        console.error('Error fetching data:', err.response?.data || err.message);
        setError('Failed to load articles. Please try again later.');
        setArticles([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [search, selectedCategory, page]);

  return (
    <>
      <Head>
        <title>جٹ کلینز - Articles</title>
        <link rel="icon" href="/jutt-icon.png" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-100 to-coral-100">
        <Navbar currentPage="articles" />
        
        <div className="container mx-auto px-3 py-4">
          {/* Compact Search and Filter */}
          <div className="mb-4 bg-white p-1 rounded-lg shadow-sm border border-teal-200">
            <div className="flex flex-col sm:flex-row gap-1 items-center">
              <div className="relative flex-grow w-full">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <FaSearch className="text-teal-600 text-[10px]" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-6 pr-2 py-1 border border-teal-200 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-transparent text-teal-900 placeholder-teal-400 text-[10px] h-7"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-teal-200 rounded-md px-1 py-0 focus:ring-1 focus:ring-teal-500 focus:border-transparent text-teal-900 bg-white text-[10px] h-7 w-full sm:w-32"
              >
                <option value="" className="text-teal-400">All Categories</option>
                {Array.isArray(categories) &&
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="text-teal-900">
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-md text-[10px] flex items-center border border-red-200">
              <span>{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
            </div>
          )}

          {/* Articles Grid */}
          {!loading && articles.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-sm p-4 border border-teal-200">
              <p className="text-xs text-teal-700">No articles found. Try adjusting your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {articles.map((article) => (
                <div 
                  key={article.id} 
                  className="bg-teal-700 rounded-lg shadow-sm overflow-hidden border border-teal-600 hover:shadow-md transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer"
                  onClick={() => router.push(`/articles/${article.id}`)}
                >
                  {article.thumbnail && (
                    <div className="relative h-32 w-full">
                      <img
                        src={article.thumbnail}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-2">
                    <h2 className="text-xs font-semibold text-white mb-1 line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-[10px] text-teal-100 mb-2 line-clamp-2">
                      {article.content}
                    </p>
                    <div className="flex items-center text-[10px] text-teal-100 mb-1">
                      <FaUser className="mr-1" />
                      <span>{article.author?.username || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-teal-100 mt-2">
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
                </div>
              ))}
            </div>
          )}

          {/* Pagination with Consistent Styling */}
          {!loading && articles.length > 0 && (
            <div className="mt-4 flex flex-row items-center justify-between gap-2 w-full">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`flex items-center px-2 py-1 rounded-md text-[10px] font-medium ${
                  page === 1 ? 'bg-teal-200 text-teal-500 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                }`}
              >
                <FaArrowLeft className="mr-1 text-white" />
                <span className="text-white">Previous</span>
              </button>
              
              <span className="text-white font-medium text-[10px] bg-teal-600 px-2 py-1 rounded-md shadow-sm">
                Page {page} of {totalPages}
              </span>
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className={`flex items-center px-2 py-1 rounded-md text-[10px] font-medium ${
                  page >= totalPages ? 'bg-teal-200 text-teal-500 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                }`}
              >
                <span className="text-white">Next</span>
                <FaArrowRight className="ml-1 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-teal-800 text-white py-6 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-4 sm:mb-8">
              <div className="col-span-2">
                <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-4">Jatt Clans</h3>
                <p className="text-teal-300 text-xs sm:text-sm">
                  Preserving and celebrating Jatt heritage for future generations.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold mb-2 sm:mb-4 text-sm sm:text-base">Navigation</h4>
                <ul className="space-y-1 sm:space-y-2">
                  <li><Link href="/articles" className="text-teal-300 hover:text-white transition text-xs sm:text-sm">Articles</Link></li>
                  <li><Link href="/about" className="text-teal-300 hover:text-white transition text-xs sm:text-sm">About</Link></li>
                  <li><Link href="/contact" className="text-teal-300 hover:text-white transition text-xs sm:text-sm">Contact</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-2 sm:mb-4 text-sm sm:text-base">Account</h4>
                <ul className="space-y-1 sm:space-y-2">
                  <li><Link href="/profile" className="text-teal-300 hover:text-white transition text-xs sm:text-sm">Profile</Link></li>
                  <li><Link href="/admin" className="text-teal-300 hover:text-white transition text-xs sm:text-sm">Admin</Link></li>
                  <li><Link href="/logout" className="text-teal-300 hover:text-white transition text-xs sm:text-sm">Logout</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-teal-700 pt-4 sm:pt-8 text-center text-teal-400 text-xs sm:text-sm">
              <p>© {new Date().getFullYear()} Jatt Clans. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}