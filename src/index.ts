#!/usr/bin/env node

import { Command } from 'commander';
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
  .version('1.2.3', '-v, --version', 'Output the current version');

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

// Sync command
program
  .command('sync')
  .description('Sync balance with API')
  .action(async () => {
    await syncCommand();
  });

// Config commands
const config = program
  .command('config')
  .description('Manage CLI configuration');

config
  .command('get')
  .description('Get configuration value')
  .argument('<key>', 'Configuration key (api-url, sync-enabled, all)')
  .action(async (key: string) => {
    await configGetCommand(key);
  });

config
  .command('set')
  .description('Set configuration value')
  .argument('<key>', 'Configuration key (api-url, sync-enabled)')
  .argument('<value>', 'Configuration value')
  .action(async (key: string, value: string) => {
    await configSetCommand(key, value);
  });

program.parse();
