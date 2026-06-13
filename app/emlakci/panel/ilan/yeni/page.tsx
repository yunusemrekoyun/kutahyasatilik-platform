import Link from "next/link";
import AgentListingForm from "@/components/agent/AgentListingForm";

export const dynamic = "force-dynamic";

export default function NewAgentListing() {
  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/emlakci/panel" className="hover:text-brand-700">Panel</Link>
        <span className="mx-2">/</span>
        <span>Yeni İlan</span>
      </nav>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">Yeni İlan Ekle</h1>
      <AgentListingForm />
    </div>
  );
}
