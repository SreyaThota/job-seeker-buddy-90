## Problem
On `/jobs` (Add Job page), there's a yellow warning box at the bottom of the form:

> ⚠ You're filtering for English-speaking roles. We'll flag postings that look like they require German so you can skip them.

It's shown on every visit, so it reads as a persistent alarm even though nothing is wrong. Real German-requirement warnings already fire as a toast after analysis (`toast.warning("Heads up — this role looks like it requires German.")`).

## Change
In `src/routes/_app.jobs.tsx`:
- Remove the `<div>` with `border-warning/30 bg-warning/5` and the `AlertTriangle` block at the bottom of the form card.
- Drop the now-unused `AlertTriangle` import.
- Move the same info into the page subheader as a plain muted sentence, so users still know the app flags German-only roles — without the alarm styling.

New subheader copy under the "Add a job" title:
> Paste a link from LinkedIn, Greenhouse, Lever, or Wellfound — or the full description. We'll flag roles that look German-only.

No other behavior changes. The real German-detection toast on submit stays as-is.
