import React from 'react';
import { Terminal, Download, Copy, Sparkles, Check } from 'lucide-react';
import { RenderMode } from '../types';

interface HeaderProps {
  currentMode: RenderMode;
  onCopyText: () => void;
  onDownloadPng: (scale: number) => void;
  hasImage: boolean;
  copied: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onCopyText,
  onDownloadPng,
  hasImage,
  copied,
}) => {
  const [downloadMenuOpen, setDownloadMenuOpen] = React.useState(false);

  // Close download menu on outside click
  React.useEffect(() => {
    const close = () => setDownloadMenuOpen(false);
    if (downloadMenuOpen) {
      window.addEventListener('click', close);
      return () => window.removeEventListener('click', close);
    }
  }, [downloadMenuOpen]);

  return (
    <header className="h-14 border-b border-white/10 bg-[#0c0e14] px-4 flex items-center justify-between shrink-0 z-30 select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-[#0d1017] rounded-[11px] flex items-center justify-center text-indigo-400">
            <Terminal size={18} />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              ASCII Studio
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                Ultra-HD
              </span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            초고밀도 컬러 아스키 & 곡률 보정 스튜디오
          </p>
        </div>
      </div>

      {/* Action Buttons: Export PNG & Copy Text */}
      <div className="flex items-center gap-2">
        {/* Copy Text Button (Only for Classic, Edge, Braille modes) */}
        {currentMode !== 'halfblock' && (
          <button
            onClick={onCopyText}
            disabled={!hasImage}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              copied
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-slate-700 hover:border-white/20 active:scale-95 disabled:opacity-40 disabled:pointer-events-none'
            }`}
            title="텍스트 문자열 클립보드 복사"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? '복사됨!' : 'Copy Text'}</span>
          </button>
        )}

        {/* Download PNG with resolution dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDownloadMenuOpen((v) => !v);
            }}
            disabled={!hasImage}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download size={14} />
            <span>Download PNG</span>
          </button>

          {downloadMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-white/15 shadow-2xl p-1.5 z-50 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                PNG 해상도 선택
              </div>
              <button
                onClick={() => {
                  onDownloadPng(1);
                  setDownloadMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-indigo-600/30 hover:text-white flex items-center justify-between transition"
              >
                <span>1x 표준 고해상도</span>
                <span className="text-[10px] font-mono text-slate-400">100%</span>
              </button>
              <button
                onClick={() => {
                  onDownloadPng(2);
                  setDownloadMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-indigo-600/30 hover:text-white flex items-center justify-between transition"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-cyan-400" />
                  <span>2x 초고화질 (Ultra-HD)</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300">200%</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
