import { FileText, GitBranch, Presentation, Users, FlaskConical } from "lucide-react";

export type TaskType = "document" | "decision" | "briefing" | "meeting" | "lab";

const STYLES: Record<TaskType, { bg: string; text: string; label: string; Icon: any }> = {
  document: { bg: "bg-[hsl(180_60%_30%/0.15)]", text: "text-[hsl(180_70%_55%)]", label: "Document", Icon: FileText },
  decision: { bg: "bg-[hsl(270_60%_40%/0.15)]", text: "text-[hsl(270_70%_70%)]", label: "Decision", Icon: GitBranch },
  briefing: { bg: "bg-[hsl(210_70%_40%/0.15)]", text: "text-[hsl(210_80%_65%)]", label: "Briefing", Icon: Presentation },
  meeting: { bg: "bg-[hsl(43_69%_52%/0.18)]", text: "text-accent", label: "Meeting", Icon: Users },
  lab: { bg: "bg-[hsl(10_70%_50%/0.15)]", text: "text-[hsl(10_80%_65%)]", label: "Lab", Icon: FlaskConical },
};

export const inferTaskType = (stageType?: string): TaskType => {
  if (!stageType) return "decision";
  if (stageType.includes("decision")) return "decision";
  if (stageType.includes("document_builder") || stageType.includes("document")) return "document";
  if (stageType.includes("risk_matrix") || stageType.includes("ecg") || stageType.includes("cytotox") || stageType.includes("power") || stageType.includes("material")) return "lab";
  if (stageType.includes("component") || stageType.includes("selector")) return "document";
  if (stageType.includes("guided_scenario") || stageType.includes("briefing")) return "briefing";
  if (stageType.includes("review") || stageType.includes("meeting")) return "meeting";
  return "briefing";
};

const TaskTypeBadge = ({ type, className = "" }: { type: TaskType; className?: string }) => {
  const s = STYLES[type];
  const Icon = s.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase ${s.bg} ${s.text} ${className}`}>
      <Icon className="h-2.5 w-2.5" /> {s.label}
    </span>
  );
};

export default TaskTypeBadge;
