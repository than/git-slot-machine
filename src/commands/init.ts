import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import chalk from 'chalk';
import { isGitRepo } from '../utils/git';
import { POST_COMMIT_HOOK } from '../templates/post-commit';
import { getRepoInfo, setGitHubUsername, getGitHubUsername, setPrivateRepo } from '../config';

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

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
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
    console.log(chalk.yellow('Git Slot Machine requires a GitHub repository.'));
    console.log();
    console.log(chalk.dim('Add a GitHub remote to this repo:'));
    console.log(chalk.cyan('  git remote add origin https://github.com/username/repo.git'));
    console.log();
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

  let usePrivacyMode = false;

  if (isPublic === false) {
    console.log(chalk.yellow('⚠️  Private repository detected'));
    console.log();
    console.log(chalk.cyan('Privacy Mode Available'));
    console.log(chalk.dim('You can still use Git Slot Machine with privacy mode enabled.'));
    console.log();
    console.log(chalk.yellow('What happens in privacy mode:'));
    console.log(chalk.dim('  • Repository name/org are NOT stored on the server'));
    console.log(chalk.dim('  • Sent as "private/private" to the API'));
    console.log(chalk.dim('  • Displayed as "*******/*******" on leaderboard'));
    console.log(chalk.dim('  • Your GitHub username is still public'));
    console.log(chalk.dim('  • All private repos share one balance'));
    console.log();

    const answer = await askQuestion(chalk.green('Enable privacy mode? (y/n): '));

    if (answer === 'y' || answer === 'yes') {
      usePrivacyMode = true;
      setPrivateRepo(true);
      console.log(chalk.green('✓ Privacy mode enabled'));
      console.log(chalk.dim('Repository details will never be sent to the server.'));
    } else {
      console.log();
      console.log(chalk.red('Cannot proceed without privacy mode for private repos.'));
      console.log(chalk.dim('Please make the repository public or enable privacy mode.'));
      process.exit(1);
    }
  } else if (isPublic === null) {
    console.log(chalk.yellow('⚠️  Could not verify repository visibility'));
    console.log();

    const answer = await askQuestion(chalk.green('Is this a private repository? (y/n): '));

    if (answer === 'y' || answer === 'yes') {
      usePrivacyMode = true;
      setPrivateRepo(true);
      console.log(chalk.green('✓ Privacy mode enabled'));
      console.log(chalk.dim('Repository details will never be sent to the server.'));
    } else {
      console.log(chalk.dim('Proceeding with public repository mode...'));
    }
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
