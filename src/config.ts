import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

interface Config {
  githubUsername?: string;
  playAsUsername?: string; // Per-repo override: play as this username instead
  apiUrl?: string;
  apiTokens?: Record<string, string>; // github username -> API token
  apiToken?: string; // Legacy single token, migrated into apiTokens on read
  syncEnabled?: boolean;
  privateRepo?: boolean;
}

// Get repo-specific config path
function getRepoConfigPath(): string {
  return path.join(process.cwd(), '.git', 'slot-machine-config.json');
}

// Get global config path
function getGlobalConfigPath(): string {
  const homeDir = os.homedir();
  const configDir = path.join(homeDir, '.git-slot-machine');

  // Ensure config directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
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
    return JSON.parse(content);
  } catch {
    return {};
  }
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

// Move a pre-3.1 single `apiToken` under the username it belongs to.
// Idempotent, and a no-op when we can't attribute the token to anyone.
function migrateLegacyToken(config: Config): Config {
  const owner = config.githubUsername;

  if (!config.apiToken || !owner) {
    return config;
  }

  const apiTokens = { ...config.apiTokens };

  if (apiTokens[owner]) {
    return config;
  }

  apiTokens[owner] = config.apiToken;

  const migrated: Config = { ...config, apiTokens };
  delete migrated.apiToken;

  saveGlobalConfig(migrated);

  return migrated;
}

// Save repo-specific config
export function saveRepoConfig(config: Config): void {
  const configPath = getRepoConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Save global config
export function saveGlobalConfig(config: Config): void {
  const configPath = getGlobalConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function getGitHubUsername(): string | null {
  const config = getConfig();
  // Check for per-repo override first, then fall back to global username
  return config.playAsUsername || config.githubUsername || null;
}

export function setGitHubUsername(username: string): void {
  const config = getGlobalConfig();
  config.githubUsername = username;
  saveGlobalConfig(config);
}

export function getApiUrl(): string {
  const config = getConfig();
  return config.apiUrl || process.env.GIT_SLOT_MACHINE_API_URL || 'https://gitslotmachine.com/api';
}

export function setApiUrl(url: string): void {
  const config = getGlobalConfig();
  config.apiUrl = url;
  saveGlobalConfig(config);
}

// Token for the identity in play here: the per-repo override if set,
// otherwise the global username. Never hands one identity another's token.
export function getApiToken(): string | null {
  const config = getGlobalConfig();
  const username = getGitHubUsername();

  if (!username) {
    return null;
  }

  const token = config.apiTokens?.[username];

  if (token) {
    return token;
  }

  // Unattributable legacy token: only usable by the global identity
  if (config.apiToken && username === config.githubUsername) {
    return config.apiToken;
  }

  return null;
}

export function setApiToken(token: string, username: string): void {
  const config = getGlobalConfig();
  config.apiTokens = { ...config.apiTokens, [username]: token };
  saveGlobalConfig(config);
}

export function clearApiToken(username?: string): void {
  const config = getGlobalConfig();
  const target = username || getGitHubUsername();

  if (target && config.apiTokens) {
    delete config.apiTokens[target];
  }

  if (!target || target === config.githubUsername) {
    delete config.apiToken;
  }

  saveGlobalConfig(config);
}

export function clearAllApiTokens(): void {
  const config = getGlobalConfig();
  delete config.apiTokens;
  delete config.apiToken;
  saveGlobalConfig(config);
}

export function getAuthenticatedUsernames(): string[] {
  const config = getGlobalConfig();
  const usernames = new Set(Object.keys(config.apiTokens || {}));

  if (config.apiToken && config.githubUsername) {
    usernames.add(config.githubUsername);
  }

  return [...usernames].sort();
}

export function isSyncEnabled(): boolean {
  const config = getConfig();
  return config.syncEnabled !== false; // Default to true
}

export function setSyncEnabled(enabled: boolean): void {
  const config = getGlobalConfig();
  config.syncEnabled = enabled;
  saveGlobalConfig(config);
}

export function isPrivateRepo(): boolean {
  const config = getRepoConfig();
  return config.privateRepo === true;
}

export function setPrivateRepo(isPrivate: boolean): void {
  const config = getRepoConfig();
  config.privateRepo = isPrivate;
  saveRepoConfig(config);
}

export function setPlayAsUsername(username: string): void {
  const config = getRepoConfig();
  config.playAsUsername = username;
  saveRepoConfig(config);
}

export function getPlayAsUsername(): string | null {
  const config = getRepoConfig();
  return config.playAsUsername || null;
}

export function getRepoInfo(): { owner: string; name: string; url: string } | null {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();

    // Parse GitHub URL (supports both HTTPS and SSH)
    const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);

    if (match) {
      const owner = match[1];
      const name = match[2];

      // If privacy mode is enabled, return obfuscated info
      if (isPrivateRepo()) {
        return {
          owner: 'private',
          name: 'private',
          url: 'private',
        };
      }

      return {
        owner,
        name,
        url: `https://github.com/${owner}/${name}`,
      };
    }

    return null;
  } catch {
    return null;
  }
}
