import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function Navbar({ currentPage }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between">
        <Link href="/" className="text-2xl font-bold">Blog Website</Link>
        <div className="space-x-4">
          <Link href="/articles" className={currentPage === 'articles' ? 'underline' : ''}>Articles</Link>
          <Link href="/about" className={currentPage === 'about' ? 'underline' : ''}>About Us</Link>
          <Link href="/contact" className={currentPage === 'contact' ? 'underline' : ''}>Contact Us</Link>
          {user ? (
            <>
              <Link href="/profile" className={currentPage === 'profile' ? 'underline' : ''}>Profile</Link>
              {user.is_staff && (
                <Link href="/admin" className={currentPage === 'admin' ? 'underline' : ''}>Admin</Link>
              )}
              <button onClick={handleLogout} className="text-white">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className={currentPage === 'login' ? 'underline' : ''}>Login</Link>
              <Link href="/signup" className={currentPage === 'signup' ? 'underline' : ''}>Signup</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}