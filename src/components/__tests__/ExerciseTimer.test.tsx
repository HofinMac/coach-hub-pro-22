import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ExerciseTimer from "@/components/ExerciseTimer";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const tick = (s: number) => act(() => { vi.advanceTimersByTime(s * 1000); });
const shows = (text: string) => screen.getAllByText(text).length > 0;

describe("ExerciseTimer counts in every mode", () => {
  it("intervals: work counts down, then rest", () => {
    render(<ExerciseTimer defaultWork={10} defaultRest={5} defaultRounds={2} />);
    fireEvent.click(screen.getByRole("button", { name: /Start/ }));
    tick(3);
    expect(shows("00:07")).toBe(true);
    tick(7);
    expect(shows("00:05")).toBe(true); // rest phase started
  });

  it("stopwatch: counts up", () => {
    render(<ExerciseTimer />);
    fireEvent.click(screen.getByRole("button", { name: /Stopky/ }));
    fireEvent.click(screen.getByRole("button", { name: /Start/ }));
    tick(4);
    expect(screen.getAllByText(/00:04/).length).toBeGreaterThan(0);
  });

  it("countdown: counts down", () => {
    render(<ExerciseTimer />);
    fireEvent.click(screen.getByRole("button", { name: /Odpočet/ }));
    fireEvent.click(screen.getByRole("button", { name: /Start/ }));
    tick(5);
    expect(screen.getAllByText(/01:55/).length).toBeGreaterThan(0);
  });
});
