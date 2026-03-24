import { PageHeader } from "@/components/PageHeader";
import ExerciseTimer from "@/components/ExerciseTimer";

export default function TimerPage() {
  return (
    <div className="p-6 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Časovač" description="Jednoduchý časovač pro cviky — práce / pauza / kola" />
      <div className="rounded-xl bg-card shadow-card">
        <ExerciseTimer defaultWork={45} defaultRest={30} defaultRounds={3} />
      </div>
    </div>
  );
}
