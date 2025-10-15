import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

interface Config {
  githubUsername?: string;
  apiUrl?: string;
  apiToken?: string;
  syncEnabled?: boolean;
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
    return JSON.parse(content);
  } catch {
    return {};
  }
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
  return config.githubUsername || null;
}

export function setGitHubUsername(username: string): void {
  const config = getRepoConfig();
  config.githubUsername = username;
  saveRepoConfig(config);
}

export function getApiUrl(): string {
  const config = getConfig();
  return config.apiUrl || process.env.GIT_SLOT_MACHINE_API_URL || 'https://gitslotmachinecom-main-vilmm1.laravel.cloud/api';
}

export function setApiUrl(url: string): void {
  const config = getGlobalConfig();
  config.apiUrl = url;
  saveGlobalConfig(config);
}

export function getApiToken(): string | null {
  const config = getConfig();
  return config.apiToken || null;
}

export function setApiToken(token: string): void {
  const config = getGlobalConfig();
  config.apiToken = token;
  saveGlobalConfig(config);
}

export function clearApiToken(): void {
  const config = getGlobalConfig();
  delete config.apiToken;
  saveGlobalConfig(config);
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

export function getRepoInfo(): { owner: string; name: string; url: string } | null {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();

    // Parse GitHub URL (supports both HTTPS and SSH)
    const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);

    if (match) {
      const owner = match[1];
      const name = match[2];
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
