import { creditCandidates, shouldPersistIdentity } from './credit.js';

// `login <name>` adopting a name globally is how every identity hijack this
// project has fixed began. The rule has to hold for names that arrive by any
// route, including `username:set <name> --repo` on a machine that has never
// run init.
describe('login: when to adopt a name as the global identity', () => {
  it('establishes the first identity on a fresh machine', () => {
    expect(shouldPersistIdentity(undefined, null, 'than')).toBe(true);
  });

  it('keeps an established identity when logging in as someone else', () => {
    expect(shouldPersistIdentity('than', null, 'broomfitters')).toBe(false);
  });

  it('re-adopts the established identity, casing aside', () => {
    expect(shouldPersistIdentity('than', null, 'Than')).toBe(true);
  });

  it('refuses to adopt this repo\'s override as the global identity', () => {
    // The hole `username:set --repo` opened: with no global identity yet,
    // following the "log in as broomfitters" hint would make the org the
    // identity for every other repo on the machine.
    expect(shouldPersistIdentity(undefined, 'broomfitters', 'broomfitters')).toBe(false);
    expect(shouldPersistIdentity(undefined, 'Broomfitters', 'broomfitters')).toBe(false);
  });

  it('still establishes a different name while an override exists', () => {
    expect(shouldPersistIdentity(undefined, 'broomfitters', 'than')).toBe(true);
  });

  it('lets the established identity win over the override', () => {
    // Logging in as the global identity from an overridden repo is a re-auth,
    // not an adoption — it must not be blocked by the override.
    expect(shouldPersistIdentity('than', 'broomfitters', 'than')).toBe(true);
  });
});

// The prompt this drives is the only way back to personal credit, and it also
// decides which identity init authenticates as. A candidate list that is wrong
// by one entry means plays are credited to a name that holds no token — and
// the resulting sync failures are silent (play.ts swallows them, and its
// "not authenticated" notice is off in --small, the hook's only mode).
describe('init: who gets credit for this repo', () => {
  const names = (personal: string, owner: string, override: string | null) =>
    creditCandidates(personal, owner, override).map((c) => c.name);

  it('asks nothing in a personal repo with no override', () => {
    expect(names('than', 'than', null)).toEqual(['than']);
  });

  it('offers the org in an org repo', () => {
    expect(names('than', 'broomfitters', null)).toEqual(['than', 'broomfitters']);
  });

  it('offers an override that is neither the owner nor the personal name', () => {
    // Reachable since 3.2 added `username:set <name> --repo`. Keying the
    // prompt on owner-vs-personal alone skips it here, so the override
    // survives while init authenticates as the personal identity.
    expect(names('than', 'than', 'broomfitters')).toEqual(['than', 'broomfitters']);
  });

  it('lists owner and override separately when they differ', () => {
    expect(names('than', 'acme', 'broomfitters')).toEqual(['than', 'acme', 'broomfitters']);
  });

  it('does not repeat the owner when it is already the override', () => {
    expect(names('than', 'broomfitters', 'broomfitters')).toEqual(['than', 'broomfitters']);
  });

  it('treats names case-insensitively, as GitHub does', () => {
    expect(names('Than', 'than', null)).toEqual(['Than']);
    expect(names('than', 'Broomfitters', 'broomfitters')).toEqual(['than', 'Broomfitters']);
  });

  it('always puts personal first, so choice 1 is the reset', () => {
    expect(creditCandidates('than', 'broomfitters', 'acme')[0]).toEqual({
      name: 'than',
      label: 'your personal account',
    });
  });
});
