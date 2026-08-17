"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";

interface ImageUploaderProps {
  bucket: "products" | "trades" | "avatars";
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  className?: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export function ImageUploader({ bucket, currentUrl, onUploaded, className }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);

      if (!ALLOWED_TYPES.includes(file.type)) {
        const msg = "Format non supporté. Utilisez JPEG, PNG ou WebP.";
        setError(msg);
        toast.error(msg);
        return;
      }
      if (file.size > MAX_SIZE) {
        const msg = "Fichier trop volumineux (max 5 Mo).";
        setError(msg);
        toast.error(msg);
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);

      const res = await apiFetch<{ url: string }>("/api/admin/upload", {
        method: "POST",
        body: formData,
        headers: {},
      });
      setUploading(false);

      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }

      setPreview(res.data.url);
      onUploaded(res.data.url);
      toast.success("Image uploadée");
    },
    [bucket, onUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) void upload(file);
    },
    [upload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void upload(file);
    },
    [upload]
  );

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative group">
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Aperçu"
            className="w-full h-40 object-cover rounded-input border border-border"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-input flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              Changer
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setPreview(null);
                onUploaded("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="w-full h-40 border-2 border-dashed border-border rounded-input flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-blue/50 hover:bg-brand-blue/5 transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
              <span className="text-sm text-text-secondary">Upload en cours…</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-text-secondary" />
              <span className="text-sm text-text-secondary">
                Glissez une image ou cliquez
              </span>
              <span className="text-xs text-text-secondary/60">
                JPEG, PNG, WebP — max 5 Mo
              </span>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1 mt-2 text-xs text-brand-red">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
}
