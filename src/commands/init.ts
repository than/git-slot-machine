import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { isGitRepo } from '../utils/git';
import { POST_COMMIT_HOOK } from '../templates/post-commit';
import { getRepoInfo, setGitHubUsername, getGitHubUsername } from '../config';

async function isRepoPublic(owner: string, repo: string): Promise<boolean | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (response.ok) {
      const data = await response.json() as { private: boolean };
      return data.private === false;
    }

    // 404 could mean private or doesn't exist
    return null;
  } catch (error) {
    // Network error or API unavailable
    return null;
  }
}

export async function initCommand(): Promise<void> {
  // Check if git repo
  if (!isGitRepo()) {
    console.error(chalk.red('Error: Not a git repository'));
    console.log(chalk.dim('Run this command from the root of a git repository'));
    process.exit(1);
  }

  // Extract and save GitHub username from remote URL (do this first)
  const repoInfo = getRepoInfo();

  if (!repoInfo) {
    console.log();
    console.error(chalk.red('Error: No GitHub remote detected'));
    console.log();
    console.log(chalk.yellow('Git Slot Machine requires a public GitHub repository.'));
    console.log();
    console.log(chalk.dim('Add a GitHub remote to this repo:'));
    console.log(chalk.cyan('  git remote add origin https://github.com/username/repo.git'));
    console.log();
    console.log(chalk.dim('This prevents farming points in private/local repos.'));
    console.log(chalk.dim('Your commits must be publicly verifiable.'));
    process.exit(1);
  }

  const existingUsername = getGitHubUsername();
  if (!existingUsername) {
    setGitHubUsername(repoInfo.owner);
    console.log(chalk.dim(`Detected GitHub username: ${repoInfo.owner}`));
  }

  // Check if repository is public
  console.log(chalk.dim('Checking repository visibility...'));
  const isPublic = await isRepoPublic(repoInfo.owner, repoInfo.name);

  if (isPublic === false) {
    console.log();
    console.error(chalk.red('Error: Private repository detected'));
    console.log();
    console.log(chalk.yellow('Git Slot Machine only supports public repositories.'));
    console.log();
    console.log(chalk.dim('Why? Your commit hashes would be visible on the public'));
    console.log(chalk.dim('leaderboard, which could expose information about your'));
    console.log(chalk.dim('private repository.'));
    console.log();
    console.log(chalk.dim('Please use git-slot-machine with a public repository.'));
    process.exit(1);
  }

  if (isPublic === null) {
    console.log(chalk.yellow('⚠️  Could not verify repository visibility'));
    console.log(chalk.dim('Proceeding with installation...'));
  } else {
    console.log(chalk.green('✓ Public repository confirmed'));
  }

  const hookPath = path.join(process.cwd(), '.git', 'hooks', 'post-commit');

  // Check if hook already exists
  if (fs.existsSync(hookPath)) {
    console.log(chalk.yellow('Warning: post-commit hook already exists'));
    console.log(chalk.dim(`Location: ${hookPath}`));

    // TODO: Could add merge logic or backup existing hook
    console.log(chalk.red('Aborting to avoid overwriting existing hook'));
    console.log(chalk.dim('Manually add git-slot-machine to your existing hook'));
    process.exit(1);
  }

  // Write the hook
  fs.writeFileSync(hookPath, POST_COMMIT_HOOK, { mode: 0o755 });

  console.log(chalk.green('✓ Post-commit hook installed'));
  console.log();
  console.log(chalk.cyan('Git Slot Machine is ready!'));
  console.log(chalk.dim('Every commit will now spin the slot machine.'));
  console.log();
  console.log('Try it out:');
  console.log(chalk.dim('  git commit --allow-empty -m "test"'));
  console.log();
  console.log(chalk.cyan('Optional: Sync with the API'));
  console.log(chalk.dim(`  git-slot-machine auth login ${repoInfo?.owner || 'your-github-username'}`));
  console.log();
  console.log(chalk.yellow('What gets sent to the server:'));
  console.log(chalk.dim('  • Commit hash (7 and 40 character versions)'));
  console.log(chalk.dim('  • Repository URL, owner, and name'));
  console.log(chalk.dim('  • GitHub username'));
  console.log(chalk.dim('  • Pattern type, payout, and balance'));
  console.log();
  console.log(chalk.dim('You can disable API sync anytime:'));
  console.log(chalk.dim('  git-slot-machine config set sync-enabled false'));
}
