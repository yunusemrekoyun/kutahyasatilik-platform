import { Check } from "lucide-react";
import { LEAD_STATUS_FLOW, LEAD_STATUS_LABELS } from "@/lib/constants";

// Talep süreç çizelgesi: Alındı → İnceleniyor → İletişim kuruldu → Sonuçlandı.
// Mevcut ve geçmiş aşamalar dolu (brand), sonrakiler soluk gösterilir.
export default function RequestStatusStepper({ status }: { status: string }) {
  const normalized = status === "new" ? "received" : status === "closed" ? "resolved" : status;
  const currentIdx = Math.max(0, LEAD_STATUS_FLOW.indexOf(normalized as (typeof LEAD_STATUS_FLOW)[number]));

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-start gap-1.5">
        {LEAD_STATUS_FLOW.map((s, i) => {
          const done = i <= currentIdx;
          const current = i === currentIdx;
          return (
            <div key={s} className="flex items-start gap-1.5">
              <div className="flex w-16 flex-col items-center gap-1 text-center">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${
                    done ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
                  } ${current ? "ring-2 ring-brand-200" : ""}`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={`text-[10px] leading-tight ${done ? "font-semibold text-brand-700" : "text-slate-400"}`}>
                  {LEAD_STATUS_LABELS[s]}
                </span>
              </div>
              {i < LEAD_STATUS_FLOW.length - 1 && (
                <div className={`mt-3 h-0.5 w-5 shrink-0 ${i < currentIdx ? "bg-brand-600" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
