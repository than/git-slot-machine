import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

interface Config {
  githubUsername?: string;
  apiUrl?: string;
  apiTokens?: Record<string, string>; // github username -> API token
  apiToken?: string; // Legacy single token, migrated into apiTokens on read
  syncEnabled?: boolean;
  privateRepo?: boolean;
  playAsUsername?: string; // Legacy pre-3.2 repo override, migrated into githubUsername on read
}

// Which config file a setting is written to. Reads never take a scope: every
// key resolves through getConfig(), where repo already overrides global.
export type Scope = 'global' | 'repo';

// Get repo-specific config path
function getRepoConfigPath(): string {
  return path.join(process.cwd(), '.git', 'slot-machine-config.json');
}

// Get global config path
function getGlobalConfigPath(): string {
  const homeDir = os.homedir();
  const configDir = path.join(homeDir, '.git-slot-machine');

  // Owner-only: it holds bearer tokens
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
  }

  return path.join(configDir, 'config.json');
}

// Get merged config (repo-specific overrides global)
export function getConfig(): Config {
  const globalConfig = getGlobalConfig();
  const repoConfig = getRepoConfig();

  return { ...globalConfig, ...repoConfig };
}

// Get only repo-specific config
export function getRepoConfig(): Config {
  const configPath = getRepoConfigPath();

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return migrateRepoIdentity(JSON.parse(content));
  } catch {
    return {};
  }
}

// Normalize a pre-3.2 repo config on read: `playAsUsername` and
// `githubUsername` were the same concept under two names, and only the repo
// file ever held the former. Collapsing them is what lets the merged config
// resolve identity like every other key. Same shape as migrateLegacyToken:
// idempotent, no-op fast path, and the write-back is best-effort.
function migrateRepoIdentity(config: Config): Config {
  if (!config.playAsUsername) {
    return config;
  }

  const migrated: Config = { ...config };
  // An explicit repo `githubUsername` wins — it's the 3.2 key, so it was
  // written later and by a caller that knew about the collapse. Either way
  // the legacy key goes: nothing reads it after this release.
  migrated.githubUsername ??= config.playAsUsername;
  delete migrated.playAsUsername;

  // A failed write (read-only checkout, ENOSPC) must not cost the caller its
  // identity for this run — the in-memory migration still stands.
  try {
    saveRepoConfig(migrated);
  } catch {
    // couldn't persist; retry on next read
  }

  return migrated;
}

// Get only global config
export function getGlobalConfig(): Config {
  const configPath = getGlobalConfigPath();

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return migrateLegacyToken(JSON.parse(content));
  } catch {
    return {};
  }
}

// Normalize a pre-3.1.1 config on read: move the single legacy `apiToken`
// under the username it belongs to, and lowercase existing `apiTokens` keys —
// 3.1.0 stored them with whatever casing the user typed, and every lookup is
// lowercased now, so a `Broomfitters` key would otherwise silently miss.
// Idempotent, and a no-op when there's nothing to normalize.
function migrateLegacyToken(config: Config): Config {
  const owner = config.githubUsername?.toLowerCase();

  const apiTokens: Record<string, string> = {};
  for (const [key, value] of Object.entries(config.apiTokens || {})) {
    // First writer wins on a casing collision, matching pre-3.1.1 lookups
    apiTokens[key.toLowerCase()] ??= value;
  }

  // Keep whichever token is already attributed; either way the legacy
  // field has served its purpose and must not linger in the file.
  if (config.apiToken && owner && !apiTokens[owner]) {
    apiTokens[owner] = config.apiToken;
  }

  const keysChanged =
    Object.keys(apiTokens).length !== Object.keys(config.apiTokens || {}).length ||
    Object.keys(config.apiTokens || {}).some((key) => key !== key.toLowerCase());

  // Without an owner the legacy token stays where it is (see below), so an
  // unattributable config with clean keys has nothing to migrate — and must
  // not trigger a write-back on every read.
  if (!keysChanged && !(config.apiToken && owner)) {
    return config;
  }

  const migrated: Config = { ...config };
  if (Object.keys(apiTokens).length > 0 || config.apiTokens) {
    migrated.apiTokens = apiTokens;
  }
  // Only drop the legacy field once it's re-homed (or a confirmed duplicate of
  // an attributed token). With no owner to attribute it to, deleting it would
  // destroy the config's only credential; leave it for a future read to place.
  if (owner) {
    delete migrated.apiToken;
  }

  // Persisting is desirable, not load-bearing: a failed write (read-only
  // $HOME, ENOSPC) must not turn a valid on-disk config into `{}` for the
  // caller — the in-memory migration still stands for this run.
  try {
    saveGlobalConfig(migrated);
  } catch {
    // couldn't persist; retry on next read
  }

  return migrated;
}

// Save repo-specific config
export function saveRepoConfig(config: Config): void {
  const configPath = getRepoConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Is there a .git here to write a repo config into? Repo scope is the default
// for sync and privacy now, so the answer has to be a message rather than a
// raw ENOENT out of saveRepoConfig.
export function hasRepoConfigTarget(): boolean {
  return fs.existsSync(path.dirname(getRepoConfigPath()));
}

// Save global config — 0600 because it holds every identity's bearer token.
// mode is ignored on existing files, so the chmod self-heals configs written
// by pre-3.1 binaries or drifted since; best-effort because chmod can throw
// on Windows, bind mounts, and some CI volumes.
export function saveGlobalConfig(config: Config): void {
  const configPath = getGlobalConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
  // Modes only change on writes, so self-healing here (not on the read path)
  // keeps the post-commit hook free of ~8 chmod syscalls per play — which are
  // network round trips on an NFS/SMB home directory.
  try {
    fs.chmodSync(configPath, 0o600);
    fs.chmodSync(path.dirname(configPath), 0o700);
  } catch {
    // best effort
  }
}

// One key, resolved through the merge like everything else: a repo
// githubUsername overrides the global one because getConfig() spreads repo
// last. No special case — that resolver was the pre-3.2 shape problem.
export function getGitHubUsername(): string | null {
  return getConfig().githubUsername || null;
}

export function setGitHubUsername(username: string, scope: Scope = 'global'): void {
  setValue('githubUsername', username, scope);
}

// The one write path for scoped settings. Reuses the existing load/save pairs
// so there is no second IO route to keep in step.
function setValue<K extends keyof Config>(key: K, value: Config[K], scope: Scope): void {
  if (scope === 'global') {
    const config = getGlobalConfig();
    config[key] = value;
    saveGlobalConfig(config);
  } else {
    const config = getRepoConfig();
    config[key] = value;
    saveRepoConfig(config);
  }
}

// Global-only, like getApiToken: getHeaders() attaches the bearer token to
// whatever host this names, so honoring a repo-local apiUrl would let anything
// that can write .git/slot-machine-config.json redirect syncs — token attached
// — to its own server.
export function getApiUrl(): string {
  const config = getGlobalConfig();
  return config.apiUrl || process.env.GIT_SLOT_MACHINE_API_URL || 'https://gitslotmachine.com/api';
}

// Global-only, and it stays out of the scope model: getApiUrl reads global
// only for the reason above, so a repo-scoped apiUrl would be a setting that
// silently does nothing. The command layer rejects --repo rather than write one.
export function setApiUrl(url: string): void {
  setValue('apiUrl', url, 'global');
}

// Token for the identity in play here: the per-repo override if set,
// otherwise the global username. Never hands one identity another's token.
// Keys are lowercased on write and lookup: GitHub usernames are
// case-insensitive, so `login Netflix` must find a token stored as netflix.
export function getApiToken(): string | null {
  const config = getGlobalConfig();
  const username = getGitHubUsername();

  if (!username) {
    return null;
  }

  return config.apiTokens?.[username.toLowerCase()] || null;
}

// A specific identity's token, for operations that act on every held identity
// (logout --all revokes each one). Same lowercased keying as getApiToken.
export function getApiTokenFor(username: string): string | null {
  const config = getGlobalConfig();

  return config.apiTokens?.[username.toLowerCase()] || null;
}

export function setApiToken(token: string, username: string): void {
  const config = getGlobalConfig();
  config.apiTokens = { ...config.apiTokens, [username.toLowerCase()]: token };
  saveGlobalConfig(config);
}

export function clearApiToken(username?: string): void {
  const config = getGlobalConfig();
  const target = (username || getGitHubUsername())?.toLowerCase();

  if (target && config.apiTokens) {
    delete config.apiTokens[target];
  }

  // Only when the target IS the global identity: with no resolvable target
  // this would otherwise delete the unattributable legacy token that
  // migrateLegacyToken deliberately preserves.
  if (target && target === config.githubUsername?.toLowerCase()) {
    delete config.apiToken;
  }

  saveGlobalConfig(config);
}

// No legacy-apiToken branch: migrateLegacyToken runs on every read, so by
// here an attributable legacy token is already in apiTokens (in memory even
// when the write-back failed), and an unattributable one belongs to no one.
export function getAuthenticatedUsernames(): string[] {
  const config = getGlobalConfig();

  return Object.keys(config.apiTokens || {}).sort();
}

export function isSyncEnabled(): boolean {
  const config = getConfig();
  return config.syncEnabled !== false; // Default to true
}

// Repo by default: `sync:disable` reads as "stop syncing this repo", and
// before 3.2 it silenced every repo at once. --global restores that.
export function setSyncEnabled(enabled: boolean, scope: Scope = 'repo'): void {
  setValue('syncEnabled', enabled, scope);
}

// Merged, not repo-only: a global `privateRepo: true` means "default all my
// repos to private". No existing config sets it globally, so this is a no-op
// on upgrade.
export function isPrivateRepo(): boolean {
  return getConfig().privateRepo === true;
}

export function setPrivateRepo(isPrivate: boolean, scope: Scope = 'repo'): void {
  setValue('privateRepo', isPrivate, scope);
}

// Identity is one key now, so the per-repo override is just a repo-scoped
// githubUsername. These two names survive because init and whoami care about
// the distinction between "overridden here" and "inherited from global".
export function setPlayAsUsername(username: string): void {
  setValue('githubUsername', username, 'repo');
}

// Choosing personal credit must remove an existing override, not just skip
// writing one — the override survives re-runs of init otherwise. Both keys go:
// a repo config written by 3.1.x can still hold the legacy one if this runs
// before migrateRepoIdentity has managed to persist.
export function clearPlayAsUsername(): void {
  const config = getRepoConfig();
  delete config.githubUsername;
  delete config.playAsUsername;
  saveRepoConfig(config);
}

export function getPlayAsUsername(): string | null {
  return getRepoConfig().githubUsername || null;
}

export interface RepoInfo {
  owner: string;
  name: string;
  url: string;
}

// The real remote, privacy mode or not. Only for local decisions that never
// reach the server — asking who to credit, checking visibility on GitHub.
// Anything sent to the API must go through getRepoInfo().
export function getRemoteRepoInfo(): RepoInfo | null {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();

    // Parse GitHub URL (supports both HTTPS and SSH)
    const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);

    if (!match) {
      return null;
    }

    const owner = match[1];
    const name = match[2];

    return {
      owner,
      name,
      url: `https://github.com/${owner}/${name}`,
    };
  } catch {
    return null;
  }
}

export function getRepoInfo(): RepoInfo | null {
  const info = getRemoteRepoInfo();

  if (!info) {
    return null;
  }

  // If privacy mode is enabled, return obfuscated info
  if (isPrivateRepo()) {
    return { owner: 'private', name: 'private', url: 'private' };
  }

  return info;
}
