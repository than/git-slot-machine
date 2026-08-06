import chalk from 'chalk';
import { createToken, logout as apiLogout, verifyToken } from '../api.js';
import {
  setApiToken,
  clearApiToken,
  clearAllApiTokens,
  getApiToken,
  getApiUrl,
  setGitHubUsername,
  getGitHubUsername,
  getAuthenticatedUsernames,
} from '../config.js';

// Throws on failure — the caller owns the exit code. init relies on this to
// carry on locally when an org token can't be minted; the top-level CLI action
// prints and exits instead.
export async function authLoginCommand(
  githubUsername: string,
  persistGlobalUsername: boolean = true
): Promise<void> {
  console.log(chalk.dim(`Generating token for ${githubUsername}...`));

  // Generate token from GitHub username
  const token = await createToken(githubUsername);

  if (!token) {
    throw new Error(`Failed to generate token for ${githubUsername}. Please check the GitHub username.`);
  }

  // Save token under its own identity; only overwrite the global
  // username for a real personal login
  setApiToken(token, githubUsername);
  if (persistGlobalUsername) {
    setGitHubUsername(githubUsername);
  }

  console.log(chalk.green('Successfully authenticated!'));
  console.log(chalk.dim(`Token saved. API URL: ${getApiUrl()}`));
  console.log(chalk.dim(`GitHub Username: ${githubUsername}`));
  console.log();
  console.log(chalk.yellow('Data sent to server on each commit:'));
  console.log(chalk.dim('  • Commit hash (7 and 40 character versions)'));
  console.log(chalk.dim('  • Repository URL, owner, and name'));
  console.log(chalk.dim('  • GitHub username'));
  console.log(chalk.dim('  • Pattern type, payout, and balance'));
  console.log();
  console.log(chalk.dim('To disable sync: git-slot-machine config set sync-enabled false'));
}

export async function authLogoutCommand(options: { all?: boolean } = {}): Promise<void> {
  try {
    if (options.all) {
      const identities = getAuthenticatedUsernames();

      if (identities.length === 0) {
        console.log(chalk.yellow('No identities are authenticated.'));
        return;
      }

      // Revoke the active identity's token on the server; the rest are
      // cleared locally (revocation needs each token to be the active one).
      await apiLogout();
      clearAllApiTokens();

      console.log(chalk.green(`Logged out all identities: ${identities.join(', ')}`));
      return;
    }

    const token = getApiToken();
    const username = getGitHubUsername();

    if (!token) {
      console.log(chalk.yellow('Not currently authenticated.'));
      return;
    }

    // Try to revoke token on server
    await apiLogout();

    // Clear local token for this identity only
    clearApiToken();

    console.log(chalk.green(`Successfully logged out${username ? ` as ${username}` : ''}.`));

    const remaining = getAuthenticatedUsernames();
    if (remaining.length > 0) {
      console.log(chalk.dim(`Still authenticated as: ${remaining.join(', ')}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

export async function authStatusCommand(): Promise<void> {
  try {
    const token = getApiToken();
    const apiUrl = getApiUrl();
    const username = getGitHubUsername();
    const authenticated = getAuthenticatedUsernames();

    if (!token) {
      console.log(chalk.yellow(`Not authenticated${username ? ` as ${username}` : ''}.`));
      console.log(chalk.dim(`API URL: ${apiUrl}`));
      if (authenticated.length > 0) {
        console.log(chalk.dim(`Tokens held for: ${authenticated.join(', ')}`));
      }
      console.log();
      console.log('To authenticate, run:');
      console.log(chalk.cyan(`  git-slot-machine auth login ${username || '<your-github-username>'}`));
      return;
    }

    // Verify token is still valid
    const isValid = await verifyToken(token);

    if (isValid) {
      console.log(chalk.green(`Authenticated as ${username}`));
      console.log(chalk.dim(`API URL: ${apiUrl}`));
      console.log(chalk.dim(`Token: ${token.substring(0, 10)}...`));
      if (authenticated.length > 1) {
        console.log(chalk.dim(`Tokens held for: ${authenticated.join(', ')}`));
      }
    } else {
      console.log(chalk.red('Authentication expired or invalid.'));
      console.log(chalk.dim(`API URL: ${apiUrl}`));
      console.log();
      console.log('Please login again:');
      console.log(chalk.cyan('  git-slot-machine auth login <your-github-username>'));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
