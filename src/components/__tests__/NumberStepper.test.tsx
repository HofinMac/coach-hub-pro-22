import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { DurationStepper, NumberStepper, RepsStepper } from "@/components/NumberStepper";

function Sets({ onValue }: { onValue: (n: number) => void }) {
  const [v, setV] = useState(1);
  return <NumberStepper label="Série" value={v} min={1} max={20} onChange={n => { setV(n); onValue(n); }} />;
}

describe("NumberStepper", () => {
  it("lets you clear the field and type a new number (the reported bug)", () => {
    const onValue = vi.fn();
    render(<Sets onValue={onValue} />);
    const input = screen.getByRole("textbox", { name: "Série" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue("");          // stays empty, no forced "1"
    fireEvent.change(input, { target: { value: "4" } });
    expect(input).toHaveValue("4");
    expect(onValue).toHaveBeenLastCalledWith(4);
    fireEvent.blur(input);
    expect(input).toHaveValue("4");
  });

  it("restores the last value when left empty, clamps out-of-range", () => {
    render(<Sets onValue={() => {}} />);
    const input = screen.getByRole("textbox", { name: "Série" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(input).toHaveValue("1");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "99" } });
    fireEvent.blur(input);
    expect(input).toHaveValue("20");
  });

  it("+ and − buttons step and respect limits", () => {
    const onValue = vi.fn();
    render(<Sets onValue={onValue} />);
    const minus = screen.getByRole("button", { name: "Snížit Série" });
    expect(minus).toBeDisabled();
    const plus = screen.getByRole("button", { name: "Zvýšit Série" });
    fireEvent.pointerDown(plus); fireEvent.pointerUp(plus);
    fireEvent.pointerDown(plus); fireEvent.pointerUp(plus);
    expect(screen.getByRole("textbox", { name: "Série" })).toHaveValue("3");
    expect(onValue).toHaveBeenLastCalledWith(3);
  });

  it("RPE steps by 0.5 and shows a Czech decimal comma", () => {
    function Rpe() { const [v, setV] = useState(7); return <NumberStepper label="RPE" value={v} min={1} max={10} step={0.5} decimals={1} onChange={setV} />; }
    render(<Rpe />);
    const plus = screen.getByRole("button", { name: "Zvýšit RPE" });
    fireEvent.pointerDown(plus); fireEvent.pointerUp(plus);
    expect(screen.getByRole("textbox", { name: "RPE" })).toHaveValue("7,5");
  });
});

describe("DurationStepper", () => {
  it("shows m:ss, steps by 15 s and accepts typed seconds or m:ss", () => {
    const onChange = vi.fn();
    function Rest() { const [v, setV] = useState(90); return <DurationStepper label="Odpočinek" value={v} onChange={n => { setV(n); onChange(n); }} />; }
    render(<Rest />);
    const input = screen.getByRole("textbox", { name: "Odpočinek" });
    expect(input).toHaveValue("1:30");
    const plus = screen.getByRole("button", { name: "Zvýšit Odpočinek" });
    fireEvent.pointerDown(plus); fireEvent.pointerUp(plus);
    expect(input).toHaveValue("1:45");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "60" } });
    fireEvent.blur(input);
    expect(input).toHaveValue("1:00");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "2:30" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(150);
  });
});

describe("RepsStepper", () => {
  it("accepts ranges like 8-12 and disables +/− for them", () => {
    function Reps() { const [v, setV] = useState("10"); return <RepsStepper label="Opakování" value={v} onChange={setV} />; }
    render(<Reps />);
    const input = screen.getByRole("textbox", { name: "Opakování" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "8-12" } });
    fireEvent.blur(input);
    expect(input).toHaveValue("8-12");
    expect(screen.getByRole("button", { name: "Zvýšit Opakování" })).toBeDisabled();
  });
});
