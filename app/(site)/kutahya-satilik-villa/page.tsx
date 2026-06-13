import type { Metadata } from "next";
import { LANDING_BY_SLUG } from "@/lib/constants";
import LandingPageView from "@/components/LandingPageView";

const L = LANDING_BY_SLUG["kutahya-satilik-villa"];

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

export const metadata: Metadata = {
  title: L.title,
  description: L.intro,
  alternates: { canonical: "/kutahya-satilik-villa" },
};

export default function Page() {
  return <LandingPageView propertyType={L.propertyType} heading={L.heading} intro={L.intro} />;
}
