import { AvatarCircle } from "@/components/AvatarCircle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { from, rpc, requireUserId, fetchCoachClients, initialsOf, type MessageRow, type ProfileRow } from "@/lib/db";

const listTime = (iso: string) => {
  const d = parseISO(iso);
  if (isToday(d)) return format(d, "H:mm");
  if (isYesterday(d)) return "Včera";
  return format(d, "d. M.", { locale: cs });
};

const bubbleTime = (iso: string) => {
  const d = parseISO(iso);
  return isToday(d) ? format(d, "H:mm") : format(d, "d. M. H:mm", { locale: cs });
};

function PersonAvatar({ profile }: { profile: ProfileRow }) {
  return profile.profile_photo_url ? (
    <img src={profile.profile_photo_url} alt={profile.full_name} className="h-7 w-7 rounded-full object-cover shrink-0" />
  ) : (
    <AvatarCircle initials={initialsOf(profile.full_name)} size="sm" />
  );
}

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedClient = searchParams.get("client");
  const setSelectedClient = (id: string | null) => setSearchParams(id ? { client: id } : {}, { replace: true });

  const [coachId, setCoachId] = useState<string | null>(null);
  const [clients, setClients] = useState<ProfileRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const addMessage = (m: MessageRow) =>
    setMessages(prev => (prev.some(p => p.id === m.id) ? prev : [...prev, m]));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const uid = await requireUserId();
        const [clientRows, { data, error }] = await Promise.all([
          fetchCoachClients(uid),
          from("messages").select("*").eq("coach_id", uid).order("created_at", { ascending: false }).limit(1000),
        ]);
        if (error) throw error;
        if (cancelled) return;
        setCoachId(uid);
        setClients(clientRows);
        setMessages(((data ?? []) as MessageRow[]).reverse());
      } catch (err) {
        console.error(err);
        toast.error("Nepodařilo se načíst zprávy");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Realtime: new messages in any of the coach's conversations
  useEffect(() => {
    if (!coachId) return;
    const channel = supabase
      .channel(`messages-coach-${coachId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `coach_id=eq.${coachId}` },
        payload => addMessage(payload.new as MessageRow),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [coachId]);

  const conversations = useMemo(() => {
    return clients
      .map(c => {
        const thread = messages.filter(m => m.client_id === c.id);
        const last = thread[thread.length - 1];
        const unread = thread.filter(m => m.sender_id === c.id && !m.read_at).length;
        return { client: c, last, unread };
      })
      .sort((a, b) => {
        if (a.last && b.last) return b.last.created_at.localeCompare(a.last.created_at);
        if (a.last) return -1;
        if (b.last) return 1;
        return a.client.full_name.localeCompare(b.client.full_name, "cs");
      });
  }, [clients, messages]);

  const client = selectedClient ? clients.find(c => c.id === selectedClient) ?? null : null;
  const thread = useMemo(
    () => (client ? messages.filter(m => m.client_id === client.id) : []),
    [messages, client],
  );
  const unreadInThread = thread.filter(m => m.sender_id === client?.id && !m.read_at).length;

  // Mark the open conversation as read (on open and whenever new client messages arrive)
  useEffect(() => {
    if (!coachId || !client || unreadInThread === 0) return;
    const clientId = client.id;
    rpc("mark_conversation_read", { _coach_id: coachId, _client_id: clientId }).then(({ error }: { error: unknown }) => {
      if (error) { console.error(error); return; }
      const now = new Date().toISOString();
      setMessages(prev => prev.map(m => (m.client_id === clientId && m.sender_id === clientId && !m.read_at ? { ...m, read_at: now } : m)));
    });
  }, [coachId, client, unreadInThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length, client?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = messageInput.trim();
    if (!body || !coachId || !client || sending) return;
    setSending(true);
    const { data, error } = await from("messages")
      .insert({ coach_id: coachId, client_id: client.id, sender_id: coachId, body })
      .select()
      .single();
    setSending(false);
    if (error) { console.error(error); toast.error("Zprávu se nepodařilo odeslat"); return; }
    addMessage(data as MessageRow);
    setMessageInput("");
  };

  const showConversationList = isMobile ? !selectedClient : true;
  const showChat = isMobile ? !!selectedClient : true;

  return (
    <div className="flex h-[calc(100vh)] animate-fade-in">
      {showConversationList && (
        <div className={`${isMobile ? 'w-full' : 'w-72'} border-r border-border bg-subtle flex flex-col`}>
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Zprávy</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Zatím nemáte žádné klienty. Jakmile se k vám klient připojí, můžete mu napsat.</p>
            ) : (
              conversations.map(({ client: c, last, unread }) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClient(c.id)}
                  className={`w-full flex items-start gap-3 p-3 px-4 text-left transition-colors ${
                    selectedClient === c.id ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                >
                  <PersonAvatar profile={c} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm text-foreground truncate ${unread ? 'font-semibold' : 'font-medium'}`}>{c.full_name}</p>
                      {last && <span className="text-xs text-muted-foreground shrink-0">{listTime(last.created_at)}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {last ? `${last.sender_id === coachId ? 'Vy: ' : ''}${last.body}` : 'Zatím žádné zprávy'}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center mt-0.5 shrink-0">
                      {unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {showChat && (
        <div className="flex-1 flex flex-col min-w-0">
          {client ? (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-border">
                {isMobile && (
                  <button onClick={() => setSelectedClient(null)} className="p-1 -ml-1 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <PersonAvatar profile={client} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{client.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {thread.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Zatím žádné zprávy. Napište první.</p>
                )}
                {thread.map(msg => {
                  const mine = msg.sender_id === coachId;
                  return (
                    <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                        mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                        <p className={`text-xs mt-1 ${mine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                          {bubbleTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="p-4 border-t border-border">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    placeholder="Napište zprávu..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    maxLength={4000}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={sending || !messageInput.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            </>
          ) : !isMobile ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vyberte konverzaci'}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground text-sm p-6 text-center">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <p>Konverzace nenalezena.</p>
                  <Button variant="outline" size="sm" onClick={() => setSelectedClient(null)}>Zpět na zprávy</Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
