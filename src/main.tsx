import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "@/integrations/supabase/client";

// Sign out on tab close if "remember me" was unchecked
window.addEventListener("beforeunload", () => {
  if (sessionStorage.getItem("coach_hub_temp_session") === "true") {
    supabase.auth.signOut();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
