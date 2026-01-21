'use client';

import React from 'react';
import { Layers } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-100 tracking-tight">TeamSync</span>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
          Documentation
        </button>
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-400">
          US
        </div>
      </div>
    </nav>
  );
}