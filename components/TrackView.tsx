"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/track";

// İlan/sayfa görüntülenmesini bir kez kaydeder.
export default function TrackView({
  type = "view",
  listingId,
  district,
}: {
  type?: string;
  listingId?: string;
  district?: string;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track({ type, listingId, district });
  }, [type, listingId, district]);
  return null;
}
