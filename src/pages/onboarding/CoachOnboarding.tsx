import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { GraduationCap, User, DollarSign, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

const STEPS = [
  { icon: User, label: "Základní údaje" },
  { icon: GraduationCap, label: "Vzdělání a zkušenosti" },
  { icon: DollarSign, label: "Služby a ceník" },
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

export default function CoachOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1 – basics
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [trainingLocation, setTrainingLocation] = useState("");
  const [bio, setBio] = useState("");

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

  const toggleCert = (c: string) =>
    setCerts(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleSpecialty = (s: string) =>
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const canProceed = () => {
    if (step === 0) return fullName.trim().length > 0;
    if (step === 1) return yearsExperience !== "" && specialties.length > 0;
    if (step === 2) return sessionPrice !== "";
    return true;
  };

  const handleFinish = () => {
    localStorage.setItem("coach_onboarding_done", "true");
    toast.success("Profil trenéra vytvořen! Vítej v Apex.");
    navigate("/dashboard");
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
                <div className={`w-8 h-0.5 ${i < step ? "bg-primary" : "bg-border"}`} />
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
                <Textarea
                  value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Pár vět o tobě, tvém přístupu k tréninku..."
                  className="min-h-[100px]" maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
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
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCert(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        certs.includes(c)
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {certs.includes("Jiné") && (
                  <Input
                    value={otherCert} onChange={e => setOtherCert(e.target.value)}
                    placeholder="Uveď certifikaci..." className="mt-1" maxLength={100}
                  />
                )}
              </div>

              <div className="grid gap-2">
                <Label>Specializace * (vyber alespoň 1)</Label>
                <div className="flex flex-wrap gap-2">
                  {specialtyOptions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialty(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        specialties.includes(s)
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {s}
                    </button>
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
                  <Input
                    type="number" min={0} value={sessionPrice}
                    onChange={e => setSessionPrice(e.target.value)}
                    placeholder="800"
                  />
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
                <Input
                  type="number" min={1} value={maxClients}
                  onChange={e => setMaxClients(e.target.value)}
                  placeholder="15"
                />
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
                    <Input
                      type="number" min={2} max={50} value={groupMaxSize}
                      onChange={e => setGroupMaxSize(e.target.value)}
                      placeholder="8"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Zkontroluj si údaje. Vše můžeš později změnit v Nastavení.</p>
              <div className="rounded-lg bg-subtle p-4 space-y-3 text-sm">
                <div><span className="font-medium text-foreground">Jméno:</span> <span className="text-muted-foreground">{fullName}</span></div>
                {city && <div><span className="font-medium text-foreground">Město:</span> <span className="text-muted-foreground">{city}</span></div>}
                <div><span className="font-medium text-foreground">Zkušenosti:</span> <span className="text-muted-foreground">{yearsExperience} let</span></div>
                {certs.length > 0 && <div><span className="font-medium text-foreground">Certifikace:</span> <span className="text-muted-foreground">{certs.join(", ")}</span></div>}
                <div><span className="font-medium text-foreground">Specializace:</span> <span className="text-muted-foreground">{specialties.join(", ")}</span></div>
                <div><span className="font-medium text-foreground">Cena:</span> <span className="text-muted-foreground">{sessionPrice} Kč / {sessionLength} min</span></div>
                {trainingLocation && <div><span className="font-medium text-foreground">Místo:</span> <span className="text-muted-foreground">{trainingLocation}</span></div>}
                <div><span className="font-medium text-foreground">Skupinové lekce:</span> <span className="text-muted-foreground">{offerGroup ? `Ano (max ${groupMaxSize || "?"} lidí)` : "Ne"}</span></div>
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
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="gap-1.5">
                Další <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button onClick={handleFinish} className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Dokončit a začít
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
