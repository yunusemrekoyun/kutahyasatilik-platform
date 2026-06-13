import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const HAKKIMIZDA_HTML = `
<p>Geleneksel emlakçılığın güvenini, dijital dünyanın hız ve şeffaflığıyla birleştiriyoruz. Amacımız ilan göstermek değil; sizi doğru gayrimenkulle, doğru fiyatta buluşturmaktır.</p>
<p>Kütahya merkez ve tüm ilçelerinde satılık daire, arsa, villa ve yatırımlık tarla portföyümüzle; alım, satım ve yatırım danışmanlığında güvenilir çözüm ortağınızız.</p>
<h2>Değerlerimiz</h2>
<ul>
<li><strong>Güven:</strong> Şeffaf süreç, doğru bilgilendirme ve tapuda güvence ilkemizdir.</li>
<li><strong>Veri Odaklılık:</strong> Her ilanı bölge ve yatırım analiziyle sunuyoruz.</li>
<li><strong>Hız:</strong> Taleplere aynı gün dönüş, hızlı eşleştirme ve çözüm.</li>
<li><strong>Sonuç:</strong> Alıcı ve satıcıyı doğru fiyatta buluşturmaya odaklanırız.</li>
</ul>
<h2>Nasıl Çalışıyoruz?</h2>
<ol>
<li><strong>İletişim &amp; Keşif:</strong> Telefon, WhatsApp veya form ile bize ulaşın; ihtiyacınızı dinleyelim.</li>
<li><strong>Değerleme &amp; Analiz:</strong> Mülk için ücretsiz, gerçekçi değerleme ve bölge analizi hazırlarız.</li>
<li><strong>Pazarlama &amp; Eşleştirme:</strong> Profesyonel ilan, Google reklamları ve portföyümüzle doğru alıcıya ulaşırız.</li>
<li><strong>Güvenli Satış:</strong> Pazarlık, sözleşme ve tapu sürecini baştan sona yönetiriz.</li>
</ol>
<blockquote>1.500+ mutlu müşteri · 850+ tamamlanan satış · 13 ilçede hizmet · 15+ yıl tecrübe</blockquote>
`.trim();

const KVKK_HTML = `
<p>Kütahya Satılık olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında kişisel verilerinizin güvenliğine önem veriyoruz. Bu metin, sitemiz aracılığıyla topladığımız verilerin nasıl işlendiğini açıklar.</p>
<h2>1. Toplanan Veriler</h2>
<p>İletişim ve talep formları aracılığıyla ad-soyad, telefon, e-posta ve mülkünüze ilişkin paylaştığınız bilgiler (ilçe, mahalle, mülk türü, fotoğraf vb.) toplanır.</p>
<h2>2. İşleme Amacı</h2>
<p>Verileriniz yalnızca; talebinize dönüş yapmak, gayrimenkul danışmanlığı sunmak, alım-satım süreçlerini yürütmek ve hizmet kalitemizi artırmak amacıyla işlenir.</p>
<h2>3. Aktarım</h2>
<p>Kişisel verileriniz, yasal yükümlülükler dışında üçüncü taraflarla paylaşılmaz, pazarlama amacıyla satılmaz.</p>
<h2>4. Çerezler (Cookies)</h2>
<p>Site deneyimini iyileştirmek ve trafiği analiz etmek için çerezler kullanılır. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.</p>
<h2>5. Haklarınız</h2>
<p>KVKK'nın 11. maddesi uyarınca verilerinize erişme, düzeltilmesini veya silinmesini talep etme hakkına sahipsiniz. Talepleriniz için bizimle iletişime geçebilirsiniz.</p>
<p><em>Bu metin bilgilendirme amaçlıdır ve hukuki danışmanlık yerine geçmez. Güncel mevzuata göre düzenlenmesi önerilir.</em></p>
`.trim();

const PAGES = [
  {
    slug: "hakkimizda",
    title: "Hakkımızda",
    content: HAKKIMIZDA_HTML,
    metaTitle: "Hakkımızda - Kurumsal",
    metaDescription:
      "Kütahya'nın dijital emlak ofisi. Alım, satım ve yatırım danışmanlığında güvenilir, şeffaf ve teknoloji odaklı hizmet anlayışımız.",
  },
  {
    slug: "kvkk",
    title: "KVKK & Gizlilik Politikası",
    content: KVKK_HTML,
    metaTitle: "KVKK & Gizlilik Politikası",
    metaDescription:
      "Kişisel verilerin korunması ve gizlilik politikamız hakkında bilgilendirme.",
  },
];

const TESTIMONIALS = [
  { name: "Ahmet Y.", role: "Daire Sahibi · Merkez", text: "Dairemi 3 hafta içinde, beklediğim fiyata sattılar. Süreç boyunca her adımda bilgilendirildim. Çok profesyonel bir ekip.", stars: 5, sortOrder: 1 },
  { name: "Selin K.", role: "Yatırımcı · Tavşanlı", text: "Yatırımlık arsa ararken bölge analizleri çok işime yaradı. Doğru lokasyonu seçmemde gerçekten yardımcı oldular.", stars: 5, sortOrder: 2 },
  { name: "Mehmet D.", role: "Alıcı · Simav", text: "WhatsApp'tan yazdım, yarım saat içinde aradılar ve ertesi gün mülkü gezdik. Hız ve ilgi mükemmeldi.", stars: 5, sortOrder: 3 },
];

const POSTS = [
  {
    slug: "dogru-gayrimenkul-nasil-alinir-adim-adim-rehber",
    title: "Doğru Gayrimenkul Nasıl Alınır? Adım Adım Rehber",
    excerpt: "Hayalinizdeki mülkü doğru fiyata ve güvenle almanın yolu planlı ilerlemekten geçer. İşte adım adım gayrimenkul alım rehberi.",
    author: "Kütahya Satılık",
    tags: "rehber, satın alma, ipuçları",
    content: `
<p>Gayrimenkul, çoğumuzun hayatındaki en büyük yatırımdır. Doğru kararı vermek için duygularla değil, planlı ve bilinçli hareket etmek gerekir. İşte güvenli bir alım için izlemeniz gereken adımlar.</p>
<h2>1. Bütçenizi Net Belirleyin</h2>
<p>Sadece satış fiyatını değil; tapu harcı, emlak komisyonu, taşınma ve olası tadilat masraflarını da hesaba katın. Kredi kullanacaksanız aylık taksitin gelirinizin %35'ini geçmemesi sağlıklıdır.</p>
<h2>2. İhtiyacınızı Tanımlayın</h2>
<p>Oturum mu, yatırım mı? Oda sayısı, konum, ulaşım, okul/hastane yakınlığı gibi kriterlerinizi yazın. Net kriter, doğru mülkü hızlı bulmanızı sağlar.</p>
<h2>3. Bölgeyi Araştırın</h2>
<p>Aynı mülk, bölgesine göre çok farklı değerlenir. Gelişen bölgeler orta vadede daha yüksek değer artışı sunar. Bölge ortalama fiyatlarını mutlaka karşılaştırın.</p>
<h2>4. Tapu ve İmar Durumunu Kontrol Edin</h2>
<p>Tapunun temiz (ipotek/haciz yok) olduğundan, imar durumunun beyan edilenle örtüştüğünden emin olun. Bu kontroller riskinizi büyük ölçüde azaltır.</p>
<h2>5. Yerinde Görün ve Pazarlık Yapın</h2>
<p>Mülkü farklı saatlerde görün; gürültü, güneş ve çevreyi gözlemleyin. Bölge ortalamasının altında bir teklifle pazarlığa başlayın.</p>
<blockquote>Acele etmeyin. Doğru mülk, doğru fiyat ve temiz tapu bir araya geldiğinde almak içinizde rahatlık yaratır.</blockquote>
<p>Tüm bu süreçte yanınızda olmamızı ister misiniz? Ücretsiz danışmanlık için bize ulaşın.</p>
`.trim(),
  },
  {
    slug: "arsa-alirken-nelere-dikkat-edilmeli",
    title: "Arsa Alırken Nelere Dikkat Edilmeli? 8 Kritik Kontrol",
    excerpt: "Arsa yatırımı yüksek getiri sunabilir ama yanlış arsa büyük kayıptır. Almadan önce mutlaka kontrol etmeniz gereken 8 nokta.",
    author: "Kütahya Satılık",
    tags: "arsa, yatırım, rehber",
    content: `
<p>Arsa, doğru seçildiğinde en kârlı yatırım araçlarından biridir. Ancak imar, tapu ve altyapı detayları gözden kaçarsa hayal kırıklığı yaratabilir. İşte dikkat edilmesi gereken 8 kritik nokta.</p>
<h2>1. İmar Durumu</h2>
<p>Arsanın konut, ticari, tarla veya sanayi imarlı olup olmadığını belediyeden teyit edin. "İmara açık" ile "imarlı" aynı şey değildir.</p>
<h2>2. KAKS / Emsal ve Gabari</h2>
<p>Ne kadar inşaat hakkınız olduğunu KAKS (emsal) belirler. Yatırım hesabı bu orana göre yapılır.</p>
<h2>3. Tapu Cinsi</h2>
<p>Müstakil tapu mu, hisseli mi? Hisseli tapularda kullanım ve satış zorlaşabilir.</p>
<h2>4. Yola Cephe ve Ulaşım</h2>
<p>Yola cepheli arsalar hem değerli hem de yapılaşmaya uygundur.</p>
<h2>5. Altyapı</h2>
<p>Elektrik, su, doğalgaz ve kanalizasyon var mı? Altyapı maliyeti yatırımı etkiler.</p>
<h2>6. Zemin ve Eğim</h2>
<p>Zemin etüdü ve arazinin eğimi, inşaat maliyetini doğrudan etkiler.</p>
<h2>7. Bölgenin Gelişim Planı</h2>
<p>Yeni yol, hastane, OSB gibi projeler arsanın değerini katlayabilir.</p>
<h2>8. Vaziyet ve Aplikasyon</h2>
<p>Arsanın sınırlarının tapudaki ölçülerle uyuştuğunu kontrol ettirin.</p>
<blockquote>Doğru arsa; temiz tapu, net imar ve gelişen bir konumun buluştuğu yerdir.</blockquote>
`.trim(),
  },
  {
    slug: "ilk-evini-alacaklara-10-altin-kural",
    title: "İlk Evini Alacaklara 10 Altın Kural",
    excerpt: "İlk ev heyecan vericidir ama acemi hatalarına da açıktır. İlk alımınızda sizi koruyacak 10 pratik kural.",
    author: "Kütahya Satılık",
    tags: "ilk ev, rehber, ipuçları",
    content: `
<p>İlk evini almak büyük bir adımdır. Heyecanın gölgesinde acele kararlar vermemek için bu 10 kuralı aklınızda tutun.</p>
<ol>
<li><strong>Önce bütçe, sonra hayal:</strong> Ne kadar ödeyebileceğinizi netleştirin.</li>
<li><strong>Konum her şeydir:</strong> Evi değiştirebilirsiniz, konumu değiştiremezsiniz.</li>
<li><strong>Tapuyu kontrol ettirin:</strong> İpotek, haciz, şerh var mı bakın.</li>
<li><strong>Aidat ve giderleri sorun:</strong> Site aidatı bütçeyi zorlayabilir.</li>
<li><strong>Binayı inceleyin:</strong> Yaş, deprem yönetmeliği, ısı yalıtımı.</li>
<li><strong>Komşuları ve çevreyi gözlemleyin.</strong></li>
<li><strong>Kredi ön onayı alın:</strong> Pazarlıkta elinizi güçlendirir.</li>
<li><strong>Pazarlıktan çekinmeyin.</strong></li>
<li><strong>Sözleşmeyi dikkatle okuyun.</strong></li>
<li><strong>Uzman desteği alın:</strong> Güvenilir bir danışman zaman ve para kazandırır.</li>
</ol>
<blockquote>İlk evinizde acele etmeyin; doğru ev, sabırla aramanın ödülüdür.</blockquote>
`.trim(),
  },
];

async function main() {
  // Sayfalar: yoksa oluştur (varsa admin düzenlemesini ezme)
  for (const p of PAGES) {
    const existing = await prisma.page.findUnique({ where: { slug: p.slug }, select: { id: true } });
    if (existing) {
      console.log(`↩︎  Sayfa zaten var, atlandı: ${p.slug}`);
      continue;
    }
    await prisma.page.create({
      data: { ...p, status: "published", showInMenu: false, menuOrder: 0 },
    });
    console.log(`✅ Sayfa oluşturuldu: ${p.slug}`);
  }

  // Yorumlar: tablo boşsa seed et
  const count = await prisma.testimonial.count();
  if (count === 0) {
    for (const t of TESTIMONIALS) {
      await prisma.testimonial.create({ data: t });
    }
    console.log(`✅ ${TESTIMONIALS.length} müşteri yorumu eklendi`);
  } else {
    console.log(`↩︎  Yorumlar zaten var (${count}), atlandı`);
  }

  // Blog rehber yazıları: tablo boşsa seed et
  const postCount = await prisma.post.count();
  if (postCount === 0) {
    for (const p of POSTS) {
      await prisma.post.create({
        data: {
          ...p,
          status: "published",
          publishedAt: new Date(),
          metaTitle: `${p.title} | Kütahya Satılık`,
          metaDescription: p.excerpt,
        },
      });
    }
    console.log(`✅ ${POSTS.length} rehber yazısı eklendi`);
  } else {
    console.log(`↩︎  Blog yazıları zaten var (${postCount}), atlandı`);
  }

  console.log("✨ CMS seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
