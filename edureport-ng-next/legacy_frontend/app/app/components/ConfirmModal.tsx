"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'primary'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-card-bg rounded-[20px] w-full max-w-md shadow-2xl overflow-hidden border border-border"
          >
            <div className="p-6">
              <h3 className="font-display font-black text-xl text-ink mb-2">{title}</h3>
              <p className="text-muted text-sm leading-relaxed">{message}</p>
            </div>
            <div className="px-6 py-4 bg-panel flex justify-end gap-3 border-t border-border">
              <button 
                onClick={onCancel}
                className="btn btn-ghost btn-sm"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`btn btn-sm ${variant === 'danger' ? 'btn-red' : 'btn-primary'}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
