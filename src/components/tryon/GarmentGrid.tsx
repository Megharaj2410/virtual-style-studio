import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { GARMENTS, type Garment } from "@/lib/garments";

interface Props {
  selectedId: string | null;
  onSelect: (g: Garment) => void;
}

export function GarmentGrid({ selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {GARMENTS.map((g, i) => {
        const active = selectedId === g.id;
        return (
          <button
            key={g.id}
            onClick={() => onSelect(g)}
            style={{ animationDelay: `${i * 40}ms` }}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-2xl border-2 bg-secondary transition-smooth animate-fade-up text-left",
              active
                ? "border-accent shadow-glow scale-[1.02]"
                : "border-transparent hover:border-border hover:scale-[1.02]",
            )}
            aria-pressed={active}
            aria-label={`Select ${g.name}`}
          >
            <img
              src={g.thumbnail}
              alt={g.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-smooth group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/85 via-primary/40 to-transparent p-3">
              <p className="text-xs font-medium text-primary-foreground line-clamp-1">
                {g.name}
              </p>
              <span className="text-[10px] uppercase tracking-wider text-primary-foreground/70">
                {g.tag}
              </span>
            </div>
            {active && (
              <div className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-glow">
                <Check className="h-4 w-4" strokeWidth={3} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
