# Git Slot Machine CLI

The player-side context: turns each git commit hash into a slot-machine play,
keeps a local balance, and syncs plays to the server under the right identity.

## Language

### Identity

**Global identity**:
The human who installed the CLI, stored once per machine. Personal — never an
organization, and never changed as a side effect of acting for one.
_Avoid_: username (ambiguous), account

**Per-repo override**:
An identity a single repository credits its plays to instead of the global
identity — typically an org. Scoped to that repo; invisible everywhere else.
_Avoid_: playAs (code name, fine in code, not in prose), repo user

**Effective identity**:
Who a play is credited to: the per-repo override when present, otherwise the
global identity. Resolution happens per repo, at play time.
_Avoid_: resolved username, current user

**Identity hijack**:
The bug class where acting *as* an identity (org login, init re-run) adopts it
as the global identity. Any flow that authenticates a per-repo identity must
leave the global identity untouched.

**Authenticated identity**:
An identity the machine holds an API token for. One token per identity, keyed
case-insensitively; holding an org's token never implies being the org.
_Avoid_: logged-in user

**API token**:
A bearer credential minted per identity from its username. Never expires or
rotates server-side, so local deletion without server revocation leaves it live.
_Avoid_: API key, session

### Play

**Play**:
One spin: a commit's 7-character hash evaluated against the ruleset, paying out
into the balance. Every commit is a play; every play costs the ante.
_Avoid_: spin (the animation, not the event), roll

**Ante**:
The fixed cost (10 points) deducted per play.

**Balance**:
A per-repo running score: starting credit plus payouts minus antes. Local
first; the server's copy wins on sync.

**Sync**:
Sending a play to the server for the leaderboard. Optional, on by default,
and only possible for an authenticated effective identity.

**Privacy mode**:
A per-repo setting that syncs plays with the repository's coordinates
obfuscated. The play still counts; the repo stays unnamed.

**Small mode**:
The single-line output contract used by the post-commit hook. Everything the
CLI prints in small mode must fit that one line — no notices, no warnings.
_Avoid_: quiet mode, compact mode
