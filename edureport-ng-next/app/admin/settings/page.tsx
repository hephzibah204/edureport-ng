"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  Settings, 
  School, 
  Calendar, 
  BarChart3, 
  Save, 
  Plus, 
  Trash2, 
  Upload,
  Info,
  FileText,
  CheckCircle2,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';

export default function SchoolSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('profile');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (res.ok) {
        const result = await res.json() as any;
        setSchool(prev => ({ ...prev, logoUrl: result.url }));
        toast.success("School logo uploaded successfully");
      } else {
        toast.error("Failed to upload logo");
      }
    } catch (error) {
      toast.error("Error uploading logo file");
    } finally {
      setIsUploadingLogo(false);
    }
  };
  const [school, setSchool] = useState<any>({
    name: '',
    abbr: '',
    motto: '',
    principal: '',
    logoUrl: '',
    address: '',
    contact: '',
    session: '',
    term: '',
    ca1Max: 20,
    ca2Max: 20,
    examMax: 60,
    grades: [],
    subjects: [],
    classTemplates: [],
    classArms: [],
    promotionLogic: { enabled: false, minAverage: 40, coreSubjects: [] },
    reportColor: '#4f46e5',
    reportTemplate: 'ELITE'
  });

  useEffect(() => {
    async function fetchSchool() {
      try {
        const res = await fetch('/api/school');
        const data = await res.json() as any;
        if (data.school) {
          const s = data.school;
          setSchool({
            ...s,
            reportColor: s.reportColor || '#4f46e5',
            reportTemplate: s.reportTemplate || 'ELITE',
            grades: (() => {
              const parsed = typeof s.grades === 'string' ? JSON.parse(s.grades) : (s.grades || []);
              return Array.isArray(parsed) ? parsed : [];
            })(),
            subjects: (() => {
              const parsed = typeof s.subjects === 'string' ? JSON.parse(s.subjects) : (s.subjects || []);
              return Array.isArray(parsed) ? parsed : [];
            })(),
            classTemplates: (() => {
              const parsed = typeof s.classTemplates === 'string' ? JSON.parse(s.classTemplates) : (s.classTemplates || []);
              return Array.isArray(parsed) ? parsed : [];
            })(),
            classArms: (() => {
              const parsed = typeof s.classArms === 'string' ? JSON.parse(s.classArms) : (s.classArms || []);
              return Array.isArray(parsed) ? parsed : [];
            })(),
            promotionLogic: (() => {
              try {
                const parsed = typeof s.promotionLogic === 'string' ? JSON.parse(s.promotionLogic) : (s.promotionLogic || {});
                return {
                  enabled: !!parsed.enabled,
                  minAverage: parsed.minAverage || 40,
                  coreSubjects: Array.isArray(parsed.coreSubjects) ? parsed.coreSubjects : []
                };
              } catch {
                return { enabled: false, minAverage: 40, coreSubjects: [] };
              }
            })(),
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching school:', error);
        toast.error('Failed to load school settings');
        setLoading(false);
      }
    }
    fetchSchool();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/school', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(school)
      });
      const data = await res.json() as any;
      if (data.success) {
        toast.success('Settings updated successfully');
      } else {
        throw new Error(data.error?.message || 'Update failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addGrade = () => {
    const newGrades = [...school.grades, { grade: '', min: 0, max: 0, remark: '' }];
    setSchool({ ...school, grades: newGrades });
  };

  const removeGrade = (index: number) => {
    const newGrades = school.grades.filter((_: any, i: number) => i !== index);
    setSchool({ ...school, grades: newGrades });
  };

  const updateGrade = (index: number, field: string, value: any) => {
    const newGrades = [...school.grades];
    newGrades[index] = { ...newGrades[index], [field]: value };
    setSchool({ ...school, grades: newGrades });
  };

  if (loading) {
    return (
      <DashboardLayout role="SCHOOL" title="Settings">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'profile', label: 'School Profile', icon: School },
    { id: 'academic', label: 'Session & Term', icon: Calendar },
    { id: 'grading', label: 'Grading Scale', icon: BarChart3 },
    { id: 'scores', label: 'Score Configuration', icon: Settings },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'classes', label: 'Classes', icon: GraduationCap },
    { id: 'reports', label: 'Report Templates', icon: FileText },
  ];

  return (
    <DashboardLayout role="SCHOOL" title="Institutional Configuration">
      <div className="space-y-10">
        {/* Header with Save Button */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-[800] tracking-tight text-[#0b1c30]">School Settings</h2>
            <p className="text-lg font-medium text-[#464555]/70">Customize your school's operating parameters and identity.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white rounded-2xl px-8 py-4 text-sm font-bold shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-100 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Navigation Tabs */}
          <aside className="lg:col-span-3 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-sm",
                  activeTab === tab.id 
                    ? "bg-white text-indigo-600 shadow-sm border border-[#0b1c30]/5" 
                    : "text-[#464555] hover:bg-white/50"
                )}
              >
                <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-indigo-600" : "text-[#464555]/40")} />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Main Content Area */}
          <section className="lg:col-span-9 glass p-10 rounded-[2.5rem] shadow-elite min-h-[600px]">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <School className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-[#0b1c30]">School Profile</h3>
                      <p className="text-sm font-medium text-[#464555]/60">Basic identity information for your institution.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Official Name</label>
                      <input 
                        type="text" 
                        value={school.name}
                        onChange={(e) => setSchool({ ...school, name: e.target.value })}
                        className="w-full px-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Abbreviation</label>
                      <input 
                        type="text" 
                        value={school.abbr}
                        onChange={(e) => setSchool({ ...school, abbr: e.target.value })}
                        className="w-full px-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">School Motto</label>
                      <input 
                        type="text" 
                        value={school.motto}
                        onChange={(e) => setSchool({ ...school, motto: e.target.value })}
                        className="w-full px-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Principal's Name</label>
                      <input 
                        type="text" 
                        value={school.principal}
                        onChange={(e) => setSchool({ ...school, principal: e.target.value })}
                        className="w-full px-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Contact Email/Phone</label>
                      <input 
                        type="text" 
                        value={school.contact}
                        onChange={(e) => setSchool({ ...school, contact: e.target.value })}
                        className="w-full px-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">School Address</label>
                      <textarea 
                        rows={3}
                        value={school.address}
                        onChange={(e) => setSchool({ ...school, address: e.target.value })}
                        className="w-full px-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#0b1c30]/5">
                    <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1 block mb-4">School Logo</label>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-2xl bg-[#f8f9ff] border-2 border-dashed border-[#0b1c30]/10 flex items-center justify-center overflow-hidden">
                        {school.logoUrl ? (
                          <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <School className="w-8 h-8 text-[#464555]/20" />
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={logoInputRef} 
                        onChange={handleLogoUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button 
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] hover:bg-[#f8f9ff] transition-all disabled:opacity-50"
                      >
                        {isUploadingLogo ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                        {isUploadingLogo ? 'Uploading...' : 'Change Logo'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-[#0b1c30]">Academic Session & Term</h3>
                      <p className="text-sm font-medium text-[#464555]/60">Manage your current academic period.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Current Session</label>
                      <select 
                        value={school.session}
                        onChange={(e) => setSchool({ ...school, session: e.target.value })}
                        className="w-full px-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                      >
                        <option value="2023/2024">2023/2024</option>
                        <option value="2024/2025">2024/2025</option>
                        <option value="2025/2026">2025/2026</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Current Term</label>
                      <select 
                        value={school.term}
                        onChange={(e) => setSchool({ ...school, term: e.target.value })}
                        className="w-full px-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                      >
                        <option value="1st Term">1st Term</option>
                        <option value="2nd Term">2nd Term</option>
                        <option value="3rd Term">3rd Term</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 flex gap-4 mt-8">
                    <Info className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <p className="text-xs font-medium text-indigo-900/70 leading-relaxed">
                      Changing the session or term will update all report generation and score entry filters site-wide. Ensure all previous term scores are finalized before switching.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'grading' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-[#0b1c30]">Grading Scale</h3>
                        <p className="text-sm font-medium text-[#464555]/60">Define grade boundaries and remarks.</p>
                      </div>
                    </div>
                    <button 
                      onClick={addGrade}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Row
                    </button>
                  </div>

                  <div className="overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="text-[10px] font-extrabold text-[#464555]/40 uppercase tracking-widest text-left">
                          <th className="pb-4 pl-1">Grade</th>
                          <th className="pb-4">Min Score</th>
                          <th className="pb-4">Max Score</th>
                          <th className="pb-4">Remark</th>
                          <th className="pb-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-3">
                        {school.grades.map((grade: any, idx: number) => (
                          <tr key={idx} className="group">
                            <td className="py-2 pr-4">
                              <input 
                                type="text" 
                                value={grade.grade}
                                placeholder="A"
                                onChange={(e) => updateGrade(idx, 'grade', e.target.value)}
                                className="w-16 px-3 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-center text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                              />
                            </td>
                            <td className="py-2 pr-4">
                              <input 
                                type="number" 
                                value={grade.min}
                                onChange={(e) => updateGrade(idx, 'min', Number(e.target.value))}
                                className="w-20 px-3 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                              />
                            </td>
                            <td className="py-2 pr-4">
                              <input 
                                type="number" 
                                value={grade.max}
                                onChange={(e) => updateGrade(idx, 'max', Number(e.target.value))}
                                className="w-20 px-3 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                              />
                            </td>
                            <td className="py-2 pr-4">
                              <input 
                                type="text" 
                                value={grade.remark}
                                placeholder="Excellent"
                                onChange={(e) => updateGrade(idx, 'remark', e.target.value)}
                                className="w-full px-4 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                              />
                            </td>
                            <td className="py-2 text-right">
                              <button 
                                onClick={() => removeGrade(idx)}
                                className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'scores' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                      <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-[#0b1c30]">Score Configuration</h3>
                      <p className="text-sm font-medium text-[#464555]/60">Define maximum scores for continuous assessments and exams.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">CA 1 Max Score</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={school.ca1Max}
                          onChange={(e) => setSchool({ ...school, ca1Max: Number(e.target.value) })}
                          className="w-full px-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#464555]/40">pts</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">CA 2 Max Score</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={school.ca2Max}
                          onChange={(e) => setSchool({ ...school, ca2Max: Number(e.target.value) })}
                          className="w-full px-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#464555]/40">pts</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Exam Max Score</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={school.examMax}
                          onChange={(e) => setSchool({ ...school, examMax: Number(e.target.value) })}
                          className="w-full px-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#464555]/40">pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-[#0b1c30] text-white flex flex-col md:flex-row items-center justify-between gap-6 mt-10">
                    <div>
                      <h4 className="text-lg font-bold">Total Aggregate Score</h4>
                      <p className="text-white/60 text-sm">Combined total for report calculation.</p>
                    </div>
                    <div className="text-5xl font-black text-indigo-400">
                      {Number(school.ca1Max) + Number(school.ca2Max) + Number(school.examMax)}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'subjects' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-[#0b1c30]">School Subjects</h3>
                        <p className="text-sm font-medium text-[#464555]/60">Manage the list of subjects offered in your school.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSchool({ ...school, subjects: [...school.subjects, ''] })}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Subject
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {school.subjects.map((sub: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input 
                          type="text" 
                          value={sub}
                          placeholder="e.g. Mathematics"
                          onChange={(e) => {
                            const newSubs = [...school.subjects];
                            newSubs[idx] = e.target.value;
                            setSchool({ ...school, subjects: newSubs });
                          }}
                          className="flex-1 px-5 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                        />
                        <button 
                          onClick={() => setSchool({ ...school, subjects: school.subjects.filter((_: any, i: number) => i !== idx) })}
                          className="p-3 text-[#464555]/30 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'classes' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-[#0b1c30]">Class Templates</h3>
                        <p className="text-sm font-medium text-[#464555]/60">Manage the naming conventions for your classes.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSchool({ ...school, classTemplates: [...school.classTemplates, ''] })}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Class
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {school.classTemplates.map((cls: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input 
                          type="text" 
                          value={cls}
                          placeholder="e.g. JSS 1A"
                          onChange={(e) => {
                            const newClasses = [...school.classTemplates];
                            newClasses[idx] = e.target.value;
                            setSchool({ ...school, classTemplates: newClasses });
                          }}
                          className="flex-1 px-5 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                        />
                        <button 
                          onClick={() => setSchool({ ...school, classTemplates: school.classTemplates.filter((_: any, i: number) => i !== idx) })}
                          className="p-3 text-[#464555]/30 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* PROMOTION SETTINGS SECTION */}
                  <div className="flex items-center justify-between mb-4 mt-8 border-t border-[#0b1c30]/5 pt-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-[#0b1c30]">Automatic Promotion Logic</h3>
                        <p className="text-sm font-medium text-[#464555]/60">Configure auto-promotion in the 3rd Term.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-3xl p-6 mb-8">
                    <div className="flex items-center gap-4 mb-6">
                      <input 
                        type="checkbox"
                        id="enablePromotion"
                        checked={school.promotionLogic?.enabled}
                        onChange={(e) => setSchool({ 
                          ...school, 
                          promotionLogic: { ...school.promotionLogic, enabled: e.target.checked }
                        })}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <label htmlFor="enablePromotion" className="text-sm font-bold text-[#0b1c30]">
                        Enable Automatic Promotion (Applies strictly in 3rd Term)
                      </label>
                    </div>

                    {school.promotionLogic?.enabled && (
                      <div className="space-y-6 animate-in slide-in-from-top-2">
                        <div>
                          <label className="block text-sm font-bold text-[#0b1c30] mb-2">Minimum Cumulative Average Required (%)</label>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={school.promotionLogic.minAverage}
                            onChange={(e) => setSchool({ 
                              ...school, 
                              promotionLogic: { ...school.promotionLogic, minAverage: Number(e.target.value) }
                            })}
                            className="w-full px-5 py-3 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-[#0b1c30] mb-2">Core Subjects Required to Pass (Comma separated, e.g. Mathematics, English Language)</label>
                          <input 
                            type="text"
                            value={school.promotionLogic.coreSubjects?.join(', ') || ''}
                            onChange={(e) => {
                              const arr = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                              setSchool({ 
                                ...school, 
                                promotionLogic: { ...school.promotionLogic, coreSubjects: arr }
                              });
                            }}
                            placeholder="Mathematics, English Language"
                            className="w-full px-5 py-3 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4 mt-8 border-t border-[#0b1c30]/5 pt-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-[#0b1c30]">Class Arms</h3>
                        <p className="text-sm font-medium text-[#464555]/60">Manage your class arms (e.g. A, B, Science, Art).</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSchool({ ...school, classArms: [...(school.classArms || []), ''] })}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Arm
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(school.classArms || []).map((arm: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input 
                          type="text" 
                          value={arm}
                          placeholder="e.g. A, B, Science"
                          onChange={(e) => {
                            const newArms = [...(school.classArms || [])];
                            newArms[idx] = e.target.value;
                            setSchool({ ...school, classArms: newArms });
                          }}
                          className="flex-1 px-5 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                        />
                        <button 
                          onClick={() => setSchool({ ...school, classArms: (school.classArms || []).filter((_: any, i: number) => i !== idx) })}
                          className="p-3 text-[#464555]/30 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-[#0b1c30]">Report Card Templates</h3>
                      <p className="text-sm font-medium text-[#464555]/60">Select the visual style for your school's official report cards.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { id: 'ELITE', name: 'Elite Modern', desc: 'Glassmorphism, clean & professional.', color: 'from-indigo-500 to-indigo-700' },
                      { id: 'CLASSIC', name: 'Classic Professional', desc: 'Institutional, border-heavy, traditional.', color: 'from-slate-700 to-slate-900' },
                      { id: 'ALQALAM', name: 'Heritage Classic', desc: 'Grid-heavy, clean traditional report sheet design.', color: 'from-blue-600 to-indigo-900' },
                      { id: 'CHERITH', name: 'Legacy Standard', desc: 'Institutional, minimal layout with traditional grading.', color: 'from-emerald-600 to-teal-900' },
                      { id: 'NURSERY', name: 'Nursery Colorful', desc: 'Playful, vibrant, perfect for kids.', color: 'from-amber-400 to-rose-400' },
                    ].map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => setSchool({ ...school, reportTemplate: tpl.id })}
                        className={cn(
                          "relative p-6 rounded-[2rem] text-left transition-all group overflow-hidden border-2",
                          school.reportTemplate === tpl.id 
                            ? "border-indigo-600 ring-4 ring-indigo-600/10" 
                            : "border-transparent bg-[#f8f9ff] hover:bg-white hover:border-indigo-600/20"
                        )}
                      >
                        <div className={cn("w-full h-32 rounded-2xl mb-4 bg-gradient-to-br", tpl.color)} />
                        <h4 className="font-extrabold text-[#0b1c30]">{tpl.name}</h4>
                        <p className="text-xs font-medium text-[#464555]/60 mt-1">{tpl.desc}</p>
                        {school.reportTemplate === tpl.id && (
                          <div className="absolute top-4 right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-[#0b1c30]/5">
                    <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1 block mb-4">Brand Accent Color</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={school.reportColor}
                        onChange={(e) => setSchool({ ...school, reportColor: e.target.value })}
                        className="w-16 h-16 rounded-2xl cursor-pointer border-none bg-transparent"
                      />
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-[#0b1c30]">{school.reportColor}</div>
                        <p className="text-[10px] font-medium text-[#464555]/40 uppercase tracking-widest">This color will be used for accents in the report cards.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
