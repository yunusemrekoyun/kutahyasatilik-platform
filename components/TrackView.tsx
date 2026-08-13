"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/track";

// İlan/sayfa görüntülenmesini bir kez kaydeder.
export default function TrackView({
  type = "view",
  listingId,
  postId,
  district,
}: {
  type?: string;
  listingId?: string;
  postId?: string;
  district?: string;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track({ type, listingId, postId, district });
  }, [type, listingId, postId, district]);
  return null;
}
