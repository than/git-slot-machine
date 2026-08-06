#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { playCommand } from './commands/play.js';
import { spinCommand } from './commands/spin.js';
import { initCommand } from './commands/init.js';
import { balanceCommand } from './commands/balance.js';
import { testCommand } from './commands/test.js';
import { authLoginCommand, authLogoutCommand, authStatusCommand } from './commands/auth.js';
import { syncCommand } from './commands/sync.js';
import { whoamiCommand } from './commands/whoami.js';
import {
  configGetCommand,
  configSetCommand,
  resolveScope,
  requireRepoScopeTarget,
  type ScopeOptions,
} from './commands/config.js';
import { getGlobalConfig } from './config.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('git-slot-machine')
  .description('Git commit hash slot machine')
  .version(version, '-v, --version', 'Output the current version');

program
  .command('play')
  .description('Play the slot machine with a git hash')
  .argument('<hash>', '7-character git commit hash')
  .option('-s, --small', 'Single line output')
  .action(async (hash: string, options: { small?: boolean }) => {
    await playCommand(hash, options);
  });

program
  .command('spin')
  .description('Play with the current git commit hash')
  .option('-s, --small', 'Single line output')
  .action(async (options: { small?: boolean }) => {
    await spinCommand(options);
  });

program
  .command('init')
  .description('Install post-commit hook in current repository')
  .action(async () => {
    await initCommand();
  });

program
  .command('balance')
  .description('Show current repository balance and stats')
  .action(balanceCommand);

program
  .command('test')
  .description('Play with a random 7-character hash')
  .option('-s, --small', 'Single line output')
  .action(async (options: { small?: boolean }) => {
    await testCommand(options);
  });

// Auth commands (top-level)
program
  .command('login')
  .description('Login with GitHub username to join the leaderboard')
  .argument('<github-username>', 'Your GitHub username')
  .action(async (githubUsername: string) => {
    try {
      // Only adopt the name globally when no identity is established yet, or
      // when it IS the established identity. Logging in as anything else —
      // this repo's org override, or a first org login before any override
      // exists — stores a token without touching the global identity; the
      // deliberate change is `username:set`.
      const globalUsername = getGlobalConfig().githubUsername;
      const persist =
        !globalUsername || globalUsername.toLowerCase() === githubUsername.toLowerCase();
      await authLoginCommand(githubUsername, persist);
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Logout and clear authentication')
  .option('--all', 'Log out every authenticated identity')
  .option('--force', 'Clear tokens locally even when server revocation fails')
  .action(async (options: { all?: boolean; force?: boolean }) => {
    await authLogoutCommand(options);
  });

program
  .command('status')
  .description('Show authentication and sync status')
  .action(async () => {
    await authStatusCommand();
  });

// Sync commands
program
  .command('sync')
  .description('Sync balance with API')
  .action(async () => {
    await syncCommand();
  });

program
  .command('sync:enable')
  .description('Enable automatic API sync for this repo')
  .option('--global', 'Apply to every repo instead of this one')
  .option('--repo', 'Apply to this repo only (default)')
  .action(async (options: ScopeOptions) => {
    await configSetCommand('sync-enabled', 'true', options);
  });

program
  .command('sync:disable')
  .description('Disable automatic API sync for this repo')
  .option('--global', 'Apply to every repo instead of this one')
  .option('--repo', 'Apply to this repo only (default)')
  .action(async (options: ScopeOptions) => {
    await configSetCommand('sync-enabled', 'false', options);
  });

// Privacy commands. Before 3.2 `privateRepo` was only settable during init,
// so re-running init was the only way to change it.
program
  .command('privacy:on')
  .description('Hide this repo\'s name and owner from the server')
  .option('--global', 'Apply to every repo instead of this one')
  .option('--repo', 'Apply to this repo only (default)')
  .action(async (options: ScopeOptions) => {
    await configSetCommand('private-repo', 'true', options);
  });

program
  .command('privacy:off')
  .description('Send this repo\'s name and owner to the server')
  .option('--global', 'Apply to every repo instead of this one')
  .option('--repo', 'Apply to this repo only (default)')
  .action(async (options: ScopeOptions) => {
    await configSetCommand('private-repo', 'false', options);
  });

// Username commands
program
  .command('whoami')
  .description('Show which identity this repo plays as')
  .action(() => {
    whoamiCommand();
  });

program
  .command('username:set')
  .description('Set GitHub username')
  .argument('<username>', 'Your GitHub username')
  .option('--global', 'Apply to every repo (default)')
  .option('--repo', 'Credit only this repo to this username')
  .action(async (username: string, options: ScopeOptions) => {
    try {
      const { setGitHubUsername } = await import('./config.js');
      const scope = resolveScope(options, 'global');
      requireRepoScopeTarget(scope);
      setGitHubUsername(username, scope);
      console.log(
        chalk.green(
          scope === 'global'
            ? `GitHub username set to: ${username}`
            : `Commits in this repo will be credited to ${username}`
        )
      );
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Config commands (advanced - hidden from main help)
program
  .command('config:get', { hidden: true })
  .description('Get configuration value (advanced)')
  .argument('<key>', 'Configuration key (api-url, sync-enabled, private-repo, all)')
  .action(async (key: string) => {
    await configGetCommand(key);
  });

program
  .command('config:set', { hidden: true })
  .description('Set configuration value (advanced)')
  .argument('<key>', 'Configuration key (api-url, sync-enabled, private-repo)')
  .argument('<value>', 'Configuration value')
  .option('--global', 'Write to the global config')
  .option('--repo', 'Write to this repo\'s config')
  .action(async (key: string, value: string, options: ScopeOptions) => {
    await configSetCommand(key, value, options);
  });

program.parse();
