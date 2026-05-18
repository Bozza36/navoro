import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass, TrendingUp, Shield, ChevronRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center py-28 md:py-40 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 mb-8">
          <span className="text-xs font-medium text-accent">NEW</span>
          <span className="text-xs text-muted-foreground">Decision Sandbox now live</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-wider text-foreground max-w-4xl leading-[1.1]">
          Navigate Your Future
        </h1>
        <p className="mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
          Navoro empowers people to make confident, informed career moves by learning the real practice of a profession—not just theory.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 px-8 text-base">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="px-8 text-base">
            Log In
          </Button>
        </div>
      </section>

      {/* Learn by Doing Section */}
      <section className="container pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-wide text-foreground">Learn by Doing</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Master real-world scenarios across engineering, healthcare, and business disciplines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="rounded-xl border border-border bg-card p-8 transition-all hover:border-accent/40" style={{ boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.3)" }}>
            <div className="mb-5 w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Compass className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-2 tracking-wide">Clarity</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Understandable steps that break down complex career paths into digestible, actionable decisions.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-8 transition-all hover:border-accent/40" style={{ boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.3)" }}>
            <div className="mb-5 w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-2 tracking-wide">Progression</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Daily growth through 7 career levels. Watch your expertise compound with every decision you make.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-8 transition-all hover:border-accent/40" style={{ boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.3)" }}>
            <div className="mb-5 w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-2 tracking-wide">Integrity</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Realistic scenarios built from real professional standards. No shortcuts, no gimmicks.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-10 md:p-16" style={{ boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.3)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-wide text-foreground mb-4">Interactive Decision Sandboxes</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Allocate budgets, manage timelines, balance quality—just like in a real job. The outcomes change based on your decisions.
                </p>
                <Button variant="outline" onClick={() => navigate("/auth")} className="gap-2">
                  Try a scenario <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="graphic-placeholder graphic-placeholder-pulse h-64 rounded-xl">
                <span className="text-sm font-medium text-secondary-foreground/60">Sandbox Preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container pb-32">
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium">Guided by Professional Standards</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-10 max-w-3xl mx-auto opacity-40">
          {["ABET", "IEEE", "AAMI", "ASCE", "NSPE", "WHO"].map((org) => (
            <div key={org} className="text-lg font-bold tracking-widest text-muted-foreground">
              {org}
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="container pb-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-wide text-foreground mb-4">Ready to start?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">Join thousands making confident career decisions through real practice.</p>
        <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 px-10 text-base">
          Get Started Free <ArrowRight className="h-4 w-4" />
        </Button>
      </section>
    </div>
  );
};

export default Index;
