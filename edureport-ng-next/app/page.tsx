import { Navbar } from '@/src/components/landing/Navbar';
import { Hero } from '@/src/components/landing/Hero';
import { Features } from '@/src/components/landing/Features';
import { Pricing } from '@/src/components/landing/Pricing';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] selection:bg-indigo-100 font-sans overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/30 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-emerald-100/40 blur-[100px]" />
      </div>

      <Navbar />
      
      <main>
        <Hero />
        
        {/* Trusted By / Logos Section */}
        <section className="py-10 md:py-12 border-y border-indigo-50 bg-white/40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <p className="text-[10px] font-extrabold tracking-[0.2em] text-[#464555]/60 uppercase text-center mb-6 md:mb-8">
              Trusted by Top-Tier Institutions
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
               {/* Placeholders for logos */}
               <div className="font-black text-sm md:text-xl tracking-tighter">ELITE_ACADEMY</div>
               <div className="font-black text-sm md:text-xl tracking-tighter">GLOBAL_SCHOOLS</div>
               <div className="font-black text-sm md:text-xl tracking-tighter">PREMIER_COLLEGE</div>
               <div className="font-black text-sm md:text-xl tracking-tighter">BRIGHT_HORIZONS</div>
            </div>
          </div>
        </section>

        <Features />

        <Pricing />

        {/* CTA Section */}
        <section className="py-20 md:py-32 px-4 md:px-6">
          <div className="max-w-6xl mx-auto rounded-[2.5rem] md:rounded-[3.5rem] bg-indigo-600 p-8 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-indigo-600/40">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-400/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 md:mb-8">
                Ready to lead with <br className="hidden md:hidden" /> 
                <span className="text-indigo-200">academic intelligence?</span>
              </h2>
              <p className="text-sm md:text-lg lg:text-xl text-indigo-100 mb-8 md:mb-12 max-w-2xl mx-auto font-medium opacity-90">
                Join the ranks of elite schools delivering superior reporting and student outcomes today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-5">
                <Link href="/register" className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 bg-white text-indigo-600 font-extrabold rounded-2xl shadow-xl hover:bg-indigo-50 hover:scale-[1.02] transition-all text-sm md:text-base">
                  Onboard Your School
                </Link>
                <Link href="#contact" className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 bg-indigo-700/50 backdrop-blur-md text-white font-extrabold rounded-2xl border border-indigo-400/50 hover:bg-indigo-700 transition-all text-sm md:text-base">
                  Schedule Executive Briefing
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 md:py-20 px-4 md:px-6 border-t border-indigo-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-20">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <GraduationCap className="text-indigo-600 w-7 h-7 md:w-8 md:h-8" />
                <span className="text-xl md:text-2xl font-extrabold text-[#0b1c30]">ReportSheet<span className="text-indigo-600">.</span></span>
              </div>
              <p className="text-[#464555] max-w-sm leading-relaxed font-medium text-sm md:text-base">
                The premier digital operating system for high-performance schools. Engineering academic excellence through data.
              </p>
            </div>
            <div>
              <h4 className="font-extrabold text-[#0b1c30] mb-4 md:mb-6 uppercase tracking-widest text-[10px] md:text-xs">Platform</h4>
              <ul className="space-y-3 md:space-y-4 text-sm font-bold text-[#464555]">
                <li><Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link></li>
                <li><Link href="#intelligence" className="hover:text-indigo-600 transition-colors">Intelligence</Link></li>
                <li><Link href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link></li>
                <li><Link href="#security" className="hover:text-indigo-600 transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-[#0b1c30] mb-4 md:mb-6 uppercase tracking-widest text-[10px] md:text-xs">Support</h4>
              <ul className="space-y-3 md:space-y-4 text-sm font-bold text-[#464555]">
                <li><Link href="#docs" className="hover:text-indigo-600 transition-colors">Documentation</Link></li>
                <li><Link href="#help" className="hover:text-indigo-600 transition-colors">Help Center</Link></li>
                <li><Link href="#contact" className="hover:text-indigo-600 transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 md:pt-12 border-t border-indigo-50/50 gap-4 md:gap-6">
            <p className="text-[10px] md:text-xs font-bold text-[#464555]/60 uppercase tracking-widest">&copy; 2026 ReportSheet Academic Systems.</p>
            <div className="flex items-center gap-6 md:gap-8">
              <Link href="/privacy" className="text-[10px] md:text-xs font-bold text-[#464555]/60 hover:text-indigo-600 uppercase tracking-widest transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-[10px] md:text-xs font-bold text-[#464555]/60 hover:text-indigo-600 uppercase tracking-widest transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
