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
