"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ArrowRight, CheckCircle2, Building2, User, Lock, Mail, Phone, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    subdomain: '',
    email: '',
    phone: '',
    password: '',
    plan: 'TRIAL'
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: formData.schoolName,
          email: formData.email,
          password: formData.password,
          subdomain: formData.subdomain,
          phone: formData.phone || undefined,
          plan: formData.plan
        }),
      });

      const data: any = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Registration failed');
      }

      toast.success('Registration successful! Please login.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Visual Side (Left) */}
      <div className="hidden lg:flex w-1/2 bg-indigo-600 relative overflow-hidden flex-col justify-between p-16">
        <div className="absolute top-0 right-0 w-full h-full -z-0">
           <div className="absolute top-[10%] left-[10%] w-[300px] h-[300px] bg-white/10 rounded-full blur-[80px]" />
           <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] bg-indigo-400/20 rounded-full blur-[100px]" />
        </div>

        <Link href="/" className="flex items-center gap-2 relative z-10 group">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <GraduationCap className="text-indigo-600 w-6 h-6" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">ReportSheet<span className="text-indigo-200">.</span></span>
        </Link>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-8">
            Empower your institution with <span className="text-indigo-200 italic">precision.</span>
          </h2>
          <div className="space-y-6">
            {[
              "Automated Academic Intelligence",
              "Enterprise-Grade Security Protocols",
              "Unified Campus Administration",
              "Seamless Stakeholder Portals"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-4 text-white/90">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-sm tracking-wide">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
           <div className="glass p-8 rounded-[2rem] border-white/20 max-w-sm">
              <p className="text-white/80 text-sm italic mb-4 font-medium leading-relaxed">
                "ReportSheet transformed our 48-hour broadsheet process into a 2-second automated workflow. Truly the gold standard."
              </p>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-indigo-400/30 border border-white/20" />
                 <div>
                    <div className="text-white font-extrabold text-xs">Dr. Adebayo</div>
                    <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Director, Premier Academy</div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Form Side (Right) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16 bg-[#f8f9ff]">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl font-extrabold text-[#0b1c30] tracking-tight mb-2">Create your school account</h1>
            <p className="text-[#464555] font-medium">Join 500+ schools delivering academic excellence.</p>
          </div>

          {/* Stepper Header */}
          <div className="flex items-center gap-4 mb-10">
            {[1, 2].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-indigo-600' : 'bg-indigo-100'}`} />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">School Name</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#464555]/50 group-focus-within:text-indigo-600 transition-colors">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="e.g. Royal International College"
                        className="w-full pl-12 pr-4 py-4 bg-white border border-[#0b1c30]/5 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium text-sm"
                        value={formData.schoolName}
                        onChange={e => setFormData({...formData, schoolName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Preferred URL</label>
                    <div className="relative group">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#464555]/40 tracking-tight">
                        .reportsheet.com.ng
                      </div>
                      <input 
                        type="text" 
                        placeholder="school-name"
                        className="w-full px-4 py-4 bg-white border border-[#0b1c30]/5 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium text-sm"
                        value={formData.subdomain}
                        onChange={e => setFormData({...formData, subdomain: e.target.value})}
                      />
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={nextStep}
                    disabled={!formData.schoolName || !formData.subdomain}
                    className="w-full py-4 bg-indigo-600 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-600/25 hover:bg-indigo-700 hover:translate-y-[-1px] active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
                  >
                    Continue to Security
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Admin Email</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#464555]/50 group-focus-within:text-indigo-600 transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input 
                        type="email" 
                        placeholder="admin@school.com"
                        className="w-full pl-12 pr-4 py-4 bg-white border border-[#0b1c30]/5 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium text-sm"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Admin Password</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#464555]/50 group-focus-within:text-indigo-600 transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input 
                        type="password" 
                        placeholder="Min. 8 characters"
                        className="w-full pl-12 pr-4 py-4 bg-white border border-[#0b1c30]/5 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium text-sm"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      type="button" 
                      onClick={prevStep}
                      className="w-1/3 py-4 bg-white border border-[#0b1c30]/5 text-[#464555] font-extrabold rounded-2xl hover:bg-white/50 transition-all"
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || !formData.email || !formData.password}
                      className="w-2/3 py-4 bg-indigo-600 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-600/25 hover:bg-indigo-700 hover:translate-y-[-1px] active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activate Platform'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-[#464555]">
            Already using ReportSheet? <Link href="/login" className="text-indigo-600 font-extrabold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
