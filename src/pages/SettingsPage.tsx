import { useState, useEffect, useRef, useCallback } from "react";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, Mail, Phone, Smartphone, Calendar, MessageSquare, CreditCard, Dumbbell, Star, Sun, Moon, Monitor, Upload, X, Image, Palette, Loader2, CalendarClock, Camera, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import avatarMale1 from "@/assets/avatars/avatar-male-1.png";
import avatarFemale1 from "@/assets/avatars/avatar-female-1.png";
import avatarMale2 from "@/assets/avatars/avatar-male-2.png";
import avatarFemale2 from "@/assets/avatars/avatar-female-2.png";
import avatarMale3 from "@/assets/avatars/avatar-male-3.png";
import avatarFemale3 from "@/assets/avatars/avatar-female-3.png";
import cover1 from "@/assets/covers/vault-1.jpg";
import cover2 from "@/assets/covers/vault-2.jpg";
import cover3 from "@/assets/covers/vault-3.jpg";
import cover4 from "@/assets/covers/vault-4.jpg";

const defaultAvatars = [
  { src: avatarMale1, label: "Trenér 1" },
  { src: avatarFemale1, label: "Trenérka 1" },
  { src: avatarMale2, label: "Trenér 2" },
  { src: avatarFemale2, label: "Trenérka 2" },
  { src: avatarMale3, label: "Trenér 3" },
  { src: avatarFemale3, label: "Trenérka 3" },
];

const defaultCovers = [
  { src: cover1, label: "Vault Gym 1" },
  { src: cover2, label: "RPG Gym" },
  { src: cover3, label: "Vault Gym 2" },
  { src: cover4, label: "Vault Gym 3" },
];

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

const defaultNotifications: NotificationSettings = {
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
  const navigate = useNavigate();
  const location = useLocation();
  const isClient = location.pathname.startsWith("/klient");
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotifications);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState("60");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  const cameraProfileRef = useRef<HTMLInputElement>(null);
  const cameraCoverRef = useRef<HTMLInputElement>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"profile" | "cover">("profile");

  // Load settings from DB
  const loadSettings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load email from profile as fallback
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, phone, bg_preset, profile_photo_url, cover_photo_url")
        .eq("id", user.id)
        .single();

      // Load user_settings
      const { data: userSettings } = await supabase
        .from("user_settings" as any)
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (userSettings) {
        const s = userSettings as any;
        setEmail(s.email || profile?.email || user.email || "");
        setPhoneNumber(s.phone || profile?.phone || "");
        setReminderMinutes(String(s.reminder_minutes || 60));
        setBgPreset(s.bg_preset || profile?.bg_preset || "none");
        if (s.notification_settings) {
          setSettings({ ...defaultNotifications, ...s.notification_settings });
        }
      } else {
        // No settings row yet — use profile data as defaults
        setEmail(profile?.email || user.email || "");
        setPhoneNumber(profile?.phone || "");
        setBgPreset(profile?.bg_preset || "none");
      }

      if (profile?.profile_photo_url) setProfilePhoto(profile.profile_photo_url);
      if (profile?.cover_photo_url) setCoverPhoto(profile.cover_photo_url);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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
    localStorage.setItem("trenernik-theme", theme);
  }, [theme]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "cover") => {
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
    reader.onload = () => {
      setCropType(type);
      setCropImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const openCropForDefault = (src: string, type: "profile" | "cover") => {
    setCropType(type);
    setCropImage(src);
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    if (cropType === "profile") {
      setProfilePhoto(croppedDataUrl);
    } else {
      setCoverPhoto(croppedDataUrl);
    }
    setCropImage(null);
  };

  const toggleChannel = (event: keyof NotificationSettings, channel: keyof NotificationChannel) => {
    setSettings((prev) => ({
      ...prev,
      [event]: { ...prev[event], [channel]: !prev[event][channel] },
    }));
  };

  const uploadPhoto = async (userId: string, photoData: string, type: "profile" | "cover"): Promise<string | null> => {
    // If it's already a supabase URL, skip upload
    if (photoData.startsWith("http")) return photoData;

    // Convert local asset import or data URL to blob
    let blob: Blob;
    if (photoData.startsWith("data:")) {
      const res = await fetch(photoData);
      blob = await res.blob();
    } else {
      // Local asset import (e.g. /src/assets/avatars/...)
      const res = await fetch(photoData);
      blob = await res.blob();
    }

    const ext = blob.type === "image/png" ? "png" : "jpeg";
    const filePath = `${userId}/${type}.${ext}`;

    const { error } = await supabase.storage
      .from("profile-assets")
      .upload(filePath, blob, { upsert: true, contentType: blob.type });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("profile-assets")
      .getPublicUrl(filePath);

    // Add cache-busting param
    return `${urlData.publicUrl}?t=${Date.now()}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Nejste přihlášen/a");
        return;
      }

      const payload = {
        user_id: user.id,
        email,
        phone: phoneNumber,
        reminder_minutes: parseInt(reminderMinutes) || 60,
        notification_settings: settings,
        bg_preset: bgPreset,
        updated_at: new Date().toISOString(),
      };

      // Upsert user_settings
      const { error } = await supabase
        .from("user_settings" as any)
        .upsert(payload as any, { onConflict: "user_id" });

      if (error) throw error;

      // Upload photos if changed
      let profilePhotoUrl = profilePhoto;
      let coverPhotoUrl = coverPhoto;

      if (profilePhoto) {
        profilePhotoUrl = await uploadPhoto(user.id, profilePhoto, "profile");
      }
      if (coverPhoto) {
        coverPhotoUrl = await uploadPhoto(user.id, coverPhoto, "cover");
      }

      // Update profile with photos and other data
      await supabase
        .from("profiles")
        .update({
          bg_preset: bgPreset,
          phone: phoneNumber,
          email,
          profile_photo_url: profilePhotoUrl || "",
          cover_photo_url: coverPhotoUrl || "",
        })
        .eq("id", user.id);

      toast.success("Nastavení uloženo");
      setTimeout(() => navigate(isClient ? "/klient" : "/dashboard"), 600);
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error("Nepodařilo se uložit nastavení: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-24">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Nastavení</h1>
        <p className="text-sm text-muted-foreground mt-1">Správa vzhledu, notifikací a kontaktních údajů</p>
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
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
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
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => profileInputRef.current?.click()}>
                        <Upload className="h-3.5 w-3.5 mr-1" /> Nahrát
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => cameraProfileRef.current?.click()}>
                        <Camera className="h-3.5 w-3.5 mr-1" /> Foto
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowAvatarPicker(true)}>
                        <ImageIcon className="h-3.5 w-3.5 mr-1" /> Avatar
                      </Button>
                    </div>
                    <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "profile")} />
                    <input ref={cameraProfileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileUpload(e, "profile")} />
                    <p className="text-[11px] text-muted-foreground">Max 5 MB, JPG/PNG</p>
                  </div>
                </div>
              </div>

              {/* Cover photo */}
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Úvodní fotka (cover)</span>
                <div className="relative h-24 w-full rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
                  {coverPhoto ? (
                    <>
                      <img src={coverPhoto} alt="Cover" className="h-full w-full object-cover" />
                      <button
                        onClick={() => setCoverPhoto(null)}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Image className="h-5 w-5" />
                      <span className="text-xs">Vyberte cover fotku</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => coverInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5 mr-1" /> Nahrát
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => cameraCoverRef.current?.click()}>
                    <Camera className="h-3.5 w-3.5 mr-1" /> Foto
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowCoverPicker(true)}>
                    <ImageIcon className="h-3.5 w-3.5 mr-1" /> Základní
                  </Button>
                </div>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "cover")} />
                <input ref={cameraCoverRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(e, "cover")} />
              </div>
            </div>
          </div>

          {/* Avatar picker dialog */}
          <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Vyberte avatar</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-3">
                {defaultAvatars.map((avatar) => (
                  <button
                    key={avatar.label}
                    onClick={() => { openCropForDefault(avatar.src, "profile"); setShowAvatarPicker(false); }}
                    className="rounded-xl border-2 border-border p-2 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <img src={avatar.src} alt={avatar.label} className="w-full aspect-square object-cover rounded-full" loading="lazy" />
                    <p className="text-[10px] text-muted-foreground text-center mt-1">{avatar.label}</p>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Cover picker dialog */}
          <Dialog open={showCoverPicker} onOpenChange={setShowCoverPicker}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Vyberte úvodní fotku</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                {defaultCovers.map((cover) => (
                  <button
                    key={cover.label}
                    onClick={() => { openCropForDefault(cover.src, "cover"); setShowCoverPicker(false); }}
                    className="rounded-xl border-2 border-border overflow-hidden hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <img src={cover.src} alt={cover.label} className="w-full aspect-[16/9] object-cover" loading="lazy" />
                    <p className="text-[10px] text-muted-foreground text-center py-1">{cover.label}</p>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
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
          {/* Mobile: stacked layout / Desktop: grid */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px] items-center gap-2 mb-2 px-2">
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

          <Separator className="mb-2 hidden sm:block" />

          <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px] items-center gap-2 px-2 mb-3">
            <span className="text-xs text-muted-foreground">Zapnout/vypnout vše:</span>
            {(["email", "sms", "push"] as const).map((ch) => (
              <div key={ch} className="flex justify-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => enableAll(ch)}>Vše</Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => disableAll(ch)}>Nic</Button>
              </div>
            ))}
          </div>

          <Separator className="mb-2 hidden sm:block" />

          {/* Desktop grid layout */}
          <div className="hidden sm:block space-y-1">
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

          {/* Mobile stacked layout */}
          <div className="sm:hidden space-y-3">
            {(Object.keys(notificationLabels) as (keyof NotificationSettings)[]).map((key) => {
              const { label, icon: Icon } = notificationLabels[key];
              return (
                <div key={key} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-medium text-foreground">{label}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Switch checked={settings[key].email} onCheckedChange={() => toggleChannel(key, "email")} className="scale-90" />
                        E-mail
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Switch checked={settings[key].sms} onCheckedChange={() => toggleChannel(key, "sms")} className="scale-90" />
                        SMS
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Switch checked={settings[key].push} onCheckedChange={() => toggleChannel(key, "push")} className="scale-90" />
                        Push
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Slot reminder settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Připomínka aktualizace termínů
          </CardTitle>
          <CardDescription>Připomenutí, abyste pravidelně doplňovali volné hodiny v kalendáři</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Zapnout připomínky</p>
              <p className="text-xs text-muted-foreground">Dostanete notifikaci, když nemáte vyplněné sloty</p>
            </div>
            <Switch checked={false} />
          </div>
          <div className="grid gap-2 max-w-[250px]">
            <Label className="text-xs">Frekvence připomínky</Label>
            <Select defaultValue="weekly">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Každý den</SelectItem>
                <SelectItem value="weekly">1× týdně</SelectItem>
                <SelectItem value="biweekly">2× týdně</SelectItem>
                <SelectItem value="custom">Vlastní interval</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Uložit nastavení
        </Button>
      </div>
    </div>
  );
}
