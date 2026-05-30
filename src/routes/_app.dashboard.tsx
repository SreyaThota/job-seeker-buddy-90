import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Pipeline — ApplyAgent" }] }),
  component: Dashboard,
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
  source: string | null;
  created_at: string;
};

const COLS: { key: Job["status"]; label: string; tone: string }[] = [
  { key: "saved", label: "Saved", tone: "bg-muted text-muted-foreground" },
  { key: "to_apply", label: "To apply", tone: "bg-accent/20 text-accent" },
  { key: "applied", label: "Applied", tone: "bg-primary/20 text-primary" },
  { key: "interview", label: "Interview", tone: "bg-warning/20 text-warning" },
  { key: "offer", label: "Offer", tone: "bg-success/20 text-success" },
  { key: "rejected", label: "Rejected", tone: "bg-destructive/15 text-destructive" },
];

function confidenceTone(c: string | null) {
  if (c === "high") return "bg-success/15 text-success border-success/30";
  if (c === "medium") return "bg-warning/15 text-warning border-warning/30";
  return "bg-muted text-muted-foreground border-border";
}

function Dashboard() {
  const { user } = useAuth();
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id,title,company,location,url,status,match_score,confidence,source,created_at")
        .order("match_score", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Job[];
    },
    enabled: !!user,
  });

  const grouped = COLS.map((c) => ({ ...c, items: jobs.filter((j) => j.status === c.key) }));
  const stats = {
    total: jobs.length,
    high: jobs.filter((j) => j.confidence === "high").length,
    applied: jobs.filter((j) => ["applied", "interview", "offer"].includes(j.status)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Pipeline</h1>
          <p className="text-sm text-muted-foreground">Your AI-scored application board.</p>
        </div>
        <Link to="/jobs">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Add job</Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Jobs tracked" value={stats.total} />
        <StatCard label="High-fit roles" value={stats.high} tone="text-success" />
        <StatCard label="Applied or further" value={stats.applied} tone="text-accent" />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : jobs.length === 0 ? (
        <Card className="grid place-items-center p-12 text-center">
          <p className="font-display text-lg font-semibold">No jobs yet</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Paste a LinkedIn / Greenhouse / Lever job URL or the full job description. We'll score the fit and prep a tailored package.
          </p>
          <Link to="/jobs" className="mt-4">
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add your first job</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {grouped.map((col) => (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", col.tone)}>{col.label}</span>
                <span className="text-xs text-muted-foreground">{col.items.length}</span>
              </div>
              <div className="space-y-2">
                {col.items.map((j) => (
                  <Link key={j.id} to="/jobs/$id" params={{ id: j.id }}>
                    <Card className="p-3 transition hover:border-accent/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{j.title}</div>
                          <div className="truncate text-xs text-muted-foreground">{j.company} {j.location ? `· ${j.location}` : ""}</div>
                        </div>
                        {j.match_score != null && (
                          <div className="text-right text-xs">
                            <div className="font-display text-base font-bold leading-none">{j.match_score}</div>
                            <div className="text-[10px] text-muted-foreground">/100</div>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Badge variant="outline" className={cn("text-[10px]", confidenceTone(j.confidence))}>
                          {j.confidence ?? "—"}
                        </Badge>
                        {j.url && (
                          <a href={j.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
                {col.items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
                    empty
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-display text-3xl font-bold", tone)}>{value}</div>
    </Card>
  );
}
