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

const StageDocumentTask = ({ stage, onComplete }: Props) => (
  <AIReviewableStage
    taskType="document"
    taskTitle={stage.title}
    scenario={stage.scenario ?? stage.instruction}
    reviewer={stage.reviewer}
    rubric={stage.rubric}
    prompt={stage.instruction}
    placeholder={stage.placeholder ?? "Draft your technical write-up, citing standards and risks…"}
    minChars={stage.min_chars ?? 120}
    onComplete={onComplete}
  />
);

export default StageDocumentTask;
