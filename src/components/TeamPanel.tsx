import { Users } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  note: string;
  avatar: string;
}

const TEAMS: Record<string, TeamMember[]> = {
  Mechanical: [
    { name: "Sarah J.", role: "Lead R&D Engineer", note: "Focus on thermal efficiency targets this quarter.", avatar: "SJ" },
    { name: "Marcus T.", role: "Compliance Officer", note: "New OSHA guidelines effective next month.", avatar: "MT" },
    { name: "Dr. Anika P.", role: "Materials Scientist", note: "Composite stress tests due Friday.", avatar: "AP" },
  ],
  Biomedical: [
    { name: "Dr. Chen W.", role: "Lead Researcher", note: "FDA submission deadline approaching.", avatar: "CW" },
    { name: "Priya S.", role: "Clinical Trials Mgr", note: "Phase II results look promising.", avatar: "PS" },
    { name: "James R.", role: "Regulatory Affairs", note: "CE marking docs need review.", avatar: "JR" },
  ],
  Civil: [
    { name: "Elena M.", role: "Structural Lead", note: "Seismic analysis report ready for review.", avatar: "EM" },
    { name: "David K.", role: "Site Supervisor", note: "Weather delay on foundation pour.", avatar: "DK" },
    { name: "Fatima A.", role: "Environmental Eng.", note: "Stormwater plan approved by EPA.", avatar: "FA" },
  ],
  default: [
    { name: "Alex R.", role: "Team Lead", note: "Sprint review scheduled for Thursday.", avatar: "AR" },
    { name: "Jordan L.", role: "Senior Analyst", note: "Q3 metrics dashboard is live.", avatar: "JL" },
    { name: "Kim N.", role: "Compliance Advisor", note: "Policy update pending board approval.", avatar: "KN" },
  ],
};

interface TeamPanelProps {
  category: string;
}

const TeamPanel = ({ category }: TeamPanelProps) => {
  const team = TEAMS[category] || TEAMS.default;

  return (
    <div className="rounded-xl border border-border bg-card p-4" style={{ boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.3)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-accent" />
        <h3 className="font-bold text-foreground text-sm tracking-wide">Your Team</h3>
      </div>
      <div className="space-y-3">
        {team.map((member) => (
          <div key={member.name} className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
              {member.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{member.name}</p>
              <p className="text-xs text-accent">{member.role}</p>
              <p className="text-xs text-muted-foreground mt-0.5 italic">"{member.note}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamPanel;
