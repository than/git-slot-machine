import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface BalanceData {
  repos: Record<string, {
    balance: number;
    totalCommits: number;
    totalWinnings: number;
    biggestWin: number;
    lastCommit: string;
  }>;
}

const BALANCE_FILE = path.join(os.homedir(), '.git-slot-machine-balance.json');

function getRepoPath(): string | null {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch {
    // Not in a git repo - use global balance instead
    return null;
  }
}

function loadBalance(): BalanceData {
  if (!fs.existsSync(BALANCE_FILE)) {
    return { repos: {} };
  }

  const data = fs.readFileSync(BALANCE_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveBalance(data: BalanceData): void {
  fs.writeFileSync(BALANCE_FILE, JSON.stringify(data, null, 2));
}

export function getBalance(): number {
  const repoPath = getRepoPath() || 'global';
  const data = loadBalance();

  if (!data.repos[repoPath]) {
    // Initialize new repo
    data.repos[repoPath] = {
      balance: 100,
      totalCommits: 0,
      totalWinnings: 0,
      biggestWin: 0,
      lastCommit: ''
    };
    saveBalance(data);
  }

  return data.repos[repoPath].balance;
}

export function updateBalance(hash: string, payout: number): number {
  const repoPath = getRepoPath() || 'global';
  const data = loadBalance();

  if (!data.repos[repoPath]) {
    data.repos[repoPath] = {
      balance: 100,
      totalCommits: 0,
      totalWinnings: 0,
      biggestWin: 0,
      lastCommit: ''
    };
  }

  const repo = data.repos[repoPath];

  // Deduct cost
  repo.balance -= 10;
  repo.totalCommits += 1;

  // Add winnings
  if (payout > 0) {
    repo.balance += payout;
    repo.totalWinnings += payout;
    repo.biggestWin = Math.max(repo.biggestWin, payout);
  }

  repo.lastCommit = hash;

  saveBalance(data);
  return repo.balance;
}

export function getRepoStats() {
  const repoPath = getRepoPath() || 'global';
  const data = loadBalance();
  return data.repos[repoPath] || null;
}
