import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Vyplňte všechna povinná pole");
      return;
    }
    if (password.length < 6) {
      toast.error("Heslo musí mít alespoň 6 znaků");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Účet vytvořen!");
      navigate("/onboarding/trener");
    }
  };

  return (
    <div className="min-h-screen bg-subtle flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-xl font-semibold tracking-tight text-foreground hover:opacity-80 transition-opacity">apex</Link>
          <p className="text-sm text-muted-foreground mt-2">Vytvořte si trenérský účet</p>
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors">
            ← Zpět na hlavní stránku
          </Link>
        </div>
        <form onSubmit={handleRegister} className="rounded-xl bg-card shadow-card p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Celé jméno *</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Jan Novák" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vas@email.cz" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Heslo *</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Vytvářím účet..." : "Vytvořit účet"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Už máte účet?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Přihlaste se</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
