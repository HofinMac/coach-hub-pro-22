import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const insert = vi.fn((_rows: unknown) => ({ select: async () => ({ data: [{ id: "slot-1" }], error: null }) }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: "coach-1" } } }) },
    from: () => ({ insert }),
  },
}));

import CreateSlotDialog from "@/components/CreateSlotDialog";

beforeEach(() => insert.mockClear());

describe("CreateSlotDialog", () => {
  it("creates an occupied slot for a client outside the app", async () => {
    render(<CreateSlotDialog open onOpenChange={() => {}} defaultDate="2026-11-02" />);
    fireEvent.click(screen.getByRole("switch", { name: /Obsazeno klientem mimo aplikaci/ }));
    fireEvent.change(screen.getByPlaceholderText(/Jméno klienta/), { target: { value: "  Pavel Novák " } });
    fireEvent.click(screen.getByRole("button", { name: "Vytvořit termín" }));

    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    const [rows] = insert.mock.calls[0] as unknown as [Array<Record<string, unknown>>];
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ coach_id: "coach-1", status: "booked", manual_client_name: "Pavel Novák" });
  });

  it("requires the client's name when occupied", async () => {
    render(<CreateSlotDialog open onOpenChange={() => {}} defaultDate="2026-11-02" />);
    fireEvent.click(screen.getByRole("switch", { name: /Obsazeno klientem mimo aplikaci/ }));
    fireEvent.click(screen.getByRole("button", { name: "Vytvořit termín" }));
    await new Promise(r => setTimeout(r, 20));
    expect(insert).not.toHaveBeenCalled();
  });

  it("keeps free slots free", async () => {
    render(<CreateSlotDialog open onOpenChange={() => {}} defaultDate="2026-11-02" />);
    fireEvent.click(screen.getByRole("button", { name: "Vytvořit termín" }));
    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    const [rows] = insert.mock.calls[0] as unknown as [Array<Record<string, unknown>>];
    expect(rows[0]).not.toHaveProperty("status");
    expect(rows[0]).not.toHaveProperty("manual_client_name");
  });
});
