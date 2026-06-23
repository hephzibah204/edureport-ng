"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  BookOpen, 
  FileText, 
  Globe, 
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Edit3,
  Download,
  Save,
  Rocket,
  Clock,
  Calendar,
  GraduationCap,
  ListChecks,
  PenLine,
  Shuffle,
  History,
  Eye,
  ChevronRight,
  FileQuestion,
  AlertCircle,
  Upload,
  Plus,
  Printer
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import useSWR from 'swr';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

interface Question {
  question: string;
  type: 'mcq' | 'theory';
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface SavedExam {
  id: string;
  subject: string;
  class_level: string;
  term: string;
  session: string;
  exam_type: string;
  question_type: string;
  source_mode: string;
  duration: string;
  file_url?: string;
  created_at: string;
}

type ActiveTab = 'generate' | 'history' | 'bank';

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<any>);

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  // Use cloudflare cdn for worker script
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += (content.items as any[]).map((item: any) => item.str).join(" ") + "\n";
  }
  return text.trim();
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

export default function ExamMaker() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate');
  const [savedExams, setSavedExams] = useState<SavedExam[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingExamId, setLoadingExamId] = useState<string | null>(null);
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);
  const [sharedExams, setSharedExams] = useState<SavedExam[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [bankTermFilter, setBankTermFilter] = useState("All Terms");
  const [isSharedChecked, setIsSharedChecked] = useState(false);
  const [currentExamOwnerId, setCurrentExamOwnerId] = useState<string | null>(null);
  const [config, setConfig] = useState({
    subject: '',
    curriculum: 'NERDC Scheme',
    topic: '',
    classLevel: 'SS 1',
    questionCount: 10,
    questionType: 'mcq',
    sourceMode: 'curriculum',
    sourceUrl: '',
    documentText: '',
    fileUrl: '',
    term: '2nd Term',
    session: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    examType: 'Terminal Exam',
    duration: '1 Hour'
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examMeta, setExamMeta] = useState<{ term: string; session: string; examType: string; duration: string } | null>(null);

  // Advanced Interactive States
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showingAnswers, setShowingAnswers] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [documentFilename, setDocumentFilename] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SWR fetching for user and school details
  const { data: userData } = useSWR('/api/me', fetcher);
  const school = userData?.school || null;
  const userRole = (userData?.user?.role as 'ADMIN' | 'TEACHER' | 'SCHOOL' | 'PARENT' | 'STUDENT') || 'TEACHER';

  // Auto-fill configuration term and session from school data if available
  useEffect(() => {
    if (school) {
      setConfig(prev => ({
        ...prev,
        term: school.term || prev.term,
        session: school.session || prev.session
      }));
    }
  }, [school]);

  // Fetch exam history
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/ai/exam', { credentials: 'include' });
      const data = await res.json() as any;
      if (data.exams) {
        setSavedExams(data.exams);
      }
    } catch {
      // silently fail — history is not critical
    } finally {
      setLoadingHistory(false);
    }
  }, []);
 
  const fetchBank = useCallback(async () => {
    setLoadingBank(true);
    try {
      const res = await fetch('/api/ai/exam/shared', { credentials: 'include' });
      const data = await res.json() as any;
      if (data.exams) {
        setSharedExams(data.exams);
      }
    } catch {
      // ignore
    } finally {
      setLoadingBank(false);
    }
  }, []);
 
  useEffect(() => {
    fetchHistory();
    fetchBank();
  }, [fetchHistory, fetchBank]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    const name = file.name.toLowerCase();
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File too large (max 5 MB)");
      return;
    }
    if (!name.endsWith(".pdf") && !name.endsWith(".doc") && !name.endsWith(".docx")) {
      setUploadError("Only PDF, DOC, and DOCX files are supported");
      return;
    }
    setUploadError(null);
    setExtracting(true);
    try {
      let text = "";
      if (name.endsWith(".pdf")) {
        text = await extractPdfText(file);
      } else {
        text = await extractDocxText(file);
      }
      if (!text.trim()) throw new Error("No readable text found in this document");
        
        // Background upload file
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include"
        });
        let uploadedUrl = "";
        if (uploadRes.ok) {
          const upData = await uploadRes.json() as any;
          uploadedUrl = upData.url;
        }

        setDocumentFilename(file.name);
        setConfig(prev => ({ ...prev, documentText: text, fileUrl: uploadedUrl }));
        toast.success(`"${file.name}" uploaded and text extracted successfully`);
    } catch (e: any) {
      setUploadError(e.message || "Failed to extract text");
    } finally {
      setExtracting(false);
    }
  };

  const handleGenerate = async () => {
    if (!config.subject || (config.sourceMode === 'url' && !config.sourceUrl) || (config.sourceMode === 'document' && !config.documentText) || (config.sourceMode === 'topic' && !config.topic)) {
      toast.error('Please provide all required inputs for the selected mode');
      return;
    }

    setLoading(true);
    setCurrentExamId(null);
    setIsModified(false);
    setEditingIndex(null);
    try {
      const res = await fetch('/api/ai/exam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...config, isShared: isSharedChecked })
      });
      const data = await res.json() as any;
      if (data.questions) {
        setQuestions(data.questions);
        setExamMeta({
          term: data.term || config.term,
          session: data.session || config.session,
          examType: data.examType || config.examType,
          duration: data.duration || config.duration
        });
        setCurrentExamId(data.id || null);
        toast.success(`Generated ${data.questions.length} questions`);
        fetchHistory();
      } else {
        throw new Error(data.error?.message || 'Generation failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'AI Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExam = async (examId: string) => {
    setLoadingExamId(examId);
    setEditingIndex(null);
    try {
      const res = await fetch(`/api/ai/exam/${examId}`, { credentials: 'include' });
      const data = await res.json() as any;
      if (data.exam) {
        setQuestions(data.exam.questions);
        setExamMeta({
          term: data.exam.term || '',
          session: data.exam.session || '',
          examType: data.exam.exam_type || '',
          duration: data.exam.duration || ''
        });
        setCurrentExamId(examId);
        setCurrentExamOwnerId(data.exam.school_id || null);
        setIsSharedChecked(data.exam.is_shared === 1);
        setConfig(prev => ({
          ...prev,
          subject: data.exam.subject,
          curriculum: data.exam.topic || 'NERDC Scheme',
          topic: data.exam.topic || '',
          classLevel: data.exam.class_level,
          questionType: data.exam.question_type || 'mcq',
          term: data.exam.term || prev.term,
          session: data.exam.session || prev.session,
          examType: data.exam.exam_type || prev.examType,
          duration: data.exam.duration || prev.duration
        }));
        setIsModified(false);
        toast.success(`Loaded exam: ${data.exam.subject}`);
      }
    } catch {
      toast.error('Failed to load exam');
    } finally {
      setLoadingExamId(null);
    }
  };
 
  const handleSaveExam = async () => {
    if (!currentExamId || !questions.length) return;
    setIsSaving(true);
    try {
      const isOwner = !currentExamOwnerId || currentExamOwnerId === school?.id;
      const url = isOwner ? `/api/ai/exam/${currentExamId}` : `/api/ai/exam`;
      const method = isOwner ? "PUT" : "POST";
 
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: config.subject,
          classLevel: config.classLevel,
          curriculum: config.curriculum,
          topic: config.topic,
          questions: questions,
          term: examMeta?.term || config.term,
          session: examMeta?.session || config.session,
          examType: examMeta?.examType || config.examType,
          questionType: config.questionType,
          duration: examMeta?.duration || config.duration,
          isShared: isSharedChecked
        }),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Save failed");
 
      if (!isOwner) {
        const data = await res.json() as any;
        setCurrentExamId(data.id);
        setCurrentExamOwnerId(school?.id);
        toast.success("Exam duplicated and saved to your school");
      } else {
        toast.success("Exam saved successfully");
      }
 
      setIsModified(false);
      fetchHistory();
      fetchBank();
    } catch (e: any) {
      toast.error(e.message || "Failed to save exam");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      const res = await fetch(`/api/ai/exam/${examId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json() as any;
      if (data.success) {
        setSavedExams(prev => prev.filter(e => e.id !== examId));
        if (currentExamId === examId) {
          setQuestions([]);
          setExamMeta(null);
          setCurrentExamId(null);
          setIsModified(false);
        }
        toast.success('Exam deleted');
      } else {
        throw new Error('Delete failed');
      }
    } catch {
      toast.error('Failed to delete exam');
    }
  };

  const updateQuestion = (i: number, updated: Partial<Question>) => {
    const qs = [...questions];
    qs[i] = { ...qs[i], ...updated } as Question;
    setQuestions(qs);
    setIsModified(true);
  };

  const deleteQuestion = (i: number) => {
    setQuestions(prev => prev.filter((_, idx) => idx !== i));
    setIsModified(true);
    if (editingIndex === i) setEditingIndex(null);
  };

  const addQuestion = () => {
    const nq: Question = {
      question: "New Question Text",
      type: config.questionType === "theory" ? "theory" : "mcq",
      options: config.questionType === "theory" ? [] : ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 0,
      explanation: ""
    };
    setQuestions(prev => [...prev, nq]);
    setIsModified(true);
    setEditingIndex(questions.length);
  };

  const shuffleQuestions = () => {
    if (!questions.length) return;
    setQuestions(prev => [...prev].sort(() => Math.random() - 0.5));
    setIsModified(true);
    toast.success("Questions shuffled");
  };

  const shuffleOptions = () => {
    if (!questions.length) return;
    const newQs = questions.map((q) => {
      if (q.type === "theory" || !q.options || !q.options.length) return q;
      const tagged = q.options.map((opt, i) => ({ opt, isCorrect: i === q.correctAnswer })).sort(() => Math.random() - 0.5);
      return {
        ...q,
        options: tagged.map((t) => t.opt),
        correctAnswer: tagged.findIndex((t) => t.isCorrect)
      };
    });
    setQuestions(newQs);
    setIsModified(true);
    toast.success("Options shuffled");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!questions.length) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 15, pageW = 210, usableW = pageW - margin * 2;
    let y = 0;

    const termVal = examMeta?.term || config.term;
    const sessionVal = examMeta?.session || config.session;
    const examTypeVal = examMeta?.examType || config.examType;
    const durationVal = examMeta?.duration || config.duration;
    const schoolName = (school?.name || "SCHOOL NAME").toUpperCase();
    const schoolMotto = school?.motto || "";
    const schoolAddress = school?.address || "";

    // Modern Indigo color header banner to match modern dashboard aesthetics
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 16, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text(`${termVal.toUpperCase()} EXAMINATION`, margin, 8);
    doc.text(`${sessionVal} ACADEMIC SESSION`, pageW - margin, 8, { align: "right" });
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text("EduReport NG - AI Exam Maker", pageW / 2, 13, { align: "center" });
    y = 24;

    // School details
    doc.setTextColor(11, 28, 48);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(schoolName, pageW / 2, y, { align: "center" });
    y += 7;
    if (schoolMotto) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(`"${schoolMotto}"`, pageW / 2, y, { align: "center" });
      y += 5;
    }
    if (schoolAddress) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(schoolAddress, pageW / 2, y, { align: "center" });
      y += 4;
    }
    y += 3;

    // Exam Type Header Banner
    doc.setFillColor(11, 28, 48);
    doc.rect(margin, y, usableW, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`${examTypeVal.toUpperCase()} - ${termVal.toUpperCase()}`, pageW / 2, y + 5.5, { align: "center" });
    y += 10;

    // Parameters block
    doc.setTextColor(11, 28, 48);
    const cw = usableW / 3;
    const mcqN = questions.filter((q) => q.type !== "theory").length;
    const thN = questions.filter((q) => q.type === "theory").length;
    const sectionLabel = config.questionType === "theory" ? "Theory" : config.questionType === "mixed" ? "Obj. & Theory" : "Objectives";
    
    const rows = [
      [["Subject", config.subject], ["Class", config.classLevel], ["Section", sectionLabel]],
      [["Time Allowed", durationVal], ["Total Questions", String(questions.length)], ["Total Score", mcqN > 0 && thN > 0 ? `${mcqN} + ${thN}` : String(questions.length)]]
    ];

    for (const row of rows) {
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, y, usableW, 10);
      row.forEach(([lbl, val], i) => {
        const x = margin + cw * i;
        doc.setFontSize(5.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 120);
        doc.text(lbl.toUpperCase(), x + 2, y + 3.5);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(11, 28, 48);
        doc.text(val, x + 2, y + 8.5);
        if (i < 2) {
          doc.setDrawColor(220, 220, 220);
          doc.line(x + cw, y, x + cw, y + 10);
        }
      });
      y += 10;
    }
    y += 5;

    // Name & class fields
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(11, 28, 48);
    doc.text("Student's Name: ___________________________________", margin, y);
    doc.text("Reg. No: _____________", margin + 118, y);
    y += 7;
    doc.text("Date: ______________________", margin, y);
    doc.text(`Score: __________ / ${questions.length}`, margin + 118, y);
    y += 7;

    // Instructions Box
    doc.setFillColor(248, 249, 255);
    doc.rect(margin, y, usableW, 22, "F");
    doc.setDrawColor(11, 28, 48, 0.1);
    doc.rect(margin, y, usableW, 22);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("INSTRUCTIONS:", margin + 2, y + 4);
    
    const insts: string[] = [];
    if (mcqN > 0) insts.push(`Answer ALL ${mcqN} objective question${mcqN !== 1 ? "s" : ""} by writing the correct option letter.`);
    if (thN > 0) insts.push(`Answer ALL ${thN} theory question${thN !== 1 ? "s" : ""} in full sentences.`);
    insts.push("Write your name and registration number clearly before you begin.");
    insts.push("Mobile phones and electronic devices are NOT allowed in the examination hall.");
    
    doc.setFont("helvetica", "normal");
    insts.forEach((inst, i) => {
      doc.text(`${i + 1}. ${inst}`, margin + 2, y + 8 + i * 3.8);
    });
    y += 26;

    doc.setDrawColor(11, 28, 48);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + usableW, y);
    y += 7;

    const letters = ["A", "B", "C", "D"];
    const mcqQs = questions.filter((q) => q.type !== "theory");
    const thQs = questions.filter((q) => q.type === "theory");

    // Objectives list
    if (mcqQs.length > 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("SECTION A - OBJECTIVES", margin, y);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text(`(Choose the correct answer - ${mcqQs.length} marks)`, margin, y + 5);
      y += 12;

      mcqQs.forEach((q, i) => {
        if (y > 258) {
          doc.addPage();
          y = 15;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        const qL = doc.splitTextToSize(`${i + 1}. ${q.question}`, usableW);
        doc.text(qL, margin, y);
        y += qL.length * 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const ow = usableW / 2;
        q.options.forEach((opt, oi) => {
          const ci = oi % 2, ri = Math.floor(oi / 2), x2 = margin + ci * ow;
          const ol = doc.splitTextToSize(`${letters[oi]}. ${opt}`, ow - 4);
          if (showingAnswers && oi === q.correctAnswer) {
            doc.setTextColor(16, 185, 129); // green for answers
            doc.setFont("helvetica", "bold");
          }
          doc.text(ol, x2 + 2, y + ri * 5 + 5);
          doc.setTextColor(11, 28, 48);
          doc.setFont("helvetica", "normal");
        });
        y += Math.ceil(q.options.length / 2) * 5 + 5;
      });
    }

    // Theory list
    if (thQs.length > 0) {
      if (y > 240) {
        doc.addPage();
        y = 15;
      }
      y += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("SECTION B - THEORY", margin, y);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text(`(Answer ALL questions - ${thQs.length} marks)`, margin, y + 5);
      y += 13;

      thQs.forEach((q, i) => {
        if (y > 250) {
          doc.addPage();
          y = 15;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        const qL = doc.splitTextToSize(`${mcqQs.length + i + 1}. ${q.question}`, usableW);
        doc.text(qL, margin, y);
        y += qL.length * 5 + 4;

        for (let ln = 0; ln < 5; ln++) {
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, y + ln * 7, margin + usableW, y + ln * 7);
        }
        y += 38;
      });
    }

    // Export Answer Key on Separate Page if active
    if (showingAnswers && mcqQs.length > 0) {
      doc.addPage();
      y = 15;
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 12, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("ANSWER KEY - TEACHER USE ONLY", pageW / 2, 8, { align: "center" });
      y = 20;

      doc.setTextColor(11, 28, 48);
      doc.setFontSize(8);
      doc.text(`${config.subject} | ${config.classLevel} | ${termVal} ${sessionVal}`, margin, y);
      y += 10;

      const kw = usableW / 5;
      mcqQs.forEach((q, i) => {
        const c3 = i % 5, r3 = Math.floor(i / 5), x3 = margin + c3 * kw, y3 = y + r3 * 12;
        if (y3 > 270) return;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(11, 28, 48);
        doc.text(`${i + 1}.`, x3, y3);
        doc.setFillColor(16, 185, 129);
        doc.circle(x3 + 9, y3 - 2, 4, "F");
        doc.setTextColor(255, 255, 255);
        doc.text(letters[q.correctAnswer] || "?", x3 + 9, y3, { align: "center" });
        doc.setTextColor(11, 28, 48);
      });
    }

    doc.save(`${config.subject}_${config.classLevel}_${termVal}_Exam.pdf`);
    toast.success("PDF exported successfully");
  };

  const handleExportDOCX = async () => {
    if (!questions.length) return;
    
    const termVal = examMeta?.term || config.term;
    const sessionVal = examMeta?.session || config.session;
    const examTypeVal = examMeta?.examType || config.examType;
    const durationVal = examMeta?.duration || config.duration;
    const schoolName = (school?.name || "SCHOOL NAME").toUpperCase();
    const mcqQs = questions.filter(q => q.type === 'mcq');
    const thQs = questions.filter(q => q.type === 'theory');
    const letters = ["A", "B", "C", "D", "E"];

    const children: any[] = [];

    children.push(new Paragraph({ text: `${schoolName}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ text: `${examTypeVal.toUpperCase()} - ${termVal.toUpperCase()} (${sessionVal})`, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ text: `Subject: ${config.subject} | Class: ${config.classLevel} | Time Allowed: ${durationVal}`, alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ text: "" }));

    if (mcqQs.length > 0) {
      children.push(new Paragraph({ text: "SECTION A - OBJECTIVES", heading: HeadingLevel.HEADING_3 }));
      children.push(new Paragraph({ text: `(Choose the correct answer - ${mcqQs.length} marks)` }));
      children.push(new Paragraph({ text: "" }));

      mcqQs.forEach((q, i) => {
        children.push(new Paragraph({ text: `${i + 1}. ${q.question}` }));
        q.options.forEach((opt, oi) => {
          if (showingAnswers && oi === q.correctAnswer) {
             children.push(new Paragraph({ children: [new TextRun({ text: `   ${letters[oi]}. ${opt}`, bold: true, color: "10B981" })] }));
          } else {
             children.push(new Paragraph({ text: `   ${letters[oi]}. ${opt}` }));
          }
        });
        children.push(new Paragraph({ text: "" }));
      });
    }

    if (thQs.length > 0) {
      children.push(new Paragraph({ text: "SECTION B - THEORY", heading: HeadingLevel.HEADING_3 }));
      children.push(new Paragraph({ text: `(Answer ALL questions - ${thQs.length} marks)` }));
      children.push(new Paragraph({ text: "" }));

      thQs.forEach((q, i) => {
        children.push(new Paragraph({ text: `${mcqQs.length + i + 1}. ${q.question}` }));
        children.push(new Paragraph({ text: "" }));
        children.push(new Paragraph({ text: "" }));
        children.push(new Paragraph({ text: "" }));
      });
    }

    if (showingAnswers && mcqQs.length > 0) {
      children.push(new Paragraph({ text: "ANSWER KEY - TEACHER USE ONLY", heading: HeadingLevel.HEADING_2, pageBreakBefore: true }));
      mcqQs.forEach((q, i) => {
        children.push(new Paragraph({ text: `${i + 1}. ${letters[q.correctAnswer] || "?"}` }));
      });
    }

    const doc = new Document({
      sections: [{ properties: {}, children }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${config.subject}_${config.classLevel}_${termVal}_Exam.docx`);
    toast.success("DOCX exported successfully");
  };

  // Split questions into sections for mixed type display
  const mcqQuestions = questions.filter(q => q.type === 'mcq');
  const theoryQuestions = questions.filter(q => q.type === 'theory');
  const isMixed = mcqQuestions.length > 0 && theoryQuestions.length > 0;

  const filteredBankExams = sharedExams.filter(exam => {
    const matchesSearch = exam.subject.toLowerCase().includes(bankSearch.toLowerCase()) || exam.class_level.toLowerCase().includes(bankSearch.toLowerCase());
    const matchesTerm = bankTermFilter === 'All Terms' || exam.term === bankTermFilter;
    return matchesSearch && matchesTerm;
  });

  const groupedBankExams = filteredBankExams.reduce((acc, exam) => {
    const cLevel = exam.class_level || 'Other';
    const subj = exam.subject || 'Other';
    if (!acc[cLevel]) acc[cLevel] = {};
    if (!acc[cLevel][subj]) acc[cLevel][subj] = [];
    acc[cLevel][subj].push(exam);
    return acc;
  }, {} as Record<string, Record<string, typeof sharedExams>>);

  return (
    <DashboardLayout role={userRole} title="AI Exam Generator">
      <div className="flex h-[calc(100vh-180px)] gap-6 overflow-hidden print:block print:h-auto">
        {/* Left Pane: Configuration */}
        <section className="w-[380px] flex-shrink-0 flex flex-col gap-4 print:hidden">
          {/* Tab Switcher */}
          <div className="glass rounded-2xl p-1.5 flex gap-1 bg-white border border-[#0b1c30]/5">
            {([
              { id: 'generate' as ActiveTab, label: 'Generate', icon: Sparkles },
              { id: 'bank' as ActiveTab, label: 'Exam Bank', icon: BookOpen },
              { id: 'history' as ActiveTab, label: 'My Exams', icon: History },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-extrabold transition-all",
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-[#464555]/60 hover:text-[#0b1c30]"
                )}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 glass rounded-[2rem] shadow-elite overflow-y-auto custom-scrollbar bg-white border border-[#0b1c30]/5">
            <AnimatePresence mode="wait">
              {activeTab === 'generate' && (
                <motion.div
                  key="generate"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="p-7 space-y-6"
                >
                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Subject</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mathematics"
                      value={config.subject}
                      onChange={(e) => setConfig({...config, subject: e.target.value})}
                      className="w-full px-4 py-3.5 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                    />
                  </div>

                  {/* Source Mode */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Source Mode</label>
                    <div className="grid grid-cols-4 gap-2">
                      {([
                        { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
                        { id: 'topic', label: 'Topic', icon: BookOpen },
                        { id: 'url', label: 'URL', icon: Globe },
                        { id: 'document', label: 'Text/File', icon: FileText },
                      ]).map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setConfig({...config, sourceMode: mode.id})}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-all",
                            config.sourceMode === mode.id 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                              : "bg-white border-[#0b1c30]/5 text-[#464555] hover:border-indigo-600/20"
                          )}
                        >
                          <mode.icon className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Source Input */}
                  {config.sourceMode === 'curriculum' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Approved Curriculum/Scheme</label>
                      <input 
                        list="curriculum-options"
                        value={config.curriculum}
                        onChange={(e) => setConfig({...config, curriculum: e.target.value})}
                        placeholder="Select or type a custom curriculum..."
                        className="w-full px-4 py-3.5 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                      />
                      <datalist id="curriculum-options">
                        <option value="NERDC Scheme">NERDC (Nigerian Educational Research and Development Council)</option>
                        <option value="NAPPS Scheme">NAPPS (National Association of Proprietors of Private Schools)</option>
                        <option value="WAEC Syllabus">WAEC (West African Examinations Council) Syllabus</option>
                        <option value="NECO Syllabus">NECO (National Examinations Council) Syllabus</option>
                        <option value="Cambridge CAIE Scheme">Cambridge Assessment International Education (CAIE)</option>
                        <option value="Lagos State Unified Scheme">Lagos State Unified Scheme</option>
                        <option value="FCT Unified Scheme">FCT Unified Scheme</option>
                      </datalist>
                    </div>
                  )}

                  {config.sourceMode === 'topic' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Specific Topic</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Quadratic Equations"
                        value={config.topic}
                        onChange={(e) => setConfig({...config, topic: e.target.value})}
                        className="w-full px-4 py-3.5 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                      />
                    </div>
                  )}

                  {config.sourceMode === 'url' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Source URL</label>
                      <input 
                        type="url" 
                        placeholder="https://wikipedia.org/..."
                        value={config.sourceUrl}
                        onChange={(e) => setConfig({...config, sourceUrl: e.target.value})}
                        className="w-full px-4 py-3.5 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                      />
                    </div>
                  )}

                  {config.sourceMode === 'document' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Upload Document</label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const f = e.dataTransfer.files[0];
                          if (f) processFile(f);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
                          extracting ? "border-indigo-600 bg-indigo-50/50" :
                          documentFilename ? "border-emerald-500 bg-emerald-50/30" :
                          "border-gray-200 hover:border-indigo-600 hover:bg-gray-50/30"
                        )}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        {extracting ? (
                          <>
                            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                            <span className="text-xs font-bold text-[#0b1c30]">Extracting text...</span>
                          </>
                        ) : documentFilename ? (
                          <>
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            <span className="text-xs font-bold text-emerald-700 truncate max-w-full">{documentFilename}</span>
                            <span className="text-[10px] text-emerald-600 font-medium">Click to replace</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-indigo-500" />
                            <span className="text-xs font-bold text-[#464555]">Drop PDF or Word document here</span>
                            <span className="text-[10px] text-gray-400">Lesson notes, syllabus, textbook (max 5 MB)</span>
                          </>
                        )}
                      </div>
                      {uploadError && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold px-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{uploadError}</span>
                        </div>
                      )}
                      <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-[#0b1c30]/5"></div>
                        <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">OR</span>
                        <div className="flex-grow border-t border-[#0b1c30]/5"></div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest block ml-1">Paste Text Directly</label>
                        <textarea 
                          rows={4}
                          placeholder="Paste textbook excerpts or scheme of work here..."
                          value={config.documentText}
                          onChange={(e) => setConfig({...config, documentText: e.target.value})}
                          className="w-full px-4 py-3.5 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Question Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Question Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'mcq', label: 'MCQ', icon: ListChecks },
                        { id: 'theory', label: 'Theory', icon: PenLine },
                        { id: 'mixed', label: 'Mixed', icon: Shuffle },
                      ]).map((qt) => (
                        <button
                          key={qt.id}
                          onClick={() => setConfig({...config, questionType: qt.id})}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-all",
                            config.questionType === qt.id
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                              : "bg-white border-[#0b1c30]/5 text-[#464555] hover:border-indigo-600/20"
                          )}
                        >
                          <qt.icon className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">{qt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Level + Count */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Class Level</label>
                      <input 
                        list="classLevel-options"
                        value={config.classLevel}
                        onChange={(e) => setConfig({...config, classLevel: e.target.value})}
                        placeholder="Select or type..."
                        className="w-full px-3 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none transition-all"
                      />
                      <datalist id="classLevel-options">
                        <option value="JSS 1" />
                        <option value="JSS 2" />
                        <option value="JSS 3" />
                        <option value="SS 1" />
                        <option value="SS 2" />
                        <option value="SS 3" />
                      </datalist>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">No. of Questions</label>
                      <input 
                        type="number" 
                        min={5}
                        max={50}
                        value={config.questionCount}
                        onChange={(e) => setConfig({...config, questionCount: Number(e.target.value)})}
                        className="w-full px-3 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Term + Session */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Term
                      </label>
                      <input
                        list="term-options"
                        value={config.term}
                        onChange={(e) => setConfig({...config, term: e.target.value})}
                        placeholder="Select or type..."
                        className="w-full px-3 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none transition-all"
                      />
                      <datalist id="term-options">
                        <option value="1st Term" />
                        <option value="2nd Term" />
                        <option value="3rd Term" />
                      </datalist>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" /> Session
                      </label>
                      <input
                        type="text"
                        placeholder="2025/2026"
                        value={config.session}
                        onChange={(e) => setConfig({...config, session: e.target.value})}
                        className="w-full px-3 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Exam Type + Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Exam Type</label>
                      <input
                        list="examType-options"
                        value={config.examType}
                        onChange={(e) => setConfig({...config, examType: e.target.value})}
                        placeholder="Select or type..."
                        className="w-full px-3 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none transition-all"
                      />
                      <datalist id="examType-options">
                        <option value="Terminal Exam" />
                        <option value="Mid-Term Test" />
                        <option value="CA Test" />
                        <option value="Mock Exam" />
                        <option value="Revision Test" />
                      </datalist>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Duration
                      </label>
                      <input
                        list="duration-options"
                        value={config.duration}
                        onChange={(e) => setConfig({...config, duration: e.target.value})}
                        placeholder="Select or type..."
                        className="w-full px-3 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none transition-all"
                      />
                      <datalist id="duration-options">
                        <option value="30 Minutes" />
                        <option value="45 Minutes" />
                        <option value="1 Hour" />
                        <option value="1hr 30mins" />
                        <option value="2 Hours" />
                        <option value="2hr 30mins" />
                        <option value="3 Hours" />
                      </datalist>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white rounded-2xl py-4 text-sm font-black shadow-xl shadow-indigo-600/20 hover:shadow-2xl hover:shadow-indigo-600/30 hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
                  >
                    {loading ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Rocket className="w-4.5 h-4.5" />}
                    {loading ? 'Generating...' : 'Generate Questions'}
                  </button>
                </motion.div>
              )}
              {activeTab === 'bank' && (
                <motion.div
                  key="bank"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-5 space-y-4"
                >
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search exam bank..."
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-xs font-bold text-[#0b1c30] focus:outline-none transition-all placeholder:text-[#464555]/30"
                      />
                    </div>
                    <select
                      value={bankTermFilter}
                      onChange={(e) => setBankTermFilter(e.target.value)}
                      className="w-[110px] px-2 py-2.5 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-xs font-bold text-[#0b1c30] focus:outline-none transition-all"
                    >
                      <option value="All Terms">All Terms</option>
                      <option value="1st Term">1st Term</option>
                      <option value="2nd Term">2nd Term</option>
                      <option value="3rd Term">3rd Term</option>
                    </select>
                  </div>
 
                  {loadingBank ? (
                    <div className="flex items-center justify-center py-20">
                      <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                    </div>
                  ) : sharedExams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                      <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-[#464555]/60">Exam Bank is empty</p>
                      <p className="text-xs text-[#464555]/40 max-w-[200px]">Exams marked as shared will appear here.</p>
                    </div>
                  ) : filteredBankExams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                      <p className="text-sm font-bold text-[#464555]/60">No exams match your filters</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.keys(groupedBankExams).sort().map(cLevel => (
                        <div key={cLevel} className="space-y-3">
                          <h3 className="text-sm font-black text-indigo-900 border-b border-[#0b1c30]/5 pb-1">{cLevel}</h3>
                          <div className="space-y-4 pl-2">
                            {Object.keys(groupedBankExams[cLevel]).sort().map(subj => (
                              <div key={subj} className="space-y-2">
                                <h4 className="text-xs font-bold text-[#464555] opacity-80">{subj}</h4>
                                <div className="space-y-2 pl-2 border-l-2 border-indigo-100">
                                  {groupedBankExams[cLevel][subj].map((exam) => (
                                    <div
                                      key={exam.id}
                                      className={cn(
                                        "group p-3 rounded-xl border transition-all cursor-pointer",
                                        currentExamId === exam.id
                                          ? "bg-indigo-50 border-indigo-200"
                                          : "bg-white border-[#0b1c30]/5 hover:border-indigo-200 hover:bg-indigo-50/30"
                                      )}
                                      onClick={() => handleLoadExam(exam.id)}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[8px] font-bold uppercase">
                                              {exam.question_type || 'mcq'}
                                            </span>
                                            {exam.term && (
                                              <span className="text-[9px] font-bold text-[#464555]/60">{exam.term}</span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          {exam.file_url && (
                                            <a
                                              href={exam.file_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1.5 rounded-md hover:bg-indigo-100 text-[#464555]/40 hover:text-indigo-600 transition-colors"
                                              onClick={(e) => e.stopPropagation()}
                                              title="Download Original Document"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                            </a>
                                          )}
                                          {loadingExamId === exam.id && (
                                            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin flex-shrink-0" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-5"
                >
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-20">
                      <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                    </div>
                  ) : savedExams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                      <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                        <FileQuestion className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-[#464555]/60">No saved exams yet</p>
                      <p className="text-xs text-[#464555]/40 max-w-[200px]">Generated exams will appear here automatically.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {savedExams.map((exam) => (
                        <div
                          key={exam.id}
                          className={cn(
                            "group p-3.5 rounded-xl border transition-all cursor-pointer",
                            currentExamId === exam.id
                              ? "bg-indigo-50 border-indigo-200"
                              : "bg-white border-[#0b1c30]/5 hover:border-indigo-200 hover:bg-indigo-50/30"
                          )}
                          onClick={() => handleLoadExam(exam.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-extrabold text-[#0b1c30] truncate">{exam.subject}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[9px] font-bold uppercase">
                                  {exam.question_type || 'mcq'}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                                  {exam.class_level}
                                </span>
                                {exam.term && (
                                  <span className="text-[9px] font-bold text-[#464555]/40">{exam.term}</span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#464555]/40 mt-1.5">
                                {new Date(exam.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {loadingExamId === exam.id ? (
                                <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                              ) : (
                                <>
                                  {exam.file_url && (
                                    <a
                                      href={exam.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-md hover:bg-indigo-100 text-[#464555]/40 hover:text-indigo-600 transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                      title="Download Original Document"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id); }}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#464555]/30 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete exam"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <ChevronRight className="w-4 h-4 text-[#464555]/20 group-hover:text-indigo-600 transition-colors" />
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Pane: Question Preview */}
        <section className="flex-1 glass p-8 rounded-[2.5rem] shadow-elite overflow-y-auto custom-scrollbar bg-white border border-[#0b1c30]/5 print:bg-white print:p-0 print:shadow-none print:rounded-none">
          <AnimatePresence mode="wait">
            {questions.length > 0 ? (
              <motion.div 
                key="questions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Toolbar */}
                <div className="flex items-center justify-between print:hidden gap-4 flex-wrap border-b border-[#0b1c30]/5 pb-4 mb-4">
                   <div>
                     <h3 className="text-xl font-black text-[#0b1c30] tracking-tight">Question Preview</h3>
                     <p className="text-xs font-medium text-[#464555]/50 mt-0.5">
                       {questions.length} questions • {mcqQuestions.length > 0 && `${mcqQuestions.length} MCQ`}{isMixed && ' + '}{theoryQuestions.length > 0 && `${theoryQuestions.length} Theory`}
                     </p>
                   </div>
                   <div className="flex items-center gap-2 flex-wrap">
                      {currentExamId && (
                        <button 
                          onClick={handleSaveExam}
                          disabled={!isModified || isSaving}
                          className={cn(
                            "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-sm",
                            isModified 
                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10" 
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          )}
                        >
                          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                      )}
                      
                      <button 
                        onClick={() => setShowingAnswers(!showingAnswers)}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                          showingAnswers 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                            : "bg-white border-[#0b1c30]/5 text-[#464555] hover:border-indigo-600/20"
                        )}
                      >
                        {showingAnswers ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <Eye className="w-3.5 h-3.5" />}
                        {showingAnswers ? "Hide Answers" : "Show Answers"}
                      </button>

                      <div className="flex bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl p-1 gap-1">
                        <button 
                          onClick={shuffleQuestions}
                          title="Shuffle Questions"
                          className="p-2 text-[#464555] hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                        </button>
                        {mcqQuestions.length > 0 && (
                          <button 
                            onClick={shuffleOptions}
                            title="Shuffle MCQ Options"
                            className="p-2 text-[#464555] hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                          >
                            <ListChecks className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button 
                        onClick={handleExportPDF} 
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export PDF
                      </button>

                      <button 
                        onClick={handleExportDOCX} 
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export DOCX
                      </button>

                      <button 
                        onClick={handlePrint} 
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#0b1c30]/5 rounded-xl text-xs font-bold text-[#464555] hover:text-indigo-600 hover:border-indigo-200 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                   </div>
                </div>

                {/* Print Header */}
                <div className="hidden print:block mb-8">
                  <div className="text-center border-b-2 border-gray-800 pb-5 mb-6">
                    <h1 className="text-2xl font-black uppercase tracking-wide">{school?.name || "SCHOOL NAME"}</h1>
                    {school?.motto && <p className="text-xs italic text-gray-500 mt-1">"{school.motto}"</p>}
                    {school?.address && <p className="text-xs text-gray-400 mt-0.5">{school.address}</p>}
                    
                    <h2 className="text-lg font-bold text-gray-700 mt-3">{examMeta?.examType || config.examType}</h2>
                    <div className="flex items-center justify-center gap-6 mt-2 text-sm font-medium text-gray-500">
                      <span>{examMeta?.term || config.term}</span>
                      <span>•</span>
                      <span>{examMeta?.session || config.session} Session</span>
                      <span>•</span>
                      <span>{config.classLevel}</span>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-1 text-sm font-medium text-gray-500">
                      <span>Duration: {examMeta?.duration || config.duration}</span>
                    </div>
                  </div>
                  <div className="flex justify-between mb-6 text-sm">
                    <div className="flex gap-1">
                      <span className="font-bold">Name:</span>
                      <span className="border-b border-gray-400 inline-block w-64">&nbsp;</span>
                    </div>
                    <div className="flex gap-1">
                      <span className="font-bold">Class:</span>
                      <span className="border-b border-gray-400 inline-block w-32">&nbsp;</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 italic mb-4">
                    Instructions: Answer ALL questions. {mcqQuestions.length > 0 && 'For objectives, select the correct option (A–D). '}{theoryQuestions.length > 0 && 'For theory, write in clear, complete sentences.'}
                  </p>
                </div>

                {/* Exam Metadata Card (screen only) */}
                {examMeta && (
                  <div className="flex flex-wrap gap-3 print:hidden">
                    {[
                      { label: 'Term', value: examMeta.term, icon: Calendar },
                      { label: 'Session', value: examMeta.session, icon: GraduationCap },
                      { label: 'Type', value: examMeta.examType, icon: FileText },
                      { label: 'Duration', value: examMeta.duration, icon: Clock },
                    ].map((meta) => (
                      <div key={meta.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f8f9ff] border border-[#0b1c30]/5">
                        <meta.icon className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-[10px] font-extrabold text-[#464555]/50 uppercase">{meta.label}:</span>
                        <span className="text-xs font-bold text-[#0b1c30]">{meta.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Questions List */}
                {isMixed ? (
                  <>
                    {/* Section A: Objectives */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-indigo-200 to-transparent" />
                        <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Section A — Objectives</h4>
                        <div className="h-px flex-1 bg-gradient-to-l from-indigo-200 to-transparent" />
                      </div>
                      <p className="text-[11px] text-[#464555]/50 font-medium text-center -mt-2 print:text-left">Choose the correct option from A to D</p>
                      {mcqQuestions.map((q, i) => {
                        const gi = questions.indexOf(q);
                        return editingIndex === gi ? (
                          <MCQEditCard 
                            key={`edit-mcq-${gi}`} 
                            q={q} 
                            gi={gi} 
                            updateQuestion={updateQuestion} 
                            setEditingIndex={setEditingIndex} 
                          />
                        ) : (
                          <MCQCard 
                            key={`mcq-${gi}`} 
                            question={q} 
                            index={i} 
                            gi={gi}
                            onEdit={setEditingIndex}
                            onDelete={deleteQuestion}
                            showingAnswers={showingAnswers}
                          />
                        );
                      })}
                    </div>

                    {/* Section B: Theory */}
                    <div className="space-y-4 mt-8">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-amber-200 to-transparent" />
                        <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest">Section B — Theory</h4>
                        <div className="h-px flex-1 bg-gradient-to-l from-amber-200 to-transparent" />
                      </div>
                      <p className="text-[11px] text-[#464555]/50 font-medium text-center -mt-2 print:text-left">Answer all questions in this section</p>
                      {theoryQuestions.map((q, i) => {
                        const gi = questions.indexOf(q);
                        return editingIndex === gi ? (
                          <TheoryEditCard 
                            key={`edit-theory-${gi}`} 
                            q={q} 
                            gi={gi} 
                            updateQuestion={updateQuestion} 
                            setEditingIndex={setEditingIndex} 
                          />
                        ) : (
                          <TheoryCard 
                            key={`theory-${gi}`} 
                            question={q} 
                            index={mcqQuestions.length + i} 
                            gi={gi}
                            onEdit={setEditingIndex}
                            onDelete={deleteQuestion}
                            showingAnswers={showingAnswers}
                          />
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, i) => {
                      const gi = i;
                      if (q.type === 'theory') {
                        return editingIndex === gi ? (
                          <TheoryEditCard 
                            key={`edit-${gi}`} 
                            q={q} 
                            gi={gi} 
                            updateQuestion={updateQuestion} 
                            setEditingIndex={setEditingIndex} 
                          />
                        ) : (
                          <TheoryCard 
                            key={`theory-${gi}`} 
                            question={q} 
                            index={i} 
                            gi={gi}
                            onEdit={setEditingIndex}
                            onDelete={deleteQuestion}
                            showingAnswers={showingAnswers}
                          />
                        );
                      } else {
                        return editingIndex === gi ? (
                          <MCQEditCard 
                            key={`edit-${gi}`} 
                            q={q} 
                            gi={gi} 
                            updateQuestion={updateQuestion} 
                            setEditingIndex={setEditingIndex} 
                          />
                        ) : (
                          <MCQCard 
                            key={`mcq-${gi}`} 
                            question={q} 
                            index={i} 
                            gi={gi}
                            onEdit={setEditingIndex}
                            onDelete={deleteQuestion}
                            showingAnswers={showingAnswers}
                          />
                        );
                      }
                    })}
                  </div>
                )}

                {/* Add Question Button */}
                <div className="flex justify-center pt-4 print:hidden">
                  <button 
                    onClick={addQuestion}
                    className="flex items-center gap-2 px-5 py-3 border border-dashed border-indigo-600/30 hover:border-indigo-600/60 bg-indigo-50/20 hover:bg-indigo-50/50 rounded-2xl text-xs font-extrabold text-indigo-600 transition-all hover:scale-[1.02] active:scale-100"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="relative">
                  <div className="w-28 h-28 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                    <Sparkles className="w-12 h-12" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border-4 border-white">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0b1c30]">Ready to Generate</h3>
                  <p className="text-sm font-medium text-[#464555]/50 max-w-xs mx-auto mt-2">
                    Configure the subject, topic, and parameters on the left, then hit Generate to create AI-powered exam questions.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#464555]/30 uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" />
                  Powered by Cloudflare Workers AI
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </DashboardLayout>
  );
}

// ──── MCQ Question Card ────
function MCQCard({ 
  question, 
  index, 
  gi, 
  onEdit, 
  onDelete, 
  showingAnswers 
}: { 
  question: Question; 
  index: number; 
  gi: number; 
  onEdit: (idx: number) => void; 
  onDelete: (idx: number) => void; 
  showingAnswers: boolean; 
}) {
  const letters = ["A", "B", "C", "D"];
  return (
    <div className="group relative p-5 rounded-2xl bg-[#f8f9ff] border border-[#0b1c30]/5 space-y-3 print:bg-white print:border-none print:px-0 print:py-2">
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black flex-shrink-0 print:bg-gray-200 print:text-black print:rounded-sm">
            {index + 1}
          </span>
          <p className="text-sm font-bold text-[#0b1c30] leading-relaxed mt-0.5">{question.question}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
          <button 
            onClick={() => onEdit(gi)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-indigo-50 text-[#464555] hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition-all"
            title="Edit question"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onDelete(gi)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-50 text-[#464555] hover:text-rose-500 border border-transparent hover:border-rose-100 transition-all"
            title="Delete question"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 ml-10 print:grid-cols-1 print:ml-8">
        {question.options?.map((opt: string, oi: number) => {
          const isCorrect = showingAnswers && question.correctAnswer === oi;
          return (
            <div key={oi} className={cn(
              "px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between",
              isCorrect
                ? "bg-emerald-50 border-emerald-500/20 text-emerald-700 print:bg-transparent print:border-none print:font-bold" 
                : "bg-white border-[#0b1c30]/5 text-[#464555] print:bg-transparent print:border-none"
            )}>
              <span>
                <span className="opacity-40 mr-1.5 font-extrabold">{letters[oi]}.</span> {opt}
              </span>
              {isCorrect && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 print:hidden" />
              )}
            </div>
          );
        })}
      </div>
      {showingAnswers && question.explanation && (
        <div className="ml-10 mt-2 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-700 font-medium print:hidden">
          <span className="font-black uppercase tracking-wider text-[9px] block mb-0.5 text-indigo-500">Explanation</span>
          {question.explanation}
        </div>
      )}
    </div>
  );
}

// ──── Theory Question Card ────
function TheoryCard({ 
  question, 
  index, 
  gi, 
  onEdit, 
  onDelete, 
  showingAnswers 
}: { 
  question: Question; 
  index: number; 
  gi: number; 
  onEdit: (idx: number) => void; 
  onDelete: (idx: number) => void; 
  showingAnswers: boolean; 
}) {
  return (
    <div className="group relative p-5 rounded-2xl bg-amber-50/30 border border-amber-200/30 space-y-3 print:bg-white print:border-none print:px-0 print:py-2">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-[11px] font-black flex-shrink-0 print:bg-gray-200 print:text-black print:rounded-sm">
              {index + 1}
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#0b1c30] leading-relaxed mt-0.5">{question.question}</p>
              {/* Lines for student answer in print */}
              <div className="hidden print:block mt-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border-b border-gray-300 h-6" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
          <button 
            onClick={() => onEdit(gi)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 text-[#464555] hover:text-amber-600 border border-transparent hover:border-amber-100 transition-all"
            title="Edit question"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onDelete(gi)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-50 text-[#464555] hover:text-rose-500 border border-transparent hover:border-rose-100 transition-all"
            title="Delete question"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {showingAnswers && question.explanation && (
        <div className="ml-10 mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200/50 text-[11px] text-amber-800 font-medium print:hidden">
          <span className="font-black uppercase tracking-wider text-[9px] block mb-0.5 text-amber-600">Expected Key Points</span>
          {question.explanation}
        </div>
      )}
    </div>
  );
}

// ──── Question MCQ Edit Card ────
function MCQEditCard({ 
  q, 
  gi, 
  updateQuestion, 
  setEditingIndex 
}: { 
  q: Question; 
  gi: number; 
  updateQuestion: (i: number, u: Partial<Question>) => void; 
  setEditingIndex: (idx: number | null) => void; 
}) {
  const letters = ["A", "B", "C", "D"];
  return (
    <div className="p-6 rounded-2xl bg-indigo-50/30 border-2 border-indigo-500/20 space-y-4 print:hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Editing Question {gi + 1} (MCQ)</span>
        <button 
          onClick={() => setEditingIndex(null)}
          className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800"
        >
          Done
        </button>
      </div>
      
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest block ml-1">Question Text</label>
        <textarea
          rows={2}
          value={q.question}
          onChange={(e) => updateQuestion(gi, { question: e.target.value })}
          className="w-full px-4 py-3 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest block ml-1">Options (Click letter to select correct answer)</label>
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <button
                onClick={() => updateQuestion(gi, { correctAnswer: oi })}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all flex-shrink-0",
                  q.correctAnswer === oi 
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                    : "bg-white border border-[#0b1c30]/5 text-[#464555] hover:border-emerald-500/30"
                )}
              >
                {letters[oi]}
              </button>
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOpts = [...q.options];
                  newOpts[oi] = e.target.value;
                  updateQuestion(gi, { options: newOpts });
                }}
                className="flex-1 px-3 py-2 bg-white border border-[#0b1c30]/5 rounded-xl text-xs font-bold text-[#0b1c30] focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest block ml-1">Explanation</label>
        <textarea
          rows={2}
          value={q.explanation || ""}
          onChange={(e) => updateQuestion(gi, { explanation: e.target.value })}
          className="w-full bg-white border border-[#0b1c30]/5 rounded-xl text-xs font-bold text-[#0b1c30] focus:outline-none resize-none"
        />
      </div>
    </div>
  );
}

// ──── Question Theory Edit Card ────
function TheoryEditCard({ 
  q, 
  gi, 
  updateQuestion, 
  setEditingIndex 
}: { 
  q: Question; 
  gi: number; 
  updateQuestion: (i: number, u: Partial<Question>) => void; 
  setEditingIndex: (idx: number | null) => void; 
}) {
  return (
    <div className="p-6 rounded-2xl bg-amber-50/20 border-2 border-amber-500/20 space-y-4 print:hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Editing Question {gi + 1} (Theory)</span>
        <button 
          onClick={() => setEditingIndex(null)}
          className="text-xs font-extrabold text-amber-600 hover:text-amber-800"
        >
          Done
        </button>
      </div>
      
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest block ml-1">Question Text</label>
        <textarea
          rows={2}
          value={q.question}
          onChange={(e) => updateQuestion(gi, { question: e.target.value })}
          className="w-full px-4 py-3 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest block ml-1">Expected Key Points</label>
        <textarea
          rows={2}
          value={q.explanation || ""}
          onChange={(e) => updateQuestion(gi, { explanation: e.target.value })}
          className="w-full bg-white border border-[#0b1c30]/5 rounded-xl text-xs font-bold text-[#0b1c30] focus:outline-none resize-none"
        />
      </div>
    </div>
  );
}
