import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import PlanEditorDialog from "@/components/PlanEditorDialog";

const setup = () => {
  const onOpenChange = vi.fn();
  render(
    <PlanEditorDialog open mode="create" clients={[]} onOpenChange={onOpenChange} onSave={() => true} />,
  );
  return { onOpenChange };
};

const typeTitle = () => {
  const input = screen.getAllByRole("textbox")[0];
  fireEvent.change(input, { target: { value: "Síla – týden 1" } });
};

describe("PlanEditorDialog unsaved-changes guard", () => {
  it("ignores clicks outside the dialog", () => {
    const { onOpenChange } = setup();
    typeTitle();
    fireEvent.pointerDown(document.body);
    fireEvent.mouseDown(document.body);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes right away when nothing changed", () => {
    const { onOpenChange } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Zrušit" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("asks before discarding changes, and can keep editing", () => {
    const { onOpenChange } = setup();
    typeTitle();
    fireEvent.click(screen.getByRole("button", { name: "Zrušit" }));
    expect(screen.getByText("Zahodit rozpracovaný trénink?")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Pokračovat v úpravách" }));
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Zrušit" }));
    fireEvent.click(screen.getByRole("button", { name: "Zahodit změny" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Escape with changes asks too", () => {
    const { onOpenChange } = setup();
    typeTitle();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByText("Zahodit rozpracovaný trénink?")).toBeInTheDocument();
  });
});

describe("PlanEditorDialog supersets", () => {
  it("links two exercises into a superset and saves it", async () => {
    const onSave = vi.fn(() => true);
    render(
      <PlanEditorDialog
        open mode="edit" clients={[]} onOpenChange={() => {}} onSave={onSave}
        initialTitle="Horní polovina"
        initialExercises={[
          { exerciseId: "e1", exerciseName: "Kliky", sets: 3, reps: "12", rpe: 7, rest: 90 },
          { exerciseId: "e2", exerciseName: "Přítahy", sets: 3, reps: "10", rpe: 7, rest: 90 },
          { exerciseId: "e3", exerciseName: "Plank", sets: 3, reps: "45s", rpe: 6, rest: 60 },
        ]}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Spojit s dalším cvikem do supersérie" })[0]);
    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rozpojit supersérii" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Uložit/ }));
    await vi.waitFor(() => expect(onSave).toHaveBeenCalled());
    const saved = (onSave.mock.calls[0] as unknown as [{ exercises: Array<{ supersetId?: string }> }])[0].exercises;
    expect(saved[0].supersetId).toBeTruthy();
    expect(saved[1].supersetId).toBe(saved[0].supersetId);
    expect(saved[2].supersetId).toBeUndefined();
  });
});
