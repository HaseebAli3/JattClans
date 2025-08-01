import Link from 'next/link';
import Image from 'next/image';

export default function ArticleCard({ article }) {
  return (
    <div className="border rounded-lg p-4 mb-4">
      <Link href={`/articles/${article.id}`}>
        <div className="flex">
          <Image src={article.thumbnail} alt={article.title} width={100} height={100} className="mr-4" />
          <div>
            <h2 className="text-xl font-bold">{article.title}</h2>
            <p>{new Date(article.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}