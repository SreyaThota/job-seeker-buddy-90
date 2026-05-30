import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { bulkImportJobs } from "@/lib/jobs.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sparkles, Zap, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_app/auto-apply")({
  head: () => ({ meta: [{ title: "Auto-apply — ApplyAgent" }] }),
  component: AutoApplyPage,
});

function AutoApplyPage() {
  const fn = useServerFn(bulkImportJobs);
  const [minScore, setMinScore] = useState(60);
  const [maxKeep, setMaxKeep] = useState(15);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    discovered: number;
    considered: number;
    scored: number;
    inserted: number;
  } | null>(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const r = await fn({ data: { min_score: minScore, max_keep: maxKeep } });
      setResult(r);
      toast.success(`Added ${r.inserted} matching role${r.inserted === 1 ? "" : "s"} to your pipeline`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bulk import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Auto-apply</h1>
        <p className="text-sm text-muted-foreground">
          Scrape Berlin Startup Jobs for working-student, internship, and AI roles. Score each against your resume. Keep the best matches.
        </p>
      </div>

      <Card className="p-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="min">Minimum fit score</Label>
            <Input
              id="min"
              type="number"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">Skip roles scoring below this.</p>
          </div>
          <div>
            <Label htmlFor="max">Max roles to save</Label>
            <Input
              id="max"
              type="number"
              min={1}
              max={30}
              value={maxKeep}
              onChange={(e) => setMaxKeep(Number(e.target.value))}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">Top N by score.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Sources:</strong> Berlin Startup Jobs — Internships, Working-Student, and AI categories. German-only roles are filtered automatically. Already-saved jobs are skipped.
        </div>

        <Button onClick={run} disabled={busy} className="w-full gap-2">
          {busy ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Zap className="h-4 w-4" />}
          {busy ? "Scraping, scoring, saving… (60-90s)" : "Run auto-apply"}
        </Button>
      </Card>

      {result && (
        <Card className="p-6 space-y-3">
          <h2 className="font-display text-lg font-semibold">Done</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Discovered" value={result.discovered} />
            <Stat label="Fetched" value={result.considered} />
            <Stat label="Scored" value={result.scored} />
            <Stat label="Saved" value={result.inserted} tone="text-success" />
          </div>
          <Link to="/dashboard">
            <Button variant="outline" className="w-full gap-2">
              View pipeline <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Open any saved job to generate the tailored resume, cover letter, recruiter DM, and interview prep — then click through to the company's apply page.
          </p>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
