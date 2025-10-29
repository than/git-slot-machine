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
import { configGetCommand, configSetCommand } from './commands/config.js';

const program = new Command();

program
  .name('git-slot-machine')
  .description('Git commit hash slot machine')
  .version('2.2.0', '-v, --version', 'Output the current version');

program
  .command('play')
  .description('Play the slot machine with a git hash')
  .argument('<hash>', '7-character git commit hash')
  .option('-s, --small', 'Single line output')
  .action(async (hash: string, options: any) => {
    await playCommand(hash, options);
  });

program
  .command('spin')
  .description('Play with the current git commit hash')
  .option('-s, --small', 'Single line output')
  .action(async (options: any) => {
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
  .action(async (options: any) => {
    await testCommand(options);
  });

// Auth commands (top-level)
program
  .command('login')
  .description('Login with GitHub username to join the leaderboard')
  .argument('<github-username>', 'Your GitHub username')
  .action(async (githubUsername: string) => {
    await authLoginCommand(githubUsername);
  });

program
  .command('logout')
  .description('Logout and clear authentication')
  .action(async () => {
    await authLogoutCommand();
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
  .description('Enable automatic API sync')
  .action(async () => {
    await configSetCommand('sync-enabled', 'true');
  });

program
  .command('sync:disable')
  .description('Disable automatic API sync')
  .action(async () => {
    await configSetCommand('sync-enabled', 'false');
  });

// Username commands
program
  .command('username:set')
  .description('Set GitHub username')
  .argument('<username>', 'Your GitHub username')
  .action(async (username: string) => {
    const { setGitHubUsername } = await import('./config.js');
    setGitHubUsername(username);
    console.log(chalk.green(`GitHub username set to: ${username}`));
  });

// Config commands (advanced - hidden from main help)
program
  .command('config:get', { hidden: true })
  .description('Get configuration value (advanced)')
  .argument('<key>', 'Configuration key (api-url, sync-enabled, all)')
  .action(async (key: string) => {
    await configGetCommand(key);
  });

program
  .command('config:set', { hidden: true })
  .description('Set configuration value (advanced)')
  .argument('<key>', 'Configuration key (api-url, sync-enabled)')
  .argument('<value>', 'Configuration value')
  .action(async (key: string, value: string) => {
    await configSetCommand(key, value);
  });

program.parse();
