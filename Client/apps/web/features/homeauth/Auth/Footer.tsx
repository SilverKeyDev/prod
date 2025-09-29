import AuthLink from "./Link";

export default function AuthFooter() {
  return (
    <div className="mt-4 animate-fade-in border-t border-gray-100 pt-4">
      <div className="flex flex-col items-center justify-center gap-2 text-center text-sm">
        <div className="flex items-center justify-center gap-1 whitespace-nowrap text-black/60 sm:gap-2 md:gap-3">
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
