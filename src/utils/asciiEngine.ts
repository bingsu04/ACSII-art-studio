import { AsciiSettings, ColorPalette, RenderResult } from '../types';

// Density character ramps
export const DENSITY_RAMP_STANDARD = '@%#*+=-:. ';
export const DENSITY_RAMP_DETAILED = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ';

// Braille dot bitmask mapping for 2x4 subpixel grid
// [x=0, y=0] -> 0x01, [x=0, y=1] -> 0x02, [x=0, y=2] -> 0x04, [x=0, y=3] -> 0x40
// [x=1, y=0] -> 0x08, [x=1, y=1] -> 0x10, [x=1, y=2] -> 0x20, [x=1, y=3] -> 0x80
const BRAILLE_DOT_MASKS: number[][] = [
  // col 0: y=0, y=1, y=2, y=3
  [0x01, 0x02, 0x04, 0x40],
  // col 1: y=0, y=1, y=2, y=3
  [0x08, 0x10, 0x20, 0x80],
];

// Bayer 4x4 dither matrix for smooth Braille dithering option
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export interface ProcessedPixel {
  r: number;
  g: number;
  b: number;
  luminance: number; // 0 - 255
}

/**
 * Apply Brightness, Contrast, and Saturation adjustments to RGB
 */
export function adjustColor(
  r: number,
  g: number,
  b: number,
  brightness: number,
  contrast: number,
  saturation: number
): ProcessedPixel {
  // 1. Contrast & Brightness
  // contrast in [-100, 100], factor formula
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const bAdj = brightness * 2.55;

  let r1 = factor * (r - 128) + 128 + bAdj;
  let g1 = factor * (g - 128) + 128 + bAdj;
  let b1 = factor * (b - 128) + 128 + bAdj;

  r1 = Math.max(0, Math.min(255, r1));
  g1 = Math.max(0, Math.min(255, g1));
  b1 = Math.max(0, Math.min(255, b1));

  // 2. Saturation
  const gray = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
  const satFactor = (saturation + 100) / 100;

  let r2 = gray + (r1 - gray) * satFactor;
  let g2 = gray + (g1 - gray) * satFactor;
  let b2 = gray + (b1 - gray) * satFactor;

  r2 = Math.max(0, Math.min(255, Math.round(r2)));
  g2 = Math.max(0, Math.min(255, Math.round(g2)));
  b2 = Math.max(0, Math.min(255, Math.round(b2)));

  // Standard ITU-R BT.709 perceived luminance
  const luminance = Math.max(0, Math.min(255, Math.round(0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2)));

  return { r: r2, g: g2, b: b2, luminance };
}

/**
 * Transform adjusted RGB into chosen Palette CSS color string
 */
export function applyPalette(
  pixel: ProcessedPixel,
  palette: ColorPalette
): string {
  const { r, g, b, luminance } = pixel;
  const normL = luminance / 255;

  switch (palette) {
    case 'matrix': {
      // Classic terminal phosphor green with bright highlights
      if (normL < 0.15) {
        const v = Math.floor(normL * 300);
        return `rgb(0, ${Math.max(15, v)}, 0)`;
      } else if (normL < 0.75) {
        const v = Math.floor(100 + normL * 155);
        return `rgb(${Math.floor(normL * 40)}, ${v}, ${Math.floor(normL * 30)})`;
      } else {
        // High luminance highlight: minty phosphor white-green
        const extra = Math.floor((normL - 0.75) * 4 * 180);
        return `rgb(${extra}, 255, ${extra + 20})`;
      }
    }
    case 'cyberpunk': {
      // Neon cyan, magenta, and electric violet
      if (normL < 0.25) {
        // Deep indigo base
        const bVal = Math.floor(60 + normL * 400);
        return `rgb(${Math.floor(bVal * 0.4)}, 0, ${bVal})`;
      } else if (normL < 0.65) {
        // Hot magenta / violet
        const t = (normL - 0.25) / 0.4;
        const red = Math.floor(180 + t * 75);
        const green = Math.floor(t * 40);
        const blue = Math.floor(220 - t * 60);
        return `rgb(${red}, ${green}, ${blue})`;
      } else {
        // Vibrant neon cyan / electric yellow
        const t = (normL - 0.65) / 0.35;
        const red = Math.floor((1 - t) * 255);
        const green = Math.floor(220 + t * 35);
        const blue = Math.floor(255);
        return `rgb(${red}, ${green}, ${blue})`;
      }
    }
    case 'monochrome': {
      return `rgb(${luminance}, ${luminance}, ${luminance})`;
    }
    case 'invert': {
      return `rgb(${255 - r}, ${255 - g}, ${255 - b})`;
    }
    case 'original':
    default:
      return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Sobel Edge character lookup based on gradient angle and magnitude,
 * plus curvature detection for '(', ')' curves.
 */
function getSobelChar(
  gx: number,
  gy: number,
  magnitude: number,
  threshold: number,
  luminance: number,
  ramp: string,
  laplacian?: number
): string {
  if (magnitude < threshold) {
    // Non-edge region: map luminance to density character
    const idx = Math.floor(((255 - luminance) / 255) * (ramp.length - 1));
    return ramp[idx] || ' ';
  }

  // Calculate gradient direction angle in degrees [-180, 180]
  // Gradient is perpendicular to edge line
  let angle = (Math.atan2(gy, gx) * 180) / Math.PI;
  if (angle < 0) angle += 180; // normalize to [0, 180]

  // Tangent angle = direction of edge line
  const tangent = (angle + 90) % 180;

  // Horizontal edge (tangent ~ 0 or 180 deg)
  if (tangent <= 20 || tangent >= 160) {
    return magnitude > threshold * 2.2 ? '=' : '-';
  }

  // 45 degree diagonal edge
  if (tangent > 20 && tangent < 65) {
    return '/';
  }

  // Vertical or curved vertical edge (tangent ~ 65 to 115 deg)
  if (tangent >= 65 && tangent <= 115) {
    // Check curvature: if laplacian is available, determine concavity
    if (laplacian !== undefined && Math.abs(laplacian) > threshold * 0.6) {
      return laplacian > 0 ? '(' : ')';
    }
    // Alternatively, check whether gx and gy tend left or right
    if (gx > threshold * 0.8) {
      return '(';
    } else if (gx < -threshold * 0.8) {
      return ')';
    }
    return '|';
  }

  // 135 degree diagonal edge
  if (tangent > 115 && tangent < 160) {
    return '\\';
  }

  return '-';
}



/**
 * Main ASCII Art Engine: renders directly to an HTML5 Canvas and generates plain text
 */
export function renderAsciiToCanvas(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  settings: AsciiSettings,
  exportScale: number = 1
): RenderResult {
  const startTime = performance.now();

  const imgW = sourceImage.width;
  const imgH = sourceImage.height;

  // Step 1: Compute dimensions
  const columns = Math.max(20, Math.min(600, settings.columns));
  const fontRatio = settings.fontRatioCorrection || 1.9; // Monospace vertical compensation
  const stepX = imgW / columns;
  const stepY = stepX * fontRatio;
  const rows = Math.max(1, Math.floor(imgH / stepY));

  // Step 2: Offscreen canvas to sample image pixels with high accuracy
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = imgW;
  sampleCanvas.height = imgH;
  const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  if (!sCtx) {
    throw new Error('Failed to get sample canvas context');
  }
  sCtx.drawImage(sourceImage, 0, 0, imgW, imgH);
  const rawImgData = sCtx.getImageData(0, 0, imgW, imgH).data;

  // Helper to read raw pixel at (x, y) with clamping
  const getRawPixel = (x: number, y: number): { r: number; g: number; b: number } => {
    const cx = Math.max(0, Math.min(imgW - 1, Math.floor(x)));
    const cy = Math.max(0, Math.min(imgH - 1, Math.floor(y)));
    const idx = (cy * imgW + cx) * 4;
    return {
      r: rawImgData[idx],
      g: rawImgData[idx + 1],
      b: rawImgData[idx + 2],
    };
  };

  // Step 3: Configure target canvas
  const fontSize = (settings.fontSize || 13) * exportScale;
  const charHeight = fontSize;
  const charWidth = fontSize / fontRatio;

  const targetWidth = Math.round(columns * charWidth);
  const targetHeight = Math.round(rows * charHeight);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Failed to create output canvas context');
  }

  // Clear background
  ctx.fillStyle = settings.bgColor;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Set font properties with broad unicode & monospace fallback
  ctx.font = `${Math.round(fontSize)}px "JetBrains Mono", "Fira Code", "DejaVu Sans", "Apple Symbols", monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const ramp = settings.customChars || DENSITY_RAMP_STANDARD;
  const textLines: string[] = [];

  // Step 4: Render based on Mode
  if (settings.mode === 'halfblock') {
    // Mode 4: True-Color Half-Block (▀ U+2580)
    for (let row = 0; row < rows; row++) {
      let lineText = '';
      const py = row * stepY;
      const topY = py + stepY * 0.25;
      const bottomY = py + stepY * 0.75;
      const drawY = row * charHeight;

      for (let col = 0; col < columns; col++) {
        const px = col * stepX + stepX * 0.5;
        const drawX = col * charWidth;

        // Sample top and bottom subpixels
        const topRaw = getRawPixel(px, topY);
        const botRaw = getRawPixel(px, bottomY);

        const topAdj = adjustColor(
          topRaw.r,
          topRaw.g,
          topRaw.b,
          settings.brightness,
          settings.contrast,
          settings.saturation
        );
        const botAdj = adjustColor(
          botRaw.r,
          botRaw.g,
          botRaw.b,
          settings.brightness,
          settings.contrast,
          settings.saturation
        );

        const topColor = applyPalette(topAdj, settings.palette);
        const botColor = applyPalette(botAdj, settings.palette);

        // Fill bottom half
        ctx.fillStyle = botColor;
        ctx.fillRect(drawX, drawY + charHeight * 0.5, charWidth + 0.5, charHeight * 0.5 + 0.5);

        // Fill top half
        ctx.fillStyle = topColor;
        ctx.fillRect(drawX, drawY, charWidth + 0.5, charHeight * 0.5 + 0.5);

        lineText += '▀';
      }
      textLines.push(lineText);
    }
  } else if (settings.mode === 'braille') {
    // Mode 3: Ultra-Fine Braille (Unicode U+2800..U+28FF)
    // 2 columns x 4 rows per character cell = 8x subpixel resolution!
    const subStepX = stepX / 2;
    const subStepY = stepY / 4;
    const threshold = settings.brailleThreshold ?? 128;

    for (let row = 0; row < rows; row++) {
      let lineText = '';
      const cellY = row * stepY;
      const drawY = row * charHeight;

      for (let col = 0; col < columns; col++) {
        const cellX = col * stepX;
        const drawX = col * charWidth;

        let charMask = 0;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let activeDots = 0;

        // Sample 2x4 subpixel grid
        for (let bx = 0; bx < 2; bx++) {
          for (let by = 0; by < 4; by++) {
            const sx = cellX + (bx + 0.5) * subStepX;
            const sy = cellY + (by + 0.5) * subStepY;

            const raw = getRawPixel(sx, sy);
            const adj = adjustColor(
              raw.r,
              raw.g,
              raw.b,
              settings.brightness,
              settings.contrast,
              settings.saturation
            );

            // Determine if dot is on
            let isDotOn = false;
            if (settings.brailleDither) {
              const ditherVal = (BAYER_4X4[(row * 4 + by) % 4][(col * 2 + bx) % 4] / 16) * 64 - 32;
              isDotOn = adj.luminance + ditherVal >= threshold;
            } else {
              isDotOn = adj.luminance >= threshold;
            }

            if (isDotOn) {
              charMask |= BRAILLE_DOT_MASKS[bx][by];
              sumR += adj.r;
              sumG += adj.g;
              sumB += adj.b;
              activeDots++;
            }
          }
        }

        // Cell average color for empty or active characters
        let cellColor: string;
        if (activeDots > 0) {
          const avgPixel: ProcessedPixel = {
            r: Math.round(sumR / activeDots),
            g: Math.round(sumG / activeDots),
            b: Math.round(sumB / activeDots),
            luminance: Math.round(0.2126 * (sumR / activeDots) + 0.7152 * (sumG / activeDots) + 0.0722 * (sumB / activeDots)),
          };
          cellColor = applyPalette(avgPixel, settings.palette);
        } else {
          // If no dots active, sample center pixel for subtle coloring if inverted
          const centerRaw = getRawPixel(cellX + stepX * 0.5, cellY + stepY * 0.5);
          const centerAdj = adjustColor(
            centerRaw.r,
            centerRaw.g,
            centerRaw.b,
            settings.brightness,
            settings.contrast,
            settings.saturation
          );
          cellColor = applyPalette(centerAdj, settings.palette);
        }

        const brailleChar = String.fromCharCode(0x2800 + charMask);
        lineText += brailleChar;

        if (charMask > 0) {
          ctx.fillStyle = cellColor;
          ctx.fillText(brailleChar, drawX + charWidth * 0.5, drawY + charHeight * 0.5);
        }
      }
      textLines.push(lineText);
    }
  } else if (settings.mode === 'edge') {
    // Mode 2: Curvature / Edge-Aware Sobel ASCII
    // First, compute luminance grid for edge detection
    const lumGrid: number[][] = [];
    const colorGrid: ProcessedPixel[][] = [];

    for (let r = 0; r < rows; r++) {
      lumGrid[r] = new Float32Array(columns) as unknown as number[];
      colorGrid[r] = new Array(columns);
      const cy = r * stepY + stepY * 0.5;

      for (let c = 0; c < columns; c++) {
        const cx = c * stepX + stepX * 0.5;
        const raw = getRawPixel(cx, cy);
        const adj = adjustColor(
          raw.r,
          raw.g,
          raw.b,
          settings.brightness,
          settings.contrast,
          settings.saturation
        );
        lumGrid[r][c] = adj.luminance;
        colorGrid[r][c] = adj;
      }
    }

    // Sobel convolution
    const threshold = settings.edgeThreshold ?? 35;

    for (let row = 0; row < rows; row++) {
      let lineText = '';
      const drawY = row * charHeight;

      for (let col = 0; col < columns; col++) {
        const drawX = col * charWidth;
        const adj = colorGrid[row][col];

        // 3x3 neighborhood with border mirroring
        const r0 = Math.max(0, row - 1);
        const r1 = row;
        const r2 = Math.min(rows - 1, row + 1);

        const c0 = Math.max(0, col - 1);
        const c1 = col;
        const c2 = Math.min(columns - 1, col + 1);

        const p00 = lumGrid[r0][c0], p01 = lumGrid[r0][c1], p02 = lumGrid[r0][c2];
        const p10 = lumGrid[r1][c0],                          p12 = lumGrid[r1][c2];
        const p20 = lumGrid[r2][c0], p21 = lumGrid[r2][c1], p22 = lumGrid[r2][c2];

        const p11 = lumGrid[r1][c1];

        // Horizontal and vertical Sobel gradients
        const gx = (p02 + 2 * p12 + p22) - (p00 + 2 * p10 + p20);
        const gy = (p20 + 2 * p21 + p22) - (p00 + 2 * p01 + p02);
        const magnitude = Math.sqrt(gx * gx + gy * gy);

        // Discrete Laplacian for curvature / concavity estimation
        const laplacian = (p01 + p21 + p10 + p12) - 4 * p11;

        const char = getSobelChar(gx, gy, magnitude, threshold, adj.luminance, ramp, laplacian);
        lineText += char;

        if (char !== ' ') {
          ctx.fillStyle = applyPalette(adj, settings.palette);
          ctx.fillText(char, drawX + charWidth * 0.5, drawY + charHeight * 0.5);
        }
      }
      textLines.push(lineText);
    }
  } else {
    // Mode 1: Classic ASCII
    for (let row = 0; row < rows; row++) {
      let lineText = '';
      const cy = row * stepY + stepY * 0.5;
      const drawY = row * charHeight;

      for (let col = 0; col < columns; col++) {
        const cx = col * stepX + stepX * 0.5;
        const drawX = col * charWidth;

        const raw = getRawPixel(cx, cy);
        const adj = adjustColor(
          raw.r,
          raw.g,
          raw.b,
          settings.brightness,
          settings.contrast,
          settings.saturation
        );

        // Map luminance to character ramp
        // High luminance -> denser or lighter character depending on background
        // Standard: 255 = blank or light, 0 = dense @
        const idx = Math.floor(((255 - adj.luminance) / 255) * (ramp.length - 1));
        const char = ramp[Math.max(0, Math.min(ramp.length - 1, idx))] || ' ';

        lineText += char;

        if (char !== ' ') {
          ctx.fillStyle = applyPalette(adj, settings.palette);
          ctx.fillText(char, drawX + charWidth * 0.5, drawY + charHeight * 0.5);
        }
      }
      textLines.push(lineText);
    }
  }

  const endTime = performance.now();

  return {
    canvas,
    textOutput: textLines.join('\n'),
    charWidth,
    charHeight,
    totalColumns: columns,
    totalRows: rows,
    renderTimeMs: Math.round(endTime - startTime),
  };
}
