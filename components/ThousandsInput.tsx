"use client";

import { useState } from "react";

// Binlik ayraçlı sayı girişi (tr-TR): kullanıcı yazarken 1000000 → 1.000.000 görünür.
// Form'a giden değer varsayılan olarak HAM rakamdır (hidden input) — sunucu Number() ile
// güvenle işler. submitFormatted=true ise noktalı hâli gönderilir (serbest-metin alanlar,
// örn. satıcı "istenilen fiyat" — görüntülendiği her yerde okunaklı kalsın diye).
// onCommit verilirse (filtreler gibi form-dışı kullanımlar) blur/Enter'da ham değeri iletir.

const fmt = (d: string) => (d ? Number(d).toLocaleString("tr-TR") : "");

export default function ThousandsInput({
  name,
  id,
  defaultValue = "",
  placeholder,
  className,
  required = false,
  submitFormatted = false,
  onCommit,
}: {
  name?: string;
  id?: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  className?: string;
  required?: boolean;
  submitFormatted?: boolean;
  onCommit?: (raw: string) => void;
}) {
  const [raw, setRaw] = useState(String(defaultValue ?? "").replace(/\D/g, ""));

  return (
    <>
      {name && <input type="hidden" name={name} value={submitFormatted ? fmt(raw) : raw} />}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        value={fmt(raw)}
        placeholder={placeholder}
        className={className}
        onChange={(e) => setRaw(e.target.value.replace(/\D/g, "").slice(0, 12))}
        onBlur={() => onCommit?.(raw)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onCommit) {
            e.preventDefault();
            onCommit(raw);
          }
        }}
      />
    </>
  );
}
