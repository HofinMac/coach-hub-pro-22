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
