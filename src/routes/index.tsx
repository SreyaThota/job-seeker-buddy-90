import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, FileText, Kanban, Brain, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ApplyAgent — AI Job Application Copilot for AI Students" },
      {
        name: "description",
        content:
          "Land English-speaking AI roles in Germany & Europe. Paste a job, get a tailored resume, cover letter, and interview prep in seconds.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-display text-lg font-semibold">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-primary text-accent-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            ApplyAgent
          </div>
          <Link to="/auth">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <section className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Built for M.Sc. AI students in Germany
          </div>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
            Apply to the right jobs.
            <br />
            <span className="gradient-text">Tailored by AI in seconds.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Drop a LinkedIn, Greenhouse or Lever job link. We score the fit, rewrite your resume for the ATS, draft a cover letter and prep you for the interview — English-only, Germany & remote Europe.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                <Zap className="h-4 w-4" /> Start free
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">See how it works</Button>
            </a>
          </div>
        </section>

        <section id="features" className="mt-28 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Target, title: "Match scoring /100", desc: "Every job ranked High / Medium / Stretch with matched & missing skills." },
            { icon: FileText, title: "ATS-tuned resume", desc: "Truthful rewrite weaving the role's top keywords into your real experience." },
            { icon: Brain, title: "Cover letter + recruiter DM", desc: "Confident, concise, on-tone for the company." },
            { icon: Kanban, title: "Kanban pipeline", desc: "Saved → To apply → Applied → Interview → Offer." },
            { icon: Sparkles, title: "Interview prep", desc: "Likely questions, 60-sec pitch, smart questions to ask back." },
            { icon: Zap, title: "Learning gap detector", desc: "Top missing skills with 2-hour free resources before your interview." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <f.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        ApplyAgent · You always review before submitting.
      </footer>
    </div>
  );
}
