import { PageHeader } from "@/components/PageHeader";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { coaches, clients } from "@/lib/demo-data";

const CLIENT_ID = "cl2";

const demoMessages = [
  { id: 1, from: "coach", text: "Ahoj Eleno, jak se cítíš po včerejším tréninku?", time: "9:15" },
  { id: 2, from: "client", text: "Ahoj! Trochu mě bolí kolena, ale jinak v pohodě.", time: "9:32" },
  { id: 3, from: "coach", text: "Dobře, dnes uděláme víc mobility na dolní tělo. Přijď o 5 minut dřív.", time: "9:35" },
  { id: 4, from: "client", text: "Super, díky! 👍", time: "9:36" },
];

export default function ClientMessagesPage() {
  const client = clients.find(c => c.id === CLIENT_ID)!;
  const coach = coaches.find(c => c.id === client.coachId)!;

  return (
    <div className="flex flex-col h-screen">
      <div className="p-6 pb-0">
        <PageHeader title="Zprávy" description={`Konverzace s ${coach.name}`} />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {demoMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.from === "client" ? "justify-end" : "justify-start"}`}
          >
            <div className="flex items-end gap-2 max-w-[70%]">
              {msg.from === "coach" && <AvatarCircle initials={coach.avatar} size="sm" />}
              <div
                className={`rounded-xl px-3 py-2 text-sm ${
                  msg.from === "client"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.from === "client" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input placeholder="Napište zprávu..." className="flex-1" />
          <Button size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
