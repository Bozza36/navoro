import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import navoroLogo from "@/assets/navoro-logo.svg";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("streak_count").eq("user_id", user.id).single()
      .then(({ data }) => { if (data) setStreak(data.streak_count); });
  }, [user]);

  const navLinks = user
    ? [
        { href: "/dashboard", label: "Home" },
        { href: "/careers", label: "Careers" },
        { href: "/profile", label: "Profile" },
      ]
    : [];

  const isActive = (href: string) => location.pathname.startsWith(href);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <button onClick={() => navigate(user ? "/dashboard" : "/")} className="flex items-center gap-2.5">
          <img src={navoroLogo} alt="Navoro" className="h-12 w-auto" />
        </button>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => navigate(link.href)}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {streak !== null && streak > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/15 gold-glow">
                  <Zap className="h-4 w-4 text-accent" />
                  <span className="text-sm font-bold text-accent">{streak}</span>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1">
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => { navigate(link.href); setMobileOpen(false); }}
              className={`block w-full text-left text-sm font-medium py-2 ${
                isActive(link.href) ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </button>
          ))}
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start gap-1">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          ) : (
            <Button size="sm" className="w-full" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>
              Get Started
            </Button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
