import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, SkipForward, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerPhase = "idle" | "work" | "rest" | "done";

interface ExerciseTimerProps {
  /** Default work seconds */
  defaultWork?: number;
  /** Default rest seconds */
  defaultRest?: number;
  /** Default rounds */
  defaultRounds?: number;
  /** Compact mode for inline use */
  compact?: boolean;
}

export default function ExerciseTimer({
  defaultWork = 45,
  defaultRest = 30,
  defaultRounds = 3,
  compact = false,
}: ExerciseTimerProps) {
  const [workSeconds, setWorkSeconds] = useState(defaultWork);
  const [restSeconds, setRestSeconds] = useState(defaultRest);
  const [rounds, setRounds] = useState(defaultRounds);
  const [showSettings, setShowSettings] = useState(false);

  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [currentRound, setCurrentRound] = useState(1);
  const [remaining, setRemaining] = useState(defaultWork);
  const [running, setRunning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  useEffect(() => {
    if (!running) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          // Phase ended
          if (phase === "work") {
            if (currentRound >= rounds) {
              setPhase("done");
              setRunning(false);
              return 0;
            }
            setPhase("rest");
            return restSeconds;
          } else if (phase === "rest") {
            setCurrentRound(r => r + 1);
            setPhase("work");
            return workSeconds;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [running, phase, currentRound, rounds, workSeconds, restSeconds, clearTimer]);

  const start = () => {
    if (phase === "idle" || phase === "done") {
      setPhase("work");
      setCurrentRound(1);
      setRemaining(workSeconds);
    }
    setRunning(true);
  };

  const pause = () => setRunning(false);

  const reset = () => {
    setRunning(false);
    setPhase("idle");
    setCurrentRound(1);
    setRemaining(workSeconds);
  };

  const skip = () => {
    if (phase === "work") {
      if (currentRound >= rounds) {
        setPhase("done");
        setRunning(false);
        setRemaining(0);
      } else {
        setPhase("rest");
        setRemaining(restSeconds);
      }
    } else if (phase === "rest") {
      setCurrentRound(r => r + 1);
      setPhase("work");
      setRemaining(workSeconds);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const phaseLabel = phase === "work" ? "PRÁCE" : phase === "rest" ? "PAUZA" : phase === "done" ? "HOTOVO" : "PŘIPRAVEN";
  const phaseColor = phase === "work" ? "text-primary" : phase === "rest" ? "text-warning" : phase === "done" ? "text-success" : "text-muted-foreground";
  const progressPercent = phase === "work"
    ? ((workSeconds - remaining) / workSeconds) * 100
    : phase === "rest"
      ? ((restSeconds - remaining) / restSeconds) * 100
      : 0;

  const ringColor = phase === "work" ? "stroke-primary" : phase === "rest" ? "stroke-warning" : "stroke-success";
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
        <div className={cn("text-2xl font-mono font-bold tabular-nums", phaseColor)}>
          {formatTime(remaining)}
        </div>
        <div className="text-xs text-muted-foreground">
          <span className={cn("font-semibold", phaseColor)}>{phaseLabel}</span>
          <span className="ml-1">Kolo {currentRound}/{rounds}</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {!running ? (
            <Button size="sm" variant="ghost" onClick={start} className="h-8 w-8 p-0">
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={pause} className="h-8 w-8 p-0">
              <Pause className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={skip} className="h-8 w-8 p-0" disabled={phase === "idle" || phase === "done"}>
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={reset} className="h-8 w-8 p-0">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Circular progress */}
      <div className="relative">
        <svg width="140" height="140" className="transform -rotate-90">
          <circle cx="70" cy="70" r="54" fill="none" stroke="currentColor" strokeWidth="6"
            className="text-border" />
          <circle cx="70" cy="70" r="54" fill="none" strokeWidth="6"
            className={cn(ringColor, "transition-all duration-300")}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-mono font-bold tabular-nums", phaseColor)}>
            {formatTime(remaining)}
          </span>
          <span className={cn("text-xs font-semibold mt-1", phaseColor)}>{phaseLabel}</span>
        </div>
      </div>

      {/* Round indicator */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: rounds }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              i + 1 < currentRound ? "bg-success"
                : i + 1 === currentRound && phase !== "idle" ? "bg-primary"
                  : "bg-border"
            )}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-2">Kolo {currentRound}/{rounds}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!running ? (
          <Button onClick={start} size="lg" className="gap-2 min-w-[120px]">
            <Play className="h-5 w-5" />
            {phase === "idle" || phase === "done" ? "Start" : "Pokračovat"}
          </Button>
        ) : (
          <Button onClick={pause} size="lg" variant="secondary" className="gap-2 min-w-[120px]">
            <Pause className="h-5 w-5" /> Pauza
          </Button>
        )}
        <Button onClick={skip} size="lg" variant="outline" disabled={phase === "idle" || phase === "done"}>
          <SkipForward className="h-5 w-5" />
        </Button>
        <Button onClick={reset} size="lg" variant="outline">
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {/* Settings toggle */}
      <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="gap-1.5 text-muted-foreground">
        <Settings2 className="h-4 w-4" /> Nastavení
      </Button>

      {showSettings && (
        <div className="w-full max-w-xs grid gap-3 p-4 rounded-xl bg-card border border-border">
          <div className="grid gap-1.5">
            <Label className="text-xs">Práce (sekundy)</Label>
            <Input type="number" min={5} max={600} value={workSeconds}
              onChange={e => { const v = parseInt(e.target.value) || 5; setWorkSeconds(v); if (phase === "idle") setRemaining(v); }}
              className="h-8 text-sm" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Pauza (sekundy)</Label>
            <Input type="number" min={0} max={600} value={restSeconds}
              onChange={e => setRestSeconds(parseInt(e.target.value) || 0)}
              className="h-8 text-sm" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Počet kol</Label>
            <Input type="number" min={1} max={50} value={rounds}
              onChange={e => setRounds(parseInt(e.target.value) || 1)}
              className="h-8 text-sm" />
          </div>
        </div>
      )}
    </div>
  );
}
