import { execSync } from 'child_process';

export function getCurrentCommitHash(): string {
  try {
    const fullHash = execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();

    return fullHash.substring(0, 7);
  } catch (error) {
    throw new Error('Not a git repository or no commits yet');
  }
}

export function getCurrentCommitFullHash(): string {
  try {
    const fullHash = execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();

    return fullHash;
  } catch (error) {
    throw new Error('Not a git repository or no commits yet');
  }
}

export function isGitRepo(): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return true;
  } catch {
    return false;
  }
}

export function detectGitHubUsername(): string | null {
  // Try 1: Check GitHub CLI (gh)
  try {
    const ghUser = execSync('gh api user --jq .login', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();

    if (ghUser) {
      return ghUser;
    }
  } catch {
    // gh not installed or not authenticated, continue to next method
  }

  // Try 2: Check git config github.user
  try {
    const githubUser = execSync('git config github.user', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();

    if (githubUser) {
      return githubUser;
    }
  } catch {
    // github.user not set, continue to next method
  }

  // Try 3: Extract from GitHub noreply email
  try {
    const email = execSync('git config user.email', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();

    // Match patterns like:
    // - username@users.noreply.github.com
    // - 12345+username@users.noreply.github.com (with ID prefix)
    const match = email.match(/^(?:\d+\+)?(.+)@users\.noreply\.github\.com$/);
    if (match) {
      return match[1];
    }
  } catch {
    // user.email not set or no match
  }

  return null;
}
