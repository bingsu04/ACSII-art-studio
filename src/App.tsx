import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { ImageViewer } from './components/ImageViewer';
import { Toast, ToastMessage } from './components/Toast';
import { AsciiSettings, RenderResult, RenderStats, SampleImage } from './types';
import { renderAsciiToCanvas } from './utils/asciiEngine';
import { SAMPLE_IMAGES } from './data/samples';

const DEFAULT_SETTINGS: AsciiSettings = {
  mode: 'edge', // Default to Curvature / Edge-Aware mode to showcase edge calculation
  columns: 160, // Optimal balance between high density and crisp character legibility
  brightness: 0,
  contrast: 10,
  saturation: 15,
  palette: 'original',
  bgColor: '#000000',
  edgeThreshold: 32,
  brailleThreshold: 125,
  brailleDither: true,
  fontRatioCorrection: 1.9,
  fontSize: 13,
};

export function App() {
  const [settings, setSettings] = useState<AsciiSettings>(DEFAULT_SETTINGS);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('cyberpunk.jpg');
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>('cyberpunk');
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [stats, setStats] = useState<RenderStats | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const renderTimeoutRef = useRef<number | null>(null);

  // Load an image from URL or data URI
  const loadImage = useCallback((src: string, name: string, sampleId: string | null = null) => {
    setIsRendering(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setOriginalImage(img);
      setImageFileName(name);
      setSelectedSampleId(sampleId);
    };
    img.onerror = () => {
      setIsRendering(false);
      setToast({
        id: 'img-error',
        type: 'error',
        title: '이미지 로드 실패',
        description: '이미지를 불러올 수 없습니다. 다른 사진을 선택해 주세요.',
      });
    };
    img.src = src;
  }, []);

  // Initial load: pick the first sample image (Cyberpunk Neon City)
  useEffect(() => {
    const firstSample = SAMPLE_IMAGES[0];
    if (firstSample) {
      loadImage(firstSample.url, firstSample.name, firstSample.id);
    }
  }, [loadImage]);

  // Main Render trigger: debounced and scheduled with requestAnimationFrame
  const triggerRender = useCallback(
    (img: HTMLImageElement, currentSettings: AsciiSettings) => {
      setIsRendering(true);

      if (renderTimeoutRef.current) {
        window.cancelAnimationFrame(renderTimeoutRef.current);
      }

      renderTimeoutRef.current = window.requestAnimationFrame(() => {
        try {
          const result = renderAsciiToCanvas(img, currentSettings, 1);
          setRenderResult(result);
          setStats({
            width: result.canvas.width,
            height: result.canvas.height,
            columns: result.totalColumns,
            rows: result.totalRows,
            charCount: result.totalColumns * result.totalRows,
            renderTimeMs: result.renderTimeMs,
          });
        } catch (err) {
          console.error('Rendering error:', err);
          setToast({
            id: 'render-error',
            type: 'error',
            title: '렌더링 오류',
            description: '아스키 아트 변환 도중 오류가 발생했습니다.',
          });
        } finally {
          setIsRendering(false);
        }
      });
    },
    []
  );

  // Re-render when originalImage or settings change
  useEffect(() => {
    if (originalImage) {
      triggerRender(originalImage, settings);
    }
    return () => {
      if (renderTimeoutRef.current) {
        window.cancelAnimationFrame(renderTimeoutRef.current);
      }
    };
  }, [originalImage, settings, triggerRender]);

  // Handle uploaded file (JPG, PNG, WebP)
  const handleImageSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        loadImage(e.target.result as string, file.name, null);
        setToast({
          id: 'upload-success',
          type: 'success',
          title: '사진 업로드 완료',
          description: `${file.name} 사진이 로드되었습니다.`,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle preset sample selection
  const handleSampleSelect = (sample: SampleImage) => {
    loadImage(sample.url, sample.name, sample.id);
  };

  // Handle Settings modification
  const handleSettingsChange = (newSettings: Partial<AsciiSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Copy pure text to clipboard
  const handleCopyText = async () => {
    if (!renderResult || !renderResult.textOutput) return;

    try {
      await navigator.clipboard.writeText(renderResult.textOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);

      const count = (renderResult.totalColumns * renderResult.totalRows).toLocaleString();
      setToast({
        id: 'copy-success',
        type: 'success',
        title: '클립보드에 복사되었습니다!',
        description: `총 ${count}자의 아스키 텍스트가 복사되었습니다.`,
      });
    } catch (err) {
      console.error('Failed to copy text:', err);
      setToast({
        id: 'copy-fail',
        type: 'error',
        title: '복사 실패',
        description: '클립보드 접근 권한을 확인해 주세요.',
      });
    }
  };

  // Export as PNG (1x or 2x Ultra-HD)
  const handleDownloadPng = (scale: number = 1) => {
    if (!originalImage) return;

    try {
      setIsRendering(true);
      // Generate clean high-resolution canvas with requested scale
      const exported = renderAsciiToCanvas(originalImage, settings, scale);

      exported.canvas.toBlob((blob) => {
        setIsRendering(false);
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const modeLabel = settings.mode;
        const resolutionLabel = scale === 2 ? '2x-UltraHD' : '1x';
        const baseName = imageFileName.replace(/\.[^/.]+$/, '');
        a.download = `ASCII_${baseName}_${modeLabel}_${resolutionLabel}.png`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setToast({
          id: 'download-success',
          type: 'success',
          title: 'PNG 다운로드 완료!',
          description: `${exported.canvas.width} × ${exported.canvas.height}px (${resolutionLabel}) 이미지로 저장되었습니다.`,
        });
      }, 'image/png');
    } catch (err) {
      setIsRendering(false);
      console.error('Failed to download PNG:', err);
      setToast({
        id: 'download-fail',
        type: 'error',
        title: '다운로드 실패',
        description: 'PNG 내보내기 중 문제가 발생했습니다.',
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090a0f] text-slate-100 font-sans">
      {/* Top Header */}
      <Header
        currentMode={settings.mode}
        onCopyText={handleCopyText}
        onDownloadPng={handleDownloadPng}
        hasImage={!!originalImage}
        copied={copied}
      />

      {/* Main Studio Body: Viewport + Control Panel */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Center/Left Large Interactive Image Viewer */}
        <ImageViewer
          originalImage={originalImage}
          renderResult={renderResult}
          stats={stats}
          isRendering={isRendering}
          bgColor={settings.bgColor}
        />

        {/* Right Docked Studio Control Panel */}
        <ControlPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onImageSelected={handleImageSelected}
          onSampleSelect={handleSampleSelect}
          selectedSampleId={selectedSampleId}
          imageFileName={imageFileName}
        />
      </div>

      {/* Floating Notification Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default App;
