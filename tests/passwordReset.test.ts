import { describe, expect, it, vi, beforeEach } from "vitest";

// Şifre sıfırlama jetonu hem kullanıcıyı hem danışmanı kapsıyor. Danışman dalı
// yeni: daha önce şifresini unutan danışman için tek çözüm veritabanına elle
// müdahaleydi. Buradaki testler "kimin jetonu" ayrımını ve süre/tek kullanım
// kurallarını kilitliyor — yanlış hesabın şifresini sıfırlamak sessiz bir
// güvenlik hatası olurdu.

type Args = Record<string, unknown>;
type TokenRecord = {
  userId: string | null;
  agentId: string | null;
  expiresAt: Date;
  usedAt: Date | null;
} | null;

// Prisma'nın tamamını taklit etmiyoruz; yalnız bu modülün dokunduğu çağrılar.
// İmzalar açıkça yazılı, yoksa tsc mock.calls[0] erişimini boş tuple sanıyor.
const db = {
  passwordResetToken: {
    deleteMany: vi.fn<(args: Args) => Promise<{ count: number }>>(async () => ({ count: 0 })),
    create: vi.fn<(args: { data: Args }) => Promise<object>>(async () => ({})),
    findUnique: vi.fn<(args: Args) => Promise<TokenRecord>>(async () => null),
  },
  user: { update: vi.fn<(args: Args) => string>(() => "user-update") },
  agent: { update: vi.fn<(args: Args) => string>(() => "agent-update") },
  pushToken: { updateMany: vi.fn<(args: Args) => string>(() => "push-update") },
  $transaction: vi.fn(async (ops: unknown[]) => ops),
};

vi.mock("../lib/prisma", () => ({ prisma: db }));

const { applyNewPassword, hashResetToken, issueResetToken, resolveResetToken } = await import(
  "../lib/passwordReset"
);

beforeEach(() => {
  for (const group of Object.values(db)) {
    if (typeof group === "function") continue;
    for (const fn of Object.values(group)) (fn as ReturnType<typeof vi.fn>).mockClear?.();
  }
  db.passwordResetToken.findUnique.mockResolvedValue(null);
});

describe("jeton üretimi", () => {
  it("kullanıcı jetonunu userId ile bağlar ve eskileri siler", async () => {
    const token = await issueResetToken("user", "u1");

    expect(db.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    const created = db.passwordResetToken.create.mock.calls[0]![0].data;
    expect(created.userId).toBe("u1");
    expect(created.agentId).toBeUndefined();
    // HAM jeton saklanmaz; yalnız özeti.
    expect(created.tokenHash).toBe(hashResetToken(token));
    expect(created.tokenHash).not.toBe(token);
  });

  it("danışman jetonunu agentId ile bağlar", async () => {
    await issueResetToken("agent", "a1");

    expect(db.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { agentId: "a1" } });
    const created = db.passwordResetToken.create.mock.calls[0]![0].data;
    expect(created.agentId).toBe("a1");
    expect(created.userId).toBeUndefined();
  });

  it("her çağrıda farklı jeton üretir", async () => {
    const a = await issueResetToken("user", "u1");
    const b = await issueResetToken("user", "u1");
    expect(a).not.toBe(b);
    expect(a).toHaveLength(64);
  });
});

describe("jeton çözümleme", () => {
  const future = () => new Date(Date.now() + 60_000);

  it("geçerli kullanıcı jetonunu çözer", async () => {
    db.passwordResetToken.findUnique.mockResolvedValue({
      userId: "u1", agentId: null, expiresAt: future(), usedAt: null,
    });
    expect(await resolveResetToken("t")).toEqual({ ok: true, audience: "user", id: "u1" });
  });

  it("geçerli danışman jetonunu çözer", async () => {
    db.passwordResetToken.findUnique.mockResolvedValue({
      userId: null, agentId: "a1", expiresAt: future(), usedAt: null,
    });
    expect(await resolveResetToken("t")).toEqual({ ok: true, audience: "agent", id: "a1" });
  });

  it("süresi dolmuş jetonu reddeder", async () => {
    db.passwordResetToken.findUnique.mockResolvedValue({
      userId: "u1", agentId: null, expiresAt: new Date(Date.now() - 1), usedAt: null,
    });
    expect(await resolveResetToken("t")).toEqual({ ok: false });
  });

  it("kullanılmış jetonu reddeder", async () => {
    db.passwordResetToken.findUnique.mockResolvedValue({
      userId: "u1", agentId: null, expiresAt: future(), usedAt: new Date(),
    });
    expect(await resolveResetToken("t")).toEqual({ ok: false });
  });

  it("sahipsiz kaydı reddeder", async () => {
    // İki kolon da nullable; veri bozulmasında kaydı geçerli saymak,
    // rastgele bir hesabın şifresini sıfırlamaya açık kapı bırakırdı.
    db.passwordResetToken.findUnique.mockResolvedValue({
      userId: null, agentId: null, expiresAt: future(), usedAt: null,
    });
    expect(await resolveResetToken("t")).toEqual({ ok: false });
  });

  it("bilinmeyen jetonu reddeder", async () => {
    expect(await resolveResetToken("yok")).toEqual({ ok: false });
  });
});

describe("şifre uygulama", () => {
  it("kullanıcıda authVersion artırır ve push kaydını pasifler", async () => {
    await applyNewPassword("user", "u1", "hash");

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { passwordHash: "hash", authVersion: { increment: 1 } },
    });
    expect(db.agent.update).not.toHaveBeenCalled();
    expect(db.pushToken.updateMany).toHaveBeenCalledWith({
      where: { recipientRole: "user", recipientId: "u1", active: true },
      data: { active: false },
    });
    // Üç işlem tek transaction'da: yarım kalan sıfırlama hesabı kilitler.
    expect(db.$transaction).toHaveBeenCalledOnce();
    expect(db.$transaction.mock.calls[0]![0]).toHaveLength(3);
  });

  it("danışmanda agent tablosunu günceller", async () => {
    await applyNewPassword("agent", "a1", "hash");

    expect(db.agent.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { passwordHash: "hash", authVersion: { increment: 1 } },
    });
    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { agentId: "a1" } });
  });
});
