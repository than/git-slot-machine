import chalk from 'chalk';
import { getRepoStats } from '../balance';

export function balanceCommand(): void {
  try {
    const stats = getRepoStats();

    if (!stats) {
      console.log(chalk.yellow('No balance data for this repository'));
      console.log(chalk.dim('Run a commit or use "git-slot-machine spin" to start playing'));
      return;
    }

    console.log();
    console.log(chalk.cyan.bold('Repository Stats'));
    console.log(chalk.dim('━'.repeat(40)));
    console.log(chalk.white(`Balance:        ${stats.balance >= 0 ? chalk.green(stats.balance) : chalk.red(stats.balance)} credits`));
    console.log(chalk.white(`Total Commits:  ${stats.totalCommits}`));
    console.log(chalk.white(`Total Winnings: ${chalk.yellow(stats.totalWinnings)} credits`));
    console.log(chalk.white(`Biggest Win:    ${chalk.yellow(stats.biggestWin)} credits`));
    console.log(chalk.white(`Last Commit:    ${chalk.dim(stats.lastCommit)}`));
    console.log();

  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
