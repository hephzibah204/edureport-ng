"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Play, Sparkles } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative pt-48 pb-32 px-6 overflow-hidden">
      {/* Visual Accents */}
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-emerald-100/30 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ y: 20, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50/80 backdrop-blur-md border border-amber-100/50 text-amber-700 text-[10px] font-extrabold tracking-[0.15em] uppercase mb-10 shadow-sm"
          >
            <Sparkles className="w-3 h-3 fill-amber-700" />
            <span>Grade Computed! ✨</span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-[800] tracking-[-0.05em] leading-[0.95] text-[#0b1c30] max-w-5xl mb-10"
          >
            Generate professional <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-800 italic">report cards in minutes.</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-2xl text-[#464555]/80 max-w-3xl leading-relaxed mb-12 font-medium"
          >
            The complete Report Card Management System for primary and secondary schools. Automated scoring, broadsheets, and pristine A4 prints.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-5"
          >
            <Link href="https://edureport.ng/app" target="_blank" className="group relative px-10 py-5 bg-indigo-600 text-white font-extrabold rounded-2xl shadow-2xl shadow-indigo-600/40 hover:bg-indigo-700 hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center gap-3">
              Start for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Link>
            
            <div className="flex flex-col items-start justify-center ml-2">
              <span className="text-[#0b1c30] font-extrabold text-lg flex items-center gap-2">
                ₦25,000 <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Lifetime Access</span>
              </span>
              <span className="text-[#464555]/60 font-medium text-sm line-through">₦15k/term elsewhere</span>
            </div>
          </motion.div>

          {/* Floating Dashboard Preview */}
          <motion.div
            initial={{ y: 100, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-24 relative w-full max-w-6xl"
          >
            <div className="absolute -inset-4 bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl rounded-[3rem] -z-10" />
            <div className="relative glass p-4 rounded-[2.5rem] shadow-2xl border-white/60">
              <div className="bg-slate-50 rounded-[2rem] aspect-[16/10] overflow-hidden flex items-center justify-center relative">
                {/* Simulated UI Content */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-transparent to-emerald-50/40" />
                <div className="flex flex-col items-center gap-4 text-indigo-200">
                  <div className="grid grid-cols-3 gap-6 w-full max-w-4xl px-12">
                     <div className="h-40 glass rounded-3xl animate-pulse" />
                     <div className="h-40 glass rounded-3xl animate-pulse delay-75" />
                     <div className="h-40 glass rounded-3xl animate-pulse delay-150" />
                  </div>
                  <div className="w-[80%] h-64 glass rounded-3xl mt-8 animate-pulse delay-300" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
