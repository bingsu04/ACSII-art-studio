export type RenderMode = 'classic' | 'edge' | 'braille' | 'halfblock';

export type ColorPalette = 'original' | 'matrix' | 'cyberpunk' | 'monochrome' | 'invert';

export interface AsciiSettings {
  mode: RenderMode;
  columns: number; // 60 - 400
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  palette: ColorPalette;
  bgColor: string; // '#000000' | '#111318' | '#0f172a'
  edgeThreshold: number; // 10 to 100
  brailleThreshold: number; // 0 to 255
  brailleDither: boolean; // adaptive dithering for ultra-fine gradients
  fontRatioCorrection: number; // typically 1.8 - 2.0
  fontSize: number; // px font size for canvas rendering
  customChars?: string;
}

export interface SampleImage {
  id: string;
  name: string;
  category: string;
  url: string;
  thumbUrl?: string;
  description: string;
}

export interface RenderStats {
  width: number;
  height: number;
  columns: number;
  rows: number;
  charCount: number;
  renderTimeMs: number;
}

export interface RenderResult {
  canvas: HTMLCanvasElement;
  textOutput: string;
  charWidth: number;
  charHeight: number;
  totalColumns: number;
  totalRows: number;
  renderTimeMs: number;
}

