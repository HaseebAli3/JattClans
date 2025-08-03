import Link from 'next/link';
import Image from 'next/image';
import { FaCalendarAlt, FaUser, FaEye, FaThumbsUp, FaComment } from 'react-icons/fa';

export default function ArticleCard({ article }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300 mb-6">
      <Link href={`/articles/${article.id}`} className="block">
        {/* Thumbnail Image */}
        <div className="relative h-48 w-full">
          <Image 
            src={article.thumbnail || '/placeholder-article.jpg'} 
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Article Content */}
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2 hover:text-teal-600 transition-colors line-clamp-2">
            {article.title}
          </h2>
          
          {/* Meta Information */}
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <FaUser className="mr-1" />
            <span className="mr-3">{article.author?.username || 'Unknown'}</span>
            <FaCalendarAlt className="mr-1" />
            <span>{new Date(article.created_at).toLocaleDateString()}</span>
          </div>

          {/* Stats */}
          <div className="flex justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <FaEye className="mr-1" />
              <span>{article.views || 0}</span>
            </div>
            <div className="flex items-center">
              <FaThumbsUp className="mr-1" />
              <span>{article.likes || 0}</span>
            </div>
            <div className="flex items-center">
              <FaComment className="mr-1" />
              <span>{article.comments?.length || 0}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}