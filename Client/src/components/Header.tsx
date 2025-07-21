import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm shadow-brown/15 z-50">
      <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <span className="text-xl sm:text-2xl font-bold text-black">SilverKey</span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center space-x-4">
          <Link
            to="/login"
            className="text-sm font-medium text-black hover:text-black/80 transition-colors px-3 py-2 rounded-md"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="text-sm font-medium bg-brown text-white hover:bg-brown/90 transition-colors px-4 py-2 rounded-md"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-black hover:text-black/80 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-2">
            <Link
              to="/login"
              className="block text-sm font-medium text-black hover:text-black/80 transition-colors py-3 px-2 rounded-md hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="block text-sm font-medium bg-brown text-white hover:bg-brown/90 transition-colors py-3 px-2 rounded-md text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
