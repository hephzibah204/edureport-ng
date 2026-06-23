"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Label } from '@/src/components/ui/Label';
import { Lock, Mail, ChevronRight, School } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<{ name: string; logoUrl?: string; abbr?: string } | null>(null);

  useEffect(() => {
    // Detect school from subdomain or query param
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost';
    let subdomain = '';

    if (hostname.endsWith(`.${mainDomain}`)) {
      subdomain = hostname.split('.')[0];
    } else if (searchParams.get('school')) {
      subdomain = searchParams.get('school') || '';
    }

    if (subdomain && subdomain !== 'www') {
      fetch(`/api/auth/school-public/${subdomain}`)
        .then(res => res.json())
        .then((data: any) => {
          if (data.school) setBranding(data.school);
        })
        .catch(console.error);
    }
  }, [searchParams]);

  useEffect(() => {
    const sessStr = localStorage.getItem('edu_session');
    if (sessStr) {
      try {
        const sess = JSON.parse(sessStr);
        const role = sess.user?.role;
        if (role === 'ADMIN' || role === 'STAFF') router.push('/admin');
        else if (role === 'SCHOOL') router.push('/app');
        else if (role === 'TEACHER') router.push('/teacher');
        else router.push('/portal');
      } catch (e) {
        localStorage.removeItem('edu_session');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data: any = await res.json();
      
      if (!res.ok) throw new Error(data.error?.message || 'Login failed');
      
      localStorage.setItem('edu_session', JSON.stringify({ token: data.token, user: data.user }));
      
      if (data.user.role === 'ADMIN' || data.user.role === 'STAFF') {
        router.push('/admin');
      } else if (data.user.role === 'SCHOOL') {
        router.push('/app');
      } else if (data.user.role === 'TEACHER') {
        router.push('/teacher');
      } else {
        router.push('/portal');
      }
    } catch (err: any) {
      setError(err?.message || 'Sign in failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-500/5 blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-secondary/10 blur-[120px] animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Left Column: Branding / Splash (Hidden on mobile) */}
      <div className="hidden lg:flex w-[45%] relative z-10 flex-col justify-between p-12 bg-gradient-to-br from-primary/95 to-green2/95 text-white overflow-hidden shadow-2xl">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 font-bold text-2xl tracking-tight"
          >
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <School className="w-8 h-8 text-white" />
            </div>
            EduReport NG
          </motion.div>
        </div>

        <div className="relative z-20 max-w-lg">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl font-extrabold tracking-tight leading-[1.1] mb-6"
          >
            Manage your school with unparalleled elegance.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white/80 text-lg font-medium leading-relaxed"
          >
            Join thousands of modern schools automating their report cards, tracking attendance, and streamlining management with our premium portal.
          </motion.p>
        </div>

        <div className="relative z-20 text-white/60 text-sm font-medium">
          © {new Date().getFullYear()} EduReport NG. All rights reserved.
        </div>
        
        {/* Decorative Graphic */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"
        ></motion.div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile Branding Header */}
          <div className="lg:hidden flex flex-col items-center mb-8 gap-3">
             <div className="bg-primary/10 p-3 rounded-2xl shadow-inner text-primary">
              <School className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">EduReport NG</h1>
          </div>

          <Card className="border-0 shadow-none bg-transparent lg:bg-card/40 lg:border lg:border-white/40 lg:shadow-[0_8px_40px_rgb(0,0,0,0.04)] lg:backdrop-blur-2xl">
            <CardHeader className="space-y-4 px-0 lg:px-8 pt-0 lg:pt-8 text-center sm:text-left">
              {branding && (
                <div className="flex flex-col items-center sm:items-start gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-green2 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} className="w-full h-full object-contain rounded-2xl p-1" alt="Logo" />
                    ) : (
                      branding.abbr || 'RS'
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">{branding.name}</h2>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Official Portal</p>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">Welcome back</h2>
                <p className="text-muted-foreground font-medium">Please enter your details to sign in.</p>
              </div>
            </CardHeader>

            <CardContent className="px-0 lg:px-8 pb-0 lg:pb-8 pt-4">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="mb-6 p-4 text-sm bg-destructive/10 border border-destructive/20 text-destructive font-semibold rounded-xl flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0"></div>
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2 group">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <Input 
                      id="email"
                      type="email" 
                      placeholder="name@school.edu.ng" 
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11"
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="mb-0">Password</Label>
                    <a href="#" className="text-xs font-bold text-primary hover:text-green2 transition-colors">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                      <Lock className="h-5 w-5" />
                    </div>
                    <Input 
                      id="password"
                      type="password" 
                      placeholder="••••••••" 
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11"
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full h-12 text-base font-bold rounded-xl mt-2 group"
                  isLoading={loading}
                >
                  Sign In
                  {!loading && <ChevronRight className="w-5 h-5 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </form>

              {!branding && (
                <div className="mt-8 pt-6 border-t border-border/50 text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <a href="/register" className="font-bold text-primary hover:text-green2 hover:underline transition-all">
                      Register your school
                    </a>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
