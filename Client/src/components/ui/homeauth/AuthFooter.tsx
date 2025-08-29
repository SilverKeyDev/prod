import AuthLink from "./AuthLink";

export default function AuthFooter() {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
      <div className="flex flex-col items-center justify-center gap-2 text-sm text-center">
        <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 text-black/60 whitespace-nowrap">
          <AuthLink to="/privacy" variant="footer">
            Privacy Policy
          </AuthLink>
          <AuthLink to="/terms" variant="footer">
            Terms of Service
          </AuthLink>
          <AuthLink to="/contact" variant="footer">
            Contact Us
          </AuthLink>
        </div>
        <p className="text-xs text-black/40">
          © {new Date().getFullYear()} SilverKey. All rights reserved.
        </p>
      </div>
    </div>
  );
}
