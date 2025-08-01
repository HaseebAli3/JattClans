import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/router';

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [articlesRes, categoriesRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/articles/?search=${search}&category=${selectedCategory}&page=${page}`),
          axios.get('http://localhost:8000/api/categories/')
        ]);
        console.log('Articles response:', articlesRes.data);
        console.log('Categories response:', categoriesRes.data);
        setArticles(Array.isArray(articlesRes.data.results) ? articlesRes.data.results : []);
        setTotalPages(Math.ceil(articlesRes.data.count / 10)); // Assuming page_size=10
        setCategories(Array.isArray(categoriesRes.data.results) ? categoriesRes.data.results : categoriesRes.data);
        setError('');
      } catch (err) {
        console.error('Error fetching data:', err.response?.data || err.message);
        setError('Failed to load articles or categories');
        setArticles([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [search, selectedCategory, page]);

  return (
    <div>
      <Navbar currentPage="articles" />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Articles</h1>
        {error && <p className="text-red-500">{error}</p>}
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded flex-grow"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">All Categories</option>
            {Array.isArray(categories) &&
              categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : articles.length === 0 ? (
          <p className="text-gray-500">No articles found.</p>
        ) : (
          <div className="grid gap-4">
            {articles.map((article) => (
              <div key={article.id} className="border p-4 rounded shadow hover:shadow-md">
                <Link href={`/articles/${article.id}`}>
                  <h2 className="text-blue-500 text-lg font-semibold hover:underline">
                    {article.title}
                  </h2>
                </Link>
                {article.thumbnail && (
                  <img
                    src={article.thumbnail}
                    alt={article.title}
                    className="w-full h-48 object-cover rounded mt-2"
                  />
                )}
                <p className="text-gray-700 mt-2">
                  {article.content.slice(0, 150)}...
                </p>
                <div className="text-gray-500 text-sm mt-2">
                  <p>Category: {article.category?.name || 'Uncategorized'}</p>
                  <p>
                    By {article.author?.username || 'Unknown'} on{' '}
                    {new Date(article.created_at).toLocaleDateString()}
                  </p>
                  <p>
                    {article.comments.length} Comment
                    {article.comments.length !== 1 ? 's' : ''} | {article.likes} Like
                    {article.likes !== 1 ? 's' : ''} | {article.views} View
                    {article.views !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="bg-gray-500 text-white py-2 px-4 rounded disabled:bg-gray-300"
          >
            Previous
          </button>
          <span className="self-center">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="bg-gray-500 text-white py-2 px-4 rounded disabled:bg-gray-300"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}