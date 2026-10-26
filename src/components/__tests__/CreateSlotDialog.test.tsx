import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const insert = vi.fn((_rows: unknown) => ({ select: async () => ({ data: [{ id: "slot-1" }], error: null }) }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: "coach-1" } } }) },
    from: () => ({ insert }),
  },
}));
const rpc = vi.fn(async (_fn: string, _args?: unknown) => ({ data: 1, error: null }));
vi.mock("@/lib/db", () => ({
  requireUserId: async () => "coach-1",
  fetchCoachClients: async () => [{ id: "client-1", full_name: "Karel Klient", email: "k@x.cz" }],
  rpc: (fn: string, args?: unknown) => rpc(fn, args),
}));

import CreateSlotDialog from "@/components/CreateSlotDialog";

beforeEach(() => { insert.mockClear(); rpc.mockClear(); });

const rowsOf = () => (insert.mock.calls[0] as unknown as [Array<Record<string, unknown>>])[0];

describe("CreateSlotDialog", () => {
  it("prefills the tapped hour, one hour long", () => {
    render(<CreateSlotDialog open onOpenChange={() => {}} defaultDate="2026-11-02" defaultStartTime="14:00" />);
    expect(screen.getByDisplayValue("14:00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("15:00")).toBeInTheDocument();
  });

  it("creates an occupied slot for a client outside the app", async () => {
    render(<CreateSlotDialog open onOpenChange={() => {}} defaultDate="2026-11-02" />);
    fireEvent.click(screen.getByRole("radio", { name: "Mimo aplikaci" }));
    fireEvent.change(screen.getByPlaceholderText(/Jméno klienta/), { target: { value: "  Pavel Novák " } });
    fireEvent.click(screen.getByRole("button", { name: "Vytvořit termín" }));

    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    expect(rowsOf()).toHaveLength(1);
    expect(rowsOf()[0]).toMatchObject({ coach_id: "coach-1", status: "booked", manual_client_name: "Pavel Novák" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("requires the client's name when occupied outside the app", async () => {
    render(<CreateSlotDialog open onOpenChange={() => {}} defaultDate="2026-11-02" />);
    fireEvent.click(screen.getByRole("radio", { name: "Mimo aplikaci" }));
    fireEvent.click(screen.getByRole("button", { name: "Vytvořit termín" }));
    await new Promise(r => setTimeout(r, 20));
    expect(insert).not.toHaveBeenCalled();
  });

  it("books an app client into the new slot", async () => {
    render(<CreateSlotDialog open onOpenChange={() => {}} defaultDate="2026-11-02" />);
    fireEvent.click(screen.getByRole("radio", { name: "Z aplikace" }));
    // no client chosen yet → refused
    fireEvent.click(screen.getByRole("button", { name: "Vytvořit termín" }));
    await new Promise(r => setTimeout(r, 20));
    expect(insert).not.toHaveBeenCalled();
  });

  it("keeps free slots free", async () => {
    render(<CreateSlotDialog open onOpenChange={() => {}} defaultDate="2026-11-02" />);
    fireEvent.click(screen.getByRole("button", { name: "Vytvořit termín" }));
    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    expect(rowsOf()[0]).not.toHaveProperty("status");
    expect(rowsOf()[0]).not.toHaveProperty("manual_client_name");
    expect(rpc).not.toHaveBeenCalled();
  });
});
