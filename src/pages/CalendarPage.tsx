import { PageHeader } from "@/components/PageHeader";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import { Plus, Check, X, Clock } from "lucide-react";
import { getBookingsByCoach, type BookingStatus } from "@/lib/demo-data";
import { format, parseISO, startOfDay, addDays } from "date-fns";
import { cs } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

const COACH_ID = "c1";

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-warning/10 text-warning",
  booked: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<BookingStatus, string> = {
  pending: "Čeká na schválení",
  booked: "Rezervováno",
  completed: "Dokončeno",
  cancelled: "Zrušeno",
  no_show: "Nedostavil se",
};

export default function CalendarPage() {
  const allBookings = getBookingsByCoach(COACH_ID);
  const today = startOfDay(new Date(2026, 2, 18));
  const [selectedDate, setSelectedDate] = useState(today);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(today, i - 1));

  const pendingCount = allBookings.filter(b => b.status === 'pending').length;

  const dayBookings = allBookings
    .filter(b => startOfDay(parseISO(b.startTime)).getTime() === selectedDate.getTime())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Kalendář" description="Správa rozvrhu">
        <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Rezervovat lekci</Button>
      </PageHeader>

      {/* Pending requests banner */}
      {pendingCount > 0 && (
        <div className="mb-6 rounded-xl bg-warning/10 border border-warning/20 p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-warning shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {pendingCount} {pendingCount === 1 ? 'žádost' : pendingCount < 5 ? 'žádosti' : 'žádostí'} o rezervaci čeká na schválení
            </p>
            <p className="text-xs text-muted-foreground">Klikněte na den s čekající rezervací pro její schválení nebo zamítnutí.</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {weekDates.map(date => {
          const isSelected = date.getTime() === selectedDate.getTime();
          const dayBookingCount = allBookings.filter(b => startOfDay(parseISO(b.startTime)).getTime() === date.getTime()).length;
          const hasPending = allBookings.some(b => startOfDay(parseISO(b.startTime)).getTime() === date.getTime() && b.status === 'pending');
          return (
            <button
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className={`flex flex-col items-center min-w-[64px] rounded-xl px-3 py-3 transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "bg-card shadow-card hover:shadow-elevated text-foreground"
              }`}
            >
              <span className={`text-xs font-medium ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {format(date, "EEE", { locale: cs })}
              </span>
              <span className="text-lg font-semibold tabular-nums">{format(date, "d")}</span>
              <div className="flex gap-0.5 mt-1">
                {dayBookingCount > 0 && (
                  <div className={`h-1 w-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
                )}
                {hasPending && (
                  <div className={`h-1 w-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-warning"}`} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl bg-card shadow-card">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            {format(selectedDate, "EEEE, d. MMMM", { locale: cs })}
            <span className="text-muted-foreground font-normal ml-2">· {dayBookings.length} lekcí</span>
          </h2>
        </div>
        {dayBookings.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Žádné naplánované lekce.</p>
        ) : (
          <div className="divide-y divide-border">
            {dayBookings.map(booking => (
              <div key={booking.id} className="flex items-center justify-between p-4 hover:bg-subtle transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-right min-w-[60px]">
                    <p className="text-sm font-mono tabular-nums font-medium text-foreground">
                      {format(parseISO(booking.startTime), "HH:mm")}
                    </p>
                    <p className="text-xs font-mono tabular-nums text-muted-foreground">
                      {format(parseISO(booking.endTime), "HH:mm")}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div className="flex items-center gap-3">
                    <AvatarCircle initials={booking.clientName.split(" ").map(n => n[0]).join("")} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{booking.clientName}</p>
                      <p className="text-xs text-muted-foreground">{booking.type === '1:1' ? 'Individuální lekce' : 'Skupinová lekce'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {booking.status === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => toast.success(`Žádost od ${booking.clientName} zamítnuta.`)}
                      >
                        <X className="h-3 w-3" /> Zamítnout
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 gap-1"
                        onClick={() => toast.success(`Lekce s ${booking.clientName} potvrzena!`)}
                      >
                        <Check className="h-3 w-3" /> Schválit
                      </Button>
                    </>
                  ) : (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${statusStyles[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
