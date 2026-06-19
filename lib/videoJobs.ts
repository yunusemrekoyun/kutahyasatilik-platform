// Video yükleme/işleme job durumu — bellek-içi (tek Node instance / systemd için yeterli).
// Upload rotası job oluşturur, arka plan transcode günceller, status rotası okur.
// Çok-instance'a geçilirse buradaki Map Redis'e taşınır (arayüz aynı kalır).

export type VideoJobStatus = "processing" | "ready" | "error";

export type VideoJob = {
  id: string;
  status: VideoJobStatus;
  /** 0–100; transcode aşamasında kabaca ilerleme */
  progress: number;
  fileName: string;
  videoUrl?: string;
  posterUrl?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
};

const JOBS = new Map<string, VideoJob>();
const TTL_MS = 6 * 60 * 60 * 1000; // 6 saat sonra tamamlanan job'ları temizle

function sweep() {
  const now = Date.now();
  for (const [id, job] of JOBS) {
    if (job.status !== "processing" && now - job.updatedAt > TTL_MS) JOBS.delete(id);
  }
}

export function createJob(id: string, fileName: string): VideoJob {
  const now = Date.now();
  const job: VideoJob = { id, status: "processing", progress: 0, fileName, createdAt: now, updatedAt: now };
  JOBS.set(id, job);
  sweep();
  return job;
}

export function updateJob(id: string, patch: Partial<Omit<VideoJob, "id" | "createdAt">>): void {
  const job = JOBS.get(id);
  if (!job) return;
  Object.assign(job, patch, { updatedAt: Date.now() });
}

export function getJob(id: string): VideoJob | null {
  return JOBS.get(id) ?? null;
}
