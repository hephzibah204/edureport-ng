import { useState } from "react";
import { X, Mail, MessageCircle, Link, Check, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  reportLink?: string;
}

export default function ShareReportModal({ isOpen, onClose, studentName, reportLink }: ShareReportModalProps) {
  const [copied, setCopied] = useState(false);
  const fallbackLink = `https://portal.edureport.ng/report/${Math.random().toString(36).substring(7)}`;
  const finalLink = reportLink || fallbackLink;

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(finalLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = `Hello, here is the academic report card for ${studentName}. You can view it here: ${finalLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleEmail = () => {
    const subject = `Academic Report Card: ${studentName}`;
    const body = `Hello,\n\nPlease find the academic report card for ${studentName} at the following link:\n\n${finalLink}\n\nBest regards,\nSchool Administration`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSMS = () => {
    const text = `Report card for ${studentName} is ready: ${finalLink}`;
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">Share Report Card</h2>
            <p className="text-indigo-100 text-xs mt-1 font-medium">Share {studentName}&apos;s result via multiple channels.</p>
          </div>
          <button onClick={onClose} className="p-2 bg-indigo-500/50 hover:bg-indigo-500 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Action Grid */}
          <div className="grid grid-cols-3 gap-4">
            <button 
              onClick={handleWhatsApp}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-2xl transition-all"
            >
              <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center shadow-md">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">WhatsApp</span>
            </button>
            
            <button 
              onClick={handleEmail}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl transition-all"
            >
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">Email</span>
            </button>

            <button 
              onClick={handleSMS}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-2xl transition-all"
            >
              <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-md">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">SMS</span>
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs font-bold text-slate-400 uppercase tracking-widest">or copy link</span></div>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="text" 
              readOnly 
              value={finalLink}
              className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 focus:outline-none"
            />
            <button 
              onClick={handleCopyLink}
              className="px-4 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all flex items-center gap-2 font-bold text-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
