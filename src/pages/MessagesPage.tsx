import { PageHeader } from "@/components/PageHeader";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useState } from "react";
import { clients } from "@/lib/demo-data";

const conversations = [
  { clientId: 'cl1', lastMessage: 'Can we move Thursday to Friday?', time: '10:32 AM', unread: true },
  { clientId: 'cl2', lastMessage: 'Completed today\'s workout. Felt great!', time: '9:15 AM', unread: false },
  { clientId: 'cl4', lastMessage: 'Thanks coach!', time: 'Yesterday', unread: false },
  { clientId: 'cl3', lastMessage: 'Shoulder still bothering me on overhead press', time: 'Yesterday', unread: true },
];

const demoMessages = [
  { from: 'client', text: 'Hey coach, can we move Thursday\'s session to Friday morning?', time: '10:32 AM' },
  { from: 'coach', text: 'Sure Marcus, I have a slot at 8 AM on Friday. Does that work?', time: '10:35 AM' },
  { from: 'client', text: 'Perfect, let\'s do that. Also, my knee felt stiff during squats yesterday.', time: '10:36 AM' },
  { from: 'coach', text: 'Noted. We\'ll add extra mobility work before squats and adjust the depth if needed. See you Friday.', time: '10:40 AM' },
];

export default function MessagesPage() {
  const [selectedClient, setSelectedClient] = useState('cl1');
  const [messageInput, setMessageInput] = useState('');

  const selectedConv = conversations.find(c => c.clientId === selectedClient);
  const client = clients.find(c => c.id === selectedClient);

  return (
    <div className="flex h-[calc(100vh)] animate-fade-in">
      {/* Sidebar */}
      <div className="w-72 border-r border-border bg-subtle flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Messages</h2>
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

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {client && (
          <>
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <AvatarCircle initials={client.avatar} size="sm" />
              <div>
                <p className="text-sm font-semibold text-foreground">{client.name}</p>
                <p className="text-xs text-muted-foreground">Active · Last seen 5 min ago</p>
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
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1"
                />
                <Button size="icon"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
