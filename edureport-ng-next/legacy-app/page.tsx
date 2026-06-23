"use client";

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent } from '@/src/components/ui/Card';
import { ChevronRight, Shield, Clock, BookOpen, Layers, Printer, School, Zap, BarChart, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        setConfig(data);
      } catch (err) {}
    }
    loadConfig();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const priceL = Number(config?.pricing?.lifetime || 25000).toLocaleString();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-primary/30">
      {/* Premium Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-600/10 blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-violet-600/10 blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-emerald-500/5 blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* Modern Glassmorphism Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4' : 'py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className={`flex items-center justify-between rounded-full transition-all duration-500 ${scrolled ? 'bg-white/5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl px-6 py-3' : 'bg-transparent px-2 py-2'}`}>
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <School className="w-5 h-5 text-white" />
              </div>
              EduReport <span className="text-indigo-400">NG</span>
            </div>
            <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-zinc-300">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </div>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="ghost" className="font-semibold text-zinc-300 hover:text-white hover:bg-white/10 rounded-full px-6">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button className="font-semibold rounded-full px-6 bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                  Get Started <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-48 pb-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.15)]"
        >
          <Sparkles className="w-4 h-4" /> The Future of Nigerian Schools
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05] mb-8 max-w-5xl"
        >
          Generate <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">flawless</span> report cards in minutes.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2, duration: 0.8 }} 
          className="text-lg md:text-2xl text-zinc-400 font-medium max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          The ultimate school management platform designed specifically for Nigerian primary and secondary schools. Automate grading, instantly generate broadsheets, and print pristine A4 report cards.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3, duration: 0.8 }} 
          className="flex flex-col sm:flex-row items-center gap-6 justify-center w-full max-w-md mx-auto"
        >
          <Link href="/register" className="w-full">
            <Button className="w-full h-16 text-lg font-bold rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all hover:scale-[1.02] border border-indigo-400/30">
              Start your free trial <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>

        {/* Hero Dashboard Preview (Abstract) */}
        <motion.div 
          style={{ y }}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1, type: "spring", stiffness: 50 }}
          className="mt-24 w-full relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 bottom-0 h-1/2"></div>
          <div className="relative rounded-t-3xl md:rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl p-2 md:p-4 aspect-video max-w-5xl mx-auto overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5 pointer-events-none"></div>
            
            {/* Mock Dashboard UI */}
            <div className="h-full w-full bg-zinc-950/80 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 flex overflow-hidden">
              {/* Sidebar */}
              <div className="w-16 md:w-64 border-r border-white/5 p-4 flex flex-col gap-4">
                <div className="h-8 w-8 md:w-32 bg-white/10 rounded-lg"></div>
                <div className="h-8 w-full bg-indigo-500/20 border border-indigo-500/30 rounded-lg"></div>
                <div className="h-8 w-full bg-white/5 rounded-lg"></div>
                <div className="h-8 w-full bg-white/5 rounded-lg"></div>
              </div>
              {/* Main Content */}
              <div className="flex-1 p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="h-8 w-48 bg-white/10 rounded-lg"></div>
                  <div className="h-8 w-32 bg-emerald-500/20 border border-emerald-500/30 rounded-full"></div>
                </div>
                <div className="grid grid-cols-3 gap-4 h-24">
                  <div className="bg-white/5 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                    <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                    <div className="h-8 w-3/4 bg-white/20 rounded"></div>
                  </div>
                  <div className="bg-white/5 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                    <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                    <div className="h-8 w-3/4 bg-white/20 rounded"></div>
                  </div>
                  <div className="bg-white/5 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                    <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                    <div className="h-8 w-3/4 bg-white/20 rounded"></div>
                  </div>
                </div>
                <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 p-6">
                  <div className="h-full w-full bg-[linear-gradient(to_bottom,transparent_90%,#ffffff05_90%)] bg-[size:100%_2rem]">
                     <div className="w-full flex justify-around items-end h-full px-8 pb-4">
                        <div className="w-12 h-1/3 bg-indigo-500/50 rounded-t-lg"></div>
                        <div className="w-12 h-2/3 bg-indigo-500/50 rounded-t-lg"></div>
                        <div className="w-12 h-1/2 bg-indigo-500/50 rounded-t-lg"></div>
                        <div className="w-12 h-full bg-emerald-500/50 rounded-t-lg"></div>
                        <div className="w-12 h-3/4 bg-indigo-500/50 rounded-t-lg"></div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="relative z-10 py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Built for speed. Designed for excellence.</h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-medium">Say goodbye to messy spreadsheets. Experience a seamless, automated workflow that handles everything from cognitive scores to affective traits.</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]"
        >
          {/* Bento Box 1 - Large */}
          <motion.div variants={itemVariants} className="md:col-span-2 relative group overflow-hidden rounded-[2rem] bg-zinc-900 border border-white/10 p-8 hover:border-indigo-500/50 transition-colors duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Layers className="w-12 h-12 text-indigo-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4">Bulk Student Import</h3>
            <p className="text-zinc-400 text-lg max-w-md">Import hundreds of students in seconds. Just paste your class list and we automatically structure everything from Primary 1 to SS3.</p>
            <div className="absolute right-0 bottom-0 p-8 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 origin-bottom-right">
              <div className="w-48 h-32 bg-black rounded-xl border border-white/10 shadow-2xl flex flex-col p-4 gap-2">
                <div className="h-3 w-3/4 bg-white/20 rounded"></div>
                <div className="h-3 w-1/2 bg-white/10 rounded"></div>
                <div className="h-3 w-full bg-white/10 rounded"></div>
              </div>
            </div>
          </motion.div>

          {/* Bento Box 2 */}
          <motion.div variants={itemVariants} className="relative group overflow-hidden rounded-[2rem] bg-zinc-900 border border-white/10 p-8 hover:border-emerald-500/50 transition-colors duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Zap className="w-12 h-12 text-emerald-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4">Auto Computation</h3>
            <p className="text-zinc-400 text-lg">Totals, grades, remarks, and class positions are computed instantly with zero human error.</p>
          </motion.div>

          {/* Bento Box 3 */}
          <motion.div variants={itemVariants} className="relative group overflow-hidden rounded-[2rem] bg-zinc-900 border border-white/10 p-8 hover:border-violet-500/50 transition-colors duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Printer className="w-12 h-12 text-violet-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4">Print-Ready Reports</h3>
            <p className="text-zinc-400 text-lg">Generate pristine A4 report cards complete with school watermarks, principal signatures, and custom remarks.</p>
          </motion.div>

          {/* Bento Box 4 - Large */}
          <motion.div variants={itemVariants} className="md:col-span-2 relative group overflow-hidden rounded-[2rem] bg-zinc-900 border border-white/10 p-8 hover:border-amber-500/50 transition-colors duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Shield className="w-12 h-12 text-amber-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4">Bank-Level Security</h3>
            <p className="text-zinc-400 text-lg max-w-md">Every school operates within an isolated, fully encrypted environment. Your student data is strictly private and secured by Cloudflare's global edge network.</p>
            <div className="absolute right-8 bottom-8">
              <div className="w-24 h-24 rounded-full border-[8px] border-amber-500/20 border-t-amber-500 flex items-center justify-center animate-spin">
                <div className="w-16 h-16 bg-black rounded-full"></div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </section>

      {/* Pricing CTA */}
      <section id="pricing" className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-[3rem] bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 p-12 md:p-20 text-center relative overflow-hidden backdrop-blur-xl">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-6 relative z-10">Simple, Lifetime Pricing</h2>
            <p className="text-xl text-indigo-200 mb-10 max-w-xl mx-auto relative z-10">Pay once, own it forever. No hidden fees. No recurring subscriptions.</p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative z-10">
              <div className="flex flex-col items-center">
                <span className="text-6xl font-black tracking-tighter text-white">₦{priceL}</span>
                <span className="text-indigo-300 font-medium uppercase tracking-widest mt-2">One-time payment</span>
              </div>
              
              <div className="h-16 w-[1px] bg-indigo-500/30 hidden md:block"></div>
              
              <ul className="text-left space-y-3">
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Unlimited Students</li>
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Unlimited Teachers</li>
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Free Platform Updates</li>
              </ul>
            </div>
            
            <div className="mt-12 relative z-10">
              <Link href="/register">
                <Button className="h-16 px-12 text-lg font-bold rounded-full bg-white text-black hover:bg-zinc-200 transition-transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  Secure Your Access Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black pt-20 pb-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter mb-6">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <School className="w-5 h-5 text-black" />
              </div>
              EduReport <span className="text-zinc-400">NG</span>
            </div>
            <p className="text-zinc-500 max-w-sm font-medium leading-relaxed">
              Empowering Nigerian educational institutions with world-class technology to streamline administration and elevate academic reporting.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white tracking-wide uppercase text-sm">Product</h4>
            <ul className="space-y-4 text-zinc-400 font-medium">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white tracking-wide uppercase text-sm">Legal</h4>
            <ul className="space-y-4 text-zinc-400 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-500 font-medium text-sm">
          <p>© {new Date().getFullYear()} EduReport NG. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Built with ❤️ in Nigeria.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
