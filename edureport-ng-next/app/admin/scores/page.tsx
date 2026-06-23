"use client";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Save, 
  Loader2,
  Search,
  Check,
  Trophy,
  AlertCircle,
  ChevronDown,
  User,
  GraduationCap,
  Percent,
  Download,
  Upload,
  FileSpreadsheet,
  X,
  AlertTriangle,
  Eye,
  Keyboard
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  admissionNo: string;
  className: string;
}

interface ScoreData {
  ca1?: number;
  ca2?: number;
  exam?: number;
}

interface ScoreSheet {
  studentId: string;
  data: Record<string, ScoreData>;
}

interface CSVPreviewRow {
  admissionNo: string;
  studentName: string;
  ca1: number | undefined;
  ca2: number | undefined;
  exam: number | undefined;
  studentId?: string;
  matched: boolean;
  warnings: string[];
}

// ==========================================
// CSV Helpers
// ==========================================
function generateCSVTemplate(students: Student[], scores: Record<string, ScoreData>, maxScores: { ca1: number; ca2: number; exam: number }): string {
  const header = `Admission No,Student Name,CA 1 (Max: ${maxScores.ca1}),CA 2 (Max: ${maxScores.ca2}),Exam (Max: ${maxScores.exam})`;
  const rows = students.map(s => {
    const sc = scores[s.id] || {};
    return `${s.admissionNo},"${s.name}",${sc.ca1 ?? ""},${sc.ca2 ?? ""},${sc.exam ?? ""}`;
  });
  return [header, ...rows].join("\n");
}

function parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 1) return { headers: [], rows: [] };
  
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine).filter(r => r.some(cell => cell.trim() !== ""));
  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ==========================================
// Main Component
// ==========================================
export default function ScoresPage() {
  const [classes, setClasses] = useState<{ name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreData>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [maxScores, setMaxScores] = useState({ ca1: 20, ca2: 20, exam: 60 });
  
  // CSV Import State
  const [showCSVPreview, setShowCSVPreview] = useState(false);
  const [csvPreviewData, setCsvPreviewData] = useState<CSVPreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Validation State - tracks which cells are currently over-limit
  const [overLimitCells, setOverLimitCells] = useState<Set<string>>(new Set());

  // Grid ref for keyboard navigation
  const gridRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchScores();
    }
  }, [selectedClass]);

  const fetchInitialData = async () => {
    try {
      const [schoolRes, meRes] = await Promise.all([
        fetch("/api/school"),
        fetch("/api/auth/me")
      ]);
      
      const schoolData = await schoolRes.json() as any;
      if (schoolData.school) {
        // Parse classes and subjects from school configuration
        const classList = (() => {
          try {
            const parsed = typeof schoolData.school.classTemplates === 'string' 
              ? JSON.parse(schoolData.school.classTemplates) 
              : (schoolData.school.classTemplates || []);
            return Array.isArray(parsed) ? parsed.map((cls: string) => ({ name: cls })) : [];
          } catch {
            return [];
          }
        })();

        const subjectList = (() => {
          try {
            const parsed = typeof schoolData.school.subjects === 'string' 
              ? JSON.parse(schoolData.school.subjects) 
              : (schoolData.school.subjects || []);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })();

        setClasses(classList);
        if (classList.length > 0) setSelectedClass(classList[0].name);

        setSubjects(subjectList);
        if (subjectList.length > 0) setSelectedSubject(subjectList[0]);

        setMaxScores({
          ca1: Number(schoolData.school.ca1Max) || 20,
          ca2: Number(schoolData.school.ca2Max) || 20,
          exam: Number(schoolData.school.examMax) || 60,
        });
      }
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    }
  };

  const fetchScores = async () => {
    setLoading(true);
    try {
      const [studentsRes, scoresRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/scores")
      ]);
      
      const studentsData = await studentsRes.json() as any;
      const scoresData = await scoresRes.json() as any;
      
      if (studentsData.students) {
        const classStudents = studentsData.students.filter((s: any) => s.className === selectedClass);
        setStudents(classStudents);
      }

      const initialScores: Record<string, ScoreData> = {};
      if (scoresData.scores) {
        Object.keys(scoresData.scores).forEach((studentId) => {
          const sheetData = scoresData.scores[studentId] || {};
          if (selectedSubject && sheetData[selectedSubject]) {
            initialScores[studentId] = sheetData[selectedSubject];
          }
        });
      }

      setScores(initialScores);
    } catch (err: any) {
      console.error("Failed to fetch scores", err);
    } finally {
      setLoading(false);
    }
  };

  // Re-filter scores when subject changes
  useEffect(() => {
    if (selectedSubject && selectedClass) {
       refreshScoresForSubject();
    }
  }, [selectedSubject, selectedClass]);

  const refreshScoresForSubject = async () => {
    setLoading(true);
    try {
      const [studentsRes, scoresRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/scores")
      ]);
      
      const studentsData = await studentsRes.json() as any;
      const scoresData = await scoresRes.json() as any;

      if (studentsData.students) {
        const classStudents = studentsData.students.filter((s: any) => s.className === selectedClass);
        setStudents(classStudents);
      }

      const updatedScores: Record<string, ScoreData> = {};
      if (scoresData.scores) {
        Object.keys(scoresData.scores).forEach((studentId) => {
          const sheetData = scoresData.scores[studentId] || {};
          if (sheetData[selectedSubject]) {
            updatedScores[studentId] = sheetData[selectedSubject];
          }
        });
      }
      setScores(updatedScores);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // Score Change Handler with Validation
  // ==========================================
  const handleScoreChange = useCallback((studentId: string, field: keyof ScoreData, value: string) => {
    const cellKey = `${studentId}-${field}`;
    
    if (value === "") {
      setScores(prev => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          [field]: undefined
        }
      }));
      // Clear over-limit flag
      setOverLimitCells(prev => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
      return;
    }

    const numValue = Number(value);
    const maxVal = maxScores[field];
    
    if (numValue > maxVal) {
      // Mark as over-limit (show red border), but still store the typed value
      setOverLimitCells(prev => new Set(prev).add(cellKey));
      toast.warning(`${field.toUpperCase()} cannot exceed ${maxVal}. Will auto-correct on blur.`, { duration: 2000 });
    } else if (numValue < 0) {
      setOverLimitCells(prev => new Set(prev).add(cellKey));
    } else {
      // Clear over-limit flag
      setOverLimitCells(prev => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
    }

    setScores(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: numValue
      }
    }));
  }, [maxScores]);

  // Auto-clamp on blur
  const handleScoreBlur = useCallback((studentId: string, field: keyof ScoreData) => {
    const cellKey = `${studentId}-${field}`;
    
    setScores(prev => {
      const current = prev[studentId]?.[field];
      if (current === undefined) return prev;
      
      const maxVal = maxScores[field];
      const clamped = Math.max(0, Math.min(current, maxVal));
      
      if (clamped !== current) {
        toast.info(`Score auto-corrected to ${clamped} (limit: ${maxVal})`);
      }
      
      return {
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          [field]: clamped
        }
      };
    });
    
    // Clear over-limit flag
    setOverLimitCells(prev => {
      const next = new Set(prev);
      next.delete(cellKey);
      return next;
    });
  }, [maxScores]);

  // ==========================================
  // Keyboard Navigation
  // ==========================================
  const handleGridKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colIdx: number) => {
    const fields = ['ca1', 'ca2', 'exam'] as const;
    let targetRow = rowIdx;
    let targetCol = colIdx;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        targetRow = Math.max(0, rowIdx - 1);
        break;
      case 'ArrowDown':
      case 'Enter':
        e.preventDefault();
        targetRow = rowIdx + 1; // Will be bounded when querying
        break;
      case 'ArrowLeft':
        e.preventDefault();
        targetCol = Math.max(0, colIdx - 1);
        break;
      case 'ArrowRight':
      case 'Tab':
        if (e.key === 'Tab' && e.shiftKey) {
          // Shift+Tab: go left
          e.preventDefault();
          targetCol = Math.max(0, colIdx - 1);
          break;
        }
        if (e.key === 'Tab') e.preventDefault();
        targetCol = colIdx + 1;
        if (targetCol > fields.length - 1) {
          targetCol = 0;
          targetRow = rowIdx + 1;
        }
        break;
      default:
        return; // Don't prevent default for other keys
    }

    // Find and focus the target input
    const grid = gridRef.current;
    if (!grid) return;
    
    const targetInput = grid.querySelector<HTMLInputElement>(
      `input[data-row="${targetRow}"][data-col="${targetCol}"]`
    );
    
    if (targetInput) {
      targetInput.focus();
      targetInput.select();
    }
  }, []);

  // ==========================================
  // CSV Export
  // ==========================================
  const handleCSVExport = useCallback(() => {
    if (students.length === 0) {
      toast.error("No students to export");
      return;
    }
    const csv = generateCSVTemplate(students, scores, maxScores);
    const filename = `${selectedClass}_${selectedSubject}_scores.csv`.replace(/\s+/g, '_');
    downloadCSV(filename, csv);
    toast.success("CSV template downloaded!");
  }, [students, scores, maxScores, selectedClass, selectedSubject]);

  // ==========================================
  // CSV Import & Preview
  // ==========================================
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a .csv file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const { headers, rows } = parseCSV(text);
      
      // Validate headers
      if (headers.length < 3) {
        toast.error("Invalid CSV format. Expected at least: Admission No, Student Name, CA 1, CA 2, Exam");
        return;
      }

      // Build preview data
      const preview: CSVPreviewRow[] = rows.map(row => {
        const admissionNo = row[0] || "";
        const studentName = row[1] || "";
        const ca1 = row[2] !== "" ? Number(row[2]) : undefined;
        const ca2 = row[3] !== "" ? Number(row[3]) : undefined;
        const exam = row[4] !== "" ? Number(row[4]) : undefined;
        
        // Match to existing student
        const matchedStudent = students.find(s => 
          s.admissionNo.toLowerCase() === admissionNo.toLowerCase()
        );

        const warnings: string[] = [];
        if (!matchedStudent) warnings.push("Student not found in class");
        if (ca1 !== undefined && ca1 > maxScores.ca1) warnings.push(`CA1 exceeds max (${maxScores.ca1})`);
        if (ca2 !== undefined && ca2 > maxScores.ca2) warnings.push(`CA2 exceeds max (${maxScores.ca2})`);
        if (exam !== undefined && exam > maxScores.exam) warnings.push(`Exam exceeds max (${maxScores.exam})`);
        if (ca1 !== undefined && isNaN(ca1)) warnings.push("CA1 is not a number");
        if (ca2 !== undefined && isNaN(ca2)) warnings.push("CA2 is not a number");
        if (exam !== undefined && isNaN(exam)) warnings.push("Exam is not a number");

        return {
          admissionNo,
          studentName,
          ca1,
          ca2,
          exam,
          studentId: matchedStudent?.id,
          matched: !!matchedStudent,
          warnings
        };
      });

      setCsvPreviewData(preview);
      setShowCSVPreview(true);
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [students, maxScores]);

  const applyCSVImport = useCallback(() => {
    setImporting(true);
    
    let applied = 0;
    let skipped = 0;

    const newScores = { ...scores };

    csvPreviewData.forEach(row => {
      if (!row.matched || !row.studentId) {
        skipped++;
        return;
      }

      newScores[row.studentId] = {
        ca1: row.ca1 !== undefined ? Math.max(0, Math.min(row.ca1, maxScores.ca1)) : (scores[row.studentId]?.ca1),
        ca2: row.ca2 !== undefined ? Math.max(0, Math.min(row.ca2, maxScores.ca2)) : (scores[row.studentId]?.ca2),
        exam: row.exam !== undefined ? Math.max(0, Math.min(row.exam, maxScores.exam)) : (scores[row.studentId]?.exam),
      };
      applied++;
    });

    setScores(newScores);
    setShowCSVPreview(false);
    setCsvPreviewData([]);
    setImporting(false);
    
    toast.success(`Imported ${applied} records. ${skipped > 0 ? `${skipped} skipped.` : ""} Click "Save Changes" to persist.`);
  }, [csvPreviewData, scores, maxScores]);

  // ==========================================
  // Save Scores
  // ==========================================
  const saveScores = async () => {
    setSaving(true);
    try {
      // Save all updated scores one-by-one or in sequence using PUT /api/scores/${studentId}
      for (const student of students) {
        const studentScore = scores[student.id] || {};
        
        // Fetch existing scores first to not overwrite other subjects
        const res = await fetch(`/api/scores`);
        const data = await res.json() as any;
        const existingData = data.scores?.[student.id] || {};

        const mergedData = {
          ...existingData,
          [selectedSubject]: studentScore
        };

        await fetch(`/api/scores/${student.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mergedData)
        });
      }
      toast.success("Scores saved successfully");
    } catch (err: any) {
      console.error("Failed to save scores", err);
      toast.error("Failed to save scores");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const stats = useMemo(() => {
    const total = students.length;
    let sum = 0;
    let count = 0;
    let pass = 0;

    Object.values(scores).forEach(s => {
      const totalScore = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0);
      if (totalScore > 0) {
        sum += totalScore;
        count++;
        if (totalScore >= 40) pass++;
      }
    });

    return {
      average: count > 0 ? Math.round(sum / count) : 0,
      passRate: count > 0 ? Math.round((pass / count) * 100) : 0,
      completion: total > 0 ? Math.round((count / total) * 100) : 0
    };
  }, [students, scores]);

  const csvStats = useMemo(() => {
    if (csvPreviewData.length === 0) return { total: 0, matched: 0, warnings: 0 };
    return {
      total: csvPreviewData.length,
      matched: csvPreviewData.filter(r => r.matched).length,
      warnings: csvPreviewData.filter(r => r.warnings.length > 0).length
    };
  }, [csvPreviewData]);

  return (
    <DashboardLayout role="SCHOOL" title="Admin Score Management">
      <div className="space-y-6">
        {/* Selection Bar */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass p-6 rounded-[2rem] shadow-elite">
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest px-1">Class</label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="block w-40 bg-white border border-[#0b1c30]/5 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
              >
                {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest px-1">Subject</label>
              <div className="relative">
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="block w-56 bg-white border border-[#0b1c30]/5 rounded-xl px-4 py-2.5 pr-10 text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all appearance-none"
                >
                  {subjects.length === 0 && <option value="">No subjects found</option>}
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40 pointer-events-none" />
              </div>
            </div>

            <div className="pt-5 pl-2">
                <button className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Configure Max Scores
                </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* CSV Export Button */}
            <Button
              variant="outline"
              onClick={handleCSVExport}
              className="rounded-2xl px-5 py-6 font-bold border-[#0b1c30]/10"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export CSV
            </Button>

            {/* CSV Import Button */}
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-2xl px-5 py-6 font-bold border-[#0b1c30]/10"
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Import CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button 
              onClick={saveScores} 
              isLoading={saving}
              className="rounded-2xl px-10 py-6 font-bold shadow-xl shadow-indigo-600/20"
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: 'Class Average', val: `${stats.average}%`, color: 'indigo', icon: Trophy, trend: 'Overall performance' },
             { label: 'Pass Rate', val: `${stats.passRate}%`, color: 'emerald', icon: Percent, trend: 'Students above 40%' },
             { label: 'Data Entry', val: `${stats.completion}%`, color: 'amber', icon: GraduationCap, trend: 'Completion status' },
           ].map((stat, i) => (
             <div key={i} className="glass p-6 rounded-[2rem] shadow-elite flex items-center gap-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", 
                   stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                   stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                   "bg-amber-50 text-amber-600"
                )}>
                   <stat.icon className="w-7 h-7" />
                </div>
                <div>
                   <div className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">{stat.label}</div>
                   <div className="text-3xl font-[800] tracking-tight text-[#0b1c30]">{stat.val}</div>
                   <div className="text-[10px] font-bold text-[#464555]/40 mt-1">{stat.trend}</div>
                </div>
             </div>
           ))}
        </section>

        {/* Keyboard Shortcut Hint */}
        <div className="flex items-center gap-2 px-2 text-[10px] font-bold text-[#464555]/40 uppercase tracking-widest">
          <Keyboard className="w-3.5 h-3.5" />
          <span>Use Arrow keys, Enter, or Tab to navigate between cells</span>
        </div>

        {/* Main Table Card */}
        <Card className="rounded-[2.5rem] border-none shadow-elite overflow-hidden">
          <CardHeader className="bg-white/50 border-b border-[#0b1c30]/5 p-8 flex flex-row items-center justify-between">
            <div className="flex items-center gap-6 flex-1">
              <CardTitle className="text-xl font-extrabold text-[#0b1c30]">Score Sheet</CardTitle>
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40" />
                <input 
                  type="text" 
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table ref={gridRef} className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f9ff]/50 border-b border-[#0b1c30]/5">
                    <th className="px-8 py-5 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">Student</th>
                    <th className="px-8 py-5 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest text-center">CA 1 ({maxScores.ca1})</th>
                    <th className="px-8 py-5 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest text-center">CA 2 ({maxScores.ca2})</th>
                    <th className="px-8 py-5 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest text-center">Exam ({maxScores.exam})</th>
                    <th className="px-8 py-5 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0b1c30]/5">
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                       [1, 2, 3, 4, 5].map(i => (
                         <tr key={i} className="animate-pulse">
                           <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-gray-200" />
                               <div className="space-y-2">
                                 <div className="h-4 w-32 bg-gray-200 rounded" />
                                 <div className="h-3 w-20 bg-gray-100 rounded" />
                               </div>
                             </div>
                           </td>
                           <td className="px-8 py-6 text-center"><div className="h-8 w-16 bg-gray-200 rounded-lg mx-auto" /></td>
                           <td className="px-8 py-6 text-center"><div className="h-8 w-16 bg-gray-200 rounded-lg mx-auto" /></td>
                           <td className="px-8 py-6 text-center"><div className="h-8 w-16 bg-gray-200 rounded-lg mx-auto" /></td>
                           <td className="px-8 py-6 text-center"><div className="h-4 w-10 bg-gray-200 rounded mx-auto" /></td>
                         </tr>
                       ))
                    ) : filteredStudents.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="px-8 py-20 text-center">
                            <AlertCircle className="w-8 h-8 text-[#464555]/20 mx-auto mb-4" />
                            <p className="text-sm font-bold text-[#464555]/60 tracking-tight">No students found.</p>
                         </td>
                       </tr>
                    ) : (
                      filteredStudents.map((student, rowIdx) => {
                        const s = scores[student.id] || {};
                        const total = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0);
                        const fields: (keyof ScoreData)[] = ['ca1', 'ca2', 'exam'];
                        
                        return (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={student.id} 
                            className="group hover:bg-[#f8f9ff]/50 transition-colors"
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-100">
                                  <User className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="text-sm font-extrabold text-[#0b1c30] tracking-tight">{student.name}</div>
                                  <div className="text-[10px] font-bold text-[#464555]/50 uppercase tracking-widest">{student.admissionNo}</div>
                                </div>
                              </div>
                            </td>
                            {fields.map((field, colIdx) => {
                              const cellKey = `${student.id}-${field}`;
                              const isOverLimit = overLimitCells.has(cellKey);
                              const fieldMax = maxScores[field];
                              const currentVal = s[field];
                              
                              return (
                                <td key={field} className="px-8 py-6 text-center">
                                  <div className="relative inline-block">
                                    <input 
                                      type="number"
                                      min="0"
                                      max={fieldMax}
                                      value={currentVal ?? ""}
                                      onChange={(e) => handleScoreChange(student.id, field, e.target.value)}
                                      onBlur={() => handleScoreBlur(student.id, field)}
                                      onKeyDown={(e) => handleGridKeyDown(e, rowIdx, colIdx)}
                                      data-row={rowIdx}
                                      data-col={colIdx}
                                      className={cn(
                                        "w-20 text-center bg-white border rounded-xl py-2 font-bold text-[#0b1c30] focus:ring-2 focus:outline-none transition-all",
                                        field === 'exam' && "w-24",
                                        isOverLimit
                                          ? "border-red-400 ring-2 ring-red-200 bg-red-50/50 text-red-700 focus:ring-red-400/30"
                                          : "border-[#0b1c30]/10 focus:ring-indigo-600/10"
                                      )}
                                    />
                                    {isOverLimit && (
                                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse">
                                        <AlertTriangle className="w-3 h-3" />
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="px-8 py-6 text-center">
                                <span className={cn(
                                    "inline-block w-12 py-2 rounded-xl text-sm font-black tracking-tighter",
                                    total >= 40 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                )}>
                                    {total}
                                </span>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==========================================
          CSV Preview Modal
          ========================================== */}
      <AnimatePresence>
        {showCSVPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCSVPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-[#0b1c30]/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#0b1c30]">CSV Import Preview</h2>
                    <p className="text-xs font-bold text-[#464555]/50 mt-0.5">
                      Review imported data before applying
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCSVPreview(false)}
                  className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-[#464555]/60" />
                </button>
              </div>

              {/* Stats Bar */}
              <div className="px-8 py-4 bg-[#f8f9ff]/50 border-b border-[#0b1c30]/5 flex items-center gap-6">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-[#464555]/60">{csvStats.total} rows</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[#464555]/60">{csvStats.matched} matched</span>
                </div>
                {csvStats.warnings > 0 && (
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-amber-600">{csvStats.warnings} with warnings</span>
                  </div>
                )}
              </div>

              {/* Preview Table */}
              <div className="flex-1 overflow-auto p-4">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#0b1c30]/5">
                      <th className="px-4 py-3 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">Status</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">Adm No</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">Name</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest text-center">CA 1</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest text-center">CA 2</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest text-center">Exam</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">Warnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0b1c30]/5">
                    {csvPreviewData.map((row, idx) => (
                      <tr key={idx} className={cn(
                        "transition-colors",
                        !row.matched && "bg-red-50/30",
                        row.warnings.length > 0 && row.matched && "bg-amber-50/30"
                      )}>
                        <td className="px-4 py-3">
                          {row.matched ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                              <X className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-[#0b1c30]">{row.admissionNo}</td>
                        <td className="px-4 py-3 font-medium text-[#464555]">{row.studentName}</td>
                        <td className="px-4 py-3 text-center font-bold">{row.ca1 ?? "—"}</td>
                        <td className="px-4 py-3 text-center font-bold">{row.ca2 ?? "—"}</td>
                        <td className="px-4 py-3 text-center font-bold">{row.exam ?? "—"}</td>
                        <td className="px-4 py-3">
                          {row.warnings.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {row.warnings.map((w, wi) => (
                                <span key={wi} className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                  {w}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-[#0b1c30]/5 flex items-center justify-between bg-white">
                <p className="text-xs font-bold text-[#464555]/40">
                  Only matched students will be updated. Over-limit scores will be auto-clamped.
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCSVPreview(false)}
                    className="rounded-xl px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={applyCSVImport}
                    isLoading={importing}
                    disabled={csvStats.matched === 0}
                    className="rounded-xl px-8 shadow-lg shadow-indigo-600/20"
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    Apply {csvStats.matched} Records
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
