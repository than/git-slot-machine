import chalk from 'chalk';
import {
  getRepoInfo,
  getGlobalConfig,
  getRepoConfig,
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

// Which file owns a setting, and what the other file says if it disagrees.
// The whole point of 3.2 is that either scope can hold any key, so "on" alone
// no longer tells you which JSON to edit.
function scopeNote(repoValue: unknown, globalValue: unknown, globalLabel: string): string {
  if (repoValue === undefined) {
    return globalValue === undefined ? chalk.dim('  (default)') : chalk.dim('  (global)');
  }

  return globalValue === undefined
    ? chalk.dim('  (per-repo)')
    : chalk.dim(`  (per-repo, global is ${globalLabel})`);
}

export function whoamiCommand(): void {
  try {
    const globalConfig = getGlobalConfig();
    const repoConfig = getRepoConfig();
    const playAs = getPlayAsUsername();
    const repoInfo = getRepoInfo();
    const tokens = getAuthenticatedUsernames();

    console.log();

    line(
      'Global identity',
      globalConfig.githubUsername ? chalk.white(globalConfig.githubUsername) : chalk.yellow('not set')
    );

    if (repoInfo) {
      const repoLabel = isPrivateRepo()
        ? chalk.dim('(private — not sent to server)')
        : chalk.white(`${repoInfo.owner}/${repoInfo.name}`);

      line('This repo', repoLabel);
    }

    // A repo-scoped githubUsername lives in .git/ and applies whether or not a
    // GitHub remote parses — an override must never be hidden by a missing remote.
    if (repoInfo || playAs) {
      const effective = getGitHubUsername();
      const suffix = playAs ? chalk.dim('  (per-repo override)') : chalk.dim('  (global)');
      line('Playing as', (effective ? chalk.white(effective) : chalk.yellow('not set')) + suffix, 2);
      line(
        'Privacy mode',
        (isPrivateRepo() ? chalk.green('on') : chalk.dim('off')) +
          scopeNote(repoConfig.privateRepo, globalConfig.privateRepo, globalConfig.privateRepo ? 'on' : 'off'),
        2
      );
      line(
        'Sync',
        (isSyncEnabled() ? chalk.green('enabled') : chalk.yellow('disabled')) +
          scopeNote(
            repoConfig.syncEnabled,
            globalConfig.syncEnabled,
            globalConfig.syncEnabled === false ? 'disabled' : 'enabled'
          ),
        2
      );
    } else {
      line('Sync', isSyncEnabled() ? chalk.green('enabled') : chalk.yellow('disabled'));
    }

    console.log();
    line('Tokens held', tokens.length > 0 ? chalk.white(tokens.join(', ')) : chalk.yellow('none'));
    console.log();
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
