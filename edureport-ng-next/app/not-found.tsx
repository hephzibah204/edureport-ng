import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff] p-4 text-[#0b1c30]">
      <div className="max-w-md w-full glass shadow-elite rounded-3xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">404</h2>
          <p className="text-xl font-semibold mb-2">Page Not Found</p>
          <p className="text-[#464555]/70 text-sm">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-all"
          >
            <Home className="w-4 h-4" /> Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
