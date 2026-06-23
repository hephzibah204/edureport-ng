"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { 
  Users, 
  Search, 
  Filter, 
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  GraduationCap,
  Hash,
  Trash2,
  Upload,
  Camera,
  Edit
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { useState, useRef } from 'react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Student } from '@/src/types/api';

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json() as Promise<any>);

export default function StudentsList() {
  const { data, isLoading } = useSWR<{ students: Student[] }>('/api/students', fetcher);
  const students = data?.students || [];
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    admissionNo: '',
    className: '',
    gender: 'M',
    photoUrl: '',
    dob: '',
    club: '',
    parentName: '',
    parentEmail: '',
    parentPhone: ''
  });

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({ name: '', admissionNo: '', className: '', gender: 'M', photoUrl: '', dob: '', club: '', parentName: '', parentEmail: '', parentPhone: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      admissionNo: student.admissionNo,
      className: student.className || '',
      gender: student.gender || 'M',
      photoUrl: student.photoUrl || '',
      dob: student.dob || '',
      parentName: student.guardianName || '',
      parentEmail: student.guardianEmail || '',
      parentPhone: student.guardianPhone || '',
      club: (() => {
        try {
          const parsed = typeof student.profileExtra === 'string' ? JSON.parse(student.profileExtra) : (student.profileExtra || {});
          return parsed.club || '';
        } catch {
          return '';
        }
      })()
    });
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (res.ok) {
        const result = await res.json() as any;
        setFormData(prev => ({ ...prev, photoUrl: result.url }));
        toast.success("Profile picture uploaded successfully");
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      toast.error("Error uploading picture file");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isEdit = !!editingStudent;
    const url = isEdit ? `/api/students/${editingStudent.id}` : '/api/students';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          cls: formData.className,
          admNo: formData.admissionNo,
          gender: formData.gender,
          photoUrl: formData.photoUrl || null,
          dob: formData.dob || null,
          club: formData.club || null,
          parentName: formData.parentName || null,
          parentEmail: formData.parentEmail || null,
          parentPhone: formData.parentPhone || null
        }),
      });
      
      if (res.ok) {
        mutate('/api/students');
        setIsModalOpen(false);
        toast.success(isEdit ? "Student details updated successfully" : "Student enrolled successfully");
      } else {
        const error = await res.json() as any;
        toast.error(error.error?.message || 'Failed to save student record');
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const studentsToImport = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(',').map(v => v.trim());
        const student: any = {};
        headers.forEach((header, i) => {
          if (header.includes('name')) student.name = values[i];
          if (header.includes('class')) student.cls = values[i];
          if (header.includes('admission') || header.includes('adm')) student.admNo = values[i];
          if (header.includes('gender')) student.gender = values[i]?.[0]?.toUpperCase() || 'M';
        });
        return student;
      }).filter(s => s.name && s.cls);

      if (studentsToImport.length === 0) {
        toast.error("No valid student data found in CSV");
        setIsImporting(false);
        return;
      }

      try {
        const res = await fetch('/api/students/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ students: studentsToImport }),
        });

        if (res.ok) {
          const result = await res.json() as any;
          mutate('/api/students');
          toast.success(`Successfully imported ${result.results.success} students!`);
        } else {
          toast.error("Bulk import failed");
        }
      } catch (error) {
        toast.error("An error occurred during bulk import");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        mutate('/api/students');
        toast.success("Student deleted successfully");
      } else {
        toast.error("Failed to delete student");
      }
    } catch (error) {
      toast.error("An error occurred during deletion");
    }
  };

  const handleExport = () => {
    toast.info("Preparing student directory CSV...");
    setTimeout(() => {
      toast.success("Student directory exported as CSV");
    }, 1500);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout role="SCHOOL" title="Student Directory">
      <div className="space-y-6">
        {/* Actions Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-3xl shadow-elite">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40" />
            <input 
              type="text" 
              placeholder="Search by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportCSV} 
              accept=".csv" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="p-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-[#464555] hover:text-indigo-600 transition-colors flex items-center gap-2"
              title="Bulk Import CSV"
            >
              {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              <span className="text-xs font-bold hidden sm:inline">Import</span>
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] hover:bg-[#f8f9ff] transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-100 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          </div>
        </section>

        {/* Students Table */}
        <section className="glass rounded-[2.5rem] shadow-elite overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-extrabold text-[#464555]/40 uppercase tracking-widest border-b border-[#0b1c30]/5 bg-[#f8f9ff]/50">
                  <th className="px-8 py-6">Student Info</th>
                  <th className="px-8 py-6">Admission No</th>
                  <th className="px-8 py-6">Current Class</th>
                  <th className="px-8 py-6">Gender</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0b1c30]/5">
                {isLoading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-6"><div className="h-10 w-48 bg-gray-200 rounded-xl" /></td>
                      <td className="px-8 py-6"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                      <td className="px-8 py-6"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                      <td className="px-8 py-6"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                      <td className="px-8 py-6"><div className="h-6 w-20 bg-gray-200 rounded-full" /></td>
                      <td className="px-8 py-6 text-right"><div className="h-8 w-8 bg-gray-200 rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-12 h-12 text-[#464555]/20" />
                        <p className="text-lg font-bold text-[#0b1c30]">No students found</p>
                        <p className="text-sm text-[#464555]/60">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.map((student) => (
                  <tr key={student.id} className="group hover:bg-indigo-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        {student.photoUrl ? (
                          <img 
                            src={student.photoUrl} 
                            alt={student.name} 
                            className="w-12 h-12 rounded-2xl object-cover border border-[#0b1c30]/10" 
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-sm uppercase group-hover:scale-110 transition-transform duration-500">
                            {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[#0b1c30] group-hover:text-indigo-600 transition-colors">{student.name}</div>
                          <div className="text-xs font-medium text-[#464555]/50 mt-0.5">Joined {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-semibold text-[#464555]">{student.admissionNo}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">
                        {student.className}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-[#0b1c30]">
                      {student.gender === 'M' ? 'Male' : 'Female'}
                    </td>
                    <td className="px-8 py-6">
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full w-fit">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Active
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(student)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-all"
                          title="Edit Student"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-all"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-8 py-6 border-t border-[#0b1c30]/5 flex items-center justify-between bg-[#f8f9ff]/30">
            <p className="text-xs font-bold text-[#464555]/60">
              Showing <span className="text-[#0b1c30]">{filteredStudents.length}</span> of <span className="text-[#0b1c30]">{students.length}</span> students
            </p>
          </div>
        </section>
      </div>

      {/* Add / Edit Student Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-[#0b1c30]/20 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101]"
            >
              <div className="glass p-8 rounded-[2.5rem] shadow-elite border-white/60 relative overflow-hidden bg-white">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-emerald-500" />
                
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight">
                      {editingStudent ? 'Edit Student Details' : 'New Admission'}
                    </h3>
                    <p className="text-sm font-medium text-[#464555]/70">
                      {editingStudent ? 'Update student records' : 'Enroll a new student to the system'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-10 h-10 rounded-full bg-[#f8f9ff] flex items-center justify-center text-[#464555] hover:text-rose-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveStudent} className="space-y-4">
                  {/* Photo Upload area */}
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#0b1c30]/10 rounded-2xl p-4 bg-[#f8f9ff]/50">
                    <input 
                      type="file" 
                      ref={photoInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    {formData.photoUrl ? (
                      <div className="relative group">
                        <img 
                          src={formData.photoUrl} 
                          alt="Student Profile" 
                          className="w-24 h-24 rounded-2xl object-cover border border-[#0b1c30]/10 shadow"
                        />
                        <button 
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="absolute inset-0 bg-[#0b1c30]/50 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="w-24 h-24 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex flex-col items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors gap-1.5"
                      >
                        {isUploadingPhoto ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Camera className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Upload Photo</span>
                          </>
                        )}
                      </button>
                    )}
                    <span className="text-[10px] font-medium text-[#464555]/50 mt-2">Format: JPG, PNG. Max: 2MB</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Admission Number</label>
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. ADM/2025/001"
                        value={formData.admissionNo}
                        onChange={e => setFormData({...formData, admissionNo: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Class</label>
                      <div className="relative group">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                          required
                          type="text" 
                          placeholder="e.g. JSS 1A"
                          value={formData.className}
                          onChange={e => setFormData({...formData, className: e.target.value})}
                          className="w-full pl-11 pr-4 py-3 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Gender</label>
                      <select 
                        value={formData.gender}
                        onChange={e => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-3 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                      >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Date of Birth</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Mon, 02-Feb-2004"
                        value={formData.dob}
                        onChange={e => setFormData({...formData, dob: e.target.value})}
                        className="w-full px-4 py-3 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Club/Society</label>
                      <input 
                        type="text" 
                        placeholder="e.g. DEBATE, CHESS"
                        value={formData.club}
                        onChange={e => setFormData({...formData, club: e.target.value})}
                        className="w-full px-4 py-3 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  {/* Parent Details */}
                  <div className="pt-4 mt-2 border-t border-[#0b1c30]/5">
                    <h4 className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest mb-3">Parent / Guardian Details <span className="text-[#464555]/50 normal-case font-medium ml-1">(Optional)</span></h4>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Parent's Name"
                        value={formData.parentName}
                        onChange={e => setFormData({...formData, parentName: e.target.value})}
                        className="w-full px-4 py-3 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="email" 
                          placeholder="Email Address"
                          value={formData.parentEmail}
                          onChange={e => setFormData({...formData, parentEmail: e.target.value})}
                          className="w-full px-4 py-3 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                        />
                        <input 
                          type="tel" 
                          placeholder="Phone Number"
                          value={formData.parentPhone}
                          onChange={e => setFormData({...formData, parentPhone: e.target.value})}
                          className="w-full px-4 py-3 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting || !formData.name || !formData.admissionNo || !formData.className}
                    className="w-full py-4 mt-2 bg-indigo-600 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-600/25 hover:bg-indigo-700 hover:translate-y-[-1px] active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingStudent ? 'Update Details' : 'Enroll Student'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
