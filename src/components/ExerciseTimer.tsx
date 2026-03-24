import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, SkipForward, Settings2, Circle, Clock, Minus, Timer, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerPhase = "idle" | "work" | "rest" | "done";
type DisplayStyle = "circle" | "digital" | "bar";
type TimerMode = "interval" | "stopwatch" | "countdown";

interface ExerciseTimerProps {
  defaultWork?: number;
  defaultRest?: number;
  defaultRounds?: number;
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
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>("circle");
  const [timerMode, setTimerMode] = useState<TimerMode>("interval");

  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [currentRound, setCurrentRound] = useState(1);
  const [remaining, setRemaining] = useState(defaultWork);
  const [elapsed, setElapsed] = useState(0); // for stopwatch
  const [running, setRunning] = useState(false);
  const [countdownTotal, setCountdownTotal] = useState(120); // simple countdown

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const playBeep = useCallback((freq = 800, duration = 150) => {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {}
  }, []);

  // Interval mode
  useEffect(() => {
    if (!running || timerMode !== "interval") { clearTimer(); return; }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          playBeep(phase === "work" ? 600 : 900);
          if (phase === "work") {
            if (currentRound >= rounds) {
              setPhase("done");
              setRunning(false);
              playBeep(1200, 300);
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
        if (prev <= 4 && prev > 1) playBeep(400, 80);
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [running, phase, currentRound, rounds, workSeconds, restSeconds, clearTimer, timerMode, playBeep]);

  // Stopwatch mode
  useEffect(() => {
    if (!running || timerMode !== "stopwatch") { clearTimer(); return; }
    intervalRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    return clearTimer;
  }, [running, timerMode, clearTimer]);

  // Countdown mode
  useEffect(() => {
    if (!running || timerMode !== "countdown") { clearTimer(); return; }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setRunning(false);
          setPhase("done");
          playBeep(1200, 300);
          return 0;
        }
        if (prev <= 4) playBeep(400, 80);
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [running, timerMode, clearTimer, playBeep]);

  const start = () => {
    if (timerMode === "stopwatch") {
      setRunning(true);
      return;
    }
    if (timerMode === "countdown") {
      if (phase === "idle" || phase === "done") {
        setRemaining(countdownTotal);
        setPhase("work");
      }
      setRunning(true);
      return;
    }
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
    setElapsed(0);
    setRemaining(timerMode === "countdown" ? countdownTotal : workSeconds);
  };

  const skip = () => {
    if (timerMode !== "interval") return;
    if (phase === "work") {
      if (currentRound >= rounds) {
        setPhase("done"); setRunning(false); setRemaining(0);
      } else {
        setPhase("rest"); setRemaining(restSeconds);
      }
    } else if (phase === "rest") {
      setCurrentRound(r => r + 1);
      setPhase("work"); setRemaining(workSeconds);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatTimeMs = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const displaySeconds = timerMode === "stopwatch" ? elapsed : remaining;
  const phaseLabel = timerMode === "stopwatch"
    ? (running ? "BĚŽÍ" : elapsed > 0 ? "POZASTAVENO" : "PŘIPRAVEN")
    : phase === "work" ? "PRÁCE" : phase === "rest" ? "PAUZA" : phase === "done" ? "HOTOVO 🎉" : "PŘIPRAVEN";
  const phaseColor = timerMode === "stopwatch"
    ? (running ? "text-primary" : "text-muted-foreground")
    : phase === "work" ? "text-primary" : phase === "rest" ? "text-warning" : phase === "done" ? "text-success" : "text-muted-foreground";
  const phaseBg = phase === "work" ? "from-primary/5 to-primary/10" : phase === "rest" ? "from-warning/5 to-warning/10" : phase === "done" ? "from-success/5 to-success/10" : "from-muted/5 to-muted/10";

  const totalPhaseSeconds = timerMode === "countdown" ? countdownTotal : phase === "work" ? workSeconds : phase === "rest" ? restSeconds : 1;
  const progressPercent = timerMode === "stopwatch" ? 0 : phase === "idle" ? 0 : ((totalPhaseSeconds - remaining) / totalPhaseSeconds) * 100;

  const ringColor = phase === "work" || timerMode === "stopwatch" ? "stroke-primary" : phase === "rest" ? "stroke-warning" : "stroke-success";
  const SIZE = 200;
  const STROKE = 8;
  const R = (SIZE - STROKE) / 2 - 4;
  const circumference = 2 * Math.PI * R;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const switchMode = (mode: TimerMode) => {
    reset();
    setTimerMode(mode);
    if (mode === "countdown") setRemaining(countdownTotal);
    if (mode === "interval") setRemaining(workSeconds);
  };

  // ── Compact mode ──
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
        <div className={cn("text-2xl font-mono font-bold tabular-nums", phaseColor)}>
          {formatTime(displaySeconds)}
        </div>
        <div className="text-xs text-muted-foreground">
          <span className={cn("font-semibold", phaseColor)}>{phaseLabel}</span>
          {timerMode === "interval" && <span className="ml-1">Kolo {currentRound}/{rounds}</span>}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {!running ? (
            <Button size="sm" variant="ghost" onClick={start} className="h-8 w-8 p-0"><Play className="h-4 w-4" /></Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={pause} className="h-8 w-8 p-0"><Pause className="h-4 w-4" /></Button>
          )}
          {timerMode === "interval" && (
            <Button size="sm" variant="ghost" onClick={skip} className="h-8 w-8 p-0" disabled={phase === "idle" || phase === "done"}>
              <SkipForward className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={reset} className="h-8 w-8 p-0"><RotateCcw className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  // ── Display Modes ──
  const renderCircleDisplay = () => (
    <div className="relative flex items-center justify-center">
      <svg width={SIZE} height={SIZE} className="transform -rotate-90 drop-shadow-lg">
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" strokeWidth={STROKE}
          className="stroke-border/40" />
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" strokeWidth={STROKE}
          className={cn(ringColor, "transition-all duration-700 ease-out")}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
        {/* Glow effect */}
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" strokeWidth={STROKE + 6}
          className={cn(ringColor, "opacity-10 blur-sm")}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-5xl font-mono font-bold tabular-nums tracking-tight", phaseColor)}>
          {formatTime(displaySeconds)}
        </span>
        <span className={cn("text-sm font-bold mt-2 tracking-widest", phaseColor)}>
          {phaseLabel}
        </span>
        {timerMode === "interval" && phase !== "idle" && (
          <span className="text-xs text-muted-foreground mt-1">Kolo {currentRound} z {rounds}</span>
        )}
      </div>
    </div>
  );

  const renderDigitalDisplay = () => (
    <div className={cn("rounded-2xl p-8 bg-gradient-to-b border border-border/50", phaseBg)}>
      <div className="text-center">
        <div className={cn("text-7xl font-mono font-black tabular-nums tracking-tighter leading-none", phaseColor)}>
          {formatTimeMs(displaySeconds)}
        </div>
        <div className={cn("text-lg font-bold mt-3 tracking-widest", phaseColor)}>
          {phaseLabel}
        </div>
        {timerMode === "interval" && phase !== "idle" && (
          <div className="flex items-center justify-center gap-2 mt-3">
            {Array.from({ length: rounds }, (_, i) => (
              <div key={i} className={cn(
                "h-3 w-3 rounded-full transition-all duration-300",
                i + 1 < currentRound ? "bg-success scale-90"
                  : i + 1 === currentRound ? "bg-primary scale-110 ring-2 ring-primary/30"
                  : "bg-border"
              )} />
            ))}
          </div>
        )}
        {/* Progress bar below the digits */}
        {timerMode !== "stopwatch" && (
          <div className="mt-5 h-1.5 bg-border/50 rounded-full overflow-hidden">
            <div className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              phase === "work" ? "bg-primary" : phase === "rest" ? "bg-warning" : "bg-success"
            )} style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>
    </div>
  );

  const renderBarDisplay = () => (
    <div className="w-full space-y-4">
      {/* Big time */}
      <div className="text-center">
        <div className={cn("text-6xl font-mono font-black tabular-nums tracking-tight", phaseColor)}>
          {formatTimeMs(displaySeconds)}
        </div>
        <div className={cn("text-sm font-bold mt-2 tracking-widest", phaseColor)}>
          {phaseLabel}
        </div>
      </div>
      {/* Full width progress bar */}
      {timerMode !== "stopwatch" && (
        <div className="relative h-4 bg-border/30 rounded-full overflow-hidden">
          <div className={cn(
            "h-full rounded-full transition-all duration-500 ease-out relative",
            phase === "work" ? "bg-gradient-to-r from-primary/80 to-primary" 
              : phase === "rest" ? "bg-gradient-to-r from-warning/80 to-warning" 
              : "bg-gradient-to-r from-success/80 to-success"
          )} style={{ width: `${progressPercent}%` }}>
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
      )}
      {/* Round indicators for interval mode */}
      {timerMode === "interval" && (
        <div className="flex items-center justify-center gap-3">
          {Array.from({ length: rounds }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                i + 1 < currentRound ? "bg-success text-success-foreground"
                  : i + 1 === currentRound && phase !== "idle" ? "bg-primary text-primary-foreground scale-110 ring-2 ring-primary/30"
                  : "bg-border text-muted-foreground"
              )}>
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Mode selector */}
      <div className="flex bg-muted rounded-xl p-1 w-full max-w-sm">
        {([
          { mode: "interval" as TimerMode, icon: Zap, label: "Intervaly" },
          { mode: "stopwatch" as TimerMode, icon: Timer, label: "Stopky" },
          { mode: "countdown" as TimerMode, icon: Clock, label: "Odpočet" },
        ]).map(({ mode, icon: Icon, label }) => (
          <button key={mode} onClick={() => switchMode(mode)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              timerMode === mode
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}>
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Display style selector */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
        {([
          { style: "circle" as DisplayStyle, icon: Circle, label: "Kruh" },
          { style: "digital" as DisplayStyle, icon: Clock, label: "Digitální" },
          { style: "bar" as DisplayStyle, icon: Minus, label: "Lišta" },
        ]).map(({ style, icon: Icon, label }) => (
          <button key={style} onClick={() => setDisplayStyle(style)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
              displayStyle === style
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}>
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div className="w-full max-w-sm flex justify-center">
        {displayStyle === "circle" && renderCircleDisplay()}
        {displayStyle === "digital" && renderDigitalDisplay()}
        {displayStyle === "bar" && renderBarDisplay()}
      </div>

      {/* Round indicators for circle mode interval */}
      {displayStyle === "circle" && timerMode === "interval" && (
        <div className="flex items-center gap-2">
          {Array.from({ length: rounds }, (_, i) => (
            <div key={i} className={cn(
              "h-2.5 w-2.5 rounded-full transition-all duration-300",
              i + 1 < currentRound ? "bg-success"
                : i + 1 === currentRound && phase !== "idle" ? "bg-primary ring-2 ring-primary/30 scale-125"
                : "bg-border"
            )} />
          ))}
          {phase !== "idle" && (
            <span className="text-xs text-muted-foreground ml-1">Kolo {currentRound}/{rounds}</span>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!running ? (
          <Button onClick={start} size="lg" className="gap-2 min-w-[140px] h-12 text-base rounded-xl shadow-md">
            <Play className="h-5 w-5" />
            {phase === "idle" || phase === "done" ? "Start" : "Pokračovat"}
          </Button>
        ) : (
          <Button onClick={pause} size="lg" variant="secondary" className="gap-2 min-w-[140px] h-12 text-base rounded-xl shadow-md">
            <Pause className="h-5 w-5" /> Pauza
          </Button>
        )}
        {timerMode === "interval" && (
          <Button onClick={skip} size="lg" variant="outline" className="h-12 w-12 rounded-xl" disabled={phase === "idle" || phase === "done"}>
            <SkipForward className="h-5 w-5" />
          </Button>
        )}
        <Button onClick={reset} size="lg" variant="outline" className="h-12 w-12 rounded-xl">
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {/* Settings */}
      <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}
        className="gap-1.5 text-muted-foreground hover:text-foreground">
        <Settings2 className="h-4 w-4" /> Nastavení
      </Button>

      {showSettings && (
        <div className="w-full max-w-sm space-y-4 p-5 rounded-2xl bg-card border border-border shadow-sm">
          {timerMode === "interval" && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Práce</Label>
                  <span className="text-sm font-mono text-primary font-bold">{formatTime(workSeconds)}</span>
                </div>
                <Slider min={5} max={300} step={5} value={[workSeconds]}
                  onValueChange={([v]) => { setWorkSeconds(v); if (phase === "idle") setRemaining(v); }} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Pauza</Label>
                  <span className="text-sm font-mono text-warning font-bold">{formatTime(restSeconds)}</span>
                </div>
                <Slider min={0} max={300} step={5} value={[restSeconds]}
                  onValueChange={([v]) => setRestSeconds(v)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Počet kol</Label>
                  <span className="text-sm font-mono font-bold">{rounds}</span>
                </div>
                <Slider min={1} max={20} step={1} value={[rounds]}
                  onValueChange={([v]) => setRounds(v)} />
              </div>
            </>
          )}
          {timerMode === "countdown" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Odpočet</Label>
                <span className="text-sm font-mono text-primary font-bold">{formatTimeMs(countdownTotal)}</span>
              </div>
              <Slider min={10} max={3600} step={10} value={[countdownTotal]}
                onValueChange={([v]) => { setCountdownTotal(v); if (phase === "idle") setRemaining(v); }} />
            </div>
          )}
          {timerMode === "stopwatch" && (
            <p className="text-sm text-muted-foreground text-center">Stopky nemají žádné nastavení — prostě běží ⏱️</p>
          )}
        </div>
      )}
    </div>
  );
}
