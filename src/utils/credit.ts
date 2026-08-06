export interface CreditCandidate {
  name: string;
  label: string;
}

// Every identity this repo could reasonably be credited to, personal first —
// so choice 1 is always the reset that clears an override. One candidate means
// there is nothing to ask.
//
// The existing override is a candidate in its own right, not just the repo
// owner: since 3.2, `username:set <name> --repo` can point a repo at any name.
// Keying the prompt on owner-vs-personal alone skips the question entirely in
// `than/my-app` overridden to `broomfitters`, leaving plays credited to
// broomfitters while init authenticates as than — so getApiToken() looks up a
// token that was never obtained and every sync fails silently.
//
// Lives here rather than in init.ts so it can be tested: init.ts imports chalk,
// which is ESM-only and can't be loaded by this repo's jest transform.
export function creditCandidates(
  personal: string,
  repoOwner: string,
  override: string | null
): CreditCandidate[] {
  const candidates: CreditCandidate[] = [{ name: personal, label: 'your personal account' }];

  const known = (name: string) =>
    candidates.some((c) => c.name.toLowerCase() === name.toLowerCase());

  if (!known(repoOwner)) {
    candidates.push({ name: repoOwner, label: "this repo's organization" });
  }

  if (override && !known(override)) {
    candidates.push({ name: override, label: 'currently credited here' });
  }

  return candidates;
}
