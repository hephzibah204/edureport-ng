"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, Settings, Users, BookOpen, Calendar } from "lucide-react";
import { School } from "@/src/types/api";

export default function OnboardingWizard({ 
  school, 
  onComplete 
}: { 
  school: School, 
  onComplete: (data: any) => void 
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    session: school.session || "2024/2025",
    term: school.term || "First Term",
    ca1Max: school.ca1Max || 10,
    ca2Max: school.ca2Max || 10,
    examMax: school.examMax || 80,
    address: school.address || "",
    contact: school.contact || "",
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete(formData);
  };

  return (
    <div className="fixed inset-0 bg-[#0b1c30]/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Sidebar */}
        <div className="w-full md:w-1/3 bg-indigo-600 p-8 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-extrabold mb-2">Welcome!</h2>
            <p className="text-indigo-100 text-sm">Let's configure your school's academic environment.</p>
          </div>
          <div className="space-y-6 mt-8 md:mt-0">
            {[
              { num: 1, label: "Academic Term", icon: Calendar },
              { num: 2, label: "Grading System", icon: Settings },
              { num: 3, label: "Ready to Go", icon: CheckCircle2 }
            ].map((s) => (
              <div key={s.num} className={`flex items-center gap-3 ${step >= s.num ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === s.num ? 'bg-white text-indigo-600' : 'border border-white/30 text-white'}`}>
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className="font-semibold text-sm">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 bg-[#f8f9ff]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-[#0b1c30] mb-6">Current Academic Term</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  <div>
                    <label className="text-xs font-extrabold text-[#464555]/50 uppercase">Session</label>
                    <input 
                      type="text" 
                      value={formData.session}
                      onChange={e => setFormData({...formData, session: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-bold mt-1" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-[#464555]/50 uppercase">Term</label>
                    <select 
                      value={formData.term}
                      onChange={e => setFormData({...formData, term: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-bold mt-1"
                    >
                      <option value="First Term">First Term</option>
                      <option value="Second Term">Second Term</option>
                      <option value="Third Term">Third Term</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-[#464555]/50 uppercase">School Address</label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="e.g. 123 Main St, Lagos"
                      className="w-full px-4 py-3 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-bold mt-1" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-[#464555]/50 uppercase">Contact Info / Phone</label>
                    <input 
                      type="text" 
                      value={formData.contact}
                      onChange={e => setFormData({...formData, contact: e.target.value})}
                      placeholder="e.g. +234 803 123 4567"
                      className="w-full px-4 py-3 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-bold mt-1" 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-[#0b1c30] mb-6">Grading Parameters</h3>
                <p className="text-sm text-[#464555]/70 mb-4">Set the maximum obtainable scores for assessments and exams. (Must total 100)</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-extrabold text-[#464555]/50 uppercase">CA 1 Max</label>
                    <input type="number" value={formData.ca1Max} onChange={e => setFormData({...formData, ca1Max: Number(e.target.value)})} className="w-full px-4 py-3 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-bold mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-[#464555]/50 uppercase">CA 2 Max</label>
                    <input type="number" value={formData.ca2Max} onChange={e => setFormData({...formData, ca2Max: Number(e.target.value)})} className="w-full px-4 py-3 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-bold mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-[#464555]/50 uppercase">Exam Max</label>
                    <input type="number" value={formData.examMax} onChange={e => setFormData({...formData, examMax: Number(e.target.value)})} className="w-full px-4 py-3 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-bold mt-1" />
                  </div>
                </div>
                {formData.ca1Max + formData.ca2Max + formData.examMax !== 100 && (
                  <p className="text-xs text-rose-500 font-bold mt-2">Scores must total 100.</p>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#0b1c30] mb-2">All Set!</h3>
                <p className="text-[#464555]/70 text-sm">Your school is configured. We've pre-loaded standard subjects and classes for you. You can edit them later in Settings.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 flex justify-end">
            <button 
              onClick={handleNext}
              disabled={step === 2 && formData.ca1Max + formData.ca2Max + formData.examMax !== 100}
              className="flex items-center gap-2 px-8 py-3 bg-[#0b1c30] text-white rounded-xl text-sm font-bold shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {step === 3 ? "Launch Dashboard" : "Continue"} 
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Ensure lucide icon Calendar is imported above
