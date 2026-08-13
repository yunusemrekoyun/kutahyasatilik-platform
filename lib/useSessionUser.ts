"use client";

import { useEffect, useState } from "react";

// Oturum durumunu client tarafında çözer.
//
// NEDEN: Sayfada sunucu tarafında getUserSession() çağırmak cookies() okuduğu için
// rotayı tamamen dinamiğe düşürür — ISR/CDN cache devre dışı kalır. İlan detayı gibi
// yüksek trafikli sayfalarda oturuma bağlı tek şey tıklayınca açılan modal içeriği
// olduğundan, bu bilgiyi client'ta çekmek sayfayı statik tutar.
//
// İstek modül düzeyinde tek sefer yapılır; aynı sayfadaki birden çok bileşen
// (ContactButtons, StartConversation, LeadForm) tek yanıtı paylaşır.

export type SessionUser = { name: string; email: string; phone: string | null };

let cached: Promise<SessionUser | null> | null = null;

function fetchSessionUser(): Promise<SessionUser | null> {
  if (!cached) {
    cached = fetch("/api/user/me")
      .then((r) => r.json())
      .then((d) => (d?.user ?? null) as SessionUser | null)
      .catch(() => null);
  }
  return cached;
}

/** Oturum bilgisini geçersiz kılar (giriş/çıkış sonrası yeniden çekilsin diye). */
export function resetSessionUserCache() {
  cached = null;
}

export function useSessionUser(): { loading: boolean; user: SessionUser | null } {
  const [state, setState] = useState<{ loading: boolean; user: SessionUser | null }>({
    loading: true,
    user: null,
  });

  useEffect(() => {
    let active = true;
    fetchSessionUser().then((user) => {
      if (active) setState({ loading: false, user });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
