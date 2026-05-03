'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'text/html') {
      setFile(selected);
      setError(null);
      setSuccess(false);
    } else {
      setError('Please select a valid .html file');
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Conversion failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.html', '')}_notebooklm.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20 relative">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 mb-6 backdrop-blur-md">
            <Sparkles className="w-3 h-3" />
            Optimized for Google NotebookLM
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            HTML to Full PDF
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Convert saved conversations into clean, searchable PDFs. 
            All images, diagrams, and text are preserved in high fidelity.
          </p>
        </motion.div>

        {/* Upload Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative group"
        >
          <input
            type="file"
            accept=".html"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-500
              ${file ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10 hover:border-white/20 bg-white/2'}
              flex flex-col items-center justify-center py-16 px-6
            `}
          >
            <div className={`
              w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500
              ${file ? 'bg-purple-500 text-white scale-110 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-white/5 text-gray-400 group-hover:scale-105'}
            `}>
              {file ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
            </div>
            
            <h3 className="text-xl font-semibold mb-2">
              {file ? file.name : 'Choose an HTML file'}
            </h3>
            <p className="text-gray-500 text-sm">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Drag and drop or click to upload'}
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              disabled={!file || isConverting}
              onClick={handleConvert}
              className={`
                w-full max-w-xs py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3
                ${!file || isConverting 
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5' 
                  : 'bg-white text-black hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-white/10'}
              `}
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generate PDF
                </>
              )}
            </button>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm mt-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-green-400 text-sm mt-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Conversion successful!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm"
        >
          {[
            { title: 'Full Layout', desc: 'Surgically expands scrollable chat windows.' },
            { title: 'Images Intact', desc: 'Diagrams and equations preserved for NotebookLM.' },
            { title: 'UI Cleaned', desc: 'Automatically removes sidebars and buttons.' }
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/2 border border-white/5">
              <h4 className="font-semibold mb-1 text-purple-300">{item.title}</h4>
              <p className="text-gray-500">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
