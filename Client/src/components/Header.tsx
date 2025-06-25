import { Link } from "react-router-dom";

export default function Header() {
  return (
    <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm shadow-brown/15 z-50">
      <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-bold text-navy">SilverKey</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="text-sm font-medium text-navy hover:text-navy/80 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="text-sm font-medium text-navy hover:text-navy/80 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
