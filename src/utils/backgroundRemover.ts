/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BackgroundRemovalOptions {
  mode: 'auto-light' | 'auto-dark' | 'sample-corner' | 'color' | 'silhouette' | 'none';
  customColor?: { r: number; g: number; b: number };
  tolerance: number; // 0 to 100
  feather: number; // 0 to 8
  silhouetteColor?: string; // Hex color for silhouette mode, e.g. '#ffffff' or '#f59e0b'
  trimTransparent?: boolean;
  maxSize?: number; // Max width or height in px (default 240)
  invert?: boolean;
}

export const DEFAULT_BG_OPTIONS: BackgroundRemovalOptions = {
  mode: 'auto-light',
  tolerance: 35,
  feather: 2,
  silhouetteColor: '#ffffff',
  trimTransparent: true,
  maxSize: 240,
  invert: false,
};

/**
 * Samples the 4 corners of the canvas (a 5x5 patch each) to determine average background color
 */
function sampleCornerColor(imageData: ImageData, width: number, height: number): { r: number; g: number; b: number } {
  const data = imageData.data;
  const sampleRadius = Math.min(5, Math.floor(Math.min(width, height) / 4));
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  const corners = [
    { x0: 0, y0: 0 }, // Top-left
    { x0: width - sampleRadius, y0: 0 }, // Top-right
    { x0: 0, y0: height - sampleRadius }, // Bottom-left
    { x0: width - sampleRadius, y0: height - sampleRadius }, // Bottom-right
  ];

  for (const corner of corners) {
    for (let y = corner.y0; y < corner.y0 + sampleRadius; y++) {
      for (let x = corner.x0; x < corner.x0 + sampleRadius; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const idx = (y * width + x) * 4;
          totalR += data[idx];
          totalG += data[idx + 1];
          totalB += data[idx + 2];
          count++;
        }
      }
    }
  }

  if (count === 0) return { r: 255, g: 255, b: 255 };
  return {
    r: Math.round(totalR / count),
    g: Math.round(totalG / count),
    b: Math.round(totalB / count),
  };
}

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    return {
      r: parseInt(cleaned[0] + cleaned[0], 16),
      g: parseInt(cleaned[1] + cleaned[1], 16),
      b: parseInt(cleaned[2] + cleaned[2], 16),
    };
  }
  const full = cleaned.padEnd(6, '0');
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
}

/**
 * Removes background from an image file or Data URL in the browser using HTML Canvas,
 * returning a lightweight transparent PNG Data URL.
 */
export async function removeImageBackground(
  imageSource: File | string,
  options: Partial<BackgroundRemovalOptions> = {}
): Promise<string> {
  const opts: BackgroundRemovalOptions = { ...DEFAULT_BG_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    let hasFinished = false;
    const img = new Image();

    // Only set crossOrigin for remote HTTP/HTTPS images to prevent browser errors with data URLs or blobs
    if (typeof imageSource === 'string' && /^https?:\/\//i.test(imageSource)) {
      img.crossOrigin = 'anonymous';
    }

    const handleLoaded = () => {
      if (hasFinished) return;
      hasFinished = true;

      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (width <= 0 || height <= 0) {
          return reject(new Error('Dimensi gambar tidak valid atau format rusak.'));
        }

        // Scale down to processing size while keeping aspect ratio
        const maxSize = opts.maxSize || 240;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          return reject(new Error('Gagal menginisialisasi konteks 2D Canvas.'));
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        if (opts.mode === 'none') {
          return resolve(canvas.toDataURL('image/png'));
        }

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Determine target background color
        let targetR = 255;
        let targetG = 255;
        let targetB = 255;

        if (opts.mode === 'auto-light') {
          targetR = 255;
          targetG = 255;
          targetB = 255;
        } else if (opts.mode === 'auto-dark') {
          targetR = 0;
          targetG = 0;
          targetB = 0;
        } else if (opts.mode === 'sample-corner') {
          const corner = sampleCornerColor(imgData, width, height);
          targetR = corner.r;
          targetG = corner.g;
          targetB = corner.b;
        } else if (opts.mode === 'color' && opts.customColor) {
          targetR = opts.customColor.r;
          targetG = opts.customColor.g;
          targetB = opts.customColor.b;
        } else if (opts.mode === 'silhouette') {
          const corner = sampleCornerColor(imgData, width, height);
          targetR = corner.r;
          targetG = corner.g;
          targetB = corner.b;
        }

        const tol = Math.max(1, Math.min(100, opts.tolerance));
        // Max euclidean distance in RGB space = sqrt(255^2 * 3) ~ 441.67
        const maxDist = 441.67;
        const tolDist = (tol / 100) * maxDist;
        const featherDist = Math.max(0.1, (opts.feather / 10) * tolDist);
        const innerTolDist = Math.max(0, tolDist - featherDist);

        const silRgb = hexToRgb(opts.silhouetteColor || '#ffffff');

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a === 0) continue; // Already transparent

          // Calculate color distance to background
          const dr = r - targetR;
          const dg = g - targetG;
          const db = b - targetB;
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);

          let isBg = false;
          let alphaMultiplier = 1;

          if (opts.mode === 'auto-light') {
            const brightness = r * 0.299 + g * 0.587 + b * 0.114;
            const thresholdBrightness = 255 - (tol * 2.2);
            const isNearWhite = brightness >= thresholdBrightness && (Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)) < (tol * 0.9);
            
            if (dist < tolDist || isNearWhite) {
              isBg = true;
              if (dist <= innerTolDist) {
                alphaMultiplier = 0;
              } else {
                alphaMultiplier = (dist - innerTolDist) / featherDist;
              }
            }
          } else if (opts.mode === 'auto-dark') {
            const brightness = r * 0.299 + g * 0.587 + b * 0.114;
            const thresholdBrightness = tol * 2.0;
            if (dist < tolDist || brightness <= thresholdBrightness) {
              isBg = true;
              if (dist <= innerTolDist) {
                alphaMultiplier = 0;
              } else {
                alphaMultiplier = (dist - innerTolDist) / featherDist;
              }
            }
          } else {
            // General Euclidean color distance
            if (dist < tolDist) {
              isBg = true;
              if (dist <= innerTolDist) {
                alphaMultiplier = 0;
              } else {
                alphaMultiplier = (dist - innerTolDist) / featherDist;
              }
            }
          }

          if (opts.invert) {
            isBg = !isBg;
            alphaMultiplier = 1 - alphaMultiplier;
          }

          if (isBg) {
            data[i + 3] = Math.max(0, Math.min(255, Math.round(a * alphaMultiplier)));
          }

          // If Silhouette mode, replace remaining visible foreground with silhouette color
          if (opts.mode === 'silhouette') {
            const currentAlpha = data[i + 3];
            if (currentAlpha > 5) {
              data[i] = silRgb.r;
              data[i + 1] = silRgb.g;
              data[i + 2] = silRgb.b;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // Optional: Auto-trim transparent borders so image is centered and fills slot nicely
        if (opts.trimTransparent) {
          const trimmedCanvas = trimTransparentCanvas(canvas, 4);
          return resolve(trimmedCanvas.toDataURL('image/png'));
        }

        resolve(canvas.toDataURL('image/png'));
      } catch (err: any) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    img.onload = handleLoaded;
    img.onerror = () => {
      if (hasFinished) return;
      hasFinished = true;
      reject(new Error('Gagal memuat gambar. Pastikan berkas JPG/PNG valid dan tidak rusak.'));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
      if (img.complete && img.naturalWidth > 0) {
        handleLoaded();
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          if (!hasFinished) {
            hasFinished = true;
            reject(new Error('Berkas gambar kosong atau tidak dapat dibaca.'));
          }
          return;
        }
        img.src = dataUrl;
        if (img.complete && img.naturalWidth > 0) {
          handleLoaded();
        }
      };
      reader.onerror = () => {
        if (!hasFinished) {
          hasFinished = true;
          reject(new Error('Gagal membaca berkas gambar dari perangkat.'));
        }
      };
      reader.readAsDataURL(imageSource);
    }
  });
}

/**
 * Trims transparent border pixels from a canvas
 */
export function trimTransparentCanvas(canvas: HTMLCanvasElement, padding: number = 2): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return canvas;

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width, maxX + padding);
  maxY = Math.min(height, maxY + padding);

  const trimW = maxX - minX;
  const trimH = maxY - minY;

  if (trimW <= 0 || trimH <= 0) return canvas;

  // Make square canvas to prevent distortion when rendering in penalty slot
  const squareSize = Math.max(trimW, trimH);
  const outCanvas = document.createElement('canvas');
  outCanvas.width = squareSize;
  outCanvas.height = squareSize;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return canvas;

  const offsetX = Math.round((squareSize - trimW) / 2);
  const offsetY = Math.round((squareSize - trimH) / 2);

  outCtx.drawImage(canvas, minX, minY, trimW, trimH, offsetX, offsetY, trimW, trimH);
  return outCanvas;
}
