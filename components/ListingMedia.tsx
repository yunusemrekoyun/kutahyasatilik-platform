import { Video, Plane, Rotate3d, ExternalLink } from "lucide-react";
import { toVideoEmbed, toTourEmbed } from "@/lib/media";

const isLocalMp4 = (url?: string | null) => !!url && /^\/uploads\/videos\/[\w.-]+\.mp4$/.test(url);

function Frame({ src, title }: { src: string; title: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-200">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking; fullscreen"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

function LocalVideo({ src }: { src: string }) {
  const poster = src.replace(/\.mp4$/, ".jpg");
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-200">
      <video controls preload="metadata" poster={poster} playsInline className="absolute inset-0 h-full w-full bg-black">
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}

export default function ListingMedia({
  videoUrl,
  droneUrl,
  virtualTourUrl,
}: {
  videoUrl?: string | null;
  droneUrl?: string | null;
  virtualTourUrl?: string | null;
}) {
  const localVideo = isLocalMp4(videoUrl) ? videoUrl! : null;
  const video = localVideo ? null : toVideoEmbed(videoUrl);
  const drone = toVideoEmbed(droneUrl);
  const tour = toTourEmbed(virtualTourUrl);

  if (!video && !localVideo && !drone && !tour) return null;

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-100 text-brand-700">
          <Video className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Video &amp; Sanal Tur</h2>
          <p className="text-xs text-slate-500">Mülkü uzaktan, her açıdan keşfedin</p>
        </div>
      </div>

      <div className="mt-5 space-y-6">
        {(localVideo || video) && (
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <Video className="h-4 w-4 text-brand-600" /> Tanıtım Videosu
            </h3>
            {localVideo ? <LocalVideo src={localVideo} /> : <Frame src={video!} title="Tanıtım videosu" />}
          </div>
        )}

        {drone && (
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <Plane className="h-4 w-4 text-brand-600" /> Drone / Havadan Görüntü
            </h3>
            <Frame src={drone} title="Drone görüntüsü" />
          </div>
        )}

        {tour && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                <Rotate3d className="h-4 w-4 text-brand-600" /> 360° Sanal Tur
              </h3>
              <a
                href={tour}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
              >
                Tam ekran <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Frame src={tour} title="360 derece sanal tur" />
          </div>
        )}
      </div>
    </section>
  );
}
