import { PageHeader } from "@/components/PageHeader";
import ExerciseTimer from "@/components/ExerciseTimer";

export default function TimerPage() {
  return (
    <div className="p-6 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Časovač" description="Intervaly, stopky nebo jednoduchý odpočet" />
      <div className="rounded-2xl bg-card shadow-card overflow-hidden">
        <ExerciseTimer defaultWork={45} defaultRest={30} defaultRounds={3} />
      </div>
    </div>
  );
}
