-- Sohbetin satıcı tarafı artık iki türlü olabilir:
--   agentId     -> onaylı danışman (mevcut davranış)
--   ownerUserId -> bireysel ilan sahibi (yeni)
--
-- Bireysel ilanlarda danışman olmadığı için Conversation.agentId NOT NULL kısıtı
-- alıcının satıcıya hiç ulaşamamasına yol açıyordu: StartConversation hasAgent
-- false görüp null dönüyor, ContactButtons sitenin genel numarasını gösteriyordu.
--
-- Geriye uyumluluk: mevcut satırların tamamı agentId taşıyor ve dokunulmuyor.
-- ownerUserId NULL gelir. "İkisinden tam biri dolu" kuralı uygulama katmanında
-- (lib/messaging.ts) tutuluyor; kısmi CHECK yazmak eski satırları riske atardı.

ALTER TABLE "Conversation" ALTER COLUMN "agentId" DROP NOT NULL;

ALTER TABLE "Conversation" ADD COLUMN "ownerUserId" TEXT;

ALTER TABLE "Conversation"
  ADD CONSTRAINT "Conversation_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Conversation_ownerUserId_idx" ON "Conversation"("ownerUserId");
