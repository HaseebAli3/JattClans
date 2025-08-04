import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import CommentSection from '../../components/CommentSection';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FaHeart, FaRegHeart, FaEye, FaCalendarAlt, FaUser, FaYoutube } from 'react-icons/fa';

// Enhanced font styling with Urdu support
const fontFaceCSS = `
  @font-face {
    font-family: 'Jameel Noori Nastaleeq';
    src: url('/fonts/Jameel-Noori-Nastaleeq.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
  
  .urdu-content {
    font-family: 'Noto Nastaliq Urdu', 'Amiri', 'Jameel Noori Nastaleeq', serif;
    direction: rtl;
    text-align: right;
    line-height: 1.8;
    word-spacing: 0.1rem;
    unicode-bidi: plaintext;
    font-size: 1.4rem;
  }

  /* Special handling for words with ٸ character */
  .urdu-content .special-char {
    font-family: 'Noto Nastaliq Urdu', 'Amiri', serif;
  }

  /* Right-aligned headings */
  .urdu-content .heading {
    font-weight: bold;
    font-size: 1.6rem;
    margin: 1.5rem 0 1rem;
    text-align: right;
  }

  /* Regular paragraphs */
  .urdu-content p {
    margin-bottom: 1rem;
    text-align: right;
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

// Function to process content with special handling
const processContent = (content) => {
  if (!content) return '';
  
  // Process special characters first
  const withSpecialChars = content.replace(
    /([^\s]*ٸ[^\s]*)/g, 
    '<span class="special-char">$1</span>'
  );
  
  // Then process asterisk-based headings
  const parts = withSpecialChars.split(/\*([^*]+)\*/g);
  
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return `<div class="heading">${part}</div>`;
    } else if (part.trim()) {
      return `<p>${part}</p>`;
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

  // ... [keep other useEffect hooks unchanged] ...

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 to-coral-100">
      <Head>
        <title>{article?.title} | Jutt Clans</title>
        <meta name="description" content={article?.meta_description || article?.title} />
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
              {article?.title}
            </h1>
          </div>

          {/* Processed Article Content */}
          <div 
            className="text-gray-800 mb-8 article-content no-copy urdu-content"
            style={{ padding: '0 0.5rem' }}
            dangerouslySetInnerHTML={{ __html: processedContent }} 
          />

          {/* Article Metadata (LTR) */}
          <div className="border-t border-teal-200 pt-6" style={{ direction: 'ltr' }}>
            {/* ... [keep metadata section unchanged] ... */}
          </div>
        </div>
      </div>

      {/* Comment Section (LTR) */}
      <div className="w-full bg-white border-t border-teal-100" style={{ direction: 'ltr' }}>
        {/* ... [keep comment section unchanged] ... */}
      </div>

      {/* Footer (LTR) */}
      <footer className="bg-teal-800 text-white py-6" style={{ direction: 'ltr' }}>
       <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-teal-300">
            © {new Date().getFullYear()} Jatt Clans. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}