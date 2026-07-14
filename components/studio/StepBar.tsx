import { Camera, Crop, FileText, SlidersHorizontal, Download } from "lucide-react";
import type { StudioStep } from "@/types/studio";

const steps: { id: StudioStep; label: string; icon: typeof Camera }[] = [
  { id: "capture", label: "Photo", icon: Camera },
  { id: "crop", label: "Crop", icon: Crop },
  { id: "details", label: "Details", icon: FileText },
  { id: "enhance", label: "Enhance", icon: SlidersHorizontal },
  { id: "preview", label: "Export", icon: Download },
];

export function StepBar({ current, enabled, onSelect }: { current: StudioStep; enabled: boolean; onSelect: (step: StudioStep) => void }) {
  const currentIndex = steps.findIndex((step) => step.id === current);
  return (
    <nav className="step-bar" aria-label="Photo preparation steps">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const disabled = index > 0 && !enabled;
        return (
          <button key={step.id} className={index === currentIndex ? "is-current" : index < currentIndex ? "is-complete" : ""} disabled={disabled} onClick={() => onSelect(step.id)} aria-current={index === currentIndex ? "step" : undefined}>
            <span className="step-icon"><Icon size={17} strokeWidth={2} /></span>
            <span>{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
