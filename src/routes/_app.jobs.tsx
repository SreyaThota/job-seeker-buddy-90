import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { addJob } from "@/lib/jobs.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Link2, FileText, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_app/jobs")({
  head: () => ({ meta: [{ title: "Add job — ApplyAgent" }] }),
  component: AddJobPage,
});

function AddJobPage() {
  const navigate = useNavigate();
  const fn = useServerFn(addJob);
  const [url, setUrl] = useState("");
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!url && pasted.length < 50) {
      toast.error("Add a job URL or paste the description.");
      return;
    }
    setBusy(true);
    try {
      const res = await fn({ data: { url, pasted } });
      if (res.requires_german) {
        toast.warning("Heads up — this role looks like it requires German.");
      }
      toast.success(`Saved · match ${res.job.match_score}/100`);
      navigate({ to: "/jobs/$id", params: { id: res.job.id } });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add job");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Add a job</h1>
        <p className="text-sm text-muted-foreground">
          Paste a job link from LinkedIn, Greenhouse, Lever, Wellfound, or the full description.
        </p>
      </div>

      <Card className="p-6 space-y-5">
        <div>
          <Label htmlFor="url" className="flex items-center gap-2"><Link2 className="h-3.5 w-3.5" /> Job URL</Label>
          <Input
            id="url"
            placeholder="https://www.linkedin.com/jobs/view/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            We'll try to fetch the page automatically. If the site blocks it, paste the description below.
          </p>
        </div>

        <div>
          <Label htmlFor="pasted" className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Or paste job description</Label>
          <Textarea
            id="pasted"
            placeholder="Paste the full job posting — title, company, requirements, responsibilities…"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={10}
            className="mt-1 font-mono text-xs"
          />
        </div>

        <Button onClick={submit} disabled={busy} className="w-full gap-2">
          <Sparkles className="h-4 w-4" />
          {busy ? "Analyzing fit & scoring…" : "Analyze & score this job"}
        </Button>

        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
          <div className="flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              You're filtering for English-speaking roles. We'll flag postings that look like they require German so you can skip them.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
