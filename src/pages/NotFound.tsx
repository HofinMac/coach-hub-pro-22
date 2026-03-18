import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 - Page not found:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-semibold tabular-nums text-foreground">404</h1>
        <p className="text-muted-foreground mt-3 mb-6">Tato stránka neexistuje.</p>
        <Link to="/" className="text-sm text-primary hover:underline font-medium">
          Zpět na úvod
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
