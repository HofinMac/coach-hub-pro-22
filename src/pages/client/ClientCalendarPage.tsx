import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { bookings } from "@/lib/demo-data";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarPlus } from "lucide-react";

const CLIENT_ID = "cl2";

const statusLabels: Record<string, string> = {
  booked: "Rezervováno",
  completed: "Dokončeno",
  cancelled: "Zrušeno",
  no_show: "Neúčast",
};

const statusColors: Record<string, string> = {
  booked: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-destructive/10 text-destructive",
};

export default function ClientCalendarPage() {
  const myBookings = bookings
    .filter(b => b.clientId === CLIENT_ID)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Kalendář" description="Tvoje naplánované a proběhlé lekce.">
        <Button size="sm" className="gap-1.5">
          <CalendarPlus className="h-3.5 w-3.5" /> Rezervovat termín
        </Button>
      </PageHeader>

      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        <div className="divide-y divide-border">
          {myBookings.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Žádné lekce.</p>
          ) : (
            myBookings.map((b) => (
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
