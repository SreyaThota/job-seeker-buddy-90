import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { bulkImportJobs, bulkApplyFits } from "@/lib/jobs.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sparkles, Zap, ArrowRight, Send } from "lucide-react";

export const Route = createFileRoute("/_app/auto-apply")({
  head: () => ({ meta: [{ title: "Auto-apply — ApplyAgent" }] }),
  component: AutoApplyPage,
});

function AutoApplyPage() {
  const importFn = useServerFn(bulkImportJobs);
  const applyFn = useServerFn(bulkApplyFits);
  const [minScore, setMinScore] = useState(60);
  const [maxKeep, setMaxKeep] = useState(15);
  const [busy, setBusy] = useState<null | "import" | "apply">(null);
  const [result, setResult] = useState<{
    discovered: number;
    considered: number;
    scored: number;
    inserted: number;
  } | null>(null);
  const [applyResult, setApplyResult] = useState<{
    applied: number;
    failed: number;
    total: number;
  } | null>(null);

  const runImport = async () => {
    setBusy("import");
    setResult(null);
    try {
      const r = await importFn({ data: { min_score: minScore, max_keep: maxKeep } });
      setResult(r);
      toast.success(`Added ${r.inserted} matching role${r.inserted === 1 ? "" : "s"} to your pipeline`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bulk import failed");
    } finally {
      setBusy(null);
    }
  };

  const runApply = async () => {
    setBusy("apply");
    setApplyResult(null);
    try {
      const r = await applyFn({ data: { min_score: minScore, max_apply: 25 } });
      setApplyResult(r);
      if (r.total === 0) {
        toast.info(`No saved jobs scoring ≥ ${minScore}. Run discovery first.`);
      } else {
        toast.success(`Generated packages for ${r.applied} / ${r.total} role${r.total === 1 ? "" : "s"}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bulk apply failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Auto-apply</h1>
        <p className="text-sm text-muted-foreground">
          Discover roles from Berlin Startup Jobs, then auto-generate tailored applications for every role you fit.
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
            <p className="mt-1 text-xs text-muted-foreground">Used for both discover and apply.</p>
          </div>
          <div>
            <Label htmlFor="max">Max roles to discover</Label>
            <Input
              id="max"
              type="number"
              min={1}
              max={30}
              value={maxKeep}
              onChange={(e) => setMaxKeep(Number(e.target.value))}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">Top N by fit score.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Step 1:</strong> Discover scrapes Berlin Startup Jobs, scores against your resume, and saves the best.{" "}
          <strong className="text-foreground">Step 2:</strong> Apply generates a tailored resume, cover letter, recruiter DM, and interview prep for every saved role at or above your minimum score, and marks them Applied.
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={runImport} disabled={busy !== null} variant="outline" className="gap-2">
            {busy === "import" ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Zap className="h-4 w-4" />}
            {busy === "import" ? "Discovering…" : "1. Discover roles"}
          </Button>
          <Button onClick={runApply} disabled={busy !== null} className="gap-2">
            {busy === "apply" ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
            {busy === "apply" ? "Generating packages…" : "2. Apply to all I fit"}
          </Button>
        </div>
      </Card>

      {result && (
        <Card className="p-6 space-y-3">
          <h2 className="font-display text-lg font-semibold">Discovery</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Discovered" value={result.discovered} />
            <Stat label="Fetched" value={result.considered} />
            <Stat label="Scored" value={result.scored} />
            <Stat label="Saved" value={result.inserted} tone="text-success" />
          </div>
        </Card>
      )}

      {applyResult && (
        <Card className="p-6 space-y-3">
          <h2 className="font-display text-lg font-semibold">Applications generated</h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Eligible" value={applyResult.total} />
            <Stat label="Applied" value={applyResult.applied} tone="text-success" />
            <Stat label="Failed" value={applyResult.failed} />
          </div>
          <Link to="/dashboard">
            <Button variant="outline" className="w-full gap-2">
              View pipeline <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Open any applied job to copy the cover letter, recruiter DM, and tailored resume, then click through to the company's apply page.
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

