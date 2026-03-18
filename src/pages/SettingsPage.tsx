import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, Phone, Smartphone, Calendar, MessageSquare, CreditCard, Dumbbell, Star } from "lucide-react";
import { toast } from "sonner";

interface NotificationChannel {
  email: boolean;
  sms: boolean;
  push: boolean;
}

interface NotificationSettings {
  newBooking: NotificationChannel;
  cancelledBooking: NotificationChannel;
  reminder: NotificationChannel;
  newMessage: NotificationChannel;
  payment: NotificationChannel;
  newReview: NotificationChannel;
  planChange: NotificationChannel;
}

const defaultSettings: NotificationSettings = {
  newBooking: { email: true, sms: false, push: true },
  cancelledBooking: { email: true, sms: true, push: true },
  reminder: { email: false, sms: false, push: true },
  newMessage: { email: false, sms: false, push: true },
  payment: { email: true, sms: false, push: true },
  newReview: { email: true, sms: false, push: false },
  planChange: { email: true, sms: false, push: true },
};

const notificationLabels: Record<keyof NotificationSettings, { label: string; desc: string; icon: React.ElementType }> = {
  newBooking: { label: "Nová rezervace", desc: "Když si někdo zarezervuje termín", icon: Calendar },
  cancelledBooking: { label: "Zrušená rezervace", desc: "Když je termín zrušen", icon: Calendar },
  reminder: { label: "Připomínka tréninku", desc: "Před blížícím se tréninkem", icon: Bell },
  newMessage: { label: "Nová zpráva", desc: "Když vám někdo napíše", icon: MessageSquare },
  payment: { label: "Platba", desc: "Potvrzení platby nebo upomínka", icon: CreditCard },
  newReview: { label: "Nové hodnocení", desc: "Když vás někdo ohodnotí", icon: Star },
  planChange: { label: "Změna plánu", desc: "Úpravy tréninkového plánu", icon: Dumbbell },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [phoneNumber, setPhoneNumber] = useState("+420 ");
  const [email, setEmail] = useState("jan.novak@email.cz");
  const [reminderMinutes, setReminderMinutes] = useState("60");

  const toggleChannel = (event: keyof NotificationSettings, channel: keyof NotificationChannel) => {
    setSettings((prev) => ({
      ...prev,
      [event]: { ...prev[event], [channel]: !prev[event][channel] },
    }));
  };

  const handleSave = () => {
    toast.success("Nastavení notifikací uloženo");
  };

  const enableAll = (channel: keyof NotificationChannel) => {
    setSettings((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next) as (keyof NotificationSettings)[]) {
        next[key] = { ...next[key], [channel]: true };
      }
      return next;
    });
  };

  const disableAll = (channel: keyof NotificationChannel) => {
    setSettings((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next) as (keyof NotificationSettings)[]) {
        next[key] = { ...next[key], [channel]: false };
      }
      return next;
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Nastavení</h1>
        <p className="text-muted-foreground mt-1">Správa notifikací a kontaktních údajů</p>
      </div>

      {/* Contact info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kontaktní údaje pro notifikace</CardTitle>
          <CardDescription>Kam vám budeme zasílat upozornění</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                E-mail
              </Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vas@email.cz" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Telefonní číslo (SMS)
              </Label>
              <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+420 123 456 789" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminder" className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              Připomínka před tréninkem (minuty)
            </Label>
            <Input id="reminder" type="number" value={reminderMinutes} onChange={(e) => setReminderMinutes(e.target.value)} className="w-32" min="5" max="1440" />
          </div>
        </CardContent>
      </Card>

      {/* Notification matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kanály notifikací</CardTitle>
          <CardDescription>Vyberte, jak chcete být informováni o jednotlivých událostech</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Header row */}
          <div className="grid grid-cols-[1fr_80px_80px_80px] items-center gap-2 mb-2 px-2">
            <div />
            <div className="text-center">
              <div className="flex flex-col items-center gap-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">E-mail</span>
              </div>
            </div>
            <div className="text-center">
              <div className="flex flex-col items-center gap-1">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">SMS</span>
              </div>
            </div>
            <div className="text-center">
              <div className="flex flex-col items-center gap-1">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Push</span>
              </div>
            </div>
          </div>

          <Separator className="mb-2" />

          {/* Quick toggles */}
          <div className="grid grid-cols-[1fr_80px_80px_80px] items-center gap-2 px-2 mb-3">
            <span className="text-xs text-muted-foreground">Zapnout/vypnout vše:</span>
            {(["email", "sms", "push"] as const).map((ch) => (
              <div key={ch} className="flex justify-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => enableAll(ch)}>Vše</Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => disableAll(ch)}>Nic</Button>
              </div>
            ))}
          </div>

          <Separator className="mb-2" />

          {/* Notification rows */}
          <div className="space-y-1">
            {(Object.keys(notificationLabels) as (keyof NotificationSettings)[]).map((key) => {
              const { label, desc, icon: Icon } = notificationLabels[key];
              return (
                <div key={key} className="grid grid-cols-[1fr_80px_80px_80px] items-center gap-2 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Switch checked={settings[key].email} onCheckedChange={() => toggleChannel(key, "email")} />
                  </div>
                  <div className="flex justify-center">
                    <Switch checked={settings[key].sms} onCheckedChange={() => toggleChannel(key, "sms")} />
                  </div>
                  <div className="flex justify-center">
                    <Switch checked={settings[key].push} onCheckedChange={() => toggleChannel(key, "push")} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Uložit nastavení
        </Button>
      </div>
    </div>
  );
}
