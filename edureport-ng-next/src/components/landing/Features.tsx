"use client";
import { motion } from 'framer-motion';
import { ShieldCheck, BarChart3, Users, Zap, BookOpen, School } from 'lucide-react';

const features = [
  { 
    icon: <School className="w-6 h-6" />, 
    title: "School Setup & Branding", 
    desc: "Your logo, name, motto, and principal's name on every report card. Full identity.",
    badge: "5-min setup"
  },
  { 
    icon: <Users className="w-6 h-6" />, 
    title: "Bulk Student Import", 
    desc: "Import 100+ students by pasting a list. Supports all class structures from Primary 1 to SS3.",
    badge: "Saves 2+ hours"
  },
  { 
    icon: <Zap className="w-6 h-6" />, 
    title: "Auto Grade Computation", 
    desc: "Enter CA1, CA2, Exam. Total, grade, remark, and class position compute instantly.",
    badge: "100% accurate"
  },
  { 
    icon: <BookOpen className="w-6 h-6" />, 
    title: "Professional Report Sheets", 
    desc: "Print-ready A4 cards with watermark, affective skills, teacher/principal remarks.",
    badge: "Print-ready"
  },
  { 
    icon: <BarChart3 className="w-6 h-6" />, 
    title: "Print All — 1 Click", 
    desc: "Print every student's report with proper page breaks. An entire class done in minutes.",
    badge: "Fast bulk"
  },
  { 
    icon: <ShieldCheck className="w-6 h-6" />, 
    title: "Secure School Accounts", 
    desc: "Each school has an isolated account. Your student data is private and only accessible by you.",
    badge: "Bank-level security"
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-[800] tracking-tight text-[#0b1c30] mb-6">
              Everything you need to <br />
              <span className="text-indigo-600">run a modern school.</span>
            </h2>
            <p className="text-lg text-[#464555] font-medium leading-relaxed">
              Stop using Excel and calculators. EduReport automates the entire term's workload so you can focus on teaching.
            </p>
          </div>
          <div className="hidden md:block pb-2">
            <button className="px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors">
              View Full Ecosystem
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 1, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-10 rounded-[2.5rem] glass hover:bg-white transition-all duration-500 hover:shadow-elite hover:translate-y-[-8px]"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-[10deg] transition-all duration-500">
                  {feature.icon}
                </div>
                {feature.badge && (
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border border-indigo-100 group-hover:bg-white group-hover:border-transparent transition-all">
                    {feature.badge}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-extrabold text-[#0b1c30] mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-[#464555] leading-relaxed font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
