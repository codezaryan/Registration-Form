import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status on component mount and when localStorage changes
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const authStatus = localStorage.getItem('isAuthenticated');
      setIsAuthenticated(!!(token && authStatus));
    };

    checkAuth();

    // Listen for storage changes (for logout from other tabs)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    navigate('/admin/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">
            Registration System
          </Link>
          <div className="flex space-x-4">
            <Link
              to="/"
              className="hover:bg-blue-700 px-3 py-2 rounded-md transition-colors"
            >
              Registration Form
            </Link>

            {!isAuthenticated ? (
              <Link
                to="/admin/login"
                className="hover:bg-blue-700 px-3 py-2 rounded-md transition-colors"
              >
                Admin Login
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="hover:bg-blue-700 px-3 py-2 rounded-md transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;