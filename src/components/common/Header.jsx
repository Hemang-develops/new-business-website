import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

// simple header with storefront links

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  // no global state used for nav

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <nav className="container-custom flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-gradient">
          Spiritual Coaching
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/#programs"
            className="hover:text-purple-600 transition-colors text-gray-700"
          >
            Offerings
          </Link>
          <a
            href="mailto:highfrequencies11@gmail.com"
            className="hover:text-purple-600 transition-colors text-gray-700"
          >
            Contact
          </a>
        </div>

        {/* Right Side - mobile menu toggle */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <div className="container-custom py-4 flex flex-col gap-4">
            <Link
              to="/"
              className="text-gray-700 hover:text-purple-600"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/#programs"
              className="text-gray-700 hover:text-purple-600"
              onClick={() => setMenuOpen(false)}
            >
              Offerings
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
