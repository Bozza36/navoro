import { useState } from "react";
import { Slider } from "@/components/ui/slider";

interface SliderConfig {
  name: string;
  label: string;
  min: number;
  max: number;
  optimal: number;
  weight: number;
}

interface ResourceSlidersProps {
  sliders: SliderConfig[];
  values: Record<string, number>;
  onChange: (name: string, value: number) => void;
  disabled?: boolean;
}

const ResourceSliders = ({ sliders, values, onChange, disabled }: ResourceSlidersProps) => {
  return (
    <div className="space-y-6">
      {sliders.map((slider) => (
        <div key={slider.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">{slider.label}</label>
            <span className="text-sm font-bold text-accent tabular-nums">{values[slider.name] ?? 50}%</span>
          </div>
          <Slider
            min={slider.min}
            max={slider.max}
            step={1}
            value={[values[slider.name] ?? 50]}
            onValueChange={([v]) => onChange(slider.name, v)}
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{slider.min}%</span>
            <span>{slider.max}%</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResourceSliders;
