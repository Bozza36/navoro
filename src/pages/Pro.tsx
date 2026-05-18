import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Star, Zap } from "lucide-react";

const PRO_FEATURES = [
  "Unlock all 7 levels instantly — no ads",
  "Access every career discipline",
  "Add Navoro Certificates to LinkedIn",
  "Priority access to new scenarios",
  "Support the Navoro mission",
];

const Pro = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-16 max-w-lg text-center">
        <div className="mb-6">
          <Zap className="h-12 w-12 text-accent mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-wide text-foreground mb-2">Go Pro</h1>
          <p className="text-muted-foreground">Unlock the full Navoro experience.</p>
        </div>

        <Card className="mb-8 text-left">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-accent" /> Pro Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-bold"
          onClick={() => {
            // Placeholder — integrate Stripe or payment flow
            alert("Payment integration coming soon!");
          }}
        >
          ✨ Upgrade to Pro
        </Button>

        <button
          onClick={() => navigate(user ? "/path" : "/")}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Maybe later
        </button>
      </main>
    </div>
  );
};

export default Pro;
