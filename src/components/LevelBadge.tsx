import { Shield, Hexagon, Award } from "lucide-react";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LevelBadge = ({ level, size = "md", className = "" }: LevelBadgeProps) => {
  const sizes = {
    sm: { icon: "h-4 w-4", container: "h-8 w-8" },
    md: { icon: "h-6 w-6", container: "h-12 w-12" },
    lg: { icon: "h-10 w-10", container: "h-20 w-20" },
  };

  const s = sizes[size];

  // Levels 1-2: Simple geometric gold icon
  if (level <= 2) {
    return (
      <div className={`${s.container} rounded-full bg-accent/20 flex items-center justify-center gold-glow ${className}`}>
        <Hexagon className={`${s.icon} text-accent fill-accent/30`} />
      </div>
    );
  }

  // Level 3+: Professional credential seal
  if (level <= 4) {
    return (
      <div className={`${s.container} rounded-full flex items-center justify-center relative ${className}`}
        style={{
          background: "linear-gradient(135deg, hsl(43 69% 52%), hsl(43 69% 42%))",
          boxShadow: "0 0 24px hsl(43 69% 52% / 0.5), inset 0 1px 2px hsl(43 69% 72% / 0.5)",
        }}
      >
        <Shield className={`${s.icon} text-accent-foreground`} />
        <div className="absolute inset-0 rounded-full border-2 border-accent/60" />
      </div>
    );
  }

  // Level 5+: Elite credential with double ring
  return (
    <div className={`${s.container} rounded-full flex items-center justify-center relative ${className}`}
      style={{
        background: "linear-gradient(135deg, hsl(43 69% 52%), hsl(43 50% 35%))",
        boxShadow: "0 0 30px hsl(43 69% 52% / 0.6), inset 0 2px 4px hsl(43 69% 72% / 0.5)",
      }}
    >
      <Award className={`${s.icon} text-accent-foreground`} />
      <div className="absolute inset-0 rounded-full border-2 border-accent/70" />
      <div className="absolute inset-[3px] rounded-full border border-accent/40" />
    </div>
  );
};

export default LevelBadge;
