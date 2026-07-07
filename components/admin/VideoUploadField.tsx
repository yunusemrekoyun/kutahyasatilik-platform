"use client";

import { useEffect, useRef, useState } from "react";
import { UploadCloud, Film, X, Check, Loader2, Trash2, AlertCircle } from "lucide-react";

type Phase = "uploading" | "processing" | "done" | "error";
type Task = { fileName: string; phase: Phase; progress: number; error?: string };

const isLocalMp4 = (url: string) => /^\/uploads\/videos\/[\w.-]+\.mp4$/.test(url);
const CHUNK_BYTES = 50 * 1024 * 1024; // 50MB parça (Cloudflare 100MB sınırının altında)
const MAX_BYTES = 1024 * 1024 * 1024; // 1GB ham tavan

export default function VideoUploadField({
  name,
  defaultValue = "",
}: {
  name: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [task, setTask] = useState<Task | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const busy = task?.phase === "uploading" || task?.phase === "processing";

  // Aktif yükleme/işleme varken sayfadan ayrılma uyarısı
  useEffect(() => {
    if (!busy) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [busy]);

  function poll(jobId: string) {
    const tick = async () => {
      try {
        const res = await fetch(`/api/video/status?id=${encodeURIComponent(jobId)}`);
        const d = await res.json();
        if (!d.ok) return setTask((t) => (t ? { ...t, phase: "error", error: d.error || "İşleme hatası" } : t));
        if (d.status === "ready") {
          setValue(d.videoUrl);
          setTask((t) => (t ? { ...t, phase: "done", progress: 100 } : t));
          setTimeout(() => setTask(null), 4000);
          return;
        }
        if (d.status === "error") {
          return setTask((t) => (t ? { ...t, phase: "error", error: d.error || "İşleme hatası" } : t));
        }
        setTask((t) => (t ? { ...t, phase: "processing", progress: Math.max(t.progress, d.progress || 0) } : t));
        setTimeout(tick, 1500);
      } catch {
        setTimeout(tick, 2500); // geçici ağ hatası → tekrar dene
      }
    };
    setTimeout(tick, 1200);
  }

  // Tek parçayı gönderir (XHR → ilerleme). Konum-bazlı olduğu için tekrar denenmesi güvenli.
  function sendChunk(
    uploadId: string,
    index: number,
    total: number,
    offset: number,
    fileName: string,
    blob: Blob,
    onProgress: (pct: number) => void
  ): Promise<{ ok: boolean; jobId?: string; error?: string }> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/video/upload");
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        try { resolve(JSON.parse(xhr.responseText || "{}")); }
        catch { resolve({ ok: false, error: "Sunucu yanıtı okunamadı" }); }
      };
      xhr.onerror = () => resolve({ ok: false, error: "Bağlantı hatası" });
      const fd = new FormData();
      fd.append("uploadId", uploadId);
      fd.append("index", String(index));
      fd.append("total", String(total));
      fd.append("offset", String(offset));
      fd.append("fileName", fileName);
      fd.append("chunk", blob);
      xhr.send(fd);
    });
  }

  async function upload(file: File) {
    if (file.size > MAX_BYTES) {
      setTask({ fileName: file.name, phase: "error", progress: 0, error: "Video 1GB'tan büyük olamaz" });
      return;
    }
    const uploadId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const total = Math.max(1, Math.ceil(file.size / CHUNK_BYTES));
    setTask({ fileName: file.name, phase: "uploading", progress: 0 });

    for (let index = 0; index < total; index++) {
      const offset = index * CHUNK_BYTES;
      const blob = file.slice(offset, offset + CHUNK_BYTES);
      let res: { ok: boolean; jobId?: string; error?: string } | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        res = await sendChunk(uploadId, index, total, offset, file.name, blob, (pct) => {
          const overall = Math.round(((index + pct / 100) / total) * 100);
          setTask((t) => (t ? { ...t, progress: overall } : t));
        });
        if (res.ok) break;
      }
      if (!res || !res.ok) {
        setTask((t) => (t ? { ...t, phase: "error", error: res?.error || "Yükleme hatası" } : t));
        return;
      }
      if (index === total - 1) {
        if (!res.jobId) {
          setTask((t) => (t ? { ...t, phase: "error", error: "İşleme başlatılamadı" } : t));
          return;
        }
        setTask((t) => (t ? { ...t, phase: "processing", progress: 100 } : t));
        poll(res.jobId);
      }
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }

  const hasLocal = value && isLocalMp4(value);

  return (
    <div>
      {/* Form ile gönderilen gerçek değer */}
      <input type="hidden" name={name} value={value} />

      {hasLocal ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-300 bg-slate-50 p-2.5">
          <video src={value} muted playsInline className="h-14 w-24 shrink-0 rounded bg-black object-cover" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-800"><Film className="h-4 w-4 text-brand-600" /> Yüklü video</p>
            <p className="truncate text-xs text-slate-500">{value}</p>
          </div>
          <button type="button" onClick={() => setValue("")} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Kaldır
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…  (link yapıştır)"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">veya</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <UploadCloud className="h-4 w-4" /> Video Yükle
            </button>
            <span className="text-xs text-slate-400">MP4/MOV · en fazla 1GB · yüksek çözünürlük otomatik 1080p&apos;ye küçültülür</span>
          </div>
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={onPick} />
        </div>
      )}

      {/* Yüzen görev kartı: sağ-alt (masaüstü) / üst (mobil) */}
      {task && (
        <div className="fixed inset-x-4 top-4 z-50 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-auto sm:w-80">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.3)]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0">
                {task.phase === "done" ? <Check className="h-5 w-5 text-green-600" />
                  : task.phase === "error" ? <AlertCircle className="h-5 w-5 text-red-600" />
                  : <Loader2 className="h-5 w-5 animate-spin text-brand-600" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{task.fileName}</p>
                <p className="text-xs text-slate-500">
                  {task.phase === "uploading" && `Yükleniyor… %${task.progress}`}
                  {task.phase === "processing" && "İşleniyor (transcode)…"}
                  {task.phase === "done" && (
                    <span className="inline-flex items-center gap-1">Hazır <Check className="h-3.5 w-3.5 text-green-600" /></span>
                  )}
                  {task.phase === "error" && (task.error || "Hata")}
                </p>
              </div>
              {(task.phase === "done" || task.phase === "error") && (
                <button type="button" onClick={() => setTask(null)} aria-label="Kapat" className="text-slate-400 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {(task.phase === "uploading" || task.phase === "processing") && (
              <>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-brand-600 transition-all ${task.phase === "processing" ? "animate-pulse" : ""}`}
                    style={{ width: `${task.phase === "processing" ? 100 : task.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-amber-600">İşlem bitene kadar sayfadan ayrılmayın.</p>
              </>
            )}
            {task.phase === "error" && (
              <button type="button" onClick={() => fileRef.current?.click()} className="mt-3 text-xs font-semibold text-brand-700 hover:underline">
                Tekrar dene
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
