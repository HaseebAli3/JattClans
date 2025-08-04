import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import CommentSection from '../../components/CommentSection';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FaHeart, FaRegHeart, FaEye, FaCalendarAlt, FaUser, FaYoutube } from 'react-icons/fa';

// Enhanced font styling with Urdu support and fallback for specific characters
const fontFaceCSS = `
  @font-face {
    font-family: 'Jameel Noori Nastaleeq';
    src: url('/fonts/Jameel-Noori-Nastaleeq.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Noto Nastaliq Urdu';
    src: url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu') format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  .urdu-content {
    font-family: 'Noto Nastaliq Urdu', 'Amiri', serif;
    direction: rtl;
    text-align: right;
    line-height: 2.2;
    word-spacing: 0.1rem; /* Reduced word spacing */
    font-size: clamp(1.5rem, 3.8vw, 1.7rem); /* Increased font size */
    unicode-bidi: plaintext;
    margin: 0.5rem 0;
  }

  /* Right-aligned headings */
  .urdu-content .heading {
    font-family: 'Noto Nastaliq Urdu', 'Amiri', serif;
    font-weight: bold;
    font-size: clamp(1.9rem, 4.2vw, 2.1rem); /* Slightly larger heading */
    margin: 1.5rem 0 0.8rem;
    text-align: right;
  }

  /* Justified regular text with fallback for specific character */
  .urdu-content p {
    font-family: 'Noto Nastaliq Urdu', 'Amiri', serif;
    margin-bottom: 0.8rem;
    text-align: justify;
    text-justify: inter-word;
  }

  /* Fallback for words containing specific character */
  .urdu-content p:has(> span.fallback),
  .urdu-content .heading:has(> span.fallback) {
    font-family: 'Noto Nastaliq Urdu', 'Amiri', serif !important;
  }

  .urdu-content span.fallback {
    font-family: 'Noto Nastaliq Urdu', 'Amiri', serif !important;
  }
`;

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://haseebclan.pythonanywhere.com/api/',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Function to process content with asterisk-based headings and handle specific character
const processContent = (content) => {
  if (!content) return '';

  // Split content by asterisk patterns
  const parts = content.split(/\*([^*]+)\*/g);

  return parts.map((part, index) => {
    // Check for the specific character ٸ in the part
    const containsSpecialChar = part.includes('ٸ');

    if (index % 2 === 1) {
      // Text between asterisks becomes right-aligned heading
      return `<div class="heading">${
        containsSpecialChar ? `<span class="fallback">${part}</span>` : part
      }</div>`;
    } else if (part.trim()) {
      // Regular justified paragraphs
      return `<p>${
        containsSpecialChar ? `<span class="fallback">${part}</span>` : part
      }</p>`;
    }
    return '';
  }).join('');
};

export default function ArticleDetail() {
  const [article, setArticle] = useState(null);
  const [processedContent, setProcessedContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    // Inject font styles
    const style = document.createElement('style');
    style.innerHTML = fontFaceCSS;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    if (!router.isReady || !id) return;

    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`articles/${id}/`);
        setArticle(response.data);
        setProcessedContent(processContent(response.data.content));
      } catch (error) {
        setError(error.response?.status === 404 ? 'Article not found' : 'Failed to load article');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [router.isReady, id]);

  useEffect(() => {
    const handleCopy = (e) => {
      e.preventDefault();
      alert('Copying content is not allowed');
    };

    const articleContent = document.querySelector('.article-content');
    if (articleContent) {
      articleContent.addEventListener('copy', handleCopy);
      articleContent.addEventListener('cut', handleCopy);
      articleContent.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    return () => {
      if (articleContent) {
        articleContent.removeEventListener('copy', handleCopy);
        articleContent.removeEventListener('cut', handleCopy);
        articleContent.removeEventListener('contextmenu', (e) => e.preventDefault());
      }
    };
  }, [article]);

  const handleLikeArticle = async () => {
    if (!currentUser) return router.push('/login');
    try {
      setIsLiking(true);
      await api.post('like/', { article_id: article.id });
      const updatedArticle = await api.get(`articles/${id}/`);
      setArticle(updatedArticle.data);
      setProcessedContent(processContent(updatedArticle.data.content));
    } catch (err) {
      setError('Failed to like article');
    } finally {
      setIsLiking(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 to-coral-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
    </div>
  );

  if (error || !article) return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 to-coral-100 flex flex-col items-center justify-center p-4">
      <p className="text-lg text-teal-800 mb-4">{error || 'Article not found'}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 to-coral-100">
      <Head>
        <title>{article.title} | Jutt Clans</title>
        <meta name="description" content={article.meta_description || article.title} />
        <link rel="icon" href="/jutt-icon.png" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&family=Amiri&display=swap" rel="stylesheet" />
      </Head>

      <Navbar currentPage="articles" />
      
      <div className="w-full bg-white">
        <div className="container mx-auto px-4 md:px-6 py-8">
          {/* Article Header */}
          <div className="flex justify-between items-center mb-6">
            <a 
              href="https://www.youtube.com/@Tahir_Farz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <FaYoutube className="text-2xl md:text-3xl" />
            </a>
            <h1 className="text-2xl md:text-3xl font-bold text-teal-900 urdu-content">
              {article.title}
            </h1>
          </div>

          {/* Processed Article Content */}
          <div 
            className="text-gray-800 mb-6 article-content no-copy urdu-content"
            style={{ padding: '0 0.5rem' }}
            dangerouslySetInnerHTML={{ __html: processedContent }} 
          />

          {/* Article Metadata (LTR) */}
          <div className="border-t border-teal-200 pt-6" style={{ direction: 'ltr' }}>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-teal-700">
                <div className="flex items-center">
                  <FaUser className="mr-2" />
                  <span>Posted by {article.author.username}</span>
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  <span>
                    {new Date(article.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-teal-700">
                <div className="flex items-center">
                  <FaEye className="mr-2" />
                  <span>{article.views} views</span>
                </div>
                
                <button
                  onClick={handleLikeArticle}
                  disabled={isLiking}
                  className={`flex items-center ${currentUser ? 'hover:text-red-500 cursor-pointer' : 'cursor-default'} ${
                    article.is_liked ? 'text-red-500' : 'text-teal-700'
                  } transition-colors`}
                >
                  {currentUser && article.is_liked ? (
                    <FaHeart className="mr-2" />
                  ) : (
                    <FaRegHeart className="mr-2" />
                  )}
                  <span>{article.likes} {article.is_liked && currentUser ? 'liked' : 'likes'}</span>
                  {isLiking && <span className="ml-1">...</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment Section (LTR) */}
      <div className="w-full bg-white border-t border-teal-100" style={{ direction: 'ltr' }}>
        <div className="container mx-auto px-4 md:px-6 py-8">
          <h2 className="text-xl font-semibold text-teal-900 mb-4">Comments</h2>
          <CommentSection 
            articleId={article.id} 
            api={api} 
            currentUser={currentUser}
          />
        </div>
      </div>

      {/* Footer (LTR) */}
      <footer className="bg-teal-800 text-white py-6" style={{ direction: 'ltr' }}>
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-teal-300">
            © {new Date().getFullYear()} Jutt Clans. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}