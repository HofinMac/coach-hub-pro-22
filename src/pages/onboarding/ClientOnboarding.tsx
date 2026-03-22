import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { User, Target, Activity, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

const STEPS = [
  { icon: User, label: "O tobě" },
  { icon: Activity, label: "Současný stav" },
  { icon: Target, label: "Cíle a preference" },
  { icon: CheckCircle2, label: "Shrnutí" },
];

const goalOptions = [
  "Zhubnout", "Nabrat svaly", "Zlepšit kondici", "Zvýšit sílu",
  "Rehabilitace po zranění", "Příprava na závody", "Celkové zdraví",
  "Zlepšit mobilitu", "Stres management",
];

const injuryOptions = [
  "Žádná zranění", "Koleno", "Rameno", "Záda (bederní)", "Záda (hrudní)",
  "Kyčle", "Kotník", "Loket", "Krční páteř", "Jiné",
];

const experienceOptions = [
  { value: "none", label: "Žádné – nikdy jsem necvičil/a" },
  { value: "beginner", label: "Začátečník – pár měsíců" },
  { value: "intermediate", label: "Středně pokročilý – 1-3 roky" },
  { value: "advanced", label: "Pokročilý – 3+ let pravidelně" },
];

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1 – about you
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2 – current state
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [experience, setExperience] = useState("");
  const [injuries, setInjuries] = useState<string[]>([]);
  const [injuryDetail, setInjuryDetail] = useState("");
  const [currentActivity, setCurrentActivity] = useState("");

  // Step 3 – goals
  const [goals, setGoals] = useState<string[]>([]);
  const [goalDetail, setGoalDetail] = useState("");
  const [preferredDays, setPreferredDays] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const toggleInjury = (i: string) => {
    if (i === "Žádná zranění") {
      setInjuries(prev => prev.includes(i) ? [] : [i]);
      return;
    }
    setInjuries(prev => {
      const without = prev.filter(x => x !== "Žádná zranění");
      return without.includes(i) ? without.filter(x => x !== i) : [...without, i];
    });
  };

  const toggleGoal = (g: string) =>
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const canProceed = () => {
    if (step === 0) return fullName.trim().length > 0;
    if (step === 1) return experience !== "";
    if (step === 2) return goals.length > 0;
    return true;
  };

  const handleFinish = () => {
    localStorage.setItem("client_onboarding_done", "true");
    toast.success("Profil vytvořen! Vítej v Trenérníku.");
    navigate("/klient");
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

          {/* Step 1: About you */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <Label>Celé jméno *</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jana Nová" maxLength={100} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                  <Label>Věk</Label>
                  <Input type="number" min={10} max={99} value={age} onChange={e => setAge(e.target.value)} placeholder="30" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Pohlaví</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue placeholder="Vyber..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Muž</SelectItem>
                      <SelectItem value="female">Žena</SelectItem>
                      <SelectItem value="other">Jiné</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Telefon</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+420 ..." maxLength={20} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Current state */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Váha (kg)</Label>
                  <Input type="number" min={30} max={300} value={weight} onChange={e => setWeight(e.target.value)} placeholder="75" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Výška (cm)</Label>
                  <Input type="number" min={100} max={250} value={height} onChange={e => setHeight(e.target.value)} placeholder="175" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Tvoje zkušenosti s cvičením *</Label>
                <RadioGroup value={experience} onValueChange={setExperience} className="space-y-2">
                  {experienceOptions.map(opt => (
                    <label key={opt.value} className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-subtle transition-colors">
                      <RadioGroupItem value={opt.value} />
                      <span className="text-sm text-foreground">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label>Současná pohybová aktivita</Label>
                <Select value={currentActivity} onValueChange={setCurrentActivity}>
                  <SelectTrigger><SelectValue placeholder="Vyber..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Žádná</SelectItem>
                    <SelectItem value="1-2">1–2× týdně</SelectItem>
                    <SelectItem value="3-4">3–4× týdně</SelectItem>
                    <SelectItem value="5+">5× a více týdně</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Zranění / omezení</Label>
                <div className="flex flex-wrap gap-2">
                  {injuryOptions.map(i => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleInjury(i)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        injuries.includes(i)
                          ? i === "Žádná zranění"
                            ? "bg-success/10 border-success/30 text-success"
                            : "bg-destructive/10 border-destructive/30 text-destructive"
                          : "bg-muted border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                {injuries.some(i => i !== "Žádná zranění") && injuries.length > 0 && !injuries.includes("Žádná zranění") && (
                  <Textarea
                    value={injuryDetail} onChange={e => setInjuryDetail(e.target.value)}
                    placeholder="Popiš svá zranění podrobněji..."
                    className="min-h-[60px] mt-1" maxLength={300}
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid gap-2">
                <Label>Jaké jsou tvé cíle? * (vyber alespoň 1)</Label>
                <div className="flex flex-wrap gap-2">
                  {goalOptions.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGoal(g)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        goals.includes(g)
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label>Upřesni své cíle (nepovinné)</Label>
                <Textarea
                  value={goalDetail} onChange={e => setGoalDetail(e.target.value)}
                  placeholder="Např. chci zhubnout 10 kg do léta, připravuji se na maraton..."
                  className="min-h-[80px]" maxLength={500}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Kolikrát týdně chceš cvičit?</Label>
                  <Select value={preferredDays} onValueChange={setPreferredDays}>
                    <SelectTrigger><SelectValue placeholder="Vyber..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">1–2×</SelectItem>
                      <SelectItem value="3">3×</SelectItem>
                      <SelectItem value="4">4×</SelectItem>
                      <SelectItem value="5+">5× a více</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Preferovaný čas</Label>
                  <Select value={preferredTime} onValueChange={setPreferredTime}>
                    <SelectTrigger><SelectValue placeholder="Vyber..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Ráno (6–10)</SelectItem>
                      <SelectItem value="midday">Dopoledne (10–13)</SelectItem>
                      <SelectItem value="afternoon">Odpoledne (13–17)</SelectItem>
                      <SelectItem value="evening">Večer (17–21)</SelectItem>
                      <SelectItem value="flexible">Flexibilní</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Zkontroluj si údaje. Vše můžeš později změnit v Nastavení.</p>
              <div className="rounded-lg bg-subtle p-4 space-y-3 text-sm">
                <div><span className="font-medium text-foreground">Jméno:</span> <span className="text-muted-foreground">{fullName}</span></div>
                {age && <div><span className="font-medium text-foreground">Věk:</span> <span className="text-muted-foreground">{age} let</span></div>}
                {weight && <div><span className="font-medium text-foreground">Váha:</span> <span className="text-muted-foreground">{weight} kg</span></div>}
                {height && <div><span className="font-medium text-foreground">Výška:</span> <span className="text-muted-foreground">{height} cm</span></div>}
                <div><span className="font-medium text-foreground">Zkušenosti:</span> <span className="text-muted-foreground">{experienceOptions.find(e => e.value === experience)?.label}</span></div>
                {injuries.length > 0 && (
                  <div><span className="font-medium text-foreground">Zranění:</span> <span className="text-muted-foreground">{injuries.join(", ")}</span></div>
                )}
                <div><span className="font-medium text-foreground">Cíle:</span> <span className="text-muted-foreground">{goals.join(", ")}</span></div>
                {preferredDays && <div><span className="font-medium text-foreground">Tréninky týdně:</span> <span className="text-muted-foreground">{preferredDays}×</span></div>}
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
