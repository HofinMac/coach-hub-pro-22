import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Vyplňte e-mail a heslo");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Check if onboarding is done
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_done")
      .eq("id", data.user.id)
      .single();

    if (profile && !profile.onboarding_done) {
      navigate("/onboarding/trener");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-subtle flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-xl font-semibold tracking-tight text-foreground">apex</Link>
          <p className="text-sm text-muted-foreground mt-2">Přihlaste se ke svému účtu</p>
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors">
            ← Zpět na hlavní stránku
          </Link>
        </div>
        <form onSubmit={handleLogin} className="rounded-xl bg-card shadow-card p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vas@email.cz" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Přihlašuji..." : "Přihlásit se"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Nemáte účet?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">Zaregistrujte se</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
