import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { 
  FaSignOutAlt, 
  FaUser, 
  FaUserPlus, 
  FaPhone, 
  FaInfoCircle, 
  FaBars, 
  FaTimes, 
  FaBook, 
  FaUserShield,
  FaLandmark,
  FaScroll
} from 'react-icons/fa';

export default function Navbar({ currentPage }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const drawerRef = useRef(null);

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

    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <FaLandmark className="h-6 w-6 text-white mr-2" />
              <span className="text-xl font-bold text-white font-urdu">جٹ کلینز</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="/articles"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  currentPage === 'articles' 
                    ? 'bg-teal-700 text-white' 
                    : 'text-white hover:bg-teal-600 hover:text-white'
                }`}
              >
                <FaBook className="mr-1" />
                Articles
              </Link>

              <Link
                href="/about"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  currentPage === 'about' 
                    ? 'bg-teal-700 text-white' 
                    : 'text-white hover:bg-teal-600 hover:text-white'
                }`}
              >
                <FaInfoCircle className="mr-1" />
                About
              </Link>

              <Link
                href="/contact"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  currentPage === 'contact' 
                    ? 'bg-teal-700 text-white' 
                    : 'text-white hover:bg-teal-600 hover:text-white'
                }`}
              >
                <FaPhone className="mr-1" />
                Contact
              </Link>

              {user ? (
                <>
                  <Link
                    href="/profile"
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                      currentPage === 'profile' 
                        ? 'bg-teal-700 text-white' 
                        : 'text-white hover:bg-teal-600 hover:text-white'
                    }`}
                  >
                    <FaUser className="mr-1" />
                    Profile
                  </Link>

                  {user.is_staff && (
                    <Link
                      href="/admin"
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                        currentPage === 'admin' 
                          ? 'bg-teal-700 text-white' 
                          : 'text-white hover:bg-teal-600 hover:text-white'
                      }`}
                    >
                      <FaUserShield className="mr-1" />
                      Admin
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-teal-600 flex items-center"
                  >
                    <FaSignOutAlt className="mr-1" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                      currentPage === 'login' 
                        ? 'bg-teal-700 text-white' 
                        : 'text-white hover:bg-teal-600 hover:text-white'
                    }`}
                  >
                    <FaUser className="mr-1" />
                    Login
                  </Link>

                  <Link
                    href="/signup"
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                      currentPage === 'signup' 
                        ? 'bg-teal-700 text-white' 
                        : 'text-white hover:bg-teal-600 hover:text-white'
                    }`}
                  >
                    <FaUserPlus className="mr-1" />
                    Signup
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-teal-600 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Right Side Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-64 bg-teal-700 shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* User Profile Section at Top */}
        {user && (
          <div className="p-4 border-b border-teal-600 flex items-center space-x-3">
            {user.profile?.profile_picture ? (
              <img 
                src={user.profile.profile_picture} 
                alt="Profile" 
                className="h-12 w-12 rounded-full object-cover"
                onClick={() => router.push('/profile')}
              />
            ) : (
              <div 
                className="h-12 w-12 rounded-full bg-teal-600 flex items-center justify-center"
                onClick={() => router.push('/profile')}
              >
                <FaUser className="text-white text-xl" />
              </div>
            )}
            <div>
              <p className="text-white font-medium">{user.username}</p>
              <button 
                onClick={() => router.push('/profile')}
                className="text-xs text-teal-200 hover:text-white"
              >
                View Profile
              </button>
            </div>
          </div>
        )}

        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-64px)]">
          <Link
            href="/articles"
            className={`block px-3 py-3 rounded-md text-base font-medium flex items-center ${
              currentPage === 'articles' 
                ? 'bg-teal-600 text-white' 
                : 'text-white hover:bg-teal-500 hover:text-white'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FaBook className="mr-3" />
            Articles
          </Link>

          <Link
            href="/about"
            className={`block px-3 py-3 rounded-md text-base font-medium flex items-center ${
              currentPage === 'about' 
                ? 'bg-teal-600 text-white' 
                : 'text-white hover:bg-teal-500 hover:text-white'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FaInfoCircle className="mr-3" />
            About
          </Link>

          <Link
            href="/contact"
            className={`block px-3 py-3 rounded-md text-base font-medium flex items-center ${
              currentPage === 'contact' 
                ? 'bg-teal-600 text-white' 
                : 'text-white hover:bg-teal-500 hover:text-white'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FaPhone className="mr-3" />
            Contact
          </Link>

          {user ? (
            <>
              <Link
                href="/profile"
                className={`block px-3 py-3 rounded-md text-base font-medium flex items-center ${
                  currentPage === 'profile' 
                    ? 'bg-teal-600 text-white' 
                    : 'text-white hover:bg-teal-500 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaUser className="mr-3" />
                Profile
              </Link>

              {user.is_staff && (
                <Link
                  href="/admin"
                  className={`block px-3 py-3 rounded-md text-base font-medium flex items-center ${
                    currentPage === 'admin' 
                      ? 'bg-teal-600 text-white' 
                      : 'text-white hover:bg-teal-500 hover:text-white'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FaUserShield className="mr-3" />
                  Admin
                </Link>
              )}

              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-white hover:bg-teal-500 hover:text-white flex items-center"
              >
                <FaSignOutAlt className="mr-3" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`block px-3 py-3 rounded-md text-base font-medium flex items-center ${
                  currentPage === 'login' 
                    ? 'bg-teal-600 text-white' 
                    : 'text-white hover:bg-teal-500 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaUser className="mr-3" />
                Login
              </Link>

              <Link
                href="/signup"
                className={`block px-3 py-3 rounded-md text-base font-medium flex items-center ${
                  currentPage === 'signup' 
                    ? 'bg-teal-600 text-white' 
                    : 'text-white hover:bg-teal-500 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaUserPlus className="mr-3" />
                Signup
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Overlay when mobile menu is open */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </nav>
  );
}