import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const STEPS = [
  "Detecting person…",
  "Estimating pose & keypoints…",
  "Segmenting body region…",
  "Warping garment to fit…",
  "Blending for realism…",
];

export function ProcessingOverlay() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 rounded-2xl bg-background/85 backdrop-blur-md animate-fade-up">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-secondary border-t-accent animate-spin" />
        <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-accent" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">Generating your try-on</p>
        <p key={step} className="text-xs text-muted-foreground animate-fade-up">
          {STEPS[step]}
        </p>
      </div>
    </div>
  );
}
