import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const info = {
  status: "pending", name: "jana", coach_name: "Petr Trenér",
  start_time: "2026-11-05T17:00:00Z", end_time: "2026-11-05T18:00:00Z",
  slot_type: "group", notes: "Kruhový trénink", closed: false, full: false,
};
const rpc = vi.fn(async (fn: string, _args?: unknown) =>
  fn === "get_slot_invitation" ? { data: info, error: null } : { data: { ...info, status: "accepted" }, error: null });
vi.mock("@/lib/db", () => ({ rpc: (fn: string, args?: unknown) => rpc(fn, args) }));

import InvitationPage from "@/pages/InvitationPage";

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes><Route path="/pozvanka/:token" element={<InvitationPage />} /></Routes>
    </MemoryRouter>,
  );

beforeEach(() => rpc.mockClear());

describe("InvitationPage", () => {
  it("does not answer on load (mail scanners open links), only after a click", async () => {
    renderAt("/pozvanka/tok-1?odpoved=ano");
    expect(await screen.findByText("Skupinová lekce")).toBeInTheDocument();
    expect(screen.getByText(/Petr Trenér vás zve/)).toBeInTheDocument();
    expect(rpc.mock.calls.map(c => c[0])).toEqual(["get_slot_invitation"]);

    fireEvent.click(screen.getByRole("button", { name: /Jdu/ }));
    await waitFor(() => expect(rpc).toHaveBeenCalledWith("respond_to_slot_invitation", { _token: "tok-1", _accept: true }));
    expect(await screen.findByText("Díky, trenér ví, že přijdete.")).toBeInTheDocument();
  });
});
