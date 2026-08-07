#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { playCommand } from './commands/play.js';
import { spinCommand } from './commands/spin.js';
import { initCommand } from './commands/init.js';
import { balanceCommand } from './commands/balance.js';
import { testCommand } from './commands/test.js';
import { authLoginCommand, authLogoutCommand, authStatusCommand } from './commands/auth.js';
import { syncCommand } from './commands/sync.js';
import { whoamiCommand } from './commands/whoami.js';
import {
  configGetCommand,
  configSetCommand,
  resolveScope,
  requireRepoScopeTarget,
  type ScopeOptions,
} from './commands/config.js';
import {
  getGlobalConfig,
  getPlayAsUsername,
  clearPlayAsUsername,
  setGitHubUsername,
  getApiTokenFor,
} from './config.js';
import { shouldPersistIdentity } from './utils/credit.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('git-slot-machine')
  .description('Git commit hash slot machine')
  .version(version, '-v, --version', 'Output the current version');

program
  .command('play')
  .description('Play the slot machine with a git hash')
  .argument('<hash>', '7-character git commit hash')
  .option('-s, --small', 'Single line output')
  .action(async (hash: string, options: { small?: boolean }) => {
    await playCommand(hash, options);
  });

program
  .command('spin')
  .description('Play with the current git commit hash')
  .option('-s, --small', 'Single line output')
  .action(async (options: { small?: boolean }) => {
    await spinCommand(options);
  });

program
  .command('init')
  .description('Install post-commit hook in current repository')
  .action(async () => {
    // program.parse() isn't awaited, so without this an EACCES on the hook
    // write surfaces as an unhandled-rejection stack instead of the red
    // one-liner every other command prints.
    try {
      await initCommand();
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('balance')
  .description('Show current repository balance and stats')
  .action(balanceCommand);

program
  .command('test')
  .description('Play with a random 7-character hash')
  .option('-s, --small', 'Single line output')
  .action(async (options: { small?: boolean }) => {
    await testCommand(options);
  });

// Auth commands (top-level)
program
  .command('login')
  .description('Login with GitHub username to join the leaderboard')
  .argument('<github-username>', 'Your GitHub username')
  .action(async (githubUsername: string) => {
    try {
      // Logging in as anything that isn't the established identity stores a
      // token without touching it; the deliberate change is `username:set`.
      const persist = shouldPersistIdentity(
        getGlobalConfig().githubUsername,
        getPlayAsUsername(),
        githubUsername
      );
      await authLoginCommand(githubUsername, persist);
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Logout and clear authentication')
  .option('--all', 'Log out every authenticated identity')
  .option('--force', 'Clear tokens locally even when server revocation fails')
  .action(async (options: { all?: boolean; force?: boolean }) => {
    await authLogoutCommand(options);
  });

program
  .command('status')
  .description('Show authentication and sync status')
  .action(async () => {
    await authStatusCommand();
  });

// Sync commands
program
  .command('sync')
  .description('Sync balance with API')
  .action(async () => {
    await syncCommand();
  });

program
  .command('sync:enable')
  .description('Enable automatic API sync for this repo')
  .option('--global', 'Apply to every repo instead of this one')
  .option('--repo', 'Apply to this repo only (default)')
  .action(async (options: ScopeOptions) => {
    await configSetCommand('sync-enabled', 'true', options);
  });

program
  .command('sync:disable')
  .description('Disable automatic API sync for this repo')
  .option('--global', 'Apply to every repo instead of this one')
  .option('--repo', 'Apply to this repo only (default)')
  .action(async (options: ScopeOptions) => {
    await configSetCommand('sync-enabled', 'false', options);
  });

// Privacy commands. Before 3.2 `privateRepo` was only settable during init,
// so re-running init was the only way to change it.
program
  .command('privacy:on')
  .description('Hide this repo\'s name and owner from the server')
  .option('--global', 'Apply to every repo instead of this one')
  .option('--repo', 'Apply to this repo only (default)')
  .action(async (options: ScopeOptions) => {
    await configSetCommand('private-repo', 'true', options);
  });

program
  .command('privacy:off')
  .description('Send this repo\'s name and owner to the server')
  .option('--global', 'Apply to every repo instead of this one')
  .option('--repo', 'Apply to this repo only (default)')
  .action(async (options: ScopeOptions) => {
    await configSetCommand('private-repo', 'false', options);
  });

// Username commands
program
  .command('whoami')
  .description('Show which identity this repo plays as')
  .action(() => {
    whoamiCommand();
  });

program
  .command('username:set')
  .description('Set GitHub username')
  .argument('<username>', 'Your GitHub username')
  .option('--global', 'Apply to every repo (default)')
  .option('--repo', 'Credit only this repo to this username')
  .action(async (username: string, options: ScopeOptions) => {
    try {
      const scope = resolveScope(options, 'global');
      requireRepoScopeTarget(scope);

      // Read before the write, so the global path can tell whether this repo
      // was already routed elsewhere.
      const globalUsername = getGlobalConfig().githubUsername;
      const overrideBefore = getPlayAsUsername();

      setGitHubUsername(username, scope);
      console.log(
        chalk.green(
          scope === 'global'
            ? `GitHub username set globally to: ${username}`
            : `Commits in this repo will be credited to ${username}`
        )
      );

      // The global name doesn't apply here if this repo overrides it. auth.ts
      // prints the same note after a non-adopting login; without it the token
      // warning below keys on a name that plays here never resolve to, so
      // setting a name you already hold a token for printed nothing at all.
      // Points at the clear, not at `username:set <global name> --repo`: that
      // would pin the repo to today's global name, so changing the global
      // identity later would silently leave this repo behind — and fire this
      // same note again, recommending the same pin.
      if (scope === 'global' && overrideBefore && overrideBefore.toLowerCase() !== username.toLowerCase()) {
        console.log(chalk.dim(`Note: this repo still credits plays to ${overrideBefore}.`));
        console.log(chalk.dim('  git-slot-machine username:unset    (to inherit the global one)'));
      }

      // A repo override with no global identity behind it is a half-configured
      // machine: `login <that name>` from any other directory has no override
      // to check and would adopt it globally. Cheapest place to close that.
      if (scope === 'repo' && !globalUsername) {
        console.log();
        console.log(chalk.yellow('No global identity set yet — other repos have nobody to credit.'));
        console.log(chalk.cyan('  git-slot-machine username:set your-personal-username'));
      }

      // Plays resolve their token through this name. Without one, every commit
      // posts and fails, and play.ts's "not authenticated" notice is gated off
      // --small — which is the post-commit hook's only mode. So the silence
      // would be total: say it here, where the choice was made.
      if (!getApiTokenFor(username)) {
        console.log();
        console.log(chalk.yellow(`No token held for ${username} — plays stay local until you log in.`));
        console.log(chalk.cyan(`  git-slot-machine login ${username}`));
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Config commands (advanced - hidden from main help)
// The symmetric half of `username:set --repo`. Before 3.2 the only writer of a
// per-repo override was init, so init's credit prompt was a proportionate way
// to remove one. As a standalone creator, --repo needs a standalone clear:
// init can't always undo it (it exits without a GitHub remote, and skips the
// prompt entirely when the candidates dedupe to one), which left hand-editing
// .git/slot-machine-config.json as the only way out — the state #13 opened on.
program
  .command('username:unset')
  .description('Clear this repo\'s username override and inherit the global one')
  .option('--repo', 'Clear this repo\'s override (default)')
  .action(() => {
    try {
      requireRepoScopeTarget('repo');

      const cleared = getPlayAsUsername();

      if (!cleared) {
        console.log(chalk.dim('This repo has no username override.'));
        return;
      }

      clearPlayAsUsername();

      const inherited = getGlobalConfig().githubUsername;

      console.log(chalk.green(`Cleared this repo's override (was ${cleared})`));
      console.log(
        inherited
          ? chalk.dim(`Commits here are credited to ${inherited} now.`)
          : chalk.yellow('No global identity set — run: git-slot-machine username:set <name>')
      );
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('config:get', { hidden: true })
  .description('Get configuration value (advanced)')
  .argument('<key>', 'Configuration key (api-url, sync-enabled, private-repo, all)')
  .action(async (key: string) => {
    await configGetCommand(key);
  });

program
  .command('config:set', { hidden: true })
  .description('Set configuration value (advanced)')
  .argument('<key>', 'Configuration key (api-url, sync-enabled, private-repo)')
  .argument('<value>', 'Configuration value')
  .option('--global', 'Write to the global config')
  .option('--repo', 'Write to this repo\'s config')
  .action(async (key: string, value: string, options: ScopeOptions) => {
    await configSetCommand(key, value, options);
  });

program.parse();
