import chalk from 'chalk';
import { createToken, logout as apiLogout, verifyToken } from '../api.js';
import {
  setApiToken,
  clearApiToken,
  getApiToken,
  getApiTokenFor,
  getApiUrl,
  setGitHubUsername,
  getGitHubUsername,
  getPlayAsUsername,
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
  const previous = getApiTokenFor(githubUsername);
  setApiToken(token, githubUsername);
  if (persistGlobalUsername) {
    setGitHubUsername(githubUsername);
  }

  // Best-effort revocation of the token this one replaces — tokens never
  // expire server-side, so overwriting without revoking leaves the old one
  // live forever. Never fail the login over it. Safe with the fresh token:
  // the server's DELETE /auth/token is currentAccessToken()->delete()
  // (AuthController), so only the presented bearer dies.
  if (previous && previous !== token) {
    await apiLogout(previous);
  }

  console.log(chalk.green('Successfully authenticated!'));
  console.log(chalk.dim(`Token saved. API URL: ${getApiUrl()}`));
  console.log(chalk.dim(`GitHub Username: ${githubUsername}`));

  // A token alone changes nothing about who gets credit. When this login
  // didn't adopt the name globally AND no repo override credits it, say so —
  // the token would otherwise sit unused behind a success message.
  if (!persistGlobalUsername) {
    const playAs = getPlayAsUsername();
    const creditsThisName = playAs?.toLowerCase() === githubUsername.toLowerCase();
    if (!creditsThisName) {
      const effective = getGitHubUsername();
      console.log();
      console.log(chalk.yellow(`Note: this repo still credits plays to ${effective}.`));
      console.log(chalk.dim(`  git-slot-machine init            # credit this repo to ${githubUsername}`));
      console.log(chalk.dim(`  git-slot-machine username:set    # change your global identity`));
    }
  }
  console.log();
  console.log(chalk.yellow('Data sent to server on each commit:'));
  console.log(chalk.dim('  • Commit hash (7 and 40 character versions)'));
  console.log(chalk.dim('  • Repository URL, owner, and name'));
  console.log(chalk.dim('  • GitHub username'));
  console.log(chalk.dim('  • Pattern type, payout, and balance'));
  console.log();
  console.log(chalk.dim('To disable sync: git-slot-machine sync:disable'));
}

export async function authLogoutCommand(options: { all?: boolean; force?: boolean } = {}): Promise<void> {
  try {
    if (options.all) {
      const identities = getAuthenticatedUsernames();

      if (identities.length === 0) {
        console.log(chalk.yellow('No identities are authenticated.'));
        return;
      }

      // Revoke every held token server-side; clear locally ONLY the ones that
      // revoked. Deleting a local token whose server copy is still live would
      // discard the one credential that can finish the job — tokens never
      // expire or rotate server-side. --force is the escape hatch for tokens
      // the server permanently rejects (already revoked from the web, user
      // deleted): a rejection is indistinguishable from an unreachable server
      // here, so without it those identities could never be cleared.
      const revokedIdentities: string[] = [];
      const unrevoked: string[] = [];
      for (const identity of identities) {
        const token = getApiTokenFor(identity);
        if (token && (await apiLogout(token))) {
          clearApiToken(identity);
          revokedIdentities.push(identity);
        } else if (options.force) {
          clearApiToken(identity);
          revokedIdentities.push(identity);
        } else {
          unrevoked.push(identity);
        }
      }

      if (revokedIdentities.length > 0) {
        const suffix = options.force ? '' : ' (revoked on the server)';
        console.log(chalk.green(`Logged out: ${revokedIdentities.join(', ')}${suffix}.`));
      }
      if (unrevoked.length > 0) {
        console.log(chalk.yellow(`Could not revoke: ${unrevoked.join(', ')} — their tokens are kept locally so you can re-run logout --all when the server is reachable.`));
        console.log(chalk.dim('If a token was already revoked elsewhere, logout --all --force clears it locally anyway.'));
      }
      return;
    }

    const token = getApiToken();
    const username = getGitHubUsername();

    if (!token) {
      console.log(chalk.yellow('Not currently authenticated.'));
      return;
    }

    // Try to revoke token on server. Same rule as --all: a token we couldn't
    // revoke is kept (it's the only credential that can finish the job),
    // and --force is the escape hatch for tokens the server already rejects.
    const revoked = await apiLogout();

    if (!revoked && !options.force) {
      console.log(chalk.yellow('The token could not be revoked server-side and was kept locally — re-run when the server is reachable.'));
      console.log(chalk.dim('If it was already revoked elsewhere, logout --force clears it locally anyway.'));
      return;
    }

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
      console.log(chalk.cyan(`  git-slot-machine login ${username || '<your-github-username>'}`));
      return;
    }

    // Verify token is still valid
    const isValid = await verifyToken(token);

    if (isValid) {
      console.log(chalk.green(`Authenticated as ${username}`));
      console.log(chalk.dim(`API URL: ${apiUrl}`));
      console.log(chalk.dim(`Token: ${token.substring(0, 10)}...`));
      if (authenticated.length > 0) {
        console.log(chalk.dim(`Tokens held for: ${authenticated.join(', ')}`));
      }
    } else {
      console.log(chalk.red('Authentication expired or invalid.'));
      console.log(chalk.dim(`API URL: ${apiUrl}`));
      console.log();
      console.log('Please login again:');
      console.log(chalk.cyan('  git-slot-machine login <your-github-username>'));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
