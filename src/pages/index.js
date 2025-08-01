import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Blog Website</h1>
      <p className="text-lg mb-6">Discover insightful articles on various topics.</p>
      <Link href="/articles">
        <button className="bg-blue-500 text-white py-2 px-4 rounded">Explore Articles</button>
      </Link>
    </div>
  );
}