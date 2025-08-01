import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/router';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8000/api/profile/${id}/`);
        setProfile(response.data);
        
        // Fetch user's articles and comments
        const [articlesRes, commentsRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/articles/?author=${id}`),
          axios.get(`http://localhost:8000/api/comments/?user=${id}`)
        ]);
        
        setArticles(articlesRes.data.results || []);
        setComments(commentsRes.data.results || []);
        setError('');
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-shrink-0">
              {profile.profile?.profile_picture ? (
                <Image
                  src={profile.profile.profile_picture}
                  alt={profile.username}
                  width={120}
                  height={120}
                  className="rounded-full"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl text-gray-400">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-grow">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              {profile.is_staff && (
                <span className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded mb-2">
                  Admin
                </span>
              )}
              <p className="text-gray-600 mb-2">{profile.email}</p>
              <p className="text-gray-700">{profile.profile?.bio || 'No bio yet'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Articles ({articles.length})</h2>
            {articles.length === 0 ? (
              <p className="text-gray-500">No articles yet</p>
            ) : (
              <div className="space-y-4">
                {articles.map(article => (
                  <Link key={article.id} href={`/articles/${article.id}`} className="block hover:bg-gray-50 p-2 rounded">
                    <h3 className="text-lg font-medium text-blue-600 hover:underline">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(article.created_at).toLocaleDateString()} · {article.views} views
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Comments ({comments.length})</h2>
            {comments.length === 0 ? (
              <p className="text-gray-500">No comments yet</p>
            ) : (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="border-b pb-3 last:border-b-0">
                    <Link href={`/articles/${comment.article.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                      On: {comment.article.title}
                    </Link>
                    <p className="text-gray-700 mt-1">{comment.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(comment.created_at).toLocaleString()} · {comment.likes} likes
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}