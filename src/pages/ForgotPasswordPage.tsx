import { useState } from "react";
import logoHorizontal from "@/assets/logo-coachhub-horizontal.png";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Zadejte e-mailovou adresu");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Nepodařilo se odeslat e-mail. Zkuste to znovu.");
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-subtle flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <Link to="/">
            <img src={logoHorizontal} alt="Coach Hub" className="h-24 mx-auto" />
          </Link>
          <p className="text-sm text-muted-foreground mt-2">Obnovení hesla</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Zpět na přihlášení
          </Link>
        </div>

        <div className="rounded-xl bg-card shadow-card p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">E-mail odeslán</h2>
              <p className="text-sm text-muted-foreground">
                Pokud existuje účet s adresou <strong>{email}</strong>, obdržíte e-mail s odkazem pro obnovení hesla.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full mt-2">
                  Zpět na přihlášení
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Zadejte svůj e-mail a my vám pošleme odkaz pro obnovení hesla.
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vas@email.cz"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Odesílám..." : "Odeslat odkaz pro obnovení"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
