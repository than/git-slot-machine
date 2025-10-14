#!/usr/bin/env node

import { Command } from 'commander';
import { playCommand } from './commands/play';
import { spinCommand } from './commands/spin';
import { initCommand } from './commands/init';
import { balanceCommand } from './commands/balance';
import { testCommand } from './commands/test';

const program = new Command();

program
  .name('git-slot-machine')
  .description('Git commit hash slot machine')
  .version('0.1.0');

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
  .action(initCommand);

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

program.parse();
