#!/usr/bin/env node

import { Command } from 'commander';
import { playCommand } from './commands/play';
import { spinCommand } from './commands/spin';

const program = new Command();

program
  .name('git-slot-machine')
  .description('Git commit hash slot machine')
  .version('0.1.0');

program
  .command('play')
  .description('Play the slot machine with a git hash')
  .argument('<hash>', '7-character git commit hash')
  .option('-q, --quiet', 'Single line output')
  .option('-s, --small', 'Compact output')
  .action(async (hash: string, options: any) => {
    await playCommand(hash, options);
  });

program
  .command('spin')
  .description('Play with the current git commit hash')
  .option('-q, --quiet', 'Single line output')
  .option('-s, --small', 'Compact output')
  .action(async (options: any) => {
    await spinCommand(options);
  });

program.parse();
