"use client";
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-6">
      <motion.div 
        initial={{ y: -20, opacity: 1 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto flex items-center justify-between glass px-6 py-3 shadow-elite rounded-2xl"
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-[#0b1c30]">ReportSheet<span className="text-indigo-600">.</span></span>
        </div>
        
        <div className="hidden md:flex items-center gap-10">
          {['Features', 'Solutions', 'Academic Intelligence', 'Pricing'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              className="text-sm font-bold text-[#464555] hover:text-indigo-600 transition-all hover:translate-y-[-1px]"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="px-5 py-2 text-sm font-bold text-[#464555] hover:text-indigo-600 transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:scale-[1.02] active:scale-100 transition-all">
            Join Now
          </Link>
        </div>
      </motion.div>
    </nav>
  );
};
