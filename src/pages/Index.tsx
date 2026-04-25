import { useMemo, useState } from "react";
import { Download, Sparkles, Wand2, Shirt, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PhotoUpload } from "@/components/tryon/PhotoUpload";
import { GarmentGrid } from "@/components/tryon/GarmentGrid";
import { BeforeAfter } from "@/components/tryon/BeforeAfter";
import { ProcessingOverlay } from "@/components/tryon/ProcessingOverlay";
import { GARMENTS, type Garment } from "@/lib/garments";

const Index = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [garment, setGarment] = useState<Garment | null>(GARMENTS[0]);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canTryOn = useMemo(() => !!photo && !!garment && !loading, [photo, garment, loading]);

  const handleTryOn = async () => {
    if (!photo || !garment) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("virtual-tryon", {
        body: {
          human_image: photo,
          garment_image: garment.publicUrl,
          garment_description: garment.description,
          category: garment.category,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.image_url) throw new Error("No image returned");
      setResult(data.image_url);
      toast.success("Try-on ready", { description: `Styled in ${garment.name}` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Try-on failed";
      toast.error("Couldn't generate try-on", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const r = await fetch(result);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tryon-${garment?.id ?? "result"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <main className="min-h-screen bg-background bg-mesh">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-md sticky top-0 z-20 bg-background/70">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-gradient text-accent-foreground shadow-glow">
              <Shirt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Mirror</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                AI Virtual Try-On
              </p>
            </div>
          </div>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
          >
            How it works
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="container pt-14 pb-10 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground shadow-soft animate-fade-up">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Powered by IDM-VTON · Realistic garment fitting
        </div>
        <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
          See yourself in anything,{" "}
          <span className="bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent">
            instantly
          </span>
          .
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground animate-fade-up" style={{ animationDelay: "120ms" }}>
          Upload a photo, pick an outfit, and watch our AI tailor it to your body —
          pose-aware, shoulder-aligned, photo-realistic.
        </p>
      </section>

      {/* Workspace */}
      <section className="container pb-20 grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10 items-start">
        {/* Left — controls */}
        <div className="space-y-6">
          <Card title="1. Your photo" subtitle="Upload a clear upper-body shot.">
            <PhotoUpload value={photo} onChange={setPhoto} />
          </Card>

          <Card
            title="2. Pick an outfit"
            subtitle="Six curated pieces. Tap to select."
          >
            <GarmentGrid
              selectedId={garment?.id ?? null}
              onSelect={(g) => {
                setGarment(g);
                setResult(null);
              }}
            />
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={handleTryOn}
              disabled={!canTryOn}
              className="flex-1 h-14 text-base bg-accent-gradient text-accent-foreground hover:opacity-95 shadow-glow disabled:opacity-50 disabled:shadow-none"
            >
              <Wand2 className="mr-2 h-5 w-5" />
              {loading ? "Generating…" : "Try it on"}
            </Button>
            {result && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => setResult(null)}
                className="h-14"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Right — preview */}
        <div className="lg:sticky lg:top-24">
          <Card
            title="Preview"
            subtitle={
              result ? "Drag the divider to compare." : "Your result will appear here."
            }
          >
            <div className="relative">
              {result && photo ? (
                <BeforeAfter before={photo} after={result} />
              ) : (
                <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-secondary/50 flex items-center justify-center" style={{ aspectRatio: "3 / 4" }}>
                  {loading && <ProcessingOverlay />}
                  {!loading && (
                    <div className="text-center px-8">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-soft">
                        <Sparkles className="h-6 w-6 text-accent" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-foreground">
                        Ready when you are
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Upload a photo and tap "Try it on" to see the magic.
                      </p>
                    </div>
                  )}
                </div>
              )}
              {loading && result === null && photo && (
                <div className="hidden" />
              )}
            </div>

            {result && (
              <Button
                onClick={handleDownload}
                variant="secondary"
                className="mt-4 w-full h-12"
              >
                <Download className="mr-2 h-4 w-4" />
                Download image
              </Button>
            )}
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border bg-card/40">
        <div className="container py-16 max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
            A real AI pipeline — not a sticker overlay
          </h2>
          <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
            Each request runs through a modular vision pipeline that detects, aligns,
            and blends the garment into your photo.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { n: "01", t: "Detect & isolate", d: "Locate the primary subject and crop to the largest person." },
              { n: "02", t: "Pose & segment", d: "Extract body keypoints and segment the torso region." },
              { n: "03", t: "Warp the garment", d: "Resize and perspective-warp to match shoulder geometry." },
              { n: "04", t: "Photo-real blend", d: "Alpha-composite with lighting, folds, and shadows." },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-smooth hover:shadow-elegant hover:-translate-y-0.5"
              >
                <span className="text-xs font-mono text-accent">{s.n}</span>
                <h3 className="mt-2 text-base font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container py-6 text-center text-xs text-muted-foreground">
          Mirror — virtual try-on demo. Photos are processed via a secure backend and
          not stored.
        </div>
      </footer>
    </main>
  );
};

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-soft animate-fade-up">
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export default Index;
