import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { parseResume } from "@/lib/jobs.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Upload } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — ApplyAgent" }] }),
  component: ProfilePage,
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  work_authorization: string | null;
  university: string | null;
  degree: string | null;
  expected_graduation: string | null;
  preferred_locations: string | null;
  role_keywords: string | null;
  daily_target: number | null;
  resume_text: string | null;
  candidate_summary: string | null;
  skills: string[];
};

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const parseFn = useServerFn(parseResume);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data as unknown as Profile;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState<Partial<Profile>>({});
  const [resume, setResume] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm(profile);
      setResume(profile.resume_text ?? "");
    }
  }, [profile]);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      linkedin_url: form.linkedin_url,
      portfolio_url: form.portfolio_url,
      github_url: form.github_url,
      work_authorization: form.work_authorization,
      university: form.university,
      degree: form.degree,
      expected_graduation: form.expected_graduation,
      preferred_locations: form.preferred_locations,
      role_keywords: form.role_keywords,
      daily_target: form.daily_target,
    }).eq("id", user!.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["profile"] }); }
  };

  const analyzeResume = async () => {
    if (resume.length < 50) { toast.error("Paste your resume text first."); return; }
    setParsing(true);
    try {
      await parseFn({ data: { resume_text: resume } });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Resume analyzed — skills extracted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Used in every tailored resume and cover letter.</p>
      </div>

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2"><Upload className="h-4 w-4" /> Resume</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Paste your full resume text. PDF parsing in-browser is unreliable — copy/paste gives the AI the cleanest signal.
        </p>
        <Textarea value={resume} onChange={(e) => setResume(e.target.value)} rows={12} className="mt-3 font-mono text-xs" placeholder="Paste your full resume content here…" />
        <Button onClick={analyzeResume} disabled={parsing} className="mt-3 gap-2">
          <Sparkles className="h-4 w-4" /> {parsing ? "Analyzing…" : "Analyze & extract skills"}
        </Button>

        {profile?.candidate_summary && (
          <div className="mt-5 rounded-lg border border-border bg-background/50 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Candidate summary</div>
            <p className="mt-1 text-sm leading-relaxed">{profile.candidate_summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(profile.skills ?? []).map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold">Personal info</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" value={form.full_name ?? ""} onChange={(v) => set("full_name", v)} />
          <Field label="Email" value={form.email ?? ""} onChange={(v) => set("email", v)} />
          <Field label="Phone" value={form.phone ?? ""} onChange={(v) => set("phone", v)} />
          <Field label="Work authorization" value={form.work_authorization ?? ""} onChange={(v) => set("work_authorization", v)} placeholder="EU citizen / student visa / Blue Card eligible…" />
          <Field label="LinkedIn URL" value={form.linkedin_url ?? ""} onChange={(v) => set("linkedin_url", v)} />
          <Field label="GitHub URL" value={form.github_url ?? ""} onChange={(v) => set("github_url", v)} />
          <Field label="Portfolio URL" value={form.portfolio_url ?? ""} onChange={(v) => set("portfolio_url", v)} />
          <Field label="University" value={form.university ?? ""} onChange={(v) => set("university", v)} />
          <Field label="Degree" value={form.degree ?? ""} onChange={(v) => set("degree", v)} />
          <Field label="Expected graduation" value={form.expected_graduation ?? ""} onChange={(v) => set("expected_graduation", v)} placeholder="e.g. Sept 2026" />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold">Search preferences</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preferred locations" value={form.preferred_locations ?? ""} onChange={(v) => set("preferred_locations", v)} placeholder="Berlin, Remote Germany, Remote Europe" />
          <Field label="Role keywords" value={form.role_keywords ?? ""} onChange={(v) => set("role_keywords", v)} placeholder="ML, AI, Data Science, Working Student" />
          <Field label="Daily application target" type="number" value={String(form.daily_target ?? 5)} onChange={(v) => set("daily_target", Number(v))} />
        </div>
      </Card>

      <div className="sticky bottom-4 z-10">
        <Button onClick={save} disabled={saving} size="lg" className="w-full shadow-lg">
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input className="mt-1" type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
