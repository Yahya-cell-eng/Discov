/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { removeImageBackground, BackgroundRemovalOptions } from './backgroundRemover';

/**
 * Resizes and optimizes an image file (specifically PNG for transparent penalty icons)
 * to a lightweight base64 data URL while preserving transparency and crispness.
 * Optionally strips solid backgrounds (e.g. white or dark camera/paper backgrounds).
 */
export async function optimizePenaltyPng(
  file: File,
  maxSize: number = 200,
  bgRemovalOptions?: Partial<BackgroundRemovalOptions>
): Promise<string> {
  const isImage = (file.type && file.type.startsWith('image/')) ||
    /\.(jpe?g|png|webp|svg|bmp|avif)$/i.test(file.name);
  if (!isImage) {
    throw new Error('File yang dipilih bukan berkas gambar. Silakan pilih berkas JPG, PNG, atau WebP.');
  }

  if (bgRemovalOptions) {
    try {
      return await removeImageBackground(file, { ...bgRemovalOptions, maxSize });
    } catch (bgErr) {
      console.warn('Penghapusan background otomatis gagal, beralih ke kompresi standar:', bgErr);
      // Fallback to regular resizing below
    }
  }

  return new Promise((resolve, reject) => {
    let hasFinished = false;
    const reader = new FileReader();

    reader.onerror = () => {
      if (!hasFinished) {
        hasFinished = true;
        reject(new Error('Gagal membaca berkas gambar.'));
      }
    };

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        if (!hasFinished) {
          hasFinished = true;
          reject(new Error('Berkas gambar kosong atau tidak dapat dibaca.'));
        }
        return;
      }

      const img = new Image();
      const handleImgLoad = () => {
        if (hasFinished) return;
        hasFinished = true;

        try {
          // Calculate new dimensions preserving aspect ratio
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;
          if (width <= 0 || height <= 0) {
            return reject(new Error('Dimensi gambar tidak valid.'));
          }

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

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(dataUrl);
          }

          // Clear canvas with transparent pixels
          ctx.clearRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export as transparent PNG
          const optimizedDataUrl = canvas.toDataURL('image/png');
          resolve(optimizedDataUrl);
        } catch (canvasErr: any) {
          reject(canvasErr instanceof Error ? canvasErr : new Error(String(canvasErr)));
        }
      };

      img.onload = handleImgLoad;
      img.onerror = () => {
        if (!hasFinished) {
          hasFinished = true;
          reject(new Error('Gagal memuat gambar. Pastikan format berkas JPG/PNG valid.'));
        }
      };

      img.src = dataUrl;
      if (img.complete && img.naturalWidth > 0) {
        handleImgLoad();
      }
    };

    reader.readAsDataURL(file);
  });
}

