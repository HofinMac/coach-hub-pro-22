import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
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
        <div className="rounded-xl bg-card shadow-card p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Celé jméno</Label>
            <Input id="name" placeholder="Jan Novák" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="vas@email.cz" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialty">Specializace</Label>
            <Input id="specialty" placeholder="např. Silový a kondiční trénink" />
          </div>
          <Link to="/dashboard">
            <Button className="w-full mt-2">Vytvořit účet</Button>
          </Link>
          <p className="text-xs text-center text-muted-foreground">
            Už máte účet?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Přihlaste se</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
