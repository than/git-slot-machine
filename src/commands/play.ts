import { detectPattern } from '../patterns';
import { animateSlotMachine, animateSmallMode } from '../animation/slotMachine';
import { getBalance, updateBalance, setBalance } from '../balance';
import { sendPlayToAPI } from '../api';
import { getRepoInfo, getGitHubUsername } from '../config';
import chalk from 'chalk';

interface PlayOptions {
  small?: boolean;
  fullHash?: string;  // Optional full hash for CLI integration
}

export async function playCommand(hash: string, options: PlayOptions): Promise<void> {
  try {
    // Get balance before playing
    const balanceBefore = getBalance();

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

        const payoutText = `+${result.payout} points`;
        const payoutPadding = Math.floor((boxWidth - payoutText.length) / 2);
        console.log(' '.repeat(payoutPadding) + chalk.white.bold(payoutText));
      } else {
        const noWinText = 'No win';
        const noWinPadding = Math.floor((boxWidth - noWinText.length) / 2);
        console.log(' '.repeat(noWinPadding) + chalk.red.bold(noWinText));

        const lossText = '-10 points';
        const lossPadding = Math.floor((boxWidth - lossText.length) / 2);
        console.log(' '.repeat(lossPadding) + chalk.white.bold(lossText));
      }

      console.log();
      const descText = result.description;
      const descPadding = Math.floor((boxWidth - descText.length) / 2);
      console.log(' '.repeat(descPadding) + chalk.dim(descText));
    }

    // Validate GitHub remote for API sync
    const repoInfo = getRepoInfo();
    const githubUsername = getGitHubUsername();

    if (!repoInfo && githubUsername) {
      console.log();
      console.log(chalk.yellow.bold('⚠ Warning: No GitHub remote detected'));
      console.log(chalk.dim('This repo will not sync to the leaderboard.'));
      console.log(chalk.dim('To sync, add a GitHub remote:'));
      console.log(chalk.cyan('  git remote add origin https://github.com/username/repo.git'));
      console.log();
    }

    // Update balance locally
    let newBalance = updateBalance(hash.toLowerCase(), result.payout);

    // Send to API and sync balance with server
    let shareUrl: string | undefined;

    if (repoInfo && githubUsername) {
      const playData: any = {
        commit_hash: hash.toLowerCase(),
        pattern_type: result.type,
        pattern_name: result.name,
        payout: result.payout,
        wager: 10,
        balance_before: balanceBefore,
        balance_after: newBalance,
        repo_url: repoInfo.url,
        github_username: githubUsername,
        repo_owner: repoInfo.owner,
        repo_name: repoInfo.name,
      };

      // Only send full hash if we have one (not in test mode)
      if (options.fullHash && options.fullHash.length === 40) {
        playData.commit_full_hash = options.fullHash;
      }

      try {
        const apiResponse = await sendPlayToAPI(playData);
        // Sync local balance to match server's balance
        if (apiResponse && apiResponse.balance !== undefined) {
          setBalance(apiResponse.balance);
          newBalance = apiResponse.balance;
          shareUrl = apiResponse.share_url;
        }
      } catch (error) {
        // Silently fail - local play already succeeded
      }
    }

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
      const balanceText = `Balance: ${newBalance} points`;
      const balancePadding = Math.floor((boxWidth - balanceText.length) / 2);
      console.log(' '.repeat(balancePadding) + chalk.white.bold(`Balance: ${newBalance >= 0 ? chalk.green.bold(newBalance) : chalk.red.bold(newBalance)} points`));
    }

    // Show share URL for wins
    if (shareUrl && result.payout > 0 && !options.small) {
      console.log();
      const boxWidth = 41;
      const shareText = 'Share your win:';
      const sharePadding = Math.floor((boxWidth - shareText.length) / 2);
      console.log(' '.repeat(sharePadding) + chalk.dim(shareText));

      const urlPadding = Math.floor((boxWidth - shareUrl.length) / 2);
      console.log(' '.repeat(urlPadding) + chalk.green.underline(shareUrl));
    }

  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
