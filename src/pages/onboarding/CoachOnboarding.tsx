import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, User, DollarSign, CheckCircle2, ArrowRight, ArrowLeft, Palette, Upload, X, Image } from "lucide-react";

const STEPS = [
  { icon: User, label: "Základní údaje" },
  { icon: GraduationCap, label: "Vzdělání a zkušenosti" },
  { icon: DollarSign, label: "Služby a ceník" },
  { icon: Palette, label: "Značka a vzhled" },
  { icon: CheckCircle2, label: "Shrnutí" },
];

const specialtyOptions = [
  "Silový trénink", "Kondice", "Bodybuilding", "Powerlifting",
  "CrossFit", "Rehabilitace", "Výživa", "Hubnutí",
  "Funkční trénink", "Sportovní příprava", "Mobilita", "Skupinové lekce",
];

const certOptions = [
  "NSCA-CSCS", "ACE-CPT", "NASM-CPT", "ISSA-CPT",
  "Fyzioterapie (Bc./Mgr.)", "FTVS (Bc./Mgr.)", "Výživový poradce",
  "Trenér II. třídy", "Trenér I. třídy", "Jiné",
];

const coachTypeOptions = [
  { value: "personal", label: "Osobní trenér", desc: "1-on-1 tréninky s klienty" },
  { value: "group", label: "Skupinový trenér", desc: "Vedu skupinové lekce" },
  { value: "online", label: "Online kouč", desc: "Trénuji na dálku" },
  { value: "rehab", label: "Rehabilitační specialista", desc: "Zaměřuji se na rehabilitaci" },
  { value: "nutrition", label: "Výživový poradce", desc: "Hlavně výživa a stravování" },
  { value: "sport", label: "Sportovní trenér", desc: "Příprava sportovců" },
];

export default function CoachOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Step 1 – basics
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [trainingLocation, setTrainingLocation] = useState("");
  const [bio, setBio] = useState("");
  const [coachType, setCoachType] = useState<string[]>([]);

  // Step 2 – education & experience
  const [certs, setCerts] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [otherCert, setOtherCert] = useState("");

  // Step 3 – services & pricing
  const [sessionPrice, setSessionPrice] = useState("");
  const [sessionLength, setSessionLength] = useState("60");
  const [offerGroup, setOfferGroup] = useState(false);
  const [groupMaxSize, setGroupMaxSize] = useState("");
  const [maxClients, setMaxClients] = useState("");

  // Step 4 – branding
  const [brandName, setBrandName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [logoPhoto, setLogoPhoto] = useState<string | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/register");
        return;
      }
      setUserId(data.user.id);
      setFullName(data.user.user_metadata?.full_name || "");
    });
  }, [navigate]);

  const toggleCert = (c: string) =>
    setCerts(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleSpecialty = (s: string) =>
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleCoachType = (t: string) =>
    setCoachType(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string | null) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Nahrajte prosím obrázek"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadFileToStorage = async (dataUrl: string, folder: string): Promise<string> => {
    if (!userId) return "";
    const base64 = dataUrl.split(",")[1];
    const mimeMatch = dataUrl.match(/data:(.*?);/);
    const mime = mimeMatch?.[1] || "image/jpeg";
    const ext = mime.split("/")[1] || "jpg";
    const byteChars = atob(base64);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArray], { type: mime });
    const path = `${userId}/${folder}.${ext}`;
    const { error } = await supabase.storage.from("profile-assets").upload(path, blob, { upsert: true });
    if (error) { console.error(error); return ""; }
    const { data } = supabase.storage.from("profile-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const getStepErrors = (): string[] => {
    const errors: string[] = [];
    if (step === 0) {
      if (!fullName.trim()) errors.push("Celé jméno je povinné");
    }
    if (step === 1) {
      if (!yearsExperience) errors.push("Vyberte roky zkušeností");
      if (specialties.length === 0) errors.push("Vyberte alespoň jednu specializaci");
    }
    if (step === 2) {
      if (!sessionPrice) errors.push("Zadejte cenu za lekci");
    }
    return errors;
  };

  const canProceed = () => getStepErrors().length === 0;

  const [stepErrors, setStepErrors] = useState<string[]>([]);

  const handleNext = () => {
    const errors = getStepErrors();
    if (errors.length > 0) {
      setStepErrors(errors);
      return;
    }
    setStepErrors([]);
    setStep(s => s + 1);
  };

  const handleFinish = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      let profilePhotoUrl = "";
      let coverPhotoUrl = "";
      let logoUrl = "";
      if (profilePhoto) profilePhotoUrl = await uploadFileToStorage(profilePhoto, "profile");
      if (coverPhoto) coverPhotoUrl = await uploadFileToStorage(coverPhoto, "cover");
      if (logoPhoto) logoUrl = await uploadFileToStorage(logoPhoto, "logo");

      const { error } = await supabase.from("profiles").update({
        full_name: fullName,
        phone,
        city,
        training_location: trainingLocation,
        bio,
        years_experience: yearsExperience,
        certifications: certs,
        specialties: [...specialties, ...coachType],
        session_price: parseInt(sessionPrice) || 0,
        session_length: parseInt(sessionLength) || 60,
        offer_group: offerGroup,
        group_max_size: parseInt(groupMaxSize) || 0,
        max_clients: parseInt(maxClients) || 0,
        brand_name: brandName,
        profile_photo_url: profilePhotoUrl,
        cover_photo_url: coverPhotoUrl,
        logo_url: logoUrl,
        onboarding_done: true,
        updated_at: new Date().toISOString(),
      }).eq("id", userId);

      if (error) throw error;
      toast.success("Profil trenéra vytvořen! Vítej v Apex.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Chyba při ukládání: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-card shadow-card p-8">
          <div className="flex items-center gap-3 mb-6">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="h-6 w-6 text-primary" />; })()}
            <h1 className="text-xl font-bold text-foreground">{STEPS[step].label}</h1>
          </div>

          {/* Step 1: Basics */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <Label>Celé jméno *</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jan Novák" maxLength={100} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Telefon</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+420 ..." maxLength={20} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Město</Label>
                  <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Praha" maxLength={50} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Místo tréninku</Label>
                <Input value={trainingLocation} onChange={e => setTrainingLocation(e.target.value)} placeholder="Název gymu, adresa studia..." maxLength={150} />
              </div>
              <div className="grid gap-1.5">
                <Label>O mně (krátký popis)</Label>
                <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Pár vět o tobě, tvém přístupu k tréninku..." className="min-h-[100px]" maxLength={500} />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
              </div>
              <div className="grid gap-2">
                <Label>Jaký typ trenéra jsi? (vyber alespoň 1)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {coachTypeOptions.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleCoachType(t.value)}
                      className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                        coachType.includes(t.value)
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      <span className="text-sm font-medium block">{t.label}</span>
                      <span className="text-xs opacity-70">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Education */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid gap-1.5">
                <Label>Kolik let se věnuješ trenérství? *</Label>
                <Select value={yearsExperience} onValueChange={setYearsExperience}>
                  <SelectTrigger><SelectValue placeholder="Vyber..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<1">Méně než 1 rok</SelectItem>
                    <SelectItem value="1-3">1–3 roky</SelectItem>
                    <SelectItem value="3-5">3–5 let</SelectItem>
                    <SelectItem value="5-10">5–10 let</SelectItem>
                    <SelectItem value="10+">10+ let</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Certifikace a vzdělání</Label>
                <div className="flex flex-wrap gap-2">
                  {certOptions.map(c => (
                    <button key={c} type="button" onClick={() => toggleCert(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        certs.includes(c) ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-border text-muted-foreground hover:bg-accent"
                      }`}>{c}</button>
                  ))}
                </div>
                {certs.includes("Jiné") && (
                  <Input value={otherCert} onChange={e => setOtherCert(e.target.value)} placeholder="Uveď certifikaci..." className="mt-1" maxLength={100} />
                )}
              </div>
              <div className="grid gap-2">
                <Label>Specializace * (vyber alespoň 1)</Label>
                <div className="flex flex-wrap gap-2">
                  {specialtyOptions.map(s => (
                    <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        specialties.includes(s) ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-border text-muted-foreground hover:bg-accent"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Cena za lekci (Kč) *</Label>
                  <Input type="number" min={0} value={sessionPrice} onChange={e => setSessionPrice(e.target.value)} placeholder="800" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Délka lekce (min)</Label>
                  <Select value={sessionLength} onValueChange={setSessionLength}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                      <SelectItem value="90">90 min</SelectItem>
                      <SelectItem value="120">120 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Max. počet klientů</Label>
                <Input type="number" min={1} value={maxClients} onChange={e => setMaxClients(e.target.value)} placeholder="15" />
              </div>
              <div className="grid gap-2">
                <Label>Skupinové lekce</Label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={offerGroup} onCheckedChange={(v) => setOfferGroup(!!v)} />
                  Nabízím skupinové lekce
                </label>
                {offerGroup && (
                  <div className="grid gap-1.5 mt-1 max-w-[200px]">
                    <Label className="text-xs">Max. lidí ve skupině</Label>
                    <Input type="number" min={2} max={50} value={groupMaxSize} onChange={e => setGroupMaxSize(e.target.value)} placeholder="8" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Branding */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">Přizpůsob si svůj profil. Vše můžeš později změnit v Nastavení.</p>
              <div className="grid gap-1.5">
                <Label>Název značky / studia</Label>
                <Input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="např. FitPro Studio" maxLength={100} />
                <p className="text-xs text-muted-foreground">Nepovinné – zobrazí se vedle tvého jména</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Profile photo */}
                <div className="space-y-2">
                  <Label className="text-sm">Profilová fotka</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 shrink-0 rounded-full border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
                      {profilePhoto ? (
                        <>
                          <img src={profilePhoto} alt="Profil" className="h-full w-full object-cover" />
                          <button onClick={() => setProfilePhoto(null)} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <Image className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <Button variant="outline" size="sm" type="button" onClick={() => profileInputRef.current?.click()}>
                        <Upload className="h-3.5 w-3.5 mr-1.5" />Nahrát
                      </Button>
                      <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, setProfilePhoto)} />
                      <p className="text-[11px] text-muted-foreground mt-1">Max 5 MB</p>
                    </div>
                  </div>
                </div>

                {/* Logo */}
                <div className="space-y-2">
                  <Label className="text-sm">Logo značky</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 shrink-0 rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
                      {logoPhoto ? (
                        <>
                          <img src={logoPhoto} alt="Logo" className="h-full w-full object-contain p-1" />
                          <button onClick={() => setLogoPhoto(null)} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <Palette className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <Button variant="outline" size="sm" type="button" onClick={() => logoInputRef.current?.click()}>
                        <Upload className="h-3.5 w-3.5 mr-1.5" />Nahrát
                      </Button>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, setLogoPhoto)} />
                      <p className="text-[11px] text-muted-foreground mt-1">Max 5 MB</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover photo */}
              <div className="space-y-2">
                <Label className="text-sm">Úvodní fotka (cover)</Label>
                <div
                  className="relative h-28 w-full rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:border-muted-foreground/40 transition-colors"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverPhoto ? (
                    <>
                      <img src={coverPhoto} alt="Cover" className="h-full w-full object-cover" />
                      <button onClick={(e) => { e.stopPropagation(); setCoverPhoto(null); }} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
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
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, setCoverPhoto)} />
              </div>
            </div>
          )}

          {/* Step 5: Summary */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Zkontroluj si údaje. Vše můžeš později změnit v Nastavení.</p>
              <div className="rounded-lg bg-subtle p-4 space-y-3 text-sm">
                <div><span className="font-medium text-foreground">Jméno:</span> <span className="text-muted-foreground">{fullName}</span></div>
                {brandName && <div><span className="font-medium text-foreground">Značka:</span> <span className="text-muted-foreground">{brandName}</span></div>}
                {city && <div><span className="font-medium text-foreground">Město:</span> <span className="text-muted-foreground">{city}</span></div>}
                <div><span className="font-medium text-foreground">Zkušenosti:</span> <span className="text-muted-foreground">{yearsExperience} let</span></div>
                {coachType.length > 0 && <div><span className="font-medium text-foreground">Typ trenéra:</span> <span className="text-muted-foreground">{coachType.map(t => coachTypeOptions.find(o => o.value === t)?.label).join(", ")}</span></div>}
                {certs.length > 0 && <div><span className="font-medium text-foreground">Certifikace:</span> <span className="text-muted-foreground">{certs.join(", ")}</span></div>}
                <div><span className="font-medium text-foreground">Specializace:</span> <span className="text-muted-foreground">{specialties.join(", ")}</span></div>
                <div><span className="font-medium text-foreground">Cena:</span> <span className="text-muted-foreground">{sessionPrice} Kč / {sessionLength} min</span></div>
                {trainingLocation && <div><span className="font-medium text-foreground">Místo:</span> <span className="text-muted-foreground">{trainingLocation}</span></div>}
                <div><span className="font-medium text-foreground">Skupinové lekce:</span> <span className="text-muted-foreground">{offerGroup ? `Ano (max ${groupMaxSize || "?"} lidí)` : "Ne"}</span></div>
                <div className="flex gap-3 pt-2">
                  {profilePhoto && <img src={profilePhoto} alt="Profil" className="h-12 w-12 rounded-full object-cover border border-border" />}
                  {logoPhoto && <img src={logoPhoto} alt="Logo" className="h-12 w-12 rounded-lg object-contain border border-border p-1" />}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Zpět
              </Button>
            ) : <div />}
            {step < 4 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="gap-1.5">
                Další <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving} className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> {saving ? "Ukládám..." : "Dokončit a začít"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
