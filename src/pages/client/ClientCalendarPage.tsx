import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { bookings } from "@/lib/demo-data";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarPlus, Clock } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CLIENT_ID = "cl2";

const statusLabels: Record<string, string> = {
  pending: "Čeká na schválení",
  booked: "Potvrzeno",
  completed: "Dokončeno",
  cancelled: "Zrušeno",
  no_show: "Neúčast",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  booked: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-destructive/10 text-destructive",
};

export default function ClientCalendarPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const myBookings = bookings
    .filter(b => b.clientId === CLIENT_ID)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const pendingBookings = myBookings.filter(b => b.status === 'pending');
  const otherBookings = myBookings.filter(b => b.status !== 'pending');

  const handleSubmitRequest = () => {
    toast.success("Žádost o rezervaci odeslána! Trenér ji musí potvrdit.");
    setDialogOpen(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Kalendář" description="Tvoje naplánované a proběhlé lekce.">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <CalendarPlus className="h-3.5 w-3.5" /> Požádat o termín
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Požádat o rezervaci termínu</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Po odeslání žádosti musí trenér termín potvrdit. O schválení budeš informován/a.
            </p>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Datum</Label>
                <Input type="date" defaultValue="2026-03-22" />
              </div>
              <div className="grid gap-2">
                <Label>Čas</Label>
                <Input type="time" defaultValue="09:00" />
              </div>
              <div className="grid gap-2">
                <Label>Typ lekce</Label>
                <Select defaultValue="1:1">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">Individuální</SelectItem>
                    <SelectItem value="group">Skupinová</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Zrušit</Button>
              </DialogClose>
              <Button onClick={handleSubmitRequest}>Odeslat žádost</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Pending requests */}
      {pendingBookings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            Čeká na schválení trenérem
          </h3>
          <div className="rounded-xl bg-warning/5 border border-warning/20 overflow-hidden">
            <div className="divide-y divide-warning/10">
              {pendingBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {format(parseISO(b.startTime), "EEEE, d. MMMM yyyy", { locale: cs })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(b.startTime), "H:mm", { locale: cs })} – {format(parseISO(b.endTime), "H:mm", { locale: cs })} · {b.type === "1:1" ? "Individuální" : "Skupinová"}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[b.status]}`}>
                    {statusLabels[b.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmed & past bookings */}
      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        <div className="divide-y divide-border">
          {otherBookings.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Žádné potvrzené lekce.</p>
          ) : (
            otherBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-4 hover:bg-subtle transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {format(parseISO(b.startTime), "EEEE, d. MMMM yyyy", { locale: cs })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(b.startTime), "H:mm", { locale: cs })} – {format(parseISO(b.endTime), "H:mm", { locale: cs })} · {b.type === "1:1" ? "Individuální" : "Skupinová"}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[b.status]}`}>
                  {statusLabels[b.status]}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
