import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  /** Shown text when not editing. */
  value: string;
  /** Called with the typed text (may be empty while typing) and on +/-. */
  onTextChange: (text: string) => void;
  /** Returns the number in the text, or null when it isn't a plain number (e.g. "8-12"). */
  toNumber: (text: string) => number | null;
  fromNumber: (n: number) => string;
  /** Called on blur with the current text; return the text to keep (e.g. the last valid value). */
  normalize: (text: string) => string;
  step: number;
  min: number;
  max: number;
  label: string;
  inputMode?: "numeric" | "decimal" | "text";
  className?: string;
}

/**
 * −  [ value ]  +  — typing works freely (an empty field stays empty until blur),
 * holding a button repeats.
 */
function Stepper({
  value, onTextChange, toNumber, fromNumber, normalize, step, min, max, label, inputMode = "numeric", className,
}: StepperProps) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  const repeat = useRef<{ timeout?: ReturnType<typeof setTimeout>; interval?: ReturnType<typeof setInterval> }>({});
  const latest = useRef(value);
  latest.current = focused.current ? draft : value;

  useEffect(() => { if (!focused.current) setDraft(value); }, [value]);
  useEffect(() => () => stopRepeat(), []);

  const current = toNumber(latest.current);
  const canStep = current !== null;

  const bump = (dir: 1 | -1) => {
    const n = toNumber(latest.current);
    if (n === null) return;
    const next = Math.min(max, Math.max(min, Math.round((n + dir * step) / step) * step));
    const text = fromNumber(next);
    latest.current = text;
    setDraft(text);
    onTextChange(text);
  };

  const startRepeat = (dir: 1 | -1) => {
    bump(dir);
    repeat.current.timeout = setTimeout(() => {
      repeat.current.interval = setInterval(() => bump(dir), 90);
    }, 400);
  };
  function stopRepeat() {
    clearTimeout(repeat.current.timeout);
    clearInterval(repeat.current.interval);
    repeat.current = {};
  }

  const button = (dir: 1 | -1) => (
    <button
      type="button"
      aria-label={`${dir === 1 ? "Zvýšit" : "Snížit"} ${label}`}
      disabled={!canStep || (dir === 1 ? current! >= max : current! <= min)}
      onPointerDown={e => { e.preventDefault(); startRepeat(dir); }}
      onPointerUp={stopRepeat}
      onPointerLeave={stopRepeat}
      onPointerCancel={stopRepeat}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bump(dir); } }}
      className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground active:bg-muted disabled:opacity-30 touch-manipulation select-none"
    >
      {dir === 1 ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
    </button>
  );

  return (
    <div className={cn("flex h-9 items-center rounded-md border border-input bg-background", className)}>
      {button(-1)}
      <input
        aria-label={label}
        inputMode={inputMode}
        value={draft}
        onFocus={e => { focused.current = true; e.target.select(); }}
        onChange={e => { setDraft(e.target.value); onTextChange(e.target.value); }}
        onBlur={() => {
          focused.current = false;
          const kept = normalize(draft);
          setDraft(kept);
          if (kept !== draft) onTextChange(kept);
        }}
        onKeyDown={e => {
          if (e.key === "ArrowUp") { e.preventDefault(); bump(1); }
          if (e.key === "ArrowDown") { e.preventDefault(); bump(-1); }
        }}
        className="h-full w-full min-w-0 bg-transparent text-center text-sm tabular-nums outline-none"
      />
      {button(1)}
    </div>
  );
}

const clampInt = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Whole or decimal number with min/max. Empty while typing; restores the last value on blur. */
export function NumberStepper({
  value, onChange, min, max, step = 1, label, decimals = 0, className,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  decimals?: number;
  className?: string;
}) {
  const fromNumber = (n: number) => (decimals > 0 ? String(Number(n.toFixed(decimals))).replace(".", ",") : String(n));
  const toNumber = (t: string) => {
    const n = Number(t.trim().replace(",", "."));
    return t.trim() !== "" && Number.isFinite(n) ? n : null;
  };
  return (
    <Stepper
      value={fromNumber(value)}
      toNumber={toNumber}
      fromNumber={fromNumber}
      onTextChange={t => {
        const n = toNumber(t);
        if (n !== null && n >= min && n <= max) onChange(n);
      }}
      normalize={t => {
        const n = toNumber(t);
        return n === null ? fromNumber(value) : fromNumber(clampInt(n, min, max));
      }}
      step={step}
      min={min}
      max={max}
      label={label}
      inputMode={decimals > 0 ? "decimal" : "numeric"}
      className={className}
    />
  );
}

/** Seconds shown as "1:30"; accepts typing "90" or "1:30". */
export function DurationStepper({
  value, onChange, min = 0, max = 600, step = 15, label, className,
}: {
  value: number;
  onChange: (seconds: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  className?: string;
}) {
  const fromNumber = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const toNumber = (t: string) => {
    const m = t.trim().match(/^(\d{1,2}):(\d{1,2})$/);
    if (m) return Number(m[1]) * 60 + Number(m[2]);
    return /^\d+$/.test(t.trim()) ? Number(t.trim()) : null;
  };
  return (
    <Stepper
      value={fromNumber(value)}
      toNumber={toNumber}
      fromNumber={fromNumber}
      onTextChange={t => {
        const n = toNumber(t);
        if (n !== null && n >= min && n <= max) onChange(n);
      }}
      normalize={t => {
        const n = toNumber(t);
        return n === null ? fromNumber(value) : fromNumber(clampInt(n, min, max));
      }}
      step={step}
      min={min}
      max={max}
      label={label}
      inputMode="numeric"
      className={className}
    />
  );
}

/** Reps: a number ("10") or free text ("8-12", "45s", "max"). +/− work when it's a number. */
export function RepsStepper({
  value, onChange, label, className,
}: {
  value: string;
  onChange: (text: string) => void;
  label: string;
  className?: string;
}) {
  const toNumber = (t: string) => (/^\d+$/.test(t.trim()) ? Number(t.trim()) : null);
  return (
    <Stepper
      value={value}
      toNumber={toNumber}
      fromNumber={String}
      onTextChange={t => { if (t.trim() !== "") onChange(t.trim()); }}
      normalize={t => (t.trim() === "" ? value : t.trim())}
      step={1}
      min={1}
      max={999}
      label={label}
      inputMode="text"
      className={className}
    />
  );
}
