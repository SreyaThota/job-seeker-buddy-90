import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateObject } from "ai";
import { getModel } from "./ai-gateway.server";

// ---------- Helpers ----------

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJobPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return "";
    const html = await res.text();
    return stripHtml(html).slice(0, 15000);
  } catch {
    return "";
  }
}

// ---------- Schemas ----------

const JobExtractionSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().optional().default(""),
  contract_type: z.string().optional().default(""),
  remote_type: z.string().optional().default(""),
  description: z.string(),
  keywords: z.array(z.string()).default([]),
  english_speaking: z.boolean().default(true),
  requires_german: z.boolean().default(false),
});

const MatchSchema = z.object({
  match_score: z.number().min(0).max(100),
  confidence: z.enum(["high", "medium", "stretch"]),
  matched_skills: z.array(z.string()).default([]),
  missing_skills: z.array(z.string()).default([]),
  fit_reasoning: z.string(),
  learning_gaps: z
    .array(
      z.object({
        skill: z.string(),
        why_it_matters: z.string(),
        quick_resource: z.string(),
      }),
    )
    .default([]),
});

const ResumeProfileSchema = z.object({
  candidate_summary: z.string(),
  skills: z.array(z.string()).default([]),
});

// ---------- Parse / refresh resume ----------

export const parseResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ resume_text: z.string().min(20) }).parse(d))
  .handler(async ({ data, context }) => {
    const model = getModel();
    const { object: output } = await generateObject({
      model,
      schema: ResumeProfileSchema,
      prompt: `Analyze this resume and produce: (1) a punchy 3-4 sentence candidate summary in first person highlighting strengths for AI / ML / Working Student / Internship roles in Europe; (2) a flat list of concrete skills (technologies, frameworks, tools, domains).

RESUME:
${data.resume_text}`,
    });

    const { supabase, userId } = context;
    await supabase
      .from("profiles")
      .update({
        resume_text: data.resume_text,
        candidate_summary: output.candidate_summary,
        skills: output.skills,
      })
      .eq("id", userId);

    return output;
  });

// ---------- Add job (URL or pasted description) ----------

export const addJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        url: z.string().url().optional().or(z.literal("")),
        pasted: z.string().optional().or(z.literal("")),
      })
      .refine((v) => (v.url && v.url.length > 0) || (v.pasted && v.pasted.length > 50), {
        message: "Provide a job URL or paste a job description.",
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Get profile/resume for matching
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.resume_text) {
      throw new Error("Add your resume in Profile first so we can score and tailor.");
    }

    let raw = data.pasted ?? "";
    let sourceUrl = data.url ?? "";
    if (sourceUrl && raw.length < 200) {
      const fetched = await fetchJobPageText(sourceUrl);
      if (fetched.length > raw.length) raw = fetched;
    }
    if (raw.length < 100) {
      throw new Error(
        "Could not read the job description from that URL. Please paste the job text directly.",
      );
    }

    const model = getModel();

    // Step 1: extract structured job info
    const { object: job } = await generateObject({
      model,
      schema: JobExtractionSchema,
      prompt: `Extract the structured job posting from the text below. 'english_speaking'=true unless German is the working language. 'requires_german' = true only if German is required (not "nice to have"). Keywords = 10-15 most important hard skills and tools the recruiter ATS will scan for.

SOURCE${sourceUrl ? ` URL: ${sourceUrl}` : ""}:
${raw.slice(0, 12000)}`,
    });

    // Step 2: match scoring
    const { object: match } = await generateObject({
      model,
      schema: MatchSchema,
      prompt: `Score how well this candidate fits this role on a scale of 0-100.
- 80-100 = High Probability (apply with confidence)
- 50-79 = Medium Probability
- below 50 = Stretch Opportunity

Then list matched_skills (overlap between candidate skills and job keywords), missing_skills (job keywords absent), a 2-3 sentence fit_reasoning, and learning_gaps (max 3, each studyable in under 2 hours with a free resource — link to docs/youtube/freecodecamp/etc).

CANDIDATE SUMMARY:
${profile.candidate_summary ?? ""}
CANDIDATE SKILLS: ${JSON.stringify(profile.skills ?? [])}

JOB: ${job.title} at ${job.company}
KEYWORDS: ${job.keywords.join(", ")}
DESCRIPTION:
${job.description.slice(0, 6000)}`,
    });

    const { data: inserted, error } = await supabase
      .from("jobs")
      .insert({
        user_id: userId,
        title: job.title,
        company: job.company,
        location: job.location,
        url: sourceUrl || null,
        source: sourceUrl ? new URL(sourceUrl).hostname.replace("www.", "") : "pasted",
        description: job.description,
        contract_type: job.contract_type,
        remote_type: job.remote_type,
        keywords: job.keywords,
        match_score: match.match_score,
        confidence: match.confidence,
        matched_skills: match.matched_skills,
        missing_skills: match.missing_skills,
        fit_reasoning: match.fit_reasoning,
        learning_gaps: match.learning_gaps,
        status: "saved",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return {
      job: inserted,
      english_speaking: job.english_speaking,
      requires_german: job.requires_german,
    };
  });

// ---------- Generate application package ----------

export const generatePackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ job_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: job }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("jobs").select("*").eq("id", data.job_id).eq("user_id", userId).maybeSingle(),
    ]);
    if (!profile?.resume_text) throw new Error("Add your resume first.");
    if (!job) throw new Error("Job not found.");

    const model = getModel();

    const PackageSchema = z.object({
      tailored_resume: z.string(),
      cover_letter: z.string(),
      recruiter_message: z.string(),
      interview_prep: z.string(),
    });

    const { object: output } = await generateObject({
      model,
      schema: PackageSchema,
      prompt: `You are an elite job-application copywriter. Produce a tailored application package for the candidate below. Stay TRUTHFUL — never invent experience, degrees, or companies. Re-order, re-phrase, and emphasize what's already there.

Return four fields:

1) tailored_resume — full markdown resume reformatted for ATS, weaving in these job keywords naturally where the candidate genuinely has the skill: ${(job.keywords as string[]).join(", ")}. Keep all real experience. Order: Header, Summary, Skills, Experience, Projects, Education. Use bullet points starting with strong verbs and quantified impact.

2) cover_letter — 250-320 words, confident, concise, addressed to "Hiring Team at ${job.company}". Opens with a specific hook about the role, shows fit through 2 specific projects/experiences, closes with a clear ask.

3) recruiter_message — 80-120 word LinkedIn / email message a recruiter would actually reply to. First person, warm but professional.

4) interview_prep — markdown notes covering: (a) 3 likely technical questions for this role with concise answer outlines, (b) a "Tell me about yourself" 60-second pitch, (c) a "Why this role at ${job.company}" answer in 4 sentences, (d) 3 smart questions to ask the interviewer.

CANDIDATE RESUME:
${profile.resume_text}

CANDIDATE PROFILE:
Name: ${profile.full_name ?? ""} | Email: ${profile.email ?? ""} | Phone: ${profile.phone ?? ""}
LinkedIn: ${profile.linkedin_url ?? ""} | GitHub: ${profile.github_url ?? ""} | Portfolio: ${profile.portfolio_url ?? ""}
University: ${profile.university ?? ""} — ${profile.degree ?? ""}, expected ${profile.expected_graduation ?? ""}
Work auth: ${profile.work_authorization ?? ""}

JOB: ${job.title} at ${job.company} (${job.location ?? ""})
DESCRIPTION:
${(job.description ?? "").slice(0, 6000)}`,
    });

    const { error } = await supabase
      .from("jobs")
      .update({
        tailored_resume: output.tailored_resume,
        cover_letter: output.cover_letter,
        recruiter_message: output.recruiter_message,
        interview_prep: output.interview_prep,
      })
      .eq("id", data.job_id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    return output;
  });

// ---------- Bulk import from Berlin Startup Jobs ----------

const DEFAULT_BOARDS = [
  "https://berlinstartupjobs.com/jobs-by-types/internship/",
  "https://berlinstartupjobs.com/jobs-by-types/working-student/",
  "https://berlinstartupjobs.com/skill-areas/ai/",
];

function extractJobUrlsFromListing(html: string): string[] {
  const urls = new Set<string>();
  const re = /href="(https:\/\/berlinstartupjobs\.com\/[^"#?]+\/)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const u = m[1];
    if (/\/(jobs-by-types|skill-areas|companies|cities|page|category|tag|author|wp-|feed)\//i.test(u)) continue;
    if (u.match(/berlinstartupjobs\.com\/?$/)) continue;
    const path = u.replace("https://berlinstartupjobs.com/", "").replace(/\/$/, "");
    if (path.split("/").length === 1 && path.length > 8) urls.add(u);
  }
  return Array.from(urls);
}

export const bulkImportJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        boards: z.array(z.string().url()).optional(),
        min_score: z.number().min(0).max(100).default(60),
        max_keep: z.number().min(1).max(30).default(15),
        max_fetch: z.number().min(1).max(50).default(30),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.resume_text) {
      throw new Error("Add your resume in Profile first.");
    }

    const boards = data.boards ?? DEFAULT_BOARDS;
    const model = getModel();
    const allUrls = new Set<string>();

    for (const boardUrl of boards) {
      try {
        const response = await fetch(boardUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          },
        });

        if (!response.ok) continue;

        const html = await response.text();
        for (const jobUrl of extractJobUrlsFromListing(html)) {
          allUrls.add(jobUrl);
        }
      } catch {
        continue;
      }
    }

    const { data: existing } = await supabase.from("jobs").select("url").eq("user_id", userId);
    const existingSet = new Set((existing ?? []).map((row) => (row.url ?? "").replace(/\/$/, "")));
    const candidates = Array.from(allUrls)
      .filter((url) => !existingSet.has(url.replace(/\/$/, "")))
      .slice(0, data.max_fetch);

    type ScoredJob = {
      url: string;
      job: z.infer<typeof JobExtractionSchema>;
      match: z.infer<typeof MatchSchema>;
    };

    const scored: ScoredJob[] = [];

    for (const candidateUrl of candidates) {
      try {
        const raw = await fetchJobPageText(candidateUrl);
        if (raw.length < 200) continue;

        const { object: job } = await generateObject({
          model,
          schema: JobExtractionSchema,
          prompt: [
            "Extract the structured job posting.",
            "Set requires_german=true only if German is required, not just nice-to-have.",
            "Return 10-15 ATS-critical hard-skill keywords.",
            "",
            `SOURCE ${candidateUrl}:`,
            raw.slice(0, 12000),
          ].join("\n"),
        });

        if (job.requires_german) continue;

        const { object: match } = await generateObject({
          model,
          schema: MatchSchema,
          prompt: [
            `Score fit 0-100 for this candidate and role.`,
            `CANDIDATE: ${profile.candidate_summary ?? ""}`,
            `SKILLS: ${JSON.stringify(profile.skills ?? [])}`,
            `JOB: ${job.title} @ ${job.company}`,
            `KEYWORDS: ${job.keywords.join(", ")}`,
            `DESC: ${job.description.slice(0, 5000)}`,
          ].join("\n"),
        });

        scored.push({ url: candidateUrl, job, match });
      } catch {
        continue;
      }
    }

    const keepers = scored
      .filter((entry) => entry.match.match_score >= data.min_score)
      .sort((a, b) => b.match.match_score - a.match.match_score)
      .slice(0, data.max_keep);

    const rows = keepers.map((entry) => ({
      user_id: userId,
      title: entry.job.title,
      company: entry.job.company,
      location: entry.job.location,
      url: entry.url,
      source: "berlinstartupjobs.com",
      description: entry.job.description,
      contract_type: entry.job.contract_type,
      remote_type: entry.job.remote_type,
      keywords: entry.job.keywords,
      match_score: entry.match.match_score,
      confidence: entry.match.confidence,
      matched_skills: entry.match.matched_skills,
      missing_skills: entry.match.missing_skills,
      fit_reasoning: entry.match.fit_reasoning,
      learning_gaps: entry.match.learning_gaps,
      status: "saved" as const,
    }));

    let inserted = 0;
    if (rows.length > 0) {
      const { data: insertedRows, error } = await supabase.from("jobs").insert(rows).select("id");
      if (error) throw new Error(error.message);
      inserted = insertedRows?.length ?? 0;
    }

    return {
      discovered: allUrls.size,
      considered: candidates.length,
      scored: scored.length,
      inserted,
    };
  });

// ---------- Bulk apply: generate package + mark applied for all good-fit saved jobs ----------

export const bulkApplyFits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        min_score: z.number().min(0).max(100).default(60),
        max_apply: z.number().min(1).max(50).default(25),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.resume_text) throw new Error("Add your resume in Profile first.");

    const { data: jobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", userId)
      .gte("match_score", data.min_score)
      .in("status", ["saved", "to_apply"])
      .order("match_score", { ascending: false })
      .limit(data.max_apply);

    const list = jobs ?? [];
    if (list.length === 0) return { applied: 0, failed: 0, total: 0 };

    const model = getModel();
    const PackageSchema = z.object({
      tailored_resume: z.string(),
      cover_letter: z.string(),
      recruiter_message: z.string(),
      interview_prep: z.string(),
    });

    let applied = 0;
    let failed = 0;

    for (const job of list) {
      try {
        const { object: output } = await generateObject({
          model,
          schema: PackageSchema,
          prompt: `Create a truthful tailored application package. Never invent experience.

Return:
1) tailored_resume — full ATS-friendly markdown resume weaving in job keywords: ${((job.keywords as string[]) ?? []).join(", ")}
2) cover_letter — 250-320 words to "Hiring Team at ${job.company}"
3) recruiter_message — 80-120 word LinkedIn/email message
4) interview_prep — markdown: 3 likely questions w/ outlines, 60s self-pitch, "why ${job.company}" answer, 3 questions to ask

CANDIDATE RESUME:
${profile.resume_text}

PROFILE: ${profile.full_name ?? ""} | ${profile.email ?? ""} | ${profile.linkedin_url ?? ""} | ${profile.github_url ?? ""}
${profile.university ?? ""} — ${profile.degree ?? ""}

JOB: ${job.title} at ${job.company} (${job.location ?? ""})
DESCRIPTION:
${(job.description ?? "").slice(0, 6000)}`,
        });

        const { error } = await supabase
          .from("jobs")
          .update({
            tailored_resume: output.tailored_resume,
            cover_letter: output.cover_letter,
            recruiter_message: output.recruiter_message,
            interview_prep: output.interview_prep,
            status: "applied",
            applied_at: new Date().toISOString(),
          })
          .eq("id", job.id)
          .eq("user_id", userId);
        if (error) throw new Error(error.message);
        applied++;
      } catch {
        failed++;
      }
    }

    return { applied, failed, total: list.length };
  });

