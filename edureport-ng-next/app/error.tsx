"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff] p-4 text-[#0b1c30]">
      <div className="max-w-md w-full glass shadow-elite rounded-3xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight mb-2">Something went wrong!</h2>
          <p className="text-[#464555]/70 text-sm">
            We encountered an unexpected error. Our team has been notified.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-all"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white border border-[#0b1c30]/5 text-[#464555] rounded-xl text-sm font-bold shadow-sm hover:bg-[#f8f9ff] transition-all"
          >
            <Home className="w-4 h-4" /> Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
