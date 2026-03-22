import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, Phone, Smartphone, Calendar, MessageSquare, CreditCard, Dumbbell, Star, Sun, Moon, Monitor, Upload, X, Image, Palette } from "lucide-react";
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

type ThemeMode = "light" | "dark" | "system";

const backgroundPresets = [
  { name: "Žádné", value: "none", color: "" },
  { name: "Jemně modrý", value: "blue", color: "from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10" },
  { name: "Teplý", value: "warm", color: "from-orange-50/40 to-amber-50/20 dark:from-orange-950/15 dark:to-amber-950/10" },
  { name: "Zelený", value: "green", color: "from-emerald-50/40 to-teal-50/20 dark:from-emerald-950/15 dark:to-teal-950/10" },
  { name: "Fialový", value: "purple", color: "from-violet-50/40 to-purple-50/20 dark:from-violet-950/15 dark:to-purple-950/10" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [phoneNumber, setPhoneNumber] = useState("+420 ");
  const [email, setEmail] = useState("jan.novak@email.cz");
  const [reminderMinutes, setReminderMinutes] = useState("60");

  // Appearance
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("trenernik-theme");
    return (stored as ThemeMode) || "light";
  });
  const [bgPreset, setBgPreset] = useState("none");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
    localStorage.setItem("apex-theme", theme);
  }, [theme]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string | null) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Nahrajte prosím obrázek");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maximální velikost je 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleChannel = (event: keyof NotificationSettings, channel: keyof NotificationChannel) => {
    setSettings((prev) => ({
      ...prev,
      [event]: { ...prev[event], [channel]: !prev[event][channel] },
    }));
  };

  const handleSave = () => {
    toast.success("Nastavení uloženo");
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

  const themeOptions: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
    { value: "light", label: "Světlý", icon: Sun },
    { value: "dark", label: "Tmavý", icon: Moon },
    { value: "system", label: "Systém", icon: Monitor },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Nastavení</h1>
        <p className="text-muted-foreground mt-1">Správa vzhledu, notifikací a kontaktních údajů</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Vzhled aplikace
          </CardTitle>
          <CardDescription>Přizpůsobte si zobrazení, pozadí a profilovou fotku</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme toggle */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Režim zobrazení</Label>
            <div className="flex gap-2">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Background presets */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Pozadí přehledu</Label>
            <div className="grid grid-cols-5 gap-2">
              {backgroundPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setBgPreset(preset.value)}
                  className={`relative flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${
                    bgPreset === preset.value
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div
                    className={`h-8 w-full rounded-md border border-border ${
                      preset.value === "none"
                        ? "bg-background"
                        : `bg-gradient-to-br ${preset.color}`
                    }`}
                  />
                  <span className="text-[11px] font-medium text-muted-foreground">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Photos */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Fotografie</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Profile photo */}
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Profilová fotka</span>
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 shrink-0 rounded-full border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
                    {profilePhoto ? (
                      <>
                        <img src={profilePhoto} alt="Profil" className="h-full w-full object-cover" />
                        <button
                          onClick={() => setProfilePhoto(null)}
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <Image className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Button variant="outline" size="sm" onClick={() => profileInputRef.current?.click()}>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Nahrát
                    </Button>
                    <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setProfilePhoto)} />
                    <p className="text-[11px] text-muted-foreground mt-1">Max 5 MB, JPG/PNG</p>
                  </div>
                </div>
              </div>

              {/* Cover photo */}
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Úvodní fotka (cover)</span>
                <div
                  className="relative h-24 w-full rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:border-muted-foreground/40 transition-colors"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverPhoto ? (
                    <>
                      <img src={coverPhoto} alt="Cover" className="h-full w-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setCoverPhoto(null); }}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="h-5 w-5" />
                      <span className="text-xs">Klikněte pro nahrání</span>
                    </div>
                  )}
                </div>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCoverPhoto)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
