// Should `login <name>` adopt that name as the global identity?
//
// "Adopt when nothing is established yet" was safe through 3.1.1, because the
// only writer of a per-repo override was init, which sets the global identity
// before it ever reaches the credit prompt — so "an override exists but no
// global identity does" was unreachable. `username:set <name> --repo` is a
// standalone command now and writes only the repo config, so on a machine that
// has never run init, following the "log in as <name>" hint would adopt the org
// globally: every other repo would credit its plays to it, and a bare `logout`
// would target it. That is the hijack this repo has spent two releases closing.
//
// So: an established identity still decides, and a first login still
// establishes you — except for the one name this repo already routes elsewhere.
export function shouldPersistIdentity(
  globalUsername: string | undefined,
  repoOverride: string | null,
  loginName: string
): boolean {
  const name = loginName.toLowerCase();

  if (globalUsername) {
    return globalUsername.toLowerCase() === name;
  }

  return repoOverride?.toLowerCase() !== name;
}

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
