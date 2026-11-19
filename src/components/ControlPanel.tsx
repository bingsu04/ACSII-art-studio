import React, { useRef } from 'react';
import {
  UploadCloud,
  Sliders,
  Palette,
  Eye,
  Type,
  Sun,
  Contrast,
  Droplets,
  Layers,
  Sparkles,
  CircleDot,
  Grid,
} from 'lucide-react';
import { AsciiSettings, ColorPalette, RenderMode, SampleImage } from '../types';
import { SAMPLE_IMAGES } from '../data/samples';

interface ControlPanelProps {
  settings: AsciiSettings;
  onSettingsChange: (newSettings: Partial<AsciiSettings>) => void;
  onImageSelected: (file: File) => void;
  onSampleSelect: (sample: SampleImage) => void;
  selectedSampleId: string | null;
  imageFileName?: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onSettingsChange,
  onImageSelected,
  onSampleSelect,
  selectedSampleId,
  imageFileName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  // File Drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelected(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  // 4 Rendering Modes specifications
  const MODES: { id: RenderMode; name: string; tag: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'classic',
      name: 'Classic ASCII',
      tag: 'Luminance',
      desc: '밝기를 밀도 문자열(@%#*+=-:. )로 표현',
      icon: <Type size={16} />,
    },
    {
      id: 'edge',
      name: 'Curvature Edge',
      tag: 'Sobel 3x3',
      desc: '소벨 필터로 윤곽선 곡률 및 각도 정밀 표현 (/, \\, |, -)',
      icon: <Layers size={16} />,
    },
    {
      id: 'braille',
      name: 'Ultra-Fine Braille',
      tag: '8x Subpixel',
      desc: '유니코드 점자 2x4 서브픽셀로 극도로 정밀한 디테일',
      icon: <CircleDot size={16} />,
    },
    {
      id: 'halfblock',
      name: 'True-Color Block',
      tag: 'Zero Gaps',
      desc: '하프 블록(▀) 글자색/배경색 듀얼 렌더로 무결점 원색 복원',
      icon: <Grid size={16} />,
    },
  ];

  // 5 Color Palettes
  const PALETTES: { id: ColorPalette; name: string; preview: string; desc: string }[] = [
    {
      id: 'original',
      name: 'Original Color',
      preview: 'linear-gradient(135deg, #f43f5e, #8b5cf6, #06b6d4)',
      desc: '원본 사진의 색조와 색채 그대로 렌더링',
    },
    {
      id: 'matrix',
      name: 'Matrix Green',
      preview: 'linear-gradient(135deg, #052e16, #22c55e, #86efac)',
      desc: '클래식 CRT 터미널 형광 그린 감성',
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Neon',
      preview: 'linear-gradient(135deg, #701a75, #ec4899, #06b6d4)',
      desc: '형광 네온 핑크, 일렉트릭 시안, 바이올렛',
    },
    {
      id: 'monochrome',
      name: 'Monochrome',
      preview: 'linear-gradient(135deg, #09090b, #71717a, #fafafa)',
      desc: '클래식 흑백 그레이스케일 아스키',
    },
    {
      id: 'invert',
      name: 'Invert Color',
      preview: 'linear-gradient(135deg, #f59e0b, #3b82f6, #ec4899)',
      desc: 'RGB 보색 반전의 사이키델릭한 효과',
    },
  ];

  return (
    <aside className="w-80 md:w-88 xl:w-96 h-full bg-[#0d0f17] border-l border-white/10 flex flex-col shrink-0 overflow-y-auto text-slate-200">
      <div className="p-4 space-y-6">
        {/* Section 1: Image Upload & Samples */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <UploadCloud size={14} className="text-indigo-400" />
              <span>사진 업로드 & 샘플</span>
            </label>
            {imageFileName && (
              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                {imageFileName}
              </span>
            )}
          </div>

          {/* Drag & Drop Box */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                : 'border-white/15 bg-slate-900/40 hover:border-indigo-500/50 hover:bg-slate-900/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-1.5 py-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <UploadCloud size={18} />
              </div>
              <div className="text-xs font-medium text-slate-200">
                사진을 드래그하거나 클릭하여 업로드
              </div>
              <div className="text-[11px] text-slate-400">JPG, PNG, WebP 지원 (정지 이미지 전용)</div>
            </div>
          </div>

          {/* Built-in Sample High-Resolution Images */}
          <div className="mt-3">
            <div className="text-[11px] text-slate-400 mb-1.5 font-medium">
              즉시 감상 가능한 고화질 샘플:
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onSampleSelect(sample)}
                  className={`relative group rounded-lg overflow-hidden aspect-square border-2 transition-all ${
                    selectedSampleId === sample.id
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-105 shadow-lg'
                      : 'border-white/10 hover:border-white/30 opacity-75 hover:opacity-100'
                  }`}
                  title={`${sample.name} - ${sample.description}`}
                >
                  <img
                    src={sample.url}
                    alt={sample.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                    <span className="text-[9px] text-white font-medium truncate leading-tight">
                      {sample.name.split(' ')[0]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: 4 Rendering Modes */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-400" />
              <span>렌더링 모드 (4가지)</span>
            </label>
          </div>

          <div className="space-y-2">
            {MODES.map((mode) => {
              const active = settings.mode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onSettingsChange({ mode: mode.id })}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all relative overflow-hidden group ${
                    active
                      ? 'bg-indigo-600/15 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                      : 'bg-slate-900/40 border-white/10 hover:border-white/20 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                          active
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {mode.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-100">{mode.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                        active
                          ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {mode.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug pl-8">{mode.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Resolution & Aspect Ratio */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={14} className="text-indigo-400" />
              <span>디테일 (해상도)</span>
            </label>
            <span className="text-xs font-mono font-bold text-indigo-400">
              {settings.columns} Columns
            </span>
          </div>

          <div>
            <input
              type="range"
              min="60"
              max="400"
              step="5"
              value={settings.columns}
              onChange={(e) => onSettingsChange({ columns: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>60 (경쾌한 도트)</span>
              <span>200 (균형)</span>
              <span>400 (초고밀도 곡률)</span>
            </div>
          </div>

          {/* Mode-specific fine-tuning */}
          {settings.mode === 'edge' && (
            <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-300 font-medium">소벨 윤곽선 감도 (Edge Threshold)</span>
                <span className="font-mono text-indigo-400">{settings.edgeThreshold}</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="2"
                value={settings.edgeThreshold}
                onChange={(e) => onSettingsChange({ edgeThreshold: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                수치가 낮을수록 미세한 곡선과 질감까지 윤곽선 문자로 포착합니다.
              </p>
            </div>
          )}

          {settings.mode === 'braille' && (
            <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-300 font-medium">점자 활성화 밝기 (Threshold)</span>
                <span className="font-mono text-indigo-400">{settings.brailleThreshold}</span>
              </div>
              <input
                type="range"
                min="30"
                max="220"
                step="5"
                value={settings.brailleThreshold}
                onChange={(e) => onSettingsChange({ brailleThreshold: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-300">부드러운 디더링 (Bayer Matrix)</span>
                <button
                  onClick={() => onSettingsChange({ brailleDither: !settings.brailleDither })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    settings.brailleDither ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                      settings.brailleDither ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Monospace Vertical Ratio Correction */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>폰트 세로 비율 보정 (stepY / stepX)</span>
              <span className="font-mono text-indigo-400">{settings.fontRatioCorrection.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1.6"
              max="2.3"
              step="0.05"
              value={settings.fontRatioCorrection}
              onChange={(e) => onSettingsChange({ fontRatioCorrection: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Section 4: Image Adjustments */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Eye size={14} className="text-indigo-400" />
            <span>이미지 보정</span>
          </label>

          {/* Brightness */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sun size={13} className="text-amber-400" />
                <span>밝기 (Brightness)</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {settings.brightness > 0 ? `+${settings.brightness}` : settings.brightness}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="2"
              value={settings.brightness}
              onChange={(e) => onSettingsChange({ brightness: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Contrast size={13} className="text-cyan-400" />
                <span>대비 (Contrast)</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {settings.contrast > 0 ? `+${settings.contrast}` : settings.contrast}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="2"
              value={settings.contrast}
              onChange={(e) => onSettingsChange({ contrast: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Droplets size={13} className="text-rose-400" />
                <span>채도 (Saturation)</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {settings.saturation > 0 ? `+${settings.saturation}` : settings.saturation}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="2"
              value={settings.saturation}
              onChange={(e) => onSettingsChange({ saturation: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Reset adjustments button */}
          {(settings.brightness !== 0 || settings.contrast !== 0 || settings.saturation !== 0) && (
            <button
              onClick={() => onSettingsChange({ brightness: 0, contrast: 0, saturation: 0 })}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              보정값 초기화
            </button>
          )}
        </div>

        {/* Section 5: Color Palette & Background */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Palette size={14} className="text-indigo-400" />
            <span>컬러 팔레트</span>
          </label>

          <div className="space-y-1.5">
            {PALETTES.map((pal) => {
              const active = settings.palette === pal.id;
              return (
                <button
                  key={pal.id}
                  onClick={() => onSettingsChange({ palette: pal.id })}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-all ${
                    active
                      ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500/50 shadow'
                      : 'bg-slate-900/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                      style={{ background: pal.preview }}
                    />
                    <span className="font-medium text-slate-200">{pal.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {pal.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Background Color toggle */}
          <div className="pt-2">
            <div className="text-[11px] text-slate-400 mb-1.5 font-medium">배경색 (Background)</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSettingsChange({ bgColor: '#000000' })}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition ${
                  settings.bgColor === '#000000'
                    ? 'border-indigo-500 bg-slate-800 ring-1 ring-indigo-500/50'
                    : 'border-white/10 bg-slate-900/50 hover:border-white/20'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/30" />
                <span>순수 블랙 (#000)</span>
              </button>

              <button
                onClick={() => onSettingsChange({ bgColor: '#111318' })}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition ${
                  settings.bgColor === '#111318'
                    ? 'border-indigo-500 bg-slate-800 ring-1 ring-indigo-500/50'
                    : 'border-white/10 bg-slate-900/50 hover:border-white/20'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[#111318] border border-white/30" />
                <span>다크 그레이 (#111)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
