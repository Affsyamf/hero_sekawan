import { loadingManager } from "../contexts/loadingManager";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Generic HTTP function untuk JSON requests
export async function http<T = any>(
  withLoading = true,
  path: string,
  init?: RequestInit,
  jsonBody?: any
): Promise<T> {
  if (withLoading) loadingManager.setLoading(true);

  try {
    const finalInit: RequestInit = {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    };
    if (jsonBody !== undefined) finalInit.body = JSON.stringify(jsonBody);

    const res = await fetch(`${BASE_URL}${path}`, finalInit);
    if (!res.ok) {
      let detail = await res.text().catch(() => "");
      try {
        detail = JSON.parse(detail)?.detail ?? detail;
      } catch {}
      throw new Error(detail || `HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    if (withLoading) loadingManager.setLoading(false);
  }
}

// Upload file helper (untuk FormData)
export async function uploadFile<T = any>(
  withLoading = true,
  path: string,
  file: File,
  fieldName: string = "file",
  additionalFields?: Record<string, string>
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const form = new FormData();
  form.append(fieldName, file, file.name);

  // Tambahkan field tambahan jika ada
  if (additionalFields) {
    for (const [key, value] of Object.entries(additionalFields)) {
      form.append(key, value);
    }
  }

  if (withLoading) loadingManager.setLoading(true);

  try {
    const res = await fetch(url, { method: "POST", body: form });
    if (!res.ok) {
      let detail = await res.text().catch(() => "");
      try {
        detail = JSON.parse(detail)?.detail ?? detail;
      } catch {}
      throw new Error(detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    if (withLoading) loadingManager.setLoading(false);
  }
}

// Download file helper (untuk blob/binary response)
export async function downloadFile(
  withLoading = true,
  path: string,
  filename: string,
  method: "GET" | "POST" = "GET",
  body?: any
): Promise<void> {
  const url = `${BASE_URL}${path}`;

  if (withLoading) loadingManager.setLoading(true);

  try {
    const options: RequestInit = { method };
    if (body && method === "POST") {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } finally {
    if (withLoading) loadingManager.setLoading(false);
  }
}

// Export BASE_URL jika diperlukan
export { BASE_URL };
