import { useEffect, useRef, useState } from "react";
import { format, isToday, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { from, rpc, requireUserId, initialsOf, type MessageRow } from "@/lib/db";

interface CoachInfo {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
}

const bubbleTime = (iso: string) => {
  const d = parseISO(iso);
  return isToday(d) ? format(d, "H:mm") : format(d, "d. M. H:mm", { locale: cs });
};

export default function ClientMessagesPage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [coach, setCoach] = useState<CoachInfo | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const addMessage = (m: MessageRow) =>
    setMessages(prev => (prev.some(p => p.id === m.id) ? prev : [...prev, m]));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const uid = await requireUserId();
        const { data: me, error: meErr } = await supabase
          .from("profiles").select("assigned_coach_id").eq("id", uid).maybeSingle();
        if (meErr) throw meErr;
        const coachId = (me as { assigned_coach_id: string | null } | null)?.assigned_coach_id ?? null;
        if (cancelled) return;
        setClientId(uid);
        if (!coachId) return;

        const [{ data: coachRow, error: coachErr }, { data: msgs, error: msgErr }] = await Promise.all([
          supabase.from("profiles").select("id, full_name, profile_photo_url").eq("id", coachId).maybeSingle(),
          from("messages").select("*").eq("coach_id", coachId).eq("client_id", uid)
            .order("created_at", { ascending: false }).limit(1000),
        ]);
        if (coachErr) throw coachErr;
        if (msgErr) throw msgErr;
        if (cancelled) return;
        setCoach((coachRow as CoachInfo | null) ?? { id: coachId, full_name: "Trenér", profile_photo_url: null });
        setMessages(((msgs ?? []) as MessageRow[]).reverse());
      } catch (err) {
        console.error(err);
        toast.error("Nepodařilo se načíst zprávy");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Realtime: new messages in this client's conversation with the coach
  useEffect(() => {
    if (!clientId || !coach) return;
    const coachId = coach.id;
    const channel = supabase
      .channel(`messages-client-${clientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `client_id=eq.${clientId}` },
        payload => {
          const m = payload.new as MessageRow;
          if (m.coach_id === coachId) addMessage(m);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clientId, coach]);

  const unread = messages.filter(m => m.sender_id === coach?.id && !m.read_at).length;

  useEffect(() => {
    if (!clientId || !coach || unread === 0) return;
    const coachId = coach.id;
    rpc("mark_conversation_read", { _coach_id: coachId, _client_id: clientId }).then(({ error }: { error: unknown }) => {
      if (error) { console.error(error); return; }
      const now = new Date().toISOString();
      setMessages(prev => prev.map(m => (m.sender_id === coachId && !m.read_at ? { ...m, read_at: now } : m)));
    });
  }, [clientId, coach, unread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = input.trim();
    if (!body || !clientId || !coach || sending) return;
    setSending(true);
    const { data, error } = await from("messages")
      .insert({ coach_id: coach.id, client_id: clientId, sender_id: clientId, body })
      .select()
      .single();
    setSending(false);
    if (error) { console.error(error); toast.error("Zprávu se nepodařilo odeslat"); return; }
    addMessage(data as MessageRow);
    setInput("");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="p-6 max-w-3xl mx-auto animate-fade-in">
        <PageHeader title="Zprávy" />
        <div className="rounded-xl bg-card shadow-card p-8 text-center">
          <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Zatím nemáš přiřazeného trenéra</p>
          <p className="text-sm text-muted-foreground mt-1">Jakmile se připojíš k trenérovi, můžeš mu psát přímo tady.</p>
        </div>
      </div>
    );
  }

  const coachAvatar = coach.profile_photo_url ? (
    <img src={coach.profile_photo_url} alt={coach.full_name} className="h-7 w-7 rounded-full object-cover shrink-0" />
  ) : (
    <AvatarCircle initials={initialsOf(coach.full_name)} size="sm" />
  );

  return (
    <div className="flex flex-col h-screen">
      <div className="p-6 pb-0">
        <PageHeader title="Zprávy" description={`Konverzace s ${coach.full_name}`} />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Zatím žádné zprávy. Napiš svému trenérovi.</p>
        )}
        {messages.map((msg) => {
          const mine = msg.sender_id === clientId;
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="flex items-end gap-2 max-w-[70%]">
                {!mine && coachAvatar}
                <div
                  className={`rounded-xl px-3 py-2 text-sm ${
                    mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {bubbleTime(msg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSend} className="flex gap-2 max-w-3xl mx-auto">
          <Input
            placeholder="Napište zprávu..."
            className="flex-1"
            value={input}
            onChange={e => setInput(e.target.value)}
            maxLength={4000}
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
