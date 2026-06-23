"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Loader2,
  TrendingUp,
  Award,
  AlertTriangle,
  FileDown,
  BookOpen,
  ArrowUpDown,
  UserCheck,
  Info,
  Share2
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';

import useSWR from 'swr';
import { toast } from 'sonner';

import { EliteModernTemplate } from '@/src/components/reports/EliteModernTemplate';
import { ClassicProfessionalTemplate } from '@/src/components/reports/ClassicProfessionalTemplate';
import { NurseryColorfulTemplate } from '@/src/components/reports/NurseryColorfulTemplate';
import { AlQalamClassicTemplate } from '@/src/components/reports/AlQalamClassicTemplate';
import { CherithClassicTemplate } from '@/src/components/reports/CherithClassicTemplate';
import { PrimarySchoolTemplate } from '@/src/components/reports/PrimarySchoolTemplate';
import ShareReportModal from '@/src/components/modals/ShareReportModal';

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<any>);

export default function AdminReports() {
  const [selectedTerm, setSelectedTerm] = useState("First Term 2025/2026");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [viewingClass, setViewingClass] = useState<string | null>(null);
  const [generatingClass, setGeneratingClass] = useState<string | null>(null);

  // Interactive sorting & filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [performanceFilter, setPerformanceFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<string>("rank");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Bulk Print and Single Print states
  const [bulkPrintMode, setBulkPrintMode] = useState<boolean>(false);
  const [singlePrintStudentId, setSinglePrintStudentId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Template select on-the-fly state
  const [selectedTemplate, setSelectedTemplate] = useState<string>("ELITE");

  // SWR data fetching
  const { data: schoolData, isLoading: schoolLoading } = useSWR('/api/school', fetcher);
  const { data: studentsData, isLoading: studentsLoading } = useSWR('/api/students', fetcher);
  const { data: scoresData, isLoading: scoresLoading, mutate: mutateScores } = useSWR(`/api/scores?session=${selectedSession}&term=${selectedTerm}`, fetcher);

  const isLoading = schoolLoading || studentsLoading || scoresLoading;

  const school = schoolData?.school || null;
  const students = studentsData?.students || [];
  const scores = scoresData?.scores || {};
  const reportExtras = scoresData?.reportExtras || {};

  // Set default session when school data loads
  useEffect(() => {
    if (school?.session) {
      setSelectedSession(school.session);
    }
  }, [school?.session]);

  // Auto-set the school's configured template once settings load
  useEffect(() => {
    if (viewingClass && (viewingClass.toLowerCase().includes('nursery') || viewingClass.toLowerCase().includes('pre'))) {
      setSelectedTemplate('NURSERY');
    } else if (school?.reportTemplate) {
      setSelectedTemplate(school.reportTemplate);
    }
  }, [school?.reportTemplate, viewingClass]);

  // Parse grades, subjects, classTemplates safely
  const grades = useMemo(() => {
    if (!school?.grades) return [];
    try {
      const parsed = typeof school.grades === 'string' ? JSON.parse(school.grades) : school.grades;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [school?.grades]);

  const subjects = useMemo(() => {
    if (!school?.subjects) return [];
    try {
      const parsed = typeof school.subjects === 'string' ? JSON.parse(school.subjects) : school.subjects;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [school?.subjects]);

  const classTemplates = useMemo(() => {
    if (!school?.classTemplates) return [];
    try {
      const parsed = typeof school.classTemplates === 'string' ? JSON.parse(school.classTemplates) : school.classTemplates;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [school?.classTemplates]);

  const classArms = useMemo(() => {
    if (!school?.classArms) return [];
    try {
      const parsed = typeof school.classArms === 'string' ? JSON.parse(school.classArms) : school.classArms;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [school?.classArms]);

  const combinedClasses = useMemo(() => {
    if (!classArms || classArms.length === 0) return classTemplates;
    const combined: string[] = [];
    classTemplates.forEach((t: string) => {
      classArms.forEach((a: string) => {
        combined.push(`${t} ${a}`.trim());
      });
    });
    // Add any standalone templates that might not have arms just in case, but usually we just want combinations
    // For now, let's just return combinations. If they want standalone, they should add an empty arm ''
    return combined.length > 0 ? combined : classTemplates;
  }, [classTemplates, classArms]);

  // Construct reports overview data dynamically
  const reports = useMemo(() => {
    return combinedClasses.map((cls: string) => {
      const classStudents = students.filter((s: any) => s.className === cls);
      const total = classStudents.length;
      const generated = classStudents.filter((s: any) => {
        const studentScores = scores[s.id];
        return studentScores && Object.keys(studentScores).length > 0;
      }).length;

      return {
        id: cls,
        class: cls,
        total,
        generated,
        status: total === 0 ? 'NOT_STARTED' : generated === total ? 'COMPLETED' : 'IN_PROGRESS',
        date: new Date().toLocaleDateString(),
      };
    });
  }, [combinedClasses, students, scores]);

  // Calculate student ranks and positions for selected class broadsheet
  const rawBroadsheetData = useMemo(() => {
    if (!viewingClass) return [];
    
    const classStudents = students.filter((s: any) => s.className === viewingClass);

    const rows = classStudents.map((student: any) => {
      const studentScores = scores[student.id] || {};
      let totalScore = 0;
      let subjectCount = 0;
      const subjectTotals: Record<string, number> = {};

      subjects.forEach((subject: string) => {
        const subData = studentScores[subject];
        if (subData) {
          const total = (Number(subData.ca1) || 0) + (Number(subData.ca2) || 0) + (Number(subData.exam) || 0);
          subjectTotals[subject] = total;
          totalScore += total;
          subjectCount++;
        }
      });

      const average = subjectCount > 0 ? Number((totalScore / subjectCount).toFixed(1)) : 0;

      let overallGrade = 'F';
      const matchingGrade = grades.find((g: any) => average >= g.min && average <= g.max);
      if (matchingGrade) {
        overallGrade = matchingGrade.grade;
      }

      return {
        studentId: student.id,
        name: student.name,
        admissionNo: student.admissionNo,
        gender: student.gender || 'M',
        subjectTotals,
        totalScore,
        average,
        grade: overallGrade,
      };
    });

    const sorted = [...rows].sort((a, b) => b.average - a.average);
    
    return rows.map((row) => {
      const rank = sorted.findIndex((s) => s.average === row.average) + 1;
      return { ...row, rank };
    });
  }, [viewingClass, students, scores, subjects, grades]);

  // Filter and sort broadsheet data interactively
  const filteredAndSortedBroadsheet = useMemo(() => {
    let result = [...rawBroadsheetData];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(q) || r.admissionNo.toLowerCase().includes(q));
    }

    if (genderFilter !== "ALL") {
      result = result.filter(r => r.gender === genderFilter);
    }

    if (performanceFilter !== "ALL") {
      if (performanceFilter === "EXCELLENT") {
        result = result.filter(r => r.average >= 75);
      } else if (performanceFilter === "AT_RISK") {
        result = result.filter(r => r.average < 50);
      }
    }

    result.sort((a: any, b: any) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (subjects.includes(sortBy)) {
        valA = a.subjectTotals[sortBy] || 0;
        valB = b.subjectTotals[sortBy] || 0;
      }

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortAsc ? valA - valB : valB - valA;
      }
    });

    return result;
  }, [rawBroadsheetData, searchQuery, genderFilter, performanceFilter, sortBy, sortAsc, subjects]);

  // Subject Averages calculations
  const subjectAverages = useMemo(() => {
    const averages: Record<string, { average: number; count: number }> = {};
    subjects.forEach((subject: string) => {
      let sum = 0;
      let count = 0;
      filteredAndSortedBroadsheet.forEach((row) => {
        const score = row.subjectTotals[subject];
        if (score !== undefined) {
          sum += score;
          count++;
        }
      });
      averages[subject] = {
        average: count > 0 ? Number((sum / count).toFixed(1)) : 0,
        count
      };
    });
    return averages;
  }, [subjects, filteredAndSortedBroadsheet]);

  // Grade Distribution calculations
  const gradeDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    grades.forEach((g: any) => { distribution[g.grade] = 0; });

    let totalGradesCount = 0;
    filteredAndSortedBroadsheet.forEach((row) => {
      Object.values(row.subjectTotals).forEach((score) => {
        const matchingGrade = grades.find((g: any) => score >= g.min && score <= g.max);
        if (matchingGrade) {
          distribution[matchingGrade.grade] = (distribution[matchingGrade.grade] || 0) + 1;
          totalGradesCount++;
        }
      });
    });

    return { distribution, total: totalGradesCount };
  }, [grades, filteredAndSortedBroadsheet]);

  // At-Risk metrics summary
  const atRiskCount = useMemo(() => {
    return rawBroadsheetData.filter(r => r.average < 50).length;
  }, [rawBroadsheetData]);

  const handleGenerate = async (cls: string) => {
    setGeneratingClass(cls);
    try {
      await new Promise((res) => setTimeout(res, 1200));
      await mutateScores();
      toast.success(`Report cards for ${cls} synchronized successfully`);
    } catch {
      toast.error(`Failed to synchronize reports for ${cls}`);
    } finally {
      setGeneratingClass(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  const handleExportCSV = () => {
    if (!viewingClass || filteredAndSortedBroadsheet.length === 0) return;

    const headers = ["Rank", "Student Name", "Admission No", "Gender", ...subjects, "Total Score", "Average", "Grade"];
    
    const rows = filteredAndSortedBroadsheet.map((row) => [
      row.rank,
      `"${row.name.replace(/"/g, '""')}"`,
      row.admissionNo,
      row.gender,
      ...subjects.map(sub => row.subjectTotals[sub] !== undefined ? row.subjectTotals[sub] : ""),
      row.totalScore,
      row.average,
      row.grade
    ]);

    const footer = [
      "Subject Averages", "", "", "",
      ...subjects.map(sub => subjectAverages[sub]?.average || 0),
      "", "", ""
    ];

    const csvContent = [headers.join(","), ...rows.map(r => r.join(",")), footer.join(",")].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Broadsheet_${viewingClass.replace(/\s+/g, '_')}_${selectedTerm.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully");
  };

  const formatReportData = (studentId: string, row: any) => {
    if (!school) return null;
    const studentObj = students.find((s: any) => s.id === studentId);
    const studentScores = scores[studentId] || {};
    const formattedScores: Record<string, any> = {};

    subjects.forEach((sub: string) => {
      const score = studentScores[sub];
      if (score) {
        const total = (Number(score.ca1) || 0) + (Number(score.ca2) || 0) + (Number(score.exam) || 0);
        const matchedG = grades.find((g: any) => total >= g.min && total <= g.max);
        formattedScores[sub] = {
          ca1: score.ca1,
          ca2: score.ca2,
          exam: score.exam,
          total,
          grade: matchedG?.grade || 'F',
          remark: matchedG?.remark || 'Fail'
        };
      }
    });

    // Evaluate Promotion Logic
    let promotionStatus = reportExtras[studentId]?.promotion || '';
    if (school.promotionLogic?.enabled && (school.term?.toLowerCase().includes('3rd') || school.term?.toLowerCase().includes('third'))) {
      const minAvg = school.promotionLogic.minAverage || 40;
      const coreSubs = school.promotionLogic.coreSubjects || [];
      const overallAvg = Number(row.average) || 0;
      
      let corePassed = true;
      if (coreSubs.length > 0) {
        coreSubs.forEach((cs: string) => {
          // Attempt case-insensitive match for core subjects
          const subjectKey = Object.keys(formattedScores).find(k => k.toLowerCase() === cs.toLowerCase());
          const csData = subjectKey ? formattedScores[subjectKey] : null;
          if (!csData || csData.total < minAvg) {
            corePassed = false;
          }
        });
      }
      
      if (overallAvg >= minAvg && corePassed) {
        promotionStatus = "PROMOTED";
      } else if (overallAvg >= minAvg && !corePassed) {
        promotionStatus = "PROMOTED ON TRIAL";
      } else {
        promotionStatus = "NOT PROMOTED";
      }
    }

    return {
      school: {
        name: school.name,
        logoUrl: school.logoUrl || undefined,
        address: school.address || undefined,
        motto: school.motto || undefined,
        principal: school.principal || undefined,
        session: school.session || '2025/2026',
        term: school.term || 'First Term'
      },
      student: {
        name: row.name,
        admissionNo: row.admissionNo,
        className: viewingClass || '',
        gender: row.gender,
        photoUrl: studentObj?.photoUrl || undefined,
        dob: studentObj?.dob || undefined,
        club: (() => {
          try {
            const parsed = typeof studentObj?.profileExtra === 'string' ? JSON.parse(studentObj.profileExtra) : (studentObj?.profileExtra || {});
            return parsed.club || undefined;
          } catch {
            return undefined;
          }
        })(),
        position: (() => {
          const s = ["th", "st", "nd", "rd"];
          const v = row.rank % 100;
          return row.rank + (s[(v - 20) % 10] || s[v] || s[0]);
        })(),
        classSize: rawBroadsheetData.length
      },
      extras: reportExtras[studentId] ? {
        attendance: reportExtras[studentId].attendance,
        traits: reportExtras[studentId].traits || {},
        comments: reportExtras[studentId].comments || {},
        promotion: promotionStatus
      } : { promotion: promotionStatus },
      scores: formattedScores,
      grades: grades.map((g: any) => ({
        grade: g.grade,
        min: g.min,
        max: g.max,
        remark: g.remark
      }))
    };
  };

  const bulkReportsData = useMemo(() => {
    if (!viewingClass || !school) return [];
    return filteredAndSortedBroadsheet.map((row) => formatReportData(row.studentId, row)).filter(Boolean);
  }, [viewingClass, school, filteredAndSortedBroadsheet, students, scores, subjects, grades]);

  const singleReportData = useMemo(() => {
    if (!singlePrintStudentId || !viewingClass || !school) return null;
    const row = rawBroadsheetData.find(r => r.studentId === singlePrintStudentId);
    if (!row) return null;
    return formatReportData(singlePrintStudentId, row);
  }, [singlePrintStudentId, viewingClass, school, rawBroadsheetData, students, scores, subjects, grades]);

  const renderTemplate = (data: any) => {
    switch (selectedTemplate) {
      case 'CLASSIC':
        return <ClassicProfessionalTemplate data={data} />;
      case 'ALQALAM':
        return <AlQalamClassicTemplate data={data} />;
      case 'CHERITH':
        return <CherithClassicTemplate data={data} />;
      case 'NURSERY':
        return <NurseryColorfulTemplate data={data} />;
      case 'PRIMARY':
        return <PrimarySchoolTemplate data={data} />;
      default:
        return <EliteModernTemplate data={data} />;
    }
  };

  // RENDER SINGLE PRINT PAGE
  if (singlePrintStudentId && singleReportData) {
    return (
      <div className="min-h-screen bg-slate-100 p-0 m-0">
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .single-print-page { padding: 0 !important; margin: 0 !important; background: white !important; }
          }
        `}</style>
        <div className="sticky top-0 bg-white border-b border-[#0b1c30]/10 p-4 flex items-center justify-between shadow-md no-print z-50">
          <button 
            onClick={() => setSinglePrintStudentId(null)}
            className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Broadsheet
          </button>
          <div className="flex items-center gap-4">
            {/* Dynamic Template Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600">
              <span className="text-slate-400">Design Layout:</span>
              <select 
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 p-0 cursor-pointer outline-none font-bold text-indigo-600"
              >
                <option value="ELITE">Elite Modern</option>
                <option value="CLASSIC">Classic Professional</option>
                <option value="ALQALAM">Heritage Classic</option>
                <option value="CHERITH">Legacy Standard</option>
                <option value="NURSERY">Nursery Colorful</option>
                <option value="PRIMARY">Primary School</option>
              </select>
            </div>
            <button 
              onClick={() => setShareModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-extrabold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button 
              onClick={handlePrint}
              className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-extrabold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Save as PDF / Print
            </button>
          </div>
        </div>
        <div className="p-8 flex justify-center bg-slate-100 print:bg-white single-print-page">
          <div className="bg-white shadow-lg print:shadow-none rounded-3xl overflow-hidden p-4">
            {renderTemplate(singleReportData)}
          </div>
        </div>
        <ShareReportModal 
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          studentName={singleReportData.student.name}
        />
      </div>
    );
  }

  // RENDER BULK PRINT PAGE
  if (bulkPrintMode && viewingClass) {
    return (
      <div className="min-h-screen bg-slate-100 p-0 m-0">
        <style>{`
          @media print {
            .no-print {
              display: none !important;
            }
            .bulk-print-page {
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }
            .page-break {
              page-break-after: always;
              break-after: page;
            }
          }
        `}</style>
        
        <div className="sticky top-0 bg-white border-b border-[#0b1c30]/10 p-4 flex items-center justify-between shadow-md no-print z-50">
          <button 
            onClick={() => setBulkPrintMode(false)}
            className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Broadsheet
          </button>
          <div className="flex items-center gap-4">
            {/* Dynamic Template Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600">
              <span className="text-slate-400">Design Layout:</span>
              <select 
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 p-0 cursor-pointer outline-none font-bold text-indigo-600"
              >
                <option value="ELITE">Elite Modern</option>
                <option value="CLASSIC">Classic Professional</option>
                <option value="ALQALAM">Heritage Classic</option>
                <option value="CHERITH">Legacy Standard</option>
                <option value="NURSERY">Nursery Colorful</option>
                <option value="PRIMARY">Primary School</option>
              </select>
            </div>
            <span className="text-sm font-bold text-[#0b1c30]">Total Cards: {bulkReportsData.length}</span>
            <button 
              onClick={handlePrint}
              className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-extrabold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print / Save all to PDF
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8 flex flex-col items-center bulk-print-page">
          {bulkReportsData.map((data, idx) => (
            <div key={idx} className="page-break bg-white shadow-lg print:shadow-none rounded-3xl overflow-hidden p-4">
              {renderTemplate(data)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout role="SCHOOL" title="Academic Reports">
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          .glass {
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="p-8 space-y-8 max-w-7xl mx-auto print-area">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#0b1c30]/5 pb-6 no-print">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">Academic Reports</h1>
            <p className="text-sm font-medium text-[#464555]/70 mt-1">Manage, analyze, and print school broadsheets and student report cards.</p>
          </div>
        </div>

        {/* Dynamic Tooltip / Notification Bar */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3 no-print">
          <Info className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs font-semibold text-indigo-900">
            <span className="font-extrabold">Report Card Preview & Generation:</span> Select a class to view its academic broadsheet, toggle designs on-the-fly, and print individually or in bulk. 
            <p className="mt-1 text-indigo-700/80">💡 Tip: You can configure your school's default template design and logo branding permanently under the <a href="/admin/settings/" className="underline font-bold hover:text-indigo-950">Settings Page</a>.</p>
          </div>
        </div>

        {viewingClass ? (
          /* SINGLE CLASS BROADSHEET VIEW */
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 no-print">
              <button 
                onClick={() => setViewingClass(null)}
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Class List
              </button>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* On-the-fly Layout Dropdown Selector */}
                <div className="flex items-center gap-1.5 bg-white border border-[#0b1c30]/5 px-3 py-2 rounded-xl text-xs font-bold text-[#464555] shadow-sm">
                  <span className="text-[#464555]/50">Layout:</span>
                  <select 
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 p-0 cursor-pointer outline-none font-bold text-indigo-600"
                  >
                    <option value="ELITE">Elite Modern</option>
                    <option value="CLASSIC">Classic Professional</option>
                    <option value="ALQALAM">Heritage Classic</option>
                    <option value="CHERITH">Legacy Standard</option>
                    <option value="NURSERY">Nursery Colorful</option>
                    <option value="PRIMARY">Primary School</option>
                  </select>
                </div>
                
                <button 
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <FileDown className="w-4 h-4" /> Export CSV
                </button>
                <button 
                  onClick={() => setBulkPrintMode(true)}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Bulk Print Cards
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Print Broadsheet
                </button>
              </div>
            </div>

            {/* CLASS INFORMATION CARD */}
            <div className="glass p-8 rounded-[2rem] shadow-elite bg-gradient-to-r from-indigo-50/50 to-emerald-50/30 border border-indigo-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-black text-[#0b1c30]">{viewingClass} Academic Broadsheet</h2>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-[#464555]/60">Session:</span>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 p-0 cursor-pointer outline-none font-bold text-indigo-600"
                  >
                    <option value={school?.session || ''}>{school?.session || 'Current Session'}</option>
                    <option value="All Sessions">All Sessions</option>
                  </select>
                </div>
                <p className="text-sm font-semibold text-[#464555]/60 mt-1">{selectedTerm} | Total Students: {rawBroadsheetData.length}</p>
              </div>
              
              {/* AT-RISK ALERTS SUMMARY */}
              <div className="flex items-center gap-4 bg-white/70 backdrop-blur border border-indigo-50 p-4 rounded-2xl no-print">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  atRiskCount > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  {atRiskCount > 0 ? <AlertTriangle className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-[#464555]/50 tracking-wider">At Risk Students</h4>
                  <p className="text-lg font-black text-[#0b1c30]">{atRiskCount} <span className="text-xs font-bold text-[#464555]/60">Avg &lt; 50%</span></p>
                </div>
              </div>
            </div>

            {/* INTERACTIVE SEARCH & FILTERS BAR */}
            <div className="glass p-6 rounded-[2rem] shadow-elite bg-white grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students..."
                  className="pl-10 pr-4 py-2.5 w-full bg-[#f8f9ff] border border-indigo-50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:bg-white transition-all"
                />
              </div>

              <div>
                <select 
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="px-4 py-2.5 w-full bg-[#f8f9ff] border border-indigo-50 rounded-xl text-xs font-bold text-[#464555] outline-none"
                >
                  <option value="ALL">All Genders</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>

              <div>
                <select 
                  value={performanceFilter}
                  onChange={(e) => setPerformanceFilter(e.target.value)}
                  className="px-4 py-2.5 w-full bg-[#f8f9ff] border border-indigo-50 rounded-xl text-xs font-bold text-[#464555] outline-none"
                >
                  <option value="ALL">All Performers</option>
                  <option value="EXCELLENT">Excellent (Avg &gt;= 75%)</option>
                  <option value="AT_RISK">At Risk (Avg &lt; 50%)</option>
                </select>
              </div>

              <div className="flex items-center justify-end">
                <span className="text-xs font-bold text-[#464555]/50">Showing {filteredAndSortedBroadsheet.length} of {rawBroadsheetData.length} records</span>
              </div>
            </div>

            {/* ANALYTICS INSIGHTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
              {/* GRADE DISTRIBUTION CHART */}
              <div className="glass p-6 rounded-[2rem] shadow-elite bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-[#0b1c30]">Grade Distribution</h3>
                </div>
                {filteredAndSortedBroadsheet.length === 0 ? (
                  <p className="text-sm font-medium text-[#464555]/60">No scores recorded yet to display grade analytics.</p>
                ) : (
                  <div className="space-y-3">
                    {grades.map((g: any) => {
                      const count = gradeDistribution.distribution[g.grade] || 0;
                      const percentage = gradeDistribution.total > 0 ? Math.round((count / gradeDistribution.total) * 100) : 0;
                      return (
                        <div key={g.grade} className="flex items-center gap-4 text-xs font-bold text-[#464555]">
                          <span className="w-6 text-center">{g.grade}</span>
                          <div className="flex-1 h-3 bg-indigo-50 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                            />
                          </div>
                          <span className="w-12 text-right">{count} ({percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SUBJECT PERFORMANCE INSIGHTS */}
              <div className="glass p-6 rounded-[2rem] shadow-elite bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-[#0b1c30]">Subject Averages</h3>
                </div>
                {subjects.length === 0 ? (
                  <p className="text-sm font-medium text-[#464555]/60">No subjects registered.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {subjects.map((sub: string) => {
                      const info = subjectAverages[sub] || { average: 0, count: 0 };
                      return (
                        <div key={sub} className="p-3 bg-[#f8f9ff] rounded-2xl border border-indigo-50 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-[#464555] truncate max-w-[120px]">{sub}</p>
                            <p className="text-[10px] text-[#464555]/50 font-bold">{info.count} Subscriptions</p>
                          </div>
                          <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-xl">
                            {info.average}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* BROADSHEET TABLE */}
            <div className="glass rounded-[2rem] shadow-elite overflow-hidden border border-[#0b1c30]/5 bg-white">
              {filteredAndSortedBroadsheet.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-[#0b1c30]">No records found</h3>
                  <p className="text-sm font-medium text-[#464555]/60 mt-1">Adjust your filter parameters and query search strings.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f8f9ff] border-b border-[#0b1c30]/5 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">
                        <th className="px-6 py-4 font-extrabold cursor-pointer select-none" onClick={() => handleSort('rank')}>
                          Rank {sortBy === 'rank' && <ArrowUpDown className="inline w-3 h-3 ml-1" />}
                        </th>
                        <th className="px-6 py-4 font-extrabold cursor-pointer select-none" onClick={() => handleSort('name')}>
                          Student Name {sortBy === 'name' && <ArrowUpDown className="inline w-3 h-3 ml-1" />}
                        </th>
                        <th className="px-6 py-4 font-extrabold cursor-pointer select-none" onClick={() => handleSort('admissionNo')}>
                          Admission No {sortBy === 'admissionNo' && <ArrowUpDown className="inline w-3 h-3 ml-1" />}
                        </th>
                        <th className="px-6 py-4 font-extrabold cursor-pointer select-none" onClick={() => handleSort('gender')}>
                          Gender {sortBy === 'gender' && <ArrowUpDown className="inline w-3 h-3 ml-1" />}
                        </th>
                        {subjects.map((sub: string) => (
                          <th key={sub} className="px-4 py-4 text-center font-extrabold cursor-pointer select-none" onClick={() => handleSort(sub)}>
                            {sub} {sortBy === sub && <ArrowUpDown className="inline w-3 h-3 ml-1" />}
                          </th>
                        ))}
                        <th className="px-6 py-4 text-right font-extrabold cursor-pointer select-none" onClick={() => handleSort('totalScore')}>
                          Total {sortBy === 'totalScore' && <ArrowUpDown className="inline w-3 h-3 ml-1" />}
                        </th>
                        <th className="px-6 py-4 text-right font-extrabold cursor-pointer select-none" onClick={() => handleSort('average')}>
                          Average {sortBy === 'average' && <ArrowUpDown className="inline w-3 h-3 ml-1" />}
                        </th>
                        <th className="px-6 py-4 text-center font-extrabold cursor-pointer select-none" onClick={() => handleSort('grade')}>
                          Grade {sortBy === 'grade' && <ArrowUpDown className="inline w-3 h-3 ml-1" />}
                        </th>
                        <th className="px-6 py-4 text-center font-extrabold no-print">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0b1c30]/5 font-semibold text-[#464555]">
                      {filteredAndSortedBroadsheet.map((row) => (
                        <tr 
                          key={row.studentId} 
                          className={cn(
                            "hover:bg-indigo-50/20 transition-colors",
                            row.average < 50 ? "border-l-4 border-rose-500 bg-rose-50/10" : ""
                          )}
                        >
                          <td className="px-6 py-4">
                            <span className={cn(
                              "inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black",
                              row.rank === 1 ? "bg-amber-100 text-amber-700" :
                              row.rank === 2 ? "bg-slate-100 text-slate-700" :
                              row.rank === 3 ? "bg-orange-100 text-orange-700" :
                              "bg-gray-100 text-gray-500"
                            )}>
                              {row.rank}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-[#0b1c30] flex items-center gap-2">
                            {row.name}
                            {row.average < 50 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-100 text-rose-600 gap-1 no-print">
                                <AlertTriangle className="w-2.5 h-2.5" /> At Risk
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium">{row.admissionNo}</td>
                          <td className="px-6 py-4 font-bold">{row.gender}</td>
                          {subjects.map((sub: string) => {
                            const val = row.subjectTotals[sub];
                            return (
                              <td key={sub} className="px-4 py-4 text-center font-bold">
                                {val !== undefined ? val : '-'}
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 text-right font-bold text-indigo-600">{row.totalScore}</td>
                          <td className="px-6 py-4 text-right font-black text-emerald-600">{row.average}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase",
                              row.grade === 'A' ? "bg-emerald-50 text-emerald-600" :
                              row.grade === 'B' || row.grade === 'C' ? "bg-indigo-50 text-indigo-600" :
                              row.grade === 'D' || row.grade === 'E' ? "bg-amber-50 text-amber-600" :
                              "bg-rose-50 text-rose-600"
                            )}>
                              {row.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center no-print">
                            <button 
                              onClick={() => setSinglePrintStudentId(row.studentId)}
                              className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 text-[10px] font-extrabold rounded-lg transition-colors flex items-center gap-1 mx-auto shadow-sm"
                            >
                              <Printer className="w-3 h-3" /> Print Card
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-indigo-50/30 border-t-2 border-indigo-100 font-bold text-indigo-900">
                        <td colSpan={4} className="px-6 py-4 text-left uppercase text-[10px] tracking-wider">Subject Class Averages</td>
                        {subjects.map((sub: string) => {
                          const avg = subjectAverages[sub]?.average || 0;
                          return (
                            <td key={sub} className="px-4 py-4 text-center font-black text-indigo-700">
                              {avg > 0 ? avg : '-'}
                            </td>
                          );
                        })}
                        <td colSpan={4} className="px-6 py-4"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* REGULAR CLASSES LIST */
          <div className="space-y-6">
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-3xl shadow-elite bg-white no-print">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                    <FileSpreadsheet className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-lg font-extrabold text-[#0b1c30]">Term Selection</h3>
                    <select 
                      className="text-sm font-medium text-[#464555] bg-transparent border-none focus:ring-0 p-0 cursor-pointer outline-none font-bold"
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                    >
                      <option>First Term 2025/2026</option>
                      <option>Second Term 2025/2026</option>
                      <option>Third Term 2025/2026</option>
                    </select>
                 </div>
              </div>
            </section>

            <section className="glass rounded-[2.5rem] shadow-elite overflow-hidden bg-white">
              <div className="p-8 border-b border-[#0b1c30]/5 flex items-center justify-between no-print">
                 <div>
                    <h3 className="text-xl font-extrabold text-[#0b1c30] tracking-tight">Class Report Generation</h3>
                    <p className="text-sm font-medium text-[#464555]/70 mt-1">Track broadsheet and report card generation status across the school.</p>
                 </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-extrabold text-[#464555]/40 uppercase tracking-widest border-b border-[#0b1c30]/5 bg-[#f8f9ff]/50">
                      <th className="px-8 py-6">Class Name</th>
                      <th className="px-8 py-6">Progress</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6">Last Updated</th>
                      <th className="px-8 py-6 text-right no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0b1c30]/5">
                    {isLoading ? (
                      [1,2,3].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-8 py-6"><div className="h-6 w-32 bg-gray-200 rounded-lg" /></td>
                          <td className="px-8 py-6"><div className="h-2 w-full bg-gray-200 rounded-full" /></td>
                          <td className="px-8 py-6"><div className="h-6 w-24 bg-gray-200 rounded-full" /></td>
                          <td className="px-8 py-6"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                          <td className="px-8 py-6 text-right no-print"><div className="h-8 w-24 bg-gray-200 rounded-lg ml-auto" /></td>
                        </tr>
                      ))
                    ) : reports.map((report) => (
                      <tr key={report.id} className="group hover:bg-indigo-50/30 transition-colors">
                        <td className="px-8 py-6 font-bold text-[#0b1c30]">{report.class}</td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-2">
                             <div className="flex items-center justify-between text-xs font-bold text-[#464555]">
                                <span>{report.generated} / {report.total} Reports</span>
                                <span className="text-indigo-600">{report.total > 0 ? Math.round((report.generated / report.total) * 100) : 0}%</span>
                             </div>
                             <div className="w-full h-1.5 bg-indigo-50 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${report.total > 0 ? (report.generated / report.total) * 100 : 0}%` }}
                                  className={cn(
                                    "h-full rounded-full",
                                    report.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-600'
                                  )}
                                />
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold",
                            report.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-600" : 
                            report.status === 'IN_PROGRESS' ? "bg-indigo-100 text-indigo-600" : 
                            "bg-amber-100 text-amber-600"
                          )}>
                            {report.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                            {report.status === 'IN_PROGRESS' && <Clock className="w-3 h-3" />}
                            {report.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-sm font-medium text-[#464555]/70">{report.date}</td>
                        <td className="px-8 py-6 text-right no-print">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setViewingClass(report.class)}
                              className="px-4 py-2 bg-[#f8f9ff] text-[#0b1c30] hover:bg-indigo-50 border border-indigo-100 text-xs font-bold rounded-lg transition-colors shadow-sm"
                            >
                              View Broadsheet
                            </button>
                            <button 
                              onClick={() => { setViewingClass(report.class); setBulkPrintMode(true); }}
                              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print All
                            </button>
                            <button 
                              onClick={() => handleGenerate(report.class)}
                              disabled={generatingClass === report.class || report.status === 'IN_PROGRESS'}
                              className="px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                            >
                              {generatingClass === report.class ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                              {generatingClass === report.class ? 'Syncing...' : 'Sync Reports'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
