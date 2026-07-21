"use client";

import { useState, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Link2, Image as ImageIcon, Undo2, Redo2, Quote, Minus,
} from "lucide-react";

function Btn({
  onClick, active, title, children,
}: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-md transition ${
        active ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichEditor({
  name,
  defaultValue = "",
}: {
  name: string;
  defaultValue?: string;
}) {
  const [html, setHtml] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        defaultProtocol: "https",
        protocols: ["http", "https", "mailto", "tel"],
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Image.configure({ HTMLAttributes: { class: "cms-img" } }),
    ],
    content: defaultValue,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "cms-content min-h-[280px] max-w-none px-4 py-3 outline-none",
      },
    },
  });

  const addImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("files", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.ok && data.urls?.[0]) {
          editor.chain().focus().setImage({ src: data.urls[0] }).run();
        }
      } finally {
        setUploading(false);
      }
    },
    [editor]
  );

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Bağlantı adresi (URL):", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    // Yalnızca güvenli protokollere izin ver (javascript:, data: vb. engelle).
    const trimmed = url.trim();
    if (!/^(https?:|mailto:|tel:|\/)/i.test(trimmed)) {
      window.alert("Yalnızca http, https, mailto, tel veya / ile başlayan adresler eklenebilir.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  }, [editor]);

  if (!editor) {
    return <div className="h-[340px] animate-pulse rounded-lg bg-slate-100" />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-paper">
      {/* Araç çubuğu */}
      <div className="flex flex-wrap items-center gap-1 border-b border-stone bg-canvas p-1.5">
        <Btn title="Kalın" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Btn>
        <Btn title="İtalik" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-slate-300" />
        <Btn title="Başlık 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Btn>
        <Btn title="Başlık 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-slate-300" />
        <Btn title="Madde listesi" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Btn>
        <Btn title="Numaralı liste" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Btn>
        <Btn title="Alıntı" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Btn>
        <Btn title="Ayraç" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-slate-300" />
        <Btn title="Bağlantı" active={editor.isActive("link")} onClick={setLink}><Link2 className="h-4 w-4" /></Btn>
        <Btn title="Görsel ekle" onClick={() => fileRef.current?.click()}><ImageIcon className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-slate-300" />
        <Btn title="Geri al" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></Btn>
        <Btn title="Yinele" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></Btn>
        {uploading && <span className="ml-2 text-xs text-slate-500">Görsel yükleniyor...</span>}
      </div>

      {/* Editör alanı */}
      <EditorContent editor={editor} />

      {/* Form ile gönderilecek HTML */}
      <input type="hidden" name={name} value={html} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) addImage(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
