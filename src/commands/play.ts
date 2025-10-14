import { detectPattern } from '../patterns';
import { animateSlotMachine, animateSmallMode } from '../animation/slotMachine';
import { updateBalance } from '../balance';
import chalk from 'chalk';

interface PlayOptions {
  small?: boolean;
}

export async function playCommand(hash: string, options: PlayOptions): Promise<void> {
  try {
    // Detect pattern
    const result = detectPattern(hash);

    // Animate based on mode
    const config = {
      finalHash: hash.toLowerCase(),
      small: options.small || false,
      patternResult: result
    };

    if (options.small) {
      await animateSmallMode(config);
    } else {
      await animateSlotMachine(config);
    }

    // Show result
    if (!options.small) {
      console.log();

      // Center the text below the box (box width is 41 chars)
      const boxWidth = 41;

      if (result.payout > 0) {
        const resultText = `${result.name}!`;
        const resultPadding = Math.floor((boxWidth - resultText.length) / 2);
        console.log(' '.repeat(resultPadding) + chalk.cyan.bold(resultText));

        const payoutText = `+${result.payout} credits`;
        const payoutPadding = Math.floor((boxWidth - payoutText.length) / 2);
        console.log(' '.repeat(payoutPadding) + chalk.white(payoutText));
      } else {
        const noWinText = 'No win';
        const noWinPadding = Math.floor((boxWidth - noWinText.length) / 2);
        console.log(' '.repeat(noWinPadding) + chalk.red(noWinText));

        const lossText = '-10 credits';
        const lossPadding = Math.floor((boxWidth - lossText.length) / 2);
        console.log(' '.repeat(lossPadding) + chalk.white(lossText));
      }

      console.log();
      const descText = result.description;
      const descPadding = Math.floor((boxWidth - descText.length) / 2);
      console.log(' '.repeat(descPadding) + chalk.dim(descText));
    }

    // Update balance
    const newBalance = updateBalance(hash.toLowerCase(), result.payout);

    // Show result and balance
    if (options.small) {
      // Small mode - everything on one line (animateSmallMode already wrote the hash without newline)
      if (result.payout > 0) {
        console.log(chalk.dim(' • ') + chalk.cyan.bold(`${result.name} +${result.payout}`) + chalk.dim(' • ') + chalk.white(`Balance: ${chalk.green.bold(newBalance)}`));
      } else {
        console.log(chalk.dim(' • ') + chalk.red('No win -10') + chalk.dim(' • ') + chalk.white(`Balance: ${newBalance >= 0 ? chalk.green.bold(newBalance) : chalk.red.bold(newBalance)}`));
      }
    } else {
      console.log();
      const boxWidth = 41;
      // Note: we can't measure the exact length with color codes, so estimate based on text content
      const balanceText = `Balance: ${newBalance} credits`;
      const balancePadding = Math.floor((boxWidth - balanceText.length) / 2);
      console.log(' '.repeat(balancePadding) + chalk.cyan(`Balance: ${newBalance >= 0 ? chalk.green(newBalance) : chalk.red(newBalance)} credits`));
    }

  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
