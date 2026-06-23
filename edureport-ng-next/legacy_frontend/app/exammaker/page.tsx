"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit3, Save, Download, Printer, RefreshCw, Eye, EyeOff, ChevronLeft, Book, Check, Zap, UploadCloud, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { ConfirmModal } from "../app/components/ConfirmModal";
import { LoadingSpinner } from "../app/components/LoadingSpinner";

interface Question {
  question: string;
  type: "mcq" | "theory";
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface Exam {
  id: string;
  subject: string;
  class_level: string;
  topic?: string;
  questions: Question[];
  created_at: string;
  term?: string;
  session?: string;
  exam_type?: string;
  question_type?: string;
  source_mode?: string;
  duration?: string;
}

type SourceMode = "topic" | "document" | "url";
type QuestionType = "mcq" | "theory" | "mixed";
type SidebarTab = "create" | "history";

const TERMS = ["1st Term", "2nd Term", "3rd Term"];
const DURATIONS = ["30 Minutes", "45 Minutes", "1 Hour", "1 Hour 30 Minutes", "2 Hours", "3 Hours"];
const EXAM_TYPES = ["Continuous Assessment (CA)", "Terminal Examination", "Mock Examination", "Practice Test"];
const LETTERS = ["A", "B", "C", "D", "E"];

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[0.62rem] font-black text-muted uppercase tracking-widest">{children}</label>;
}

function SideInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="bg-ink2/50 border border-ink2 rounded-lg p-2.5 text-[0.82rem] text-white focus:outline-none focus:border-green transition-colors w-full"
    />
  );
}

function SideSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className="bg-ink2/50 border border-ink2 rounded-lg p-2.5 text-[0.82rem] text-white focus:outline-none focus:border-green transition-colors w-full">
      {children}
    </select>
  );
}

function SideTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="bg-ink2/50 border border-ink2 rounded-lg p-2.5 text-[0.82rem] text-white focus:outline-none focus:border-green transition-colors resize-none w-full"
    />
  );
}

function DocumentUploadZone({ onTextExtracted }: { onTextExtracted: (text: string, filename: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedFile, setExtractedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    const name = file.name.toLowerCase();
    if (file.size > 5 * 1024 * 1024) { setError("File too large (max 5 MB)"); return; }
    if (!name.endsWith(".pdf") && !name.endsWith(".doc") && !name.endsWith(".docx")) {
      setError("Only PDF, DOC, and DOCX files are supported"); return;
    }
    setError(null); setExtracting(true);
    try {
      let text = "";
      if (name.endsWith(".pdf")) text = await extractPdfText(file);
      else text = await extractDocxText(file);
      if (!text.trim()) throw new Error("No readable text found in this document");
      setExtractedFile(file.name);
      onTextExtracted(text, file.name);
      toast.success(`"${file.name}" extracted successfully`);
    } catch (e: any) {
      setError(e.message || "Failed to extract text");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          dragging ? "border-green bg-green/10" :
          extractedFile ? "border-green/40 bg-green/5" :
          "border-ink2 hover:border-green/50 hover:bg-white/5"
        }`}
      >
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} className="hidden" />
        {extracting ? (
          <div className="flex flex-col items-center gap-2 text-muted">
            <Loader className="animate-spin text-green" size={22} />
            <span className="text-[0.72rem] font-bold">Extracting text...</span>
          </div>
        ) : extractedFile ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="text-green" size={22} />
            <span className="text-[0.72rem] font-bold text-green truncate max-w-full">{extractedFile}</span>
            <span className="text-[0.62rem] text-muted">Click to replace</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted">
            <UploadCloud size={22} />
            <span className="text-[0.72rem] font-bold">Drop PDF or Word file here</span>
            <span className="text-[0.6rem]">Scheme of Work · Lesson Note · Textbook · max 5 MB</span>
          </div>
        )}
      </div>
      {error && <div className="flex items-center gap-1.5 text-[0.65rem] text-red font-semibold"><AlertCircle size={11} /> {error}</div>}
    </div>
  );
}

function ExamPaperHeader({ exam, schoolData }: { exam: Exam; schoolData: any }) {
  const schoolName = schoolData?.name || "SCHOOL NAME";
  const motto = schoolData?.motto || "";
  const address = schoolData?.address || "";
  const logoUrl = schoolData?.logoUrl;
  const term = exam.term || "2nd Term";
  const session = exam.session || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
  const examType = exam.exam_type || "Terminal Examination";
  const duration = exam.duration || "1 Hour";
  const mcqCount = exam.questions.filter((q) => q.type !== "theory").length;
  const theoryCount = exam.questions.filter((q) => q.type === "theory").length;
  const qtLabel = exam.question_type === "theory" ? "Theory" : exam.question_type === "mixed" ? "Obj. & Theory" : "Objectives";

  return (
    <div style={{ borderBottom: "3px double #141412", paddingBottom: "20px", marginBottom: "24px" }}>
      <div style={{ background: "#1a6b3c", color: "#fff", padding: "7px 16px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
        <span>{term.toUpperCase()} EXAMINATION</span>
        <span>{session} ACADEMIC SESSION</span>
      </div>
      <div style={{ textAlign: "center", marginBottom: "14px" }}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" style={{ width: 68, height: 68, objectFit: "contain", margin: "0 auto 8px" }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid #1a6b3c", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", background: "#e8f5ee" }}>
            <span style={{ fontSize: "1.6rem" }}>&#127979;</span>
          </div>
        )}
        <h1 style={{ fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.04em", margin: 0, lineHeight: 1.2 }}>{schoolName}</h1>
        {motto && <p style={{ fontSize: "0.7rem", fontStyle: "italic", color: "#3d3b38", margin: "4px 0 0" }}>&#8220;{motto}&#8221;</p>}
        {address && <p style={{ fontSize: "0.67rem", color: "#7c7a76", margin: "3px 0 0" }}>{address}</p>}
      </div>
      <div style={{ border: "1.5px solid #141412", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ background: "#141412", color: "#fff", padding: "6px 12px", textAlign: "center" as const, fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
          {examType} &mdash; {term}
        </div>
        {[
          [["Subject", exam.subject], ["Class / Arm", exam.class_level], ["Section", qtLabel]],
          [["Time Allowed", duration], ["Total Questions", String(exam.questions.length)], ["Total Score", mcqCount > 0 && theoryCount > 0 ? `${mcqCount} + ${theoryCount}` : String(exam.questions.length)]],
        ].map((row, ri) => (
          <div key={ri} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid #e4e0d8" }}>
            {row.map(([label, val]) => (
              <div key={label} style={{ padding: "6px 10px", borderRight: "1px solid #e4e0d8" }}>
                <div style={{ fontSize: "0.52rem", fontWeight: 800, textTransform: "uppercase" as const, color: "#7c7a76", letterSpacing: "0.1em" }}>{label}</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#141412", marginTop: "2px" }}>{val}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
        <div style={{ borderBottom: "1px solid #141412", paddingBottom: "2px" }}>
          <span style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#3d3b38" }}>Student&apos;s Name: </span>
          <span style={{ fontSize: "0.62rem", color: "#ccc" }}>____________________________________</span>
        </div>
        <div style={{ borderBottom: "1px solid #141412", paddingBottom: "2px" }}>
          <span style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#3d3b38" }}>Reg. No.: </span>
          <span style={{ fontSize: "0.62rem", color: "#ccc" }}>______________</span>
        </div>
      </div>
      <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ borderBottom: "1px solid #141412", paddingBottom: "2px" }}>
          <span style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#3d3b38" }}>Date: </span>
          <span style={{ fontSize: "0.62rem", color: "#ccc" }}>___________________</span>
        </div>
        <div style={{ borderBottom: "1px solid #141412", paddingBottom: "2px" }}>
          <span style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#3d3b38" }}>Score: </span>
          <span style={{ fontSize: "0.62rem", color: "#ccc" }}>_______ / {exam.questions.length}</span>
        </div>
      </div>
      <div style={{ marginTop: "12px", background: "#f5f3ee", border: "1px solid #e4e0d8", borderRadius: "4px", padding: "8px 12px" }}>
        <div style={{ fontSize: "0.58rem", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "4px" }}>Instructions:</div>
        <ol style={{ paddingLeft: "16px", margin: 0 }}>
          {mcqCount > 0 && <li style={{ fontSize: "0.63rem", marginBottom: "2px" }}>Answer ALL {mcqCount} objective question{mcqCount !== 1 ? "s" : ""} by writing the correct option letter in the space provided.</li>}
          {theoryCount > 0 && <li style={{ fontSize: "0.63rem", marginBottom: "2px" }}>Answer ALL {theoryCount} theory question{theoryCount !== 1 ? "s" : ""}. Write your answers in full sentences.</li>}
          <li style={{ fontSize: "0.63rem", marginBottom: "2px" }}>Write your full name and registration number clearly before you begin answering.</li>
          <li style={{ fontSize: "0.63rem" }}>Mobile phones and electronic devices are NOT permitted in the examination hall.</li>
        </ol>
      </div>
    </div>
  );
}

export default function ExammakerPage() {
  const [schoolData, setSchoolData] = useState<any>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [loadingExams, setLoadingExams] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState("");
  const [activeTab, setActiveTab] = useState<SidebarTab>("create");
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showingAnswers, setShowingAnswers] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode>("topic");
  const [subject, setSubject] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [count, setCount] = useState(20);
  const [term, setTerm] = useState("2nd Term");
  const [session, setSession] = useState(() => { const y = new Date().getFullYear(); return `${y}/${y + 1}`; });
  const [examType, setExamType] = useState("Terminal Examination");
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [duration, setDuration] = useState("1 Hour");
  const [topicText, setTopicText] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [documentFilename, setDocumentFilename] = useState("");
  const [urlInput, setUrlInput] = useState("");

  const apiBaseUrl = "/api";

  const loadExams = useCallback(async () => {
    setLoadingExams(true);
    try {
      const res = await fetch(`${apiBaseUrl}/ai/exam`, { credentials: "include" });
      const data = await res.json() as any;
      if (res.ok) setExams(data.exams || []);
    } catch (e) { toast.error("Failed to load exams"); }
    finally { setLoadingExams(false); }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/portal/api/me`, { credentials: "include" });
      const data = await res.json() as any;
      if (data.school) setSchoolData(data.school);
    } catch (e) {}
  }, []);

  useEffect(() => { checkAuth(); loadExams(); }, [checkAuth, loadExams]);

  const generateExam = async () => {
    if (!subject.trim() || !classLevel.trim()) { toast.error("Enter Subject and Class Level"); return; }
    if (sourceMode === "topic" && !topicText.trim()) { toast.error("Enter a topic or lesson notes"); return; }
    if (sourceMode === "document" && !documentText.trim()) { toast.error("Upload a document or paste text"); return; }
    if (sourceMode === "url" && !urlInput.trim()) { toast.error("Enter a URL"); return; }
    setGenerating(true); setGeneratingStep("Connecting to AI...");
    try {
      setGeneratingStep("Generating questions...");
      const res = await fetch(`${apiBaseUrl}/ai/exam/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, classLevel, topic: topicText, questionCount: count, term, session, examType, questionType, sourceMode, documentText: sourceMode === "document" ? documentText : undefined, sourceUrl: sourceMode === "url" ? urlInput : undefined, duration }),
        credentials: "include",
      });
      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error?.message || "Generation failed");
      setCurrentExam({ id: data.id || `temp-${Date.now()}`, subject, class_level: classLevel, topic: topicText, questions: data.questions, created_at: new Date().toISOString(), term: data.term || term, session: data.session || session, exam_type: data.examType || examType, question_type: data.questionType || questionType, source_mode: sourceMode, duration: data.duration || duration });
      setIsModified(false); toast.success(`${data.questions.length} questions generated!`); loadExams();
    } catch (e: any) { toast.error(e.message || "Generation failed"); }
    finally { setGenerating(false); setGeneratingStep(""); }
  };

  const viewExam = async (id: string) => {
    if (isModified && !confirm("Discard unsaved changes?")) return;
    try {
      const res = await fetch(`${apiBaseUrl}/ai/exam/${id}`, { credentials: "include" });
      const data = await res.json() as any;
      if (res.ok) {
        setCurrentExam({ id: data.exam.id, subject: data.exam.subject, class_level: data.exam.class_level, topic: data.exam.topic, questions: data.exam.questions.map((q: any) => ({ ...q, type: q.type || (q.options?.length ? "mcq" : "theory") })), created_at: data.exam.created_at, term: data.exam.term, session: data.exam.session, exam_type: data.exam.exam_type, question_type: data.exam.question_type, source_mode: data.exam.source_mode, duration: data.exam.duration });
        setIsModified(false); setActiveTab("create");
      }
    } catch (e) { toast.error("Failed to load exam"); }
  };

  const saveExam = async () => {
    if (!currentExam) return; setIsSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/ai/exam/${currentExam.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: currentExam.subject, classLevel: currentExam.class_level, topic: currentExam.topic, questions: currentExam.questions, term: currentExam.term, session: currentExam.session, examType: currentExam.exam_type, questionType: currentExam.question_type, duration: currentExam.duration }), credentials: "include" });
      if (!res.ok) throw new Error("Save failed");
      setIsModified(false); toast.success("Exam saved"); loadExams();
    } catch (e: any) { toast.error(e.message); }
    finally { setIsSaving(false); }
  };

  const deleteExam = async () => {
    if (!deleteId) return;
    try { await fetch(`${apiBaseUrl}/ai/exam/${deleteId}`, { method: "DELETE", credentials: "include" }); if (currentExam?.id === deleteId) setCurrentExam(null); setExams(exams.filter((e) => e.id !== deleteId)); toast.success("Exam deleted"); }
    catch (e: any) { toast.error(e.message); } finally { setDeleteId(null); }
  };

  const updateQuestion = (i: number, updated: Partial<Question>) => {
    if (!currentExam) return;
    const qs = [...currentExam.questions]; qs[i] = { ...qs[i], ...updated };
    setCurrentExam({ ...currentExam, questions: qs }); setIsModified(true);
  };

  const deleteQuestion = (i: number) => {
    if (!currentExam) return;
    setCurrentExam({ ...currentExam, questions: currentExam.questions.filter((_, idx) => idx !== i) }); setIsModified(true);
  };

  const addQuestion = () => {
    if (!currentExam) return;
    const nq: Question = { question: "New Question", type: currentExam.question_type === "theory" ? "theory" : "mcq", options: currentExam.question_type === "theory" ? [] : ["Option A", "Option B", "Option C", "Option D"], correctAnswer: 0, explanation: "" };
    setCurrentExam({ ...currentExam, questions: [...currentExam.questions, nq] }); setIsModified(true); setEditingIndex(currentExam.questions.length);
  };

  const shuffleQuestions = () => {
    if (!currentExam) return;
    setCurrentExam({ ...currentExam, questions: [...currentExam.questions].sort(() => Math.random() - 0.5) }); setIsModified(true); toast.success("Questions shuffled");
  };

  const shuffleOptions = () => {
    if (!currentExam) return;
    const newQs = currentExam.questions.map((q) => {
      if (q.type === "theory" || !q.options.length) return q;
      const tagged = q.options.map((opt, i) => ({ opt, isCorrect: i === q.correctAnswer })).sort(() => Math.random() - 0.5);
      return { ...q, options: tagged.map((t) => t.opt), correctAnswer: tagged.findIndex((t) => t.isCorrect) };
    });
    setCurrentExam({ ...currentExam, questions: newQs }); setIsModified(true); toast.success("Options shuffled");
  };

  const exportPDF = () => {
    if (!currentExam) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 15, pageW = 210, usableW = pageW - margin * 2; let y = 0;
    const t2 = currentExam.term || "2nd Term", s2 = currentExam.session || "", et2 = currentExam.exam_type || "Terminal Examination", d2 = currentExam.duration || "1 Hour";
    const sn = (schoolData?.name || "SCHOOL NAME").toUpperCase(), mo = schoolData?.motto || "", ad = schoolData?.address || "";
    doc.setFillColor(26, 107, 60); doc.rect(0, 0, 210, 16, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "bold");
    doc.text(`${t2.toUpperCase()} EXAMINATION`, margin, 8); doc.text(`${s2} ACADEMIC SESSION`, pageW - margin, 8, { align: "right" });
    doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.text("EduReport NG - AI Exam Maker", pageW / 2, 13, { align: "center" }); y = 24;
    doc.setTextColor(20, 20, 18); doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text(sn, pageW / 2, y, { align: "center" }); y += 7;
    if (mo) { doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.text(`"${mo}"`, pageW / 2, y, { align: "center" }); y += 5; }
    if (ad) { doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text(ad, pageW / 2, y, { align: "center" }); y += 4; }
    y += 3;
    doc.setFillColor(20, 20, 18); doc.rect(margin, y, usableW, 8, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text(`${et2.toUpperCase()} - ${t2.toUpperCase()}`, pageW / 2, y + 5.5, { align: "center" }); y += 10;
    doc.setTextColor(20, 20, 18);
    const cw = usableW / 3;
    const mcqN = currentExam.questions.filter((q) => q.type !== "theory").length;
    const thN = currentExam.questions.filter((q) => q.type === "theory").length;
    const rows2 = [[["Subject", currentExam.subject], ["Class", currentExam.class_level], ["Section", currentExam.question_type === "theory" ? "Theory" : "Objectives"]], [["Time Allowed", d2], ["Total Questions", String(currentExam.questions.length)], ["Total Score", String(currentExam.questions.length)]]];
    for (const row of rows2) {
      doc.setDrawColor(200, 200, 200); doc.rect(margin, y, usableW, 10);
      row.forEach(([lbl, val], i) => { const x = margin + cw * i; doc.setFontSize(5.5); doc.setFont("helvetica", "normal"); doc.setTextColor(120, 120, 120); doc.text(lbl.toUpperCase(), x + 2, y + 3.5); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 18); doc.text(val, x + 2, y + 8.5); if (i < 2) { doc.setDrawColor(220, 220, 220); doc.line(x + cw, y, x + cw, y + 10); } }); y += 10;
    }
    y += 5;
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 18);
    doc.text("Student's Name: ___________________________________", margin, y); doc.text("Reg. No: _____________", margin + 118, y); y += 7;
    doc.text("Date: ______________________", margin, y); doc.text(`Score: __________ / ${currentExam.questions.length}`, margin + 118, y); y += 7;
    doc.setFillColor(245, 243, 238); doc.rect(margin, y, usableW, 22, "F"); doc.setDrawColor(180, 180, 180); doc.rect(margin, y, usableW, 22);
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.text("INSTRUCTIONS:", margin + 2, y + 4);
    const insts: string[] = [];
    if (mcqN > 0) insts.push(`Answer ALL ${mcqN} objective question${mcqN !== 1 ? "s" : ""} by writing the correct option letter.`);
    if (thN > 0) insts.push(`Answer ALL ${thN} theory question${thN !== 1 ? "s" : ""} in full sentences.`);
    insts.push("Write your name and reg. number clearly before you begin."); insts.push("Mobile phones are NOT allowed in the examination hall.");
    doc.setFont("helvetica", "normal"); insts.forEach((inst, i) => { doc.text(`${i + 1}. ${inst}`, margin + 2, y + 8 + i * 3.8); }); y += 26;
    doc.setDrawColor(20, 20, 18); doc.setLineWidth(0.5); doc.line(margin, y, margin + usableW, y); y += 7;
    const mcqQs = currentExam.questions.filter((q) => q.type !== "theory");
    const thQs = currentExam.questions.filter((q) => q.type === "theory");
    if (mcqQs.length > 0) {
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("SECTION A - OBJECTIVES", margin, y);
      doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.text(`(Choose the correct answer - ${mcqQs.length} marks)`, margin, y + 5); y += 12;
      mcqQs.forEach((q, i) => {
        if (y > 258) { doc.addPage(); y = 15; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
        const qL = doc.splitTextToSize(`${i + 1}. ${q.question}`, usableW); doc.text(qL, margin, y); y += qL.length * 5;
        doc.setFont("helvetica", "normal"); doc.setFontSize(8);
        const ow = usableW / 2;
        q.options.forEach((opt, oi) => {
          const ci = oi % 2, ri = Math.floor(oi / 2), x2 = margin + ci * ow;
          const ol = doc.splitTextToSize(`${LETTERS[oi]}. ${opt}`, ow - 4);
          if (showingAnswers && oi === q.correctAnswer) { doc.setTextColor(26, 107, 60); doc.setFont("helvetica", "bold"); }
          doc.text(ol, x2 + 2, y + ri * 5 + 5); doc.setTextColor(20, 20, 18); doc.setFont("helvetica", "normal");
        }); y += Math.ceil(q.options.length / 2) * 5 + 5;
      });
    }
    if (thQs.length > 0) {
      if (y > 240) { doc.addPage(); y = 15; }
      y += 5; doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("SECTION B - THEORY", margin, y);
      doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.text(`(Answer ALL questions - ${thQs.length} marks)`, margin, y + 5); y += 13;
      thQs.forEach((q, i) => {
        if (y > 250) { doc.addPage(); y = 15; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
        const qL = doc.splitTextToSize(`${mcqQs.length + i + 1}. ${q.question}`, usableW); doc.text(qL, margin, y); y += qL.length * 5 + 4;
        for (let ln = 0; ln < 5; ln++) { doc.setDrawColor(200, 200, 200); doc.line(margin, y + ln * 7, margin + usableW, y + ln * 7); } y += 38;
      });
    }
    if (showingAnswers && mcqQs.length > 0) {
      doc.addPage(); y = 15;
      doc.setFillColor(26, 107, 60); doc.rect(0, 0, 210, 12, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("ANSWER KEY - TEACHER USE ONLY", pageW / 2, 8, { align: "center" }); y = 20;
      doc.setTextColor(20, 20, 18); doc.setFontSize(8); doc.text(`${currentExam.subject} | ${currentExam.class_level} | ${t2} ${s2}`, margin, y); y += 10;
      const kw = usableW / 5;
      mcqQs.forEach((q, i) => { const c3 = i % 5, r3 = Math.floor(i / 5), x3 = margin + c3 * kw, y3 = y + r3 * 12; if (y3 > 270) return; doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(20, 20, 18); doc.text(`${i + 1}.`, x3, y3); doc.setFillColor(26, 107, 60); doc.circle(x3 + 9, y3 - 2, 4, "F"); doc.setTextColor(255, 255, 255); doc.text(LETTERS[q.correctAnswer] || "?", x3 + 9, y3, { align: "center" }); doc.setTextColor(20, 20, 18); });
    }
    doc.save(`${currentExam.subject}_${currentExam.class_level}_${t2}_Exam.pdf`); toast.success("PDF exported");
  };

  const mcqQuestions = currentExam?.questions.filter((q) => q.type !== "theory") || [];
  const theoryQuestions = currentExam?.questions.filter((q) => q.type === "theory") || [];

  return (
    <div className="bg-background h-screen overflow-hidden flex font-sans">
      <Toaster position="top-right" richColors />
      <div className="w-[285px] bg-ink border-r border-ink2 shrink-0 flex flex-col print:hidden overflow-hidden">
        <div className="p-5 border-b border-ink2 shrink-0">
          <Link href="/app" className="flex items-center gap-2 text-gold2 no-underline mb-4 hover:opacity-80 transition-opacity">
            <ChevronLeft /><span className="font-bold text-xs tracking-tight">BACK TO APP</span>
          </Link>
          <div className="flex gap-1">
            {(["create", "history"] as SidebarTab[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-[0.68rem] font-bold transition-all ${activeTab === tab ? "bg-green text-white" : "text-muted hover:bg-white/5 hover:text-white"}`}>
                {tab === "create" ? "⚡ Generate" : "🕐 History"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <AnimatePresence mode="wait">
            {activeTab === "create" ? (
              <motion.div key="create" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-4">
                <div>
                  <eldLabel>Source Mode</eldLabel>
                  <div className="flex gap-1 mt-1.5 p-1 bg-ink2/40 rounded-xl">
                    {([["topic", "⚡", "Topic"], ["document", "📄", "Document"], ["url", "🌐", "URL"]] as [SourceMode, string, string][]).map(([mode, icon, label]) => (
                      <button key={mode} onClick={() => setSourceMode(mode)} className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg text-[0.65rem] font-bold transition-all ${sourceMode === mode ? "bg-green text-white shadow-lg" : "text-muted hover:bg-white/5 hover:text-white"}`}>
                        <span className="text-base">{icon}</span>{label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5"><eldLabel>Subject</eldLabel><SideInput value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" /></div>
                <div className="flex flex-col gap-1.5"><eldLabel>Class Level</eldLabel><SideInput value={classLevel} onChange={(e) => setClassLevel(e.target.value)} placeholder="e.g. JSS 3, SS 2" /></div>
                <AnimatePresence mode="wait">
                  {sourceMode === "topic" && (
                    <motion.div key="topic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-1.5">
                      <eldLabel>Topic / Lesson Notes</eldLabel>
                      <SideTextarea rows={5} value={topicText} onChange={(e) => setTopicText(e.target.value)} placeholder="e.g. Photosynthesis in plants, or paste your full lesson note here..." />
                    </motion.div>
                  )}
                  {sourceMode === "document" && (
                    <motion.div key="document" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2.5">
                      <eldLabel>Upload PDF, DOC, or DOCX</eldLabel>
                      <DocumentUploadZone onTextExtracted={(text, filename) => { setDocumentText(text); setDocumentFilename(filename); }} />
                      <div className="flex items-center gap-2 text-[0.6rem] text-muted"><div className="flex-1 border-t border-ink2" />OR<div className="flex-1 border-t border-ink2" /></div>
                      <eldLabel>Paste Text Directly</eldLabel>
                      <SideTextarea rows={3} value={documentText} onChange={(e) => setDocumentText(e.target.value)} placeholder="Paste scheme of work, lesson note, or textbook content here..." />
                      {documentFilename && <div className="flex items-center gap-1.5 text-[0.62rem] text-green font-semibold"><CheckCircle size={10} /> {documentFilename} · {(documentText.length / 1000).toFixed(1)}k chars</div>}
                    </motion.div>
                  )}
                  {sourceMode === "url" && (
                    <motion.div key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-1.5">
                      <eldLabel>Web Page URL</eldLabel>
                      <SideInput type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://..." />
                      <p className="text-[0.6rem] text-muted leading-relaxed">The AI will fetch this page and generate questions from its content.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="pt-3 border-t border-ink2">
                  <div className="text-[0.58rem] font-black text-muted uppercase tracking-widest mb-3">Exam Settings</div>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1"><eldLabel>Term</eldLabel><SideSelect value={term} onChange={(e) => setTerm(e.target.value)}>{TERMS.map((t) => <option key={t}>{t}</option>)}</SideSelect></div>
                      <div className="flex flex-col gap-1"><eldLabel>Session</eldLabel><SideInput value={session} onChange={(e) => setSession(e.target.value)} placeholder="2025/2026" /></div>
                    </div>
                    <div className="flex flex-col gap-1"><eldLabel>Exam Type</eldLabel><SideSelect value={examType} onChange={(e) => setExamType(e.target.value)}>{EXAM_TYPES.map((t) => <option key={t}>{t}</option>)}</SideSelect></div>
                    <div className="flex flex-col gap-1"><eldLabel>Duration</eldLabel><SideSelect value={duration} onChange={(e) => setDuration(e.target.value)}>{DURATIONS.map((d) => <option key={d}>{d}</option>)}</SideSelect></div>
                    <div className="flex flex-col gap-1">
                      <eldLabel>Question Type</eldLabel>
                      <div className="flex gap-1">
                        {(["mcq", "theory", "mixed"] as QuestionType[]).map((qt) => (
                          <button key={qt} onClick={() => setQuestionType(qt)} className={`flex-1 py-1.5 rounded-lg text-[0.6rem] font-bold border transition-all ${questionType === qt ? "bg-green border-green text-white" : "border-ink2 text-muted hover:border-green/50 hover:text-white"}`}>
                            {qt === "mcq" ? "MCQ" : qt === "theory" ? "Theory" : "Mixed"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <eldLabel>Questions: {count}</eldLabel>
                      <input type="range" min={5} max={50} step={5} value={count} onChange={(e) => setCount(parseInt(e.target.value))} className="w-full accent-green h-1.5 bg-ink2 rounded-lg appearance-none cursor-pointer" />
                      <div className="flex justify-between text-[0.52rem] text-muted"><span>5</span><span>50</span></div>
                    </div>
                  </div>
                </div>
                <button onClick={generateExam} disabled={generating} className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${generating ? "bg-green/40 cursor-not-allowed" : "bg-green hover:bg-green2 text-white shadow-lg shadow-green/20"}`}>
                  {generating ? <><Loader className="animate-spin" />{generatingStep || "Generating..."}</> : <><Zap />Generate Exam</>}
                </button>
              </motion.div>
            ) : (
              <motion.div key="history" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-3">
                <div className="text-[0.58rem] font-black text-muted uppercase tracking-widest">Saved Exams ({exams.length})</div>
                {loadingExams ? (<div className="flex justify-center py-8"><LoadingSpinner /></div>) : exams.length === 0 ? (<div className="text-center py-10 text-muted text-xs italic">No exams yet. Generate your first one!</div>) : (
                  exams.map((e) => (
                    <div key={e.id} onClick={() => viewExam(e.id)} className={`group p-3 rounded-xl border cursor-pointer transition-all ${currentExam?.id === e.id ? "bg-green/10 border-green/50" : "border-ink2 hover:bg-white/5 hover:border-green/50"}`}>
                      <div className="flex justify-between items-start mb-1.5">
                        <div className={`font-bold text-xs ${currentExam?.id === e.id ? "text-green" : "text-white group-hover:text-green"}`}>{e.subject}</div>
                        <button onClick={(ev) => { ev.stopPropagation(); setDeleteId(e.id); }} className="p-1 text-muted hover:text-red opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={11} /></button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[0.6rem] bg-ink2/60 text-muted px-1.5 py-0.5 rounded font-semibold">{e.class_level}</span>
                        {e.term && <span className="text-[0.6rem] bg-green/10 text-green px-1.5 py-0.5 rounded font-semibold">{e.term}</span>}
                      </div>
                      <div className="text-[0.58rem] text-muted/50 mt-1.5">{new Date(e.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-[58px] border-b border-border bg-white flex items-center justify-between px-8 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green/10 rounded-xl flex items-center justify-center text-green"><Book size={18} /></div>
            <div>
              <h1 className="text-[1.05rem] font-black tracking-tight">AI Exam Maker</h1>
              <p className="text-[0.63rem] text-muted font-semibold -mt-0.5">{schoolData?.name || "EduReport NG"} · Nigerian Curriculum Format</p>
            </div>
          </div>
          {currentExam && (
            <div className="flex items-center gap-2">
              <button onClick={saveExam} disabled={!isModified || isSaving} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isModified ? "bg-orange text-white shadow-md" : "bg-panel text-muted"}`}>
                {isSaving ? <Loader className="animate-spin" size={13} /> : <Save size={13} />}{isSaving ? "Saving..." : "Save"}
              </button>
              <div className="h-5 w-px bg-border mx-0.5" />
              <button onClick={() => setShowingAnswers(!showingAnswers)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showingAnswers ? "bg-green4 text-green" : "bg-panel text-muted hover:bg-border"}`}>
                {showingAnswers ? <EyeOff size={13} /> : <Eye size={13} />}{showingAnswers ? "Hide Ans." : "Show Ans."}
              </button>
              <button onClick={shuffleQuestions} title="Shuffle" className="p-2 bg-panel text-muted hover:bg-border hover:text-ink rounded-lg transition-all"><RefreshCw size={14} /></button>
              <div className="flex bg-panel rounded-lg p-1 gap-0.5">
                <button onClick={exportPDF} title="Export PDF" className="p-1.5 text-muted hover:text-ink hover:bg-white rounded-md transition-all"><Download size={15} /></button>
                <button onClick={() => window.print()} title="Print" className="p-1.5 text-muted hover:text-ink hover:bg-white rounded-md transition-all"><Printer size={15} /></button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-muted/30 print:p-0 print:bg-white">
          <div className="max-w-[860px] mx-auto">
            <AnimatePresence mode="wait">
              {currentExam ? (
                <motion.div key="exam" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white shadow-2xl rounded-2xl border border-border flex flex-col p-[60px] print:shadow-none print:border-none print:rounded-none print:p-8">
                  <ExamPaperHeader exam={currentExam} schoolData={schoolData} />
                  {mcqQuestions.length > 0 && (
                    <div className="mb-10">
                      <div className="flex items-center gap-3 mb-7">
                        <div className="h-px flex-1 bg-border" />
                        <div className="font-black text-xs tracking-widest uppercase text-ink px-4 py-1.5 border-2 border-ink rounded-full">Section A — Objectives ({mcqQuestions.length} Questions)</div>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <div className="flex flex-col gap-8">
                        {mcqQuestions.map((q, i) => {
                          const gi = currentExam.questions.indexOf(q);
                          return (
                            <div key={gi} className="group relative break-inside-avoid">
                              <div className="absolute -right-12 top-0 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                <button onClick={() => setEditingIndex(editingIndex === gi ? null : gi)} className={`p-1.5 rounded-lg shadow-sm border ${editingIndex === gi ? "bg-gold text-white border-gold" : "bg-white text-muted border-border"}`}>{editingIndex === gi ? <Check size={13} /> : <Edit3 size={13} />}</button>
                                <button onClick={() => deleteQuestion(gi)} className="p-1.5 bg-white text-muted border border-border rounded-lg shadow-sm hover:text-red hover:border-red transition-all"><Trash2 size={13} /></button>
                              </div>
                              {editingIndex === gi ? (
                                <div className="bg-panel/50 p-5 rounded-xl border-2 border-gold/30 print:hidden">
                                  <label className="text-[0.58rem] font-black text-muted uppercase block mb-1">Question</label>
                                  <textarea className="w-full bg-white border border-border rounded-lg p-3 text-[0.9rem] font-bold focus:outline-none focus:border-gold mb-3" value={q.question} onChange={(e) => updateQuestion(gi, { question: e.target.value })} rows={2} />
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    {q.options.map((opt, oi) => (
                                      <div key={oi} className="flex items-center gap-2">
                                        <button onClick={() => updateQuestion(gi, { correctAnswer: oi })} className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[0.6rem] font-black border-2 transition-all ${q.correctAnswer === oi ? "bg-green border-green text-white" : "border-border text-muted"}`}>{LETTERS[oi]}</button>
                                        <input className="flex-1 bg-white border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-gold" value={opt} onChange={(e) => { const opts = [...q.options]; opts[oi] = e.target.value; updateQuestion(gi, { options: opts }); }} />
                                      </div>
                                    ))}
                                  </div>
                                  <label className="text-[0.58rem] font-black text-muted uppercase block mb-1">Explanation</label>
                                  <textarea className="w-full bg-white border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-gold" value={q.explanation || ""} onChange={(e) => updateQuestion(gi, { explanation: e.target.value })} rows={2} />
                                  <div className="mt-3 flex justify-end"><button onClick={() => setEditingIndex(null)} className="px-4 py-2 bg-gold text-white rounded-lg text-xs font-bold">Done</button></div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex gap-3 mb-3">
                                    <span className="font-black text-xl text-muted/25 shrink-0 leading-none mt-0.5">{i + 1}.</span>
                                    <p className="font-bold text-[1rem] text-ink leading-snug">{q.question}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 pl-9">
                                    {q.options.map((opt, oi) => {
                                      const isCorrect = showingAnswers && oi === q.correctAnswer;
                                      return (
                                        <div key={oi} className="flex items-start gap-2.5">
                                          <div className={`w-6 h-6 rounded border-2 shrink-0 flex items-center justify-center text-[0.6rem] font-black transition-all ${isCorrect ? "bg-green border-green text-white" : "border-border bg-cream text-muted"}`}>{LETTERS[oi]}</div>
                                          <span className={`text-[0.9rem] leading-tight ${isCorrect ? "font-bold text-green" : "text-ink2"}`}>{opt}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {showingAnswers && q.explanation && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 ml-9 p-3 bg-green4/60 rounded-lg border-l-4 border-green text-[0.78rem] text-green font-medium italic">
                                      <span className="font-black not-italic uppercase text-[0.52rem] block mb-0.5 opacity-60">Explanation</span>{q.explanation}
                                    </motion.div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {theoryQuestions.length > 0 && (
                    <div className="mb-10">
                      <div className="flex items-center gap-3 mb-7">
                        <div className="h-px flex-1 bg-border" />
                        <div className="font-black text-xs tracking-widest uppercase text-ink px-4 py-1.5 border-2 border-ink rounded-full">Section B — Theory ({theoryQuestions.length} Questions)</div>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <div className="flex flex-col gap-10">
                        {theoryQuestions.map((q, i) => {
                          const gi = currentExam.questions.indexOf(q);
                          const gNum = mcqQuestions.length + i + 1;
                          return (
                            <div key={gi} className="group relative break-inside-avoid">
                              <div className="absolute -right-12 top-0 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                <button onClick={() => setEditingIndex(editingIndex === gi ? null : gi)} className={`p-1.5 rounded-lg shadow-sm border ${editingIndex === gi ? "bg-gold text-white border-gold" : "bg-white text-muted border-border"}`}>{editingIndex === gi ? <Check size={13} /> : <Edit3 size={13} />}</button>
                                <button onClick={() => deleteQuestion(gi)} className="p-1.5 bg-white text-muted border border-border rounded-lg shadow-sm hover:text-red transition-all"><Trash2 size={13} /></button>
                              </div>
                              {editingIndex === gi ? (
                                <div className="bg-panel/50 p-5 rounded-xl border-2 border-gold/30 print:hidden">
                                  <label className="text-[0.58rem] font-black text-muted uppercase block mb-1">Question</label>
                                  <textarea className="w-full bg-white border border-border rounded-lg p-3 text-[0.9rem] font-bold focus:outline-none focus:border-gold mb-3" value={q.question} onChange={(e) => updateQuestion(gi, { question: e.target.value })} rows={3} />
                                  <label className="text-[0.58rem] font-black text-muted uppercase block mb-1">Mark Scheme / Key Points</label>
                                  <textarea className="w-full bg-white border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-gold" value={q.explanation || ""} onChange={(e) => updateQuestion(gi, { explanation: e.target.value })} rows={3} placeholder="Key points for a model answer..." />
                                  <div className="mt-3 flex justify-end"><button onClick={() => setEditingIndex(null)} className="px-4 py-2 bg-gold text-white rounded-lg text-xs font-bold">Done</button></div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex gap-3 mb-4">
                                    <span className="font-black text-xl text-muted/25 shrink-0 leading-none mt-0.5">{gNum}.</span>
                                    <p className="font-bold text-[1rem] text-ink leading-snug">{q.question}</p>
                                  </div>
                                  <div className="pl-9 flex flex-col gap-3">
                                    {Array.from({ length: 6 }).map((_, li) => (<div key={li} className="border-b border-dashed border-muted/25 h-7" />))}
                                  </div>
                                  {showingAnswers && q.explanation && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 ml-9 p-3 bg-blue2 rounded-lg border-l-4 border-blue text-[0.78rem] text-blue font-medium">
                                      <span className="font-black uppercase text-[0.52rem] block mb-0.5 opacity-60">Mark Scheme</span>{q.explanation}
                                    </motion.div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="mt-12 pt-8 border-t border-dashed border-border flex justify-between items-center print:hidden">
                    <button onClick={addQuestion} className="flex items-center gap-2 px-5 py-2.5 bg-panel hover:bg-border rounded-xl font-bold text-sm text-ink2 transition-all"><Plus /> Add Question</button>
                    <div className="flex gap-2">
                      <button onClick={shuffleOptions} className="flex items-center gap-2 px-3 py-2 text-muted hover:text-ink font-bold text-xs rounded-lg hover:bg-panel transition-all"><RefreshCw size={13} /> Shuffle Options</button>
                      <button onClick={shuffleQuestions} className="flex items-center gap-2 px-3 py-2 text-muted hover:text-ink font-bold text-xs rounded-lg hover:bg-panel transition-all"><RefreshCw size={13} /> Shuffle Questions</button>
                    </div>
                  </div>
                  <div className="hidden print:block mt-8 pt-4 border-t border-border text-center text-[0.58rem] text-muted">
                    Powered by EduReport NG · AI Exam Maker · {schoolData?.name}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-28 text-center">
                  <div className="relative mb-8">
                    <div className="w-28 h-28 bg-white shadow-2xl rounded-3xl flex items-center justify-center border border-border"><span className="text-5xl">📝</span></div>
                    <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-green rounded-xl flex items-center justify-center shadow-lg"><Zap size={18} className="text-white" /></div>
                  </div>
                  <h2 className="text-2xl font-black text-ink mb-3 tracking-tight">Nigerian-Format Exam Maker</h2>
                  <p className="text-muted max-w-sm leading-relaxed mb-2 text-sm">Generate print-ready exam papers in seconds from your lesson notes, scheme of work, or any web URL.</p>
                  <p className="text-[0.7rem] text-muted/60 mb-8">MCQ · Theory · Mixed · Nigerian curriculum aligned</p>
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {[{ icon: "⚡", label: "From Topic", sub: "Type a topic or notes" }, { icon: "📄", label: "From Document", sub: "Upload PDF or DOCX" }, { icon: "🌐", label: "From URL", sub: "Paste a web link" }].map((item) => (
                      <div key={item.label} className="p-4 bg-white rounded-2xl border border-border shadow-sm text-center hover:shadow-md hover:border-green/30 transition-all">
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <div className="font-bold text-xs text-ink">{item.label}</div>
                        <div className="text-[0.62rem] text-muted mt-0.5">{item.sub}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab("create")} className="px-6 py-3 bg-green text-white rounded-xl font-black text-sm shadow-lg shadow-green/20 hover:bg-green2 transition-colors flex items-center gap-2"><Zap /> Start Generating</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <ConfirmModal isOpen={!!deleteId} title="Delete Exam?" message="This exam will be permanently removed." confirmLabel="Delete Permanently" variant="danger" onConfirm={deleteExam} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

