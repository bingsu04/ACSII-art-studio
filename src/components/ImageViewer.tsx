import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  SplitSquareVertical,
  Image as ImageIcon,
  Terminal,
  Move,
} from 'lucide-react';
import { RenderResult, RenderStats } from '../types';

interface ImageViewerProps {
  originalImage: HTMLImageElement | null;
  renderResult: RenderResult | null;
  stats: RenderStats | null;
  isRendering: boolean;
  bgColor: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  originalImage,
  renderResult,
  stats,
  isRendering,
  bgColor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport transforms (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  // Split Comparison Slider (0 to 100%)
  const [splitPos, setSplitPos] = useState<number>(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'ascii' | 'original'>('split');

  // Copy rendered canvas to display canvas whenever renderResult changes
  useEffect(() => {
    if (!renderResult || !displayCanvasRef.current) return;
    const canvas = displayCanvasRef.current;
    canvas.width = renderResult.canvas.width;
    canvas.height = renderResult.canvas.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(renderResult.canvas, 0, 0);
    }
  }, [renderResult]);

  // Fit image to view container on initial load or image change
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current || !renderResult) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const { width, height } = renderResult.canvas;

    if (width === 0 || height === 0) return;

    const padding = 40;
    const scaleX = (clientWidth - padding) / width;
    const scaleY = (clientHeight - padding) / height;
    const newZoom = Math.min(scaleX, scaleY, 1.2); // avoid over-enlarging low-res

    setZoom(Math.max(0.1, newZoom));
    setPan({ x: 0, y: 0 });
  }, [renderResult]);

  // Auto-fit whenever a new image or resolution is rendered
  useEffect(() => {
    handleFitToScreen();
  }, [handleFitToScreen]);

  // Handle Zoom via mouse wheel
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.08, Math.min(15, zoom * zoomFactor));

    // Focal zoom towards mouse position
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    const dx = (mouseX - pan.x) * (1 - zoomFactor);
    const dy = (mouseY - pan.y) * (1 - zoomFactor);

    setZoom(newZoom);
    setPan((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  };

  // Handle Pan dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Left click only
    if (e.button !== 0) return;

    // Check if clicking near the split slider handle
    if (isDraggingSplit) return;

    setIsPanning(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingSplit && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const contentW = renderResult?.canvas.width || 800;
      // Calculate image's actual screen bounds considering pan and zoom
      const imageLeft = rect.left + rect.width / 2 + pan.x - (contentW * zoom) / 2;
      const imageScreenWidth = contentW * zoom;

      if (imageScreenWidth > 0) {
        const percentage = Math.max(
          0,
          Math.min(100, ((e.clientX - imageLeft) / imageScreenWidth) * 100)
        );
        setSplitPos(percentage);
      }
      return;
    }

    if (isPanning) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
  };

  // Compute effective split percentage based on current viewMode
  const effectiveSplit = viewMode === 'original' ? 100 : viewMode === 'ascii' ? 0 : splitPos;

  const contentWidth = renderResult?.canvas.width || 800;
  const contentHeight = renderResult?.canvas.height || 600;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full w-full overflow-hidden select-none bg-[#07080b] flex items-center justify-center cursor-grab active:cursor-grabbing"
      style={{ backgroundColor: bgColor === '#000000' ? '#050507' : '#0a0c12' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background grid subtle pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main Viewport Content with Zoom & Pan */}
      <div
        className="relative transition-transform duration-75 ease-out shadow-2xl rounded-sm will-change-transform"
        style={{
          width: `${contentWidth}px`,
          height: `${contentHeight}px`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Layer 1: ASCII Art Canvas (Always present underneath) */}
        <canvas
          ref={displayCanvasRef}
          className="absolute inset-0 w-full h-full block"
          style={{
            backgroundColor: bgColor,
            imageRendering: 'pixelated',
          }}
        />

        {/* Layer 2: Original Image for Before/After Split */}
        {originalImage && effectiveSplit > 0 && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{
              clipPath: `inset(0 ${100 - effectiveSplit}% 0 0)`,
            }}
          >
            <img
              src={originalImage.src}
              alt="Original"
              className="w-full h-full object-fill block"
              draggable={false}
            />
          </div>
        )}

        {/* Before / After Divider Line & Handle (Only in Split View) */}
        {viewMode === 'split' && (
          <div
            className="absolute top-0 bottom-0 pointer-events-auto cursor-ew-resize z-20 group"
            style={{
              left: `${splitPos}%`,
              transform: 'translateX(-50%)',
              width: '28px',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingSplit(true);
            }}
          >
            {/* Vertical glowing divider line */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] group-hover:bg-cyan-400 group-hover:shadow-[0_0_12px_rgba(6,182,212,1)]" />

            {/* Circular grab thumb button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-indigo-400 shadow-xl flex items-center justify-center text-indigo-300 group-hover:scale-110 group-hover:border-cyan-400 group-hover:text-cyan-200 transition-all">
              <SplitSquareVertical size={16} />
            </div>

            {/* Floating Tag Indicators */}
            <div className="absolute top-4 left-[-72px] px-2 py-0.5 rounded bg-black/80 backdrop-blur border border-white/10 text-[10px] font-mono text-slate-300 pointer-events-none whitespace-nowrap shadow">
              Original
            </div>
            <div className="absolute top-4 right-[-64px] px-2 py-0.5 rounded bg-black/80 backdrop-blur border border-white/10 text-[10px] font-mono text-indigo-300 pointer-events-none whitespace-nowrap shadow">
              ASCII
            </div>
          </div>
        )}
      </div>

      {/* Rendering Loading Spinner Overlay */}
      {isRendering && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-30 pointer-events-none">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-indigo-200 shadow-2xl">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">초고밀도 렌더링 연산 중...</span>
          </div>
        </div>
      )}

      {/* Floating Top-Center Mode Indicator / Split Toggle Pills */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-xl">
        <button
          onClick={() => setViewMode('split')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'split'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="원본 사진과 아스키 아트를 슬라이더로 실시간 비교"
        >
          <SplitSquareVertical size={14} />
          <span>Before / After</span>
        </button>

        <button
          onClick={() => setViewMode('ascii')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'ascii'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="아스키 아트 결과물만 전체 표시"
        >
          <Terminal size={14} />
          <span>ASCII Only</span>
        </button>

        <button
          onClick={() => setViewMode('original')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'original'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="원본 이미지 전체 확인"
        >
          <ImageIcon size={14} />
          <span>Original Only</span>
        </button>
      </div>

      {/* Bottom Floating Toolbar: Zoom, Pan, Fit, Stats */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.1, z * 0.85))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            title="축소 (마우스 휠 가능)"
          >
            <ZoomOut size={16} />
          </button>

          <span className="text-xs font-mono font-medium text-slate-200 min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => setZoom((z) => Math.min(15, z * 1.18))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            title="확대 (마우스 휠 가능)"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        <div className="w-[1px] h-4 bg-white/10" />

        {/* Fit to View & Reset Pan */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleFitToScreen}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="화면에 맞추기"
          >
            <Maximize2 size={14} />
            <span>Fit</span>
          </button>

          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            title="100% 원본 배율 및 위치 초기화"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Render Stats HUD */}
        {stats && (
          <>
            <div className="w-[1px] h-4 bg-white/10 shrink-0" />
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-slate-400 whitespace-nowrap">
              <span className="flex items-center gap-1.5 text-indigo-300 font-medium whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 inline-block" />
                {stats.columns} × {stats.rows} 칸
              </span>
              <span className="whitespace-nowrap">{(stats.charCount).toLocaleString()} 글자</span>
              <span className="text-slate-500 whitespace-nowrap">{stats.renderTimeMs}ms</span>
            </div>
          </>
        )}
      </div>

      {/* Guide tooltip at top right */}
      <div className="absolute top-4 right-4 z-10 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur border border-white/5 text-[11px] text-slate-400 pointer-events-none">
        <Move size={12} className="text-indigo-400" />
        <span>휠로 확대/축소 · 드래그로 이동</span>
      </div>
    </div>
  );
};
