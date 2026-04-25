import { Upload, X, ImageIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Image is too large (max 8MB).");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => onChange(reader.result as string);
      reader.onerror = () => setError("Could not read file.");
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary shadow-soft animate-fade-up">
          <img
            src={value}
            alt="Your uploaded photo"
            className="w-full h-auto max-h-[520px] object-contain bg-muted"
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-3 right-3 rounded-full shadow-soft"
            onClick={() => onChange(null)}
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={cn(
            "group relative w-full rounded-2xl border-2 border-dashed transition-smooth",
            "flex flex-col items-center justify-center gap-4 p-12 text-center",
            "bg-secondary/50 hover:bg-secondary hover:border-accent",
            drag && "border-accent bg-accent/5 scale-[1.01]",
            !drag && "border-border",
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-gradient text-accent-foreground shadow-glow group-hover:scale-110 transition-smooth">
            <Upload className="h-7 w-7" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">
              Drop your photo here
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              or click to browse — JPG, PNG up to 8MB
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" />
            Best results: full upper body, facing camera, plain background
          </p>
        </button>
      )}

      {error && (
        <p className="text-sm text-destructive animate-fade-up">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
