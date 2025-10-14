import { detectPattern } from '../patterns';
import { animateSlotMachine, animateQuietMode, showSmallMode } from '../animation/slotMachine';
import { updateBalance } from '../balance';
import chalk from 'chalk';

interface PlayOptions {
  quiet?: boolean;
  small?: boolean;
}

export async function playCommand(hash: string, options: PlayOptions): Promise<void> {
  try {
    // Detect pattern
    const result = detectPattern(hash);

    // Animate based on mode
    const config = {
      finalHash: hash.toLowerCase(),
      quiet: options.quiet || false,
      small: options.small || false
    };

    if (options.small) {
      await showSmallMode(config);
    } else if (options.quiet) {
      await animateQuietMode(config);
    } else {
      await animateSlotMachine(config);
    }

    // Show result
    if (!options.small) {
      console.log();
      if (result.payout > 0) {
        console.log(chalk.green.bold(`${result.name}!`));
        console.log(chalk.yellow(`+${result.payout} credits`));
      } else {
        console.log(chalk.red('No win'));
        console.log(chalk.gray('-1 credit'));
      }

      if (!options.quiet) {
        console.log();
        console.log(chalk.dim(result.description));
      }
    } else {
      // Small mode - compact result
      if (result.payout > 0) {
        console.log(chalk.green(`${result.name} +${result.payout}`));
      } else {
        console.log(chalk.red('No win -1'));
      }
    }

    // Update balance
    const newBalance = updateBalance(hash.toLowerCase(), result.payout);

    // Show balance
    if (!options.small) {
      console.log();
      console.log(chalk.cyan(`Balance: ${newBalance >= 0 ? chalk.green(newBalance) : chalk.red(newBalance)} credits`));
    }

  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
