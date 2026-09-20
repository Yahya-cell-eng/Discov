/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

interface BuildStatus {
  isBuilding: boolean;
  hasBuild: boolean;
  lastBuiltAt: string | null;
  lastBuildError: string | null;
  distPath: string;
  hasIndexHtml: boolean;
  builtFilesCount: number;
}

let isBuilding = false;
let buildPromise: Promise<boolean> | null = null;
let lastBuiltAt: string | null = null;
let lastBuildError: string | null = null;

export const getDistPath = (): string => {
  return path.join(process.cwd(), 'dist');
};

export const hasBuiltIndex = (): boolean => {
  const indexPath = path.join(getDistPath(), 'index.html');
  return fs.existsSync(indexPath);
};

export const getBuildStatus = (): BuildStatus => {
  const distPath = getDistPath();
  const hasIndex = hasBuiltIndex();
  let builtFilesCount = 0;

  if (fs.existsSync(distPath)) {
    try {
      const files = fs.readdirSync(distPath);
      builtFilesCount = files.length;
    } catch {
      builtFilesCount = 0;
    }
  }

  return {
    isBuilding,
    hasBuild: hasIndex,
    lastBuiltAt,
    lastBuildError,
    distPath,
    hasIndexHtml: hasIndex,
    builtFilesCount
  };
};

/**
 * Programmatically build the frontend application using Vite inside Node.js
 * Automatically executed when entering the app / apk if build is missing,
 * or triggered on-demand via API.
 */
export const triggerNodeAutoBuild = async (force: boolean = false): Promise<boolean> => {
  const distPath = getDistPath();
  const indexPath = path.join(distPath, 'index.html');

  if (!force && fs.existsSync(indexPath)) {
    return true;
  }

  if (isBuilding && buildPromise) {
    return buildPromise;
  }

  isBuilding = true;
  lastBuildError = null;

  buildPromise = (async () => {
    console.log('[Node.js Auto-Build] ⚡ Memulai auto-build frontend Vite secara langsung di Node.js...');
    const startTime = Date.now();
    try {
      // Dynamically import Vite build
      const { build } = await import('vite');
      
      const configPath = path.join(process.cwd(), 'vite.config.ts');
      await build({
        configFile: fs.existsSync(configPath) ? configPath : undefined,
        mode: 'production',
        logLevel: 'info',
      });

      const durationMs = Date.now() - startTime;
      lastBuiltAt = new Date().toISOString();
      console.log(`[Node.js Auto-Build] ✅ Build frontend selesai dalam ${(durationMs / 1000).toFixed(2)} detik!`);
      isBuilding = false;
      return true;
    } catch (err: any) {
      console.error('[Node.js Auto-Build] ❌ Terjadi kesalahan saat auto-build di Node.js:', err);
      lastBuildError = err?.message || String(err);
      isBuilding = false;
      return false;
    } finally {
      buildPromise = null;
    }
  })();

  return buildPromise;
};

/**
 * Ensure build exists on Node.js startup.
 * If running in production or standalone APK mode and dist/index.html is missing,
 * triggers build in the background or immediately.
 */
export const ensureClientBuildOnStartup = async (): Promise<void> => {
  const distPath = getDistPath();
  const indexPath = path.join(distPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.log('[Node.js Startup] 🚀 Mendeteksi berkas build frontend belum ada. Menjalankan auto-build otomatis sekarang...');
    // Run in background without blocking server listen, so HTTP server is already available
    triggerNodeAutoBuild(false).catch((err) => {
      console.error('[Node.js Startup] Gagal auto-build di latar belakang:', err);
    });
  } else {
    console.log('[Node.js Startup] ✅ Berkas build frontend ditemukan dan siap disajikan dari dist/index.html');
  }
};
