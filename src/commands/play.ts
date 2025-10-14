import { detectPattern } from '../patterns';
import { animateSlotMachine } from '../animation/slotMachine';
import chalk from 'chalk';

interface PlayOptions {
  quiet?: boolean;
  small?: boolean;
}

export async function playCommand(hash: string, options: PlayOptions): Promise<void> {
  try {
    // Detect pattern
    const result = detectPattern(hash);

    // Animate
    if (!options.quiet && !options.small) {
      await animateSlotMachine({
        finalHash: hash.toLowerCase(),
        quiet: options.quiet || false,
        small: options.small || false
      });
    }

    // Show result
    console.log();
    if (result.payout > 0) {
      console.log(chalk.green.bold(`🎰 ${result.name}!`));
      console.log(chalk.yellow(`+${result.payout} credits`));
    } else {
      console.log(chalk.red('No win'));
      console.log(chalk.gray('-1 credit'));
    }
    console.log();
    console.log(chalk.dim(result.description));

  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
