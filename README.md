# Job Genie AI

Build me an AI-powered personal job application agent web app.

Purpose:
Help me discover highly relevant English-speaking jobs in Germany or remote Europe, tailor my application materials for each role, and streamline the application process with maximum efficiency.

ABOUT ME:
I am an M.Sc. Artificial Intelligence student at BTU Cottbus-Senftenberg.
I am targeting:

Working Student roles

Internships

Mandatory Internships

Part-time contracts

Hybrid or Remote in Germany / Europe

Languages:

Fluent English

Only English-speaking jobs

Exclude jobs requiring German

USER INPUTS:

Upload resume PDF

Preferred locations (Berlin, remote Germany, Europe)

Role keywords

Salary preference (optional)

Contract type

Remote / hybrid filter

Visa sponsorship optional filter

Daily application target

CORE FEATURES:

Resume Analyzer

parse uploaded resume

extract skills, projects, education, experience

identify strongest matching roles

generate candidate profile summary

Job Search Agent
Search:

LinkedIn Jobs

Greenhouse

Lever

Wellfound

company career pages

startup hiring pages

Filters:

English-speaking only

posted within last 24h / 3 days / 7 days

internships

working student

part-time

mandatory internship

Germany or remote Europe

Job Match Scoring Engine
For every job:
show:

Match score /100

matched skills

missing skills

why I am a fit

confidence level

Sort:

High Probability

Medium Probability

Stretch Opportunities

AI Resume Tailoring Engine
For each job:

analyze job description

extract top 10 keywords

rewrite my resume specifically for ATS matching

keep resume truthful

no fake experience

prioritize relevant experience

optimize for recruiter screening

export PDF and editable version

AI Cover Letter Generator
Generate personalized cover letter per job:

tailored to company tone

confident

concise

ATS-friendly

personalized to role

Application Assistant
Store reusable information:

full name

email

phone

LinkedIn URL

portfolio URL

GitHub URL

work authorization

university details

expected graduation

Generate:

recruiter email draft

short motivation text

“Why do you want this role?” response

“Tell us about yourself” answer

Application Tracker Dashboard
Columns:

Saved

To Apply

Applied

Interview

Rejected

Offer

Track:

company

role

date posted

date applied

job URL

application status

notes

follow-up reminder

AI Learning Gap Detector
For each job:
identify missing skills
Recommend:
“Learn this in 2 hours before interview”
with free resource links

One-click Application Package
For every job generate:

tailored resume

tailored cover letter

recruiter message

interview prep notes
ready to review before submission

UI REQUIREMENTS:

modern clean dashboard

dark mode

card layout

search + filters

upload resume drag-and-drop

job pipeline Kanban board

mobile responsive

TECH:

Supabase database

auth/login

OpenAI integration

optional Anthropic integration

PDF export

save job history

Important:
Do NOT auto-submit applications without user review.
Instead prepare the full application package and present a “Ready to Apply” button for manual confirmation.

Goal:
Help me apply faster to the most relevant jobs with highly personalized applications while maximizing interview chances.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://job-seeker-buddy-90.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/763c2361-a696-4008-9f6a-62ec8d1f15f7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
