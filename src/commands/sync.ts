import chalk from 'chalk';
import { getBalance as getApiBalance } from '../api';
import { getBalance as getLocalBalance } from '../balance';

export async function syncCommand(): Promise<void> {
  try {
    console.log(chalk.dim('Syncing with API...'));

    const apiBalance = await getApiBalance();

    if (!apiBalance) {
      console.log(chalk.yellow('Unable to sync with API.'));
      console.log(chalk.dim('Make sure you are authenticated and online.'));
      return;
    }

    const localBalance = getLocalBalance();

    console.log();
    console.log(chalk.bold('Local Balance:'));
    console.log(`  Balance: ${chalk.green(localBalance)} points`);
    console.log();
    console.log(chalk.bold('API Balance:'));
    console.log(`  Balance: ${chalk.green(apiBalance.balance)} points`);
    console.log(`  Total Commits: ${chalk.cyan(apiBalance.total_commits)}`);
    console.log(`  Total Winnings: ${chalk.cyan(apiBalance.total_winnings)}`);
    console.log(`  Biggest Win: ${chalk.cyan(apiBalance.biggest_win)}`);
    console.log();

    if (localBalance !== apiBalance.balance) {
      console.log(chalk.yellow('Warning: Local and API balances differ.'));
      console.log(chalk.dim('This is normal if you play offline or in multiple repos.'));
    } else {
      console.log(chalk.green('Balances are in sync!'));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
