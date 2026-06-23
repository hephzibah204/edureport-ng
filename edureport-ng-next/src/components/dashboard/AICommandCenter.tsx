"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Loader2, Sparkles, Command } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";

export const AICommandCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;

    const userCommand = command.trim();
    setMessages(prev => [...prev, { role: 'user', content: userCommand }]);
    setCommand("");
    setIsProcessing(true);

    try {
      const res = await fetch('/api/ai-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ command: userCommand })
      });

      if (res.ok) {
        const data = await res.json() as any;
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply || "Action processed successfully." }]);
        if (data.intent !== "unknown") {
            toast.success("AI Command Executed");
        }
      } else {
        const err = await res.json() as any;
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.error?.message || "Something went wrong."}` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Failed to connect to AI service." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-8 right-8 w-14 h-14 rounded-2xl bg-[#0b1c30] text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100] group",
          isOpen && "opacity-0 pointer-events-none"
        )}
      >
        <div className="absolute inset-0 rounded-2xl bg-indigo-600 animate-ping opacity-20 group-hover:opacity-40" />
        <Bot className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[#0b1c30]/10 backdrop-blur-[2px] z-[101]"
            />

            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
              className="fixed bottom-8 right-8 w-full max-w-[400px] h-[550px] glass shadow-2xl rounded-[2.5rem] border-white/60 overflow-hidden flex flex-col z-[102]"
            >
              {/* Header */}
              <div className="p-6 bg-[#0b1c30] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm tracking-tight">AI Command Center</h3>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Powered by Llama 3</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col justify-center space-y-6 py-4">
                    <div className="flex flex-col items-center justify-center text-center space-y-3 opacity-80">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-[#0b1c30]/5">
                        <Command className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0b1c30]">How can I help you today?</p>
                        <p className="text-[11px] font-medium text-[#464555]/60 mt-0.5">Click a quick command template below to get started:</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { label: "Record Score", cmd: "Record 85% in Mathematics for John" },
                        { label: "AI Comments", cmd: "Generate comments for JSS 1" },
                        { label: "Search Student", cmd: "Search student Adamu" },
                        { label: "General Q&A", cmd: "How do I upgrade my school subscription?" }
                      ].map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCommand(tmpl.cmd)}
                          className="w-full p-3.5 text-left bg-white border border-[#0b1c30]/5 rounded-xl shadow-sm hover:border-indigo-600/30 hover:bg-indigo-50/20 active:scale-[0.99] transition-all flex flex-col gap-0.5 group"
                        >
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{tmpl.label}</span>
                          <span className="text-xs font-semibold text-[#0b1c30] group-hover:text-indigo-950 transition-colors">"{tmpl.cmd}"</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-sm",
                      msg.role === 'user' 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-white text-[#0b1c30] rounded-tl-none border border-[#0b1c30]/5"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-[#0b1c30]/5 shadow-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">AI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-gray-100">
                <form onSubmit={handleSubmit} className="relative group">
                  <input
                    autoFocus
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Type a command..."
                    className="w-full pl-5 pr-14 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600/20 transition-all placeholder:text-[#464555]/30"
                  />
                  <button 
                    disabled={!command.trim() || isProcessing}
                    className="absolute right-2 top-2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-indigo-600/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="mt-4 flex items-center gap-2 px-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-extrabold text-[#464555]/40 uppercase tracking-widest">AI Agent Online</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
