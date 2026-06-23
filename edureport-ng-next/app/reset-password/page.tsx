"use client";
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GraduationCap, Lock, Loader2, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword }),
      });

      const data = await res.json() as any;

      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to reset password');
      }

      setCompleted(true);
      toast.success('Password successfully reset');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <div className="text-center py-6 space-y-4">
        <h2 className="text-xl font-extrabold text-rose-600">Invalid Reset Link</h2>
        <p className="text-sm font-medium text-[#464555]/70 max-w-[280px] mx-auto leading-relaxed">
          The password reset link is missing required parameters or is invalid. Please request a new link.
        </p>
        <Link href="/forgot-password" className="inline-block mt-4 text-sm font-bold text-indigo-600 hover:underline">
          Request New Link
        </Link>
      </div>
    );
  }

  return (
    <>
      {!completed ? (
        <>
          <div className="mb-10">
            <h1 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight mb-2">Create New Password</h1>
            <p className="text-sm font-medium text-[#464555] opacity-70">Enter a strong, secure new password for your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-[0.15em] ml-1">New Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  placeholder="Minimum 8 characters"
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-[#0b1c30]/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium text-sm"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-[0.15em] ml-1">Confirm New Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  placeholder="Repeat new password"
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-[#0b1c30]/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium text-sm"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full py-4 bg-indigo-600 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-600/25 hover:bg-indigo-700 hover:translate-y-[-1px] active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Update Security Password
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center py-6 space-y-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-[#0b1c30]">Password updated</h2>
            <p className="text-sm font-medium text-[#464555]/70 max-w-[280px] mx-auto leading-relaxed">
              Your security password was successfully reset. You can now log back into your portal.
            </p>
          </div>
          <Link href="/login" className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-bold shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-100 transition-all block">
            Login to Command Center
          </Link>
        </div>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/30 blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-100/30 blur-[120px] -z-10" />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-[440px] relative"
      >
        <div className="flex justify-center mb-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <GraduationCap className="text-white w-7 h-7" />
            </div>
            <span className="text-2xl font-[800] tracking-tighter text-[#0b1c30]">ReportSheet<span className="text-indigo-600">.</span></span>
          </Link>
        </div>

        <div className="glass p-10 rounded-[2.5rem] shadow-elite border-white/60 relative">
          <div className="absolute top-6 right-8 text-indigo-600 opacity-20">
             <ShieldCheck className="w-12 h-12" />
          </div>

          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-indigo-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">Loading Session...</span>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>

          <div className="mt-10 pt-8 border-t border-[#0b1c30]/5 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-extrabold text-indigo-600 hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
