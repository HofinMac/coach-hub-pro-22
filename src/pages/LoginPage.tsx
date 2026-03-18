import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-subtle flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-xl font-semibold tracking-tight text-foreground">apex</Link>
          <p className="text-sm text-muted-foreground mt-2">Přihlaste se ke svému účtu</p>
        </div>
        <div className="rounded-xl bg-card shadow-card p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="vas@email.cz" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <Link to="/dashboard">
            <Button className="w-full mt-2">Přihlásit se</Button>
          </Link>
          <p className="text-xs text-center text-muted-foreground">
            Nemáte účet?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">Zaregistrujte se</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
