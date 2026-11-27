/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clearDriveAccessToken } from './firebaseService';

export const APP_DRIVE_FOLDER_NAME = 'Skoring Pencak Silat - Storage';
export const MAIN_DRIVE_FILE_NAME = 'silat_cloud_database.json';
export const SCHEDULE_DRIVE_PDF_NAME = 'Jadwal_Pertandingan.pdf';
export const FINAL_REPORT_DRIVE_PDF_NAME = 'Laporan_Akhir_Turnamen.pdf';
const MULTIPART_MAX_BYTES = 4 * 1024 * 1024; // Switch to resumable upload above 4MB (Drive multipart limit is 5MB)

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface DriveStorageFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  description?: string;
}

let cachedFolderInfo: DriveFolderInfo | null = null;
let pendingFolderPromise: Promise<DriveFolderInfo> | null = null;

async function driveFetch(url: string, accessToken: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(url, {
    ...init,
    headers
  });

  if (res.status === 401) {
    clearDriveAccessToken();
    cachedFolderInfo = null;
    pendingFolderPromise = null;
    throw new Error('Sesi akses Google Drive telah berakhir. Silakan klik "Sign in with Google" untuk menghubungkan ulang.');
  }

  if (res.status === 404) {
    cachedFolderInfo = null;
    pendingFolderPromise = null;
  }

  if (!res.ok) {
    let errDetail = `Google Drive API error (${res.status})`;
    try {
      const json = await res.json();
      if (json?.error?.message) {
        errDetail = json.error.message;
      }
    } catch {
      // ignore non-json error body
    }

    if (res.status === 403 && /accessNotConfigured|API has not been used|disabled/i.test(errDetail)) {
      clearDriveAccessToken();
      cachedFolderInfo = null;
      pendingFolderPromise = null;
      throw new Error(
        'Google Drive API belum diaktifkan pada proyek Google Cloud terkait. Aktifkan Google Drive API di Google Cloud Console lalu hubungkan ulang.'
      );
    }

    if (res.status === 403 && /insufficient|scope|permission/i.test(errDetail)) {
      clearDriveAccessToken();
      cachedFolderInfo = null;
      pendingFolderPromise = null;
      throw new Error(
        'Izin Google Drive belum lengkap atau dicabut. Silakan klik "Sign in with Google" dan centang persetujuan akses Google Drive.'
      );
    }

    throw new Error(errDetail);
  }

  return res;
}

export async function ensureDriveStorageFolder(accessToken: string): Promise<DriveFolderInfo> {
  if (cachedFolderInfo?.id) {
    return cachedFolderInfo;
  }
  if (pendingFolderPromise) {
    return pendingFolderPromise;
  }

  pendingFolderPromise = (async () => {
    const q = encodeURIComponent(
      `name = '${APP_DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const searchRes = await driveFetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)&spaces=drive`,
      accessToken
    );
    const searchData = await searchRes.json();

    if (Array.isArray(searchData.files) && searchData.files.length > 0) {
      const folder = searchData.files[0] as DriveFolderInfo;
      cachedFolderInfo = folder;
      return folder;
    }

    const createRes = await driveFetch(
      'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
      accessToken,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: APP_DRIVE_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder'
        })
      }
    );
    const created = (await createRes.json()) as DriveFolderInfo;
    cachedFolderInfo = created;
    return created;
  })();

  try {
    return await pendingFolderPromise;
  } finally {
    pendingFolderPromise = null;
  }
}

export async function listDriveStorageFiles(
  accessToken: string
): Promise<{ folder: DriveFolderInfo; files: DriveStorageFile[] }> {
  const folder = await ensureDriveStorageFolder(accessToken);
  const q = encodeURIComponent(`'${folder.id}' in parents and trashed = false`);
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,description)&pageSize=50`,
    accessToken
  );
  const data = await res.json();
  const files = (Array.isArray(data.files) ? data.files : []) as DriveStorageFile[];
  return { folder, files };
}

function buildMultipartBody(metadata: Record<string, any>, jsonString: string): { body: Blob; contentType: string } {
  const boundary = `silat_drive_boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const metaPart = JSON.stringify(metadata);

  const multipartText =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metaPart}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${jsonString}\r\n` +
    `--${boundary}--\r\n`;

  const contentType = `multipart/related; boundary=${boundary}`;
  return {
    body: new Blob([multipartText], { type: contentType }),
    contentType
  };
}

async function uploadViaResumable(
  accessToken: string,
  method: 'POST' | 'PATCH',
  endpointUrl: string,
  metadata: Record<string, any>,
  jsonString: string
): Promise<DriveStorageFile> {
  const initRes = await driveFetch(endpointUrl, accessToken, {
    method,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify(metadata)
  });

  const sessionUri = initRes.headers.get('Location');
  if (!sessionUri) {
    throw new Error('Gagal memulai sesi unggah resumable ke Google Drive.');
  }

  const putRes = await fetch(sessionUri, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8'
    },
    body: jsonString
  });

  if (!putRes.ok) {
    let detail = `Gagal mengunggah berkas ke Google Drive (${putRes.status})`;
    try {
      const errJson = await putRes.json();
      if (errJson?.error?.message) detail = errJson.error.message;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  return (await putRes.json()) as DriveStorageFile;
}

export async function uploadNewDriveFile(
  accessToken: string,
  fileName: string,
  data: any,
  description?: string
): Promise<DriveStorageFile> {
  const folder = await ensureDriveStorageFolder(accessToken);
  const safeName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const metadata = {
    name: safeName,
    mimeType: 'application/json',
    parents: [folder.id],
    ...(description ? { description } : {})
  };

  const byteLen = new Blob([jsonString]).size;
  if (byteLen > MULTIPART_MAX_BYTES) {
    return await uploadViaResumable(
      accessToken,
      'POST',
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,size,modifiedTime,webViewLink,description',
      metadata,
      jsonString
    );
  }

  const { body, contentType } = buildMultipartBody(metadata, jsonString);
  const res = await driveFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,description',
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body
    }
  );
  return (await res.json()) as DriveStorageFile;
}

/**
 * Updates/overwrites an existing Drive file.
 * UI MUST obtain explicit user confirmation before invoking this operation.
 */
export async function updateExistingDriveFile(
  accessToken: string,
  fileId: string,
  fileName: string,
  data: any,
  description?: string
): Promise<DriveStorageFile> {
  const safeName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const metadata = {
    name: safeName,
    ...(description ? { description } : {})
  };

  const byteLen = new Blob([jsonString]).size;
  if (byteLen > MULTIPART_MAX_BYTES) {
    return await uploadViaResumable(
      accessToken,
      'PATCH',
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=resumable&fields=id,name,mimeType,size,modifiedTime,webViewLink,description`,
      metadata,
      jsonString
    );
  }

  const { body, contentType } = buildMultipartBody(metadata, jsonString);
  const res = await driveFetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,description`,
    accessToken,
    {
      method: 'PATCH',
      headers: { 'Content-Type': contentType },
      body
    }
  );
  return (await res.json()) as DriveStorageFile;
}

async function uploadBlobViaResumable(
  accessToken: string,
  method: 'POST' | 'PATCH',
  endpointUrl: string,
  metadata: Record<string, any>,
  blob: Blob,
  mimeType: string
): Promise<DriveStorageFile> {
  const initRes = await driveFetch(endpointUrl, accessToken, {
    method,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(blob.size)
    },
    body: JSON.stringify(metadata)
  });

  const sessionUri = initRes.headers.get('Location');
  if (!sessionUri) {
    throw new Error('Gagal memulai sesi unggah berkas ke Google Drive.');
  }

  const putRes = await fetch(sessionUri, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType
    },
    body: blob
  });

  if (putRes.status === 401) {
    clearDriveAccessToken();
    cachedFolderInfo = null;
    pendingFolderPromise = null;
    throw new Error('Sesi akses Google Drive telah berakhir. Silakan masuk ulang.');
  }

  if (!putRes.ok) {
    let detail = `Gagal mengunggah berkas ke Google Drive (${putRes.status})`;
    try {
      const errJson = await putRes.json();
      if (errJson?.error?.message) detail = errJson.error.message;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  return (await putRes.json()) as DriveStorageFile;
}

export async function uploadNewDriveBlobFile(
  accessToken: string,
  fileName: string,
  blob: Blob,
  mimeType: string = 'application/pdf',
  description?: string
): Promise<DriveStorageFile> {
  const folder = await ensureDriveStorageFolder(accessToken);
  const metadata = {
    name: fileName,
    mimeType,
    parents: [folder.id],
    ...(description ? { description } : {})
  };
  return await uploadBlobViaResumable(
    accessToken,
    'POST',
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,size,modifiedTime,webViewLink,description',
    metadata,
    blob,
    mimeType
  );
}

/**
 * Updates/overwrites an existing binary/PDF Drive file.
 * UI MUST obtain explicit user confirmation before invoking this operation.
 */
export async function updateExistingDriveBlobFile(
  accessToken: string,
  fileId: string,
  fileName: string,
  blob: Blob,
  mimeType: string = 'application/pdf',
  description?: string
): Promise<DriveStorageFile> {
  const metadata = {
    name: fileName,
    ...(description ? { description } : {})
  };
  return await uploadBlobViaResumable(
    accessToken,
    'PATCH',
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=resumable&fields=id,name,mimeType,size,modifiedTime,webViewLink,description`,
    metadata,
    blob,
    mimeType
  );
}

export async function downloadDriveFileJson(accessToken: string, fileId: string): Promise<any> {
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    accessToken
  );
  return await res.json();
}

export async function downloadDriveFileBlob(accessToken: string, fileId: string): Promise<Blob> {
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    accessToken
  );
  return await res.blob();
}

/**
 * Deletes a file from Google Drive.
 * UI MUST obtain explicit user confirmation before invoking this operation.
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, accessToken, {
    method: 'DELETE'
  });
}

export function formatDriveBytes(sizeStr?: string): string {
  const bytes = Number(sizeStr || 0);
  if (!bytes || isNaN(bytes)) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
