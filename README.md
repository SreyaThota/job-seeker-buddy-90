# Job Genie AI

A personal job-application agent for students looking for working-student roles and internships in Germany and remote Europe. Upload a resume once; the app scores each job against it and drafts a tailored application package.

**Live demo:** _link added after deployment_

## Features
- **Resume analyzer**: parses an uploaded resume into skills, projects, education and experience.
- **Job tracker**: add or bulk-import roles and keep them in one list with status tracking.
- **Match scoring**: a 0–100 fit score per job, with matched and missing skills.
- **Application package**: for each role, a tailored resume, cover letter, recruiter message and interview prep.
- **Auto-apply queue**: generate packages for every saved role above a chosen fit score in one step.

## Tech
- TanStack Start (React 19, Vite) with server functions
- Supabase for auth and the Postgres database (profiles and jobs tables, with row-level security)
- LLM calls through the Lovable AI gateway
- Tailwind CSS and shadcn/ui

Built with the Lovable AI app builder, so most commits come from its bot account.

## Run locally
```bash
npm install
npm run dev
```
The AI features need the Lovable AI gateway key (`LOVABLE_API_KEY`) and a Supabase project; see `src/lib/config.server.ts`.
