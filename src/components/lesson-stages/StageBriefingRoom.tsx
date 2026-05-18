import AIReviewableStage from "./AIReviewableStage";

interface Props {
  stage: {
    title: string;
    instruction: string;
    scenario?: string;
    reviewer?: string;
    rubric?: string[];
    placeholder?: string;
    min_chars?: number;
  };
  onComplete: (score: number) => void;
}

const StageBriefingRoom = ({ stage, onComplete }: Props) => (
  <AIReviewableStage
    taskType="briefing"
    taskTitle={stage.title}
    scenario={stage.scenario ?? stage.instruction}
    reviewer={stage.reviewer}
    rubric={stage.rubric}
    prompt={stage.instruction}
    placeholder={stage.placeholder ?? "Outline the briefing: context, key decision, recommended path, risks…"}
    minChars={stage.min_chars ?? 100}
    onComplete={onComplete}
  />
);

export default StageBriefingRoom;
