import { redirect } from "next/navigation";
import { getAgentSession } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import AgentPanelHeader from "@/components/agent/AgentPanelHeader";

export const dynamic = "force-dynamic";

export default async function AgentPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAgentSession();
  if (!session) redirect("/giris");

  const agent = await prisma.agent.findUnique({
    where: { id: session.agentId },
    select: { status: true, name: true },
  });

  if (!agent) redirect("/giris");

  // Oturum açıkken admin tarafından askıya alınmış/reddedilmiş olabilir.
  if (agent.status !== "approved") {
    return (
      <div className="min-h-screen bg-slate-50">
        <AgentPanelHeader name={agent.name} />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="text-5xl">⏳</div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Hesabınız aktif değil</h1>
          <p className="mt-2 text-slate-600">
            {agent.status === "pending"
              ? "Başvurunuz henüz onay bekliyor."
              : agent.status === "suspended"
              ? "Hesabınız askıya alınmış. Lütfen bizimle iletişime geçin."
              : "Hesabınız onaylanmadı. Lütfen bizimle iletişime geçin."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AgentPanelHeader name={agent.name} />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
