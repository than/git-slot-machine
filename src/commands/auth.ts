import chalk from 'chalk';
import { createToken, logout as apiLogout, verifyToken } from '../api';
import { setApiToken, clearApiToken, getApiToken, getApiUrl, setGitHubUsername } from '../config';

export async function authLoginCommand(githubUsername: string): Promise<void> {
  try {
    console.log(chalk.dim(`Generating token for ${githubUsername}...`));

    // Generate token from GitHub username
    const token = await createToken(githubUsername);

    if (!token) {
      console.error(chalk.red('Failed to generate token. Please check your GitHub username.'));
      process.exit(1);
    }

    // Save token and username
    setApiToken(token);
    setGitHubUsername(githubUsername);

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
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

export async function authLogoutCommand(): Promise<void> {
  try {
    const token = getApiToken();

    if (!token) {
      console.log(chalk.yellow('Not currently authenticated.'));
      return;
    }

    // Try to revoke token on server
    await apiLogout();

    // Clear local token
    clearApiToken();

    console.log(chalk.green('Successfully logged out.'));
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

export async function authStatusCommand(): Promise<void> {
  try {
    const token = getApiToken();
    const apiUrl = getApiUrl();

    if (!token) {
      console.log(chalk.yellow('Not authenticated.'));
      console.log(chalk.dim(`API URL: ${apiUrl}`));
      console.log();
      console.log('To authenticate, run:');
      console.log(chalk.cyan('  git-slot-machine auth login <your-github-username>'));
      return;
    }

    // Verify token is still valid
    const isValid = await verifyToken(token);

    if (isValid) {
      console.log(chalk.green('Authenticated'));
      console.log(chalk.dim(`API URL: ${apiUrl}`));
      console.log(chalk.dim(`Token: ${token.substring(0, 10)}...`));
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
