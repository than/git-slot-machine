import { creditCandidates } from './credit.js';

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
