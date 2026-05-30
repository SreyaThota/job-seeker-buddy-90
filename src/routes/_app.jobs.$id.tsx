import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generatePackage } from "@/lib/jobs.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Sparkles, Copy, Download, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/jobs/$id")({
  head: () => ({ meta: [{ title: "Job — ApplyAgent" }] }),
  component: JobDetail,
});

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string | null;
  status: "saved" | "to_apply" | "applied" | "interview" | "rejected" | "offer";
  match_score: number | null;
  confidence: string | null;
  matched_skills: string[];
  missing_skills: string[];
  keywords: string[];
  fit_reasoning: string | null;
  learning_gaps: Array<{ skill: string; why_it_matters: string; quick_resource: string }>;
  description: string | null;
  tailored_resume: string | null;
  cover_letter: string | null;
  recruiter_message: string | null;
  interview_prep: string | null;
  notes: string | null;
};

const STATUSES = ["saved", "to_apply", "applied", "interview", "rejected", "offer"] as const;

function JobDetail() {
  const { id } = useParams({ from: "/_app/jobs/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const genFn = useServerFn(generatePackage);
  const [generating, setGenerating] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();
      if (error) throw error;
      return data as unknown as Job;
    },
  });

  if (isLoading || !job) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const updateStatus = async (status: Job["status"]) => {
    const patch: { status: Job["status"]; applied_at?: string } = { status };
    if (status === "applied") patch.applied_at = new Date().toISOString();
    const { error } = await supabase.from("jobs").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      qc.invalidateQueries({ queryKey: ["job", id] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Status updated");
    }
  };

  const saveNotes = async (notes: string) => {
    await supabase.from("jobs").update({ notes }).eq("id", id);
  };

  const remove = async () => {
    if (!confirm("Delete this job?")) return;
    await supabase.from("jobs").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["jobs"] });
    navigate({ to: "/dashboard" });
  };

  const generate = async () => {
    setGenerating(true);
    try {
      await genFn({ data: { job_id: id } });
      qc.invalidateQueries({ queryKey: ["job", id] });
      toast.success("Application package ready");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const copy = (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const downloadMd = (filename: string, text: string | null) => {
    if (!text) return;
    const blob = new Blob([text], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  const conf = job.confidence;
  const confTone =
    conf === "high" ? "bg-success/15 text-success border-success/30" :
    conf === "medium" ? "bg-warning/15 text-warning border-warning/30" :
    "bg-muted text-muted-foreground border-border";

  const hasPackage = !!job.tailored_resume;

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to pipeline
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{job.title}</h1>
              {job.url && (
                <a href={job.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.company}{job.location ? ` · ${job.location}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {job.match_score != null && (
              <div className="text-right">
                <div className="font-display text-4xl font-bold">{job.match_score}<span className="text-base text-muted-foreground">/100</span></div>
                <Badge variant="outline" className={cn("mt-1", confTone)}>{conf}</Badge>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Status</div>
            <Select value={job.status} onValueChange={(v) => updateStatus(v as Job["status"])}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 flex items-end justify-end gap-2">
            <Button variant="outline" size="sm" onClick={remove}>Delete</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Why you fit</h3>
          <p className="mt-2 text-sm leading-relaxed">{job.fit_reasoning ?? "—"}</p>
          <div className="mt-4">
            <div className="text-xs font-medium text-muted-foreground">Matched skills</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {job.matched_skills.length === 0 ? <span className="text-xs text-muted-foreground">—</span> :
                job.matched_skills.map((s) => (
                  <Badge key={s} className="bg-success/15 text-success hover:bg-success/20 border-success/30" variant="outline">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> {s}
                  </Badge>
                ))
              }
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs font-medium text-muted-foreground">Missing skills</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {job.missing_skills.length === 0 ? <span className="text-xs text-muted-foreground">—</span> :
                job.missing_skills.map((s) => (
                  <Badge key={s} variant="outline" className="border-warning/30 text-warning">{s}</Badge>
                ))
              }
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Learn before interview</h3>
          {job.learning_gaps && job.learning_gaps.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {job.learning_gaps.map((g, i) => (
                <li key={i} className="rounded-lg border border-border bg-background/50 p-3 text-sm">
                  <div className="font-semibold">{g.skill}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{g.why_it_matters}</p>
                  <a href={g.quick_resource.startsWith("http") ? g.quick_resource : `https://www.google.com/search?q=${encodeURIComponent(g.quick_resource)}`}
                     target="_blank" rel="noreferrer"
                     className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline">
                    Open resource <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No urgent gaps — you're ready.</p>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Application package</h3>
            <p className="text-xs text-muted-foreground">Tailored resume, cover letter, recruiter DM, and interview prep — all in one click.</p>
          </div>
          <Button onClick={generate} disabled={generating} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {generating ? "Generating…" : hasPackage ? "Regenerate" : "Generate package"}
          </Button>
        </div>

        {hasPackage && (
          <Tabs defaultValue="resume" className="mt-5">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="resume">Resume</TabsTrigger>
              <TabsTrigger value="cover">Cover letter</TabsTrigger>
              <TabsTrigger value="dm">Recruiter DM</TabsTrigger>
              <TabsTrigger value="prep">Interview prep</TabsTrigger>
            </TabsList>
            <PackagePanel value="resume" text={job.tailored_resume} onCopy={() => copy(job.tailored_resume)} onDownload={() => downloadMd(`resume-${job.company}.md`, job.tailored_resume)} />
            <PackagePanel value="cover" text={job.cover_letter} onCopy={() => copy(job.cover_letter)} onDownload={() => downloadMd(`cover-${job.company}.md`, job.cover_letter)} />
            <PackagePanel value="dm" text={job.recruiter_message} onCopy={() => copy(job.recruiter_message)} onDownload={() => downloadMd(`recruiter-${job.company}.md`, job.recruiter_message)} />
            <PackagePanel value="prep" text={job.interview_prep} onCopy={() => copy(job.interview_prep)} onDownload={() => downloadMd(`interview-${job.company}.md`, job.interview_prep)} />
          </Tabs>
        )}

        {hasPackage && job.status !== "applied" && (
          <div className="mt-5 flex items-center justify-between rounded-lg border border-accent/40 bg-accent/5 p-4">
            <div className="text-sm">
              <div className="font-semibold">Ready to apply</div>
              <div className="text-xs text-muted-foreground">Review your package above, then mark applied to log it.</div>
            </div>
            <Button onClick={() => updateStatus("applied")} className="gap-2 bg-accent text-accent-foreground hover:opacity-90">
              <CheckCircle2 className="h-4 w-4" /> Mark applied
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notes</h3>
        <Textarea
          defaultValue={job.notes ?? ""}
          onBlur={(e) => saveNotes(e.target.value)}
          placeholder="Recruiter name, follow-up dates, anything to remember…"
          rows={4}
          className="mt-2"
        />
      </Card>

      <details className="rounded-lg border border-border bg-card p-4 text-sm">
        <summary className="cursor-pointer text-muted-foreground">Original job description</summary>
        <pre className="mt-3 whitespace-pre-wrap text-xs">{job.description}</pre>
      </details>
    </div>
  );
}

function PackagePanel({
  value, text, onCopy, onDownload,
}: { value: string; text: string | null; onCopy: () => void; onDownload: () => void }) {
  return (
    <TabsContent value={value} className="mt-4 space-y-3">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCopy} className="gap-1.5"><Copy className="h-3 w-3" /> Copy</Button>
        <Button variant="outline" size="sm" onClick={onDownload} className="gap-1.5"><Download className="h-3 w-3" /> .md</Button>
      </div>
      <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background/60 p-4 font-sans text-sm leading-relaxed">
        {text}
      </pre>
    </TabsContent>
  );
}
