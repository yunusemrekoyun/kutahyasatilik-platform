import { z } from "zod";

// Zod'un VARSAYILAN hata mesajlarını Türkçeleştirir (şemalardaki özel mesajlar aynen kalır).
// Yan-etkili modül: lib/prisma ve lib/rateLimit tarafından import edilir — böylece her API
// route'unun bulunduğu modül grafiğindeki zod instance'ı yapılandırılır. (instrumentation.ts
// tek başına yetmiyor: Turbopack dev'de ayrı grafikte ayrı zod instance'ı yapılandırıyordu.)
z.config(z.locales.tr());
