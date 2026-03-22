import { AvatarCircle } from "@/components/AvatarCircle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { clients } from "@/lib/demo-data";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const conversations = [
  { clientId: 'cl1', lastMessage: 'Můžeme přesunout čtvrtek na pátek?', time: '10:32', unread: true },
  { clientId: 'cl2', lastMessage: 'Dnešní trénink dokončen. Skvělý pocit!', time: '9:15', unread: false },
  { clientId: 'cl4', lastMessage: 'Díky trenére!', time: 'Včera', unread: false },
  { clientId: 'cl3', lastMessage: 'Rameno mě stále trápí při overheadu', time: 'Včera', unread: true },
];

const demoMessages = [
  { from: 'client', text: 'Ahoj trenére, můžeme přesunout čtvrteční lekci na pátek ráno?', time: '10:32' },
  { from: 'coach', text: 'Jasně Marcusi, mám volný slot v 8:00 v pátek. Hodí se ti to?', time: '10:35' },
  { from: 'client', text: 'Perfektní, tak to uděláme. Ještě — koleno mi včera při dřepech tuhlo.', time: '10:36' },
  { from: 'coach', text: 'Zaznamenáno. Přidáme víc mobilizace před dřepy a případně upravíme hloubku. Uvidíme se v pátek.', time: '10:40' },
];

export default function MessagesPage() {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const isMobile = useIsMobile();

  const client = selectedClient ? clients.find(c => c.id === selectedClient) : null;

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
            {conversations.map(conv => {
              const c = clients.find(cl => cl.id === conv.clientId);
              if (!c) return null;
              return (
                <button
                  key={conv.clientId}
                  onClick={() => setSelectedClient(conv.clientId)}
                  className={`w-full flex items-start gap-3 p-3 px-4 text-left transition-colors ${
                    selectedClient === conv.clientId ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                >
                  <AvatarCircle initials={c.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <span className="text-xs text-muted-foreground">{conv.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unread && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showChat && (
        <div className="flex-1 flex flex-col">
          {client ? (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-border">
                {isMobile && (
                  <button onClick={() => setSelectedClient(null)} className="p-1 -ml-1 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <AvatarCircle initials={client.avatar} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{client.name}</p>
                  <p className="text-xs text-muted-foreground">Online · Naposledy viděn před 5 min</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {demoMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === 'coach' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                      msg.from === 'coach' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-foreground'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${
                        msg.from === 'coach' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                      }`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!messageInput.trim()) return;
                  toast.success("Zpráva odeslána");
                  setMessageInput("");
                }} className="flex gap-2">
                  <Input
                    placeholder="Napište zprávu..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
                </form>
              </div>
            </>
          ) : (
            !isMobile && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Vyberte konverzaci
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}