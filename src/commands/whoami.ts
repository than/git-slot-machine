import chalk from 'chalk';
import {
  getRepoInfo,
  getGlobalConfig,
  getGitHubUsername,
  getPlayAsUsername,
  getAuthenticatedUsernames,
  isPrivateRepo,
  isSyncEnabled,
} from '../config.js';

const LABEL_WIDTH = 18;

function line(label: string, value: string, indent = 0): void {
  const pad = ' '.repeat(indent);
  console.log(pad + chalk.dim((label + ':').padEnd(LABEL_WIDTH - indent)) + value);
}

export function whoamiCommand(): void {
  try {
    const globalUsername = getGlobalConfig().githubUsername;
    const playAs = getPlayAsUsername();
    const repoInfo = getRepoInfo();
    const tokens = getAuthenticatedUsernames();

    console.log();

    line('Global identity', globalUsername ? chalk.white(globalUsername) : chalk.yellow('not set'));

    if (repoInfo) {
      const repoLabel = isPrivateRepo()
        ? chalk.dim('(private — not sent to server)')
        : chalk.white(`${repoInfo.owner}/${repoInfo.name}`);

      line('This repo', repoLabel);

      const effective = getGitHubUsername();
      const suffix = playAs ? chalk.dim('  (per-repo override)') : chalk.dim('  (global)');
      line('Playing as', (effective ? chalk.white(effective) : chalk.yellow('not set')) + suffix, 2);
      line('Privacy mode', isPrivateRepo() ? chalk.green('on') : chalk.dim('off'), 2);
    }

    console.log();
    line('Tokens held', tokens.length > 0 ? chalk.white(tokens.join(', ')) : chalk.yellow('none'));
    line('Sync', isSyncEnabled() ? chalk.green('enabled') : chalk.yellow('disabled'));
    console.log();
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
