import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [duplicateEmail, setDuplicateEmail] = useState(false);

  const validate = () => {
    const errors: string[] = [];
    if (!name.trim()) errors.push("Celé jméno je povinné");
    if (!email.trim()) errors.push("E-mail je povinný");
    if (!password.trim()) errors.push("Heslo je povinné");
    else if (password.length < 6) errors.push("Heslo musí mít alespoň 6 znaků");
    return errors;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateEmail(false);
    const errors = validate();
    setFieldErrors(errors);
    if (errors.length > 0) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      // Detect duplicate email errors
      if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already been registered")) {
        setDuplicateEmail(true);
        return;
      }
      toast.error(error.message);
      return;
    }

    // Supabase may return a user with fake session for existing email (no error but identities empty)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setDuplicateEmail(true);
      return;
    }

    toast.success("Účet vytvořen!");
    navigate("/onboarding/trener");
  };

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Chyba při přihlášení přes Google");
  };

  const handleAppleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Chyba při přihlášení přes Apple");
  };

  return (
    <div className="min-h-screen bg-subtle flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-xl font-semibold tracking-tight text-foreground hover:opacity-80 transition-opacity">Trenérník</Link>
          <p className="text-sm text-muted-foreground mt-2">Vytvořte si trenérský účet</p>
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors">
            ← Zpět na hlavní stránku
          </Link>
        </div>
        <form onSubmit={handleRegister} className="rounded-xl bg-card shadow-card p-6 space-y-4">
          {fieldErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4 text-xs space-y-0.5">
                  {fieldErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {duplicateEmail && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Tento e-mail je již zaregistrován.{" "}
                <Link to="/login" className="font-semibold underline text-primary">Přihlaste se zde</Link>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Celé jméno *</Label>
            <Input id="name" value={name} onChange={e => { setName(e.target.value); setFieldErrors([]); }} placeholder="Jan Novák" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input id="email" type="email" value={email} onChange={e => { setEmail(e.target.value); setFieldErrors([]); setDuplicateEmail(false); }} placeholder="vas@email.cz" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Heslo *</Label>
            <Input id="password" type="password" value={password} onChange={e => { setPassword(e.target.value); setFieldErrors([]); }} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Vytvářím účet..." : "Vytvořit účet"}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">nebo</span></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={handleGoogleLogin} className="text-xs gap-1.5">
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </Button>
            <Button type="button" variant="outline" onClick={handleAppleLogin} className="text-xs gap-1.5">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Apple
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Už máte účet?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Přihlaste se</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
