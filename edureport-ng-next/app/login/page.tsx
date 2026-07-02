"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, Lock, Loader2, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json() as any;

      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Authentication failed');
      }

      toast.success('Successfully authenticated');

      const targetPath =
        (data.user?.role === 'ADMIN' || data.user?.role === 'STAFF') ? '/app/admin' :
        data.user?.role === 'SCHOOL' ? '/admin' :
        data.user?.role === 'TEACHER' ? '/teacher' : '/portal';

      if (data.school?.subdomain) {
        const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'reportsheet.com.ng';
        const isLocalhost = window.location.hostname === 'localhost';
        const isPagesDev = window.location.hostname.endsWith('.pages.dev');
        const expectedHost = isLocalhost || isPagesDev ? window.location.host : `${data.school.subdomain}.${mainDomain}`;
        
        if (!isLocalhost && !isPagesDev && window.location.hostname !== expectedHost) {
          window.location.href = `https://${expectedHost}${targetPath}`;
          return;
        }
      }

      router.push(targetPath);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

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

          <div className="mb-10">
            <h1 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight mb-2">Welcome back</h1>
            <p className="text-sm font-medium text-[#464555] opacity-70">Access your academic command center.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-[0.15em] ml-1">Account Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  placeholder="admin@institution.edu"
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-[#0b1c30]/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium text-sm"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-[0.15em]">Security Password</label>
                <Link href="/forgot-password" title="Forgot Password" className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-wider">Recover</Link>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors z-10">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-4 bg-white/50 border border-[#0b1c30]/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium text-sm"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#464555]/40 hover:text-indigo-600 transition-colors min-tap"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={e => setFormData({...formData, rememberMe: e.target.checked})}
                className="w-4 h-4 rounded border-[#0b1c30]/20 text-indigo-600 focus:ring-indigo-600/20 transition-all cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs font-bold text-[#464555] cursor-pointer select-none">
                Remember me for 30 days
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-600/25 hover:bg-indigo-700 hover:translate-y-[-1px] active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Authenticate
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-[#0b1c30]/5 text-center">
            <p className="text-sm font-medium text-[#464555]">
              New to ReportSheet? <Link href="/register" className="text-indigo-600 font-extrabold hover:underline">Register Institution</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
