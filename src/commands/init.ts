import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { isGitRepo } from '../utils/git';
import { POST_COMMIT_HOOK } from '../templates/post-commit';

export function initCommand(): void {
  // Check if git repo
  if (!isGitRepo()) {
    console.error(chalk.red('Error: Not a git repository'));
    console.log(chalk.dim('Run this command from the root of a git repository'));
    process.exit(1);
  }

  const hookPath = path.join(process.cwd(), '.git', 'hooks', 'post-commit');

  // Check if hook already exists
  if (fs.existsSync(hookPath)) {
    console.log(chalk.yellow('Warning: post-commit hook already exists'));
    console.log(chalk.dim(`Location: ${hookPath}`));

    // TODO: Could add merge logic or backup existing hook
    console.log(chalk.red('Aborting to avoid overwriting existing hook'));
    console.log(chalk.dim('Manually add git-slot-machine to your existing hook'));
    process.exit(1);
  }

  // Write the hook
  fs.writeFileSync(hookPath, POST_COMMIT_HOOK, { mode: 0o755 });

  console.log(chalk.green('✓ Post-commit hook installed'));
  console.log();
  console.log(chalk.cyan('Git Slot Machine is ready!'));
  console.log(chalk.dim('Every commit will now spin the slot machine.'));
  console.log();
  console.log('Try it out:');
  console.log(chalk.dim('  git commit --allow-empty -m "test"'));
}
