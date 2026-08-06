import chalk from 'chalk';
import {
  getApiUrl,
  setApiUrl,
  isSyncEnabled,
  setSyncEnabled,
  setPrivateRepo,
  isPrivateRepo,
  getApiToken,
  hasRepoConfigTarget,
  type Scope,
} from '../config.js';

export interface ScopeOptions {
  global?: boolean;
  repo?: boolean;
}

// Resolve --global/--repo down to one scope. Each command names its own
// default, because the scope people mean by the bare command differs:
// sync and privacy are about this repo, identity and api-url about the user.
export function resolveScope(options: ScopeOptions, fallback: Scope): Scope {
  if (options.global && options.repo) {
    console.error(chalk.red('Error: --global and --repo are mutually exclusive'));
    process.exit(1);
  }

  if (options.global) return 'global';
  if (options.repo) return 'repo';
  return fallback;
}

// A repo-scoped write needs a .git to land in. Without this the default scope
// for sync/privacy turns "run it in the wrong directory" into a raw ENOENT.
export function requireRepoScopeTarget(scope: Scope): void {
  if (scope === 'repo' && !hasRepoConfigTarget()) {
    console.error(chalk.red('Error: not a git repository'));
    console.log(chalk.dim('Run this from inside a repo, or use --global to set it for every repo.'));
    process.exit(1);
  }
}

const where = (scope: Scope) => (scope === 'global' ? 'globally' : 'for this repo');

export async function configGetCommand(key: string): Promise<void> {
  try {
    switch (key) {
      case 'api-url':
        console.log(getApiUrl());
        break;
      case 'sync-enabled':
        console.log(isSyncEnabled());
        break;
      case 'private-repo':
        console.log(isPrivateRepo());
        break;
      case 'all':
        console.log(chalk.bold('Configuration:'));
        console.log(`  API URL: ${chalk.cyan(getApiUrl())}`);
        console.log(`  Sync Enabled: ${chalk.cyan(isSyncEnabled())}`);
        console.log(`  Private Repo: ${chalk.cyan(isPrivateRepo())}`);
        console.log(`  Has Token: ${chalk.cyan(getApiToken() ? 'yes' : 'no')}`);
        break;
      default:
        console.error(chalk.red(`Unknown config key: ${key}`));
        console.log('Available keys: api-url, sync-enabled, private-repo, all');
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

export async function configSetCommand(
  key: string,
  value: string,
  options: ScopeOptions = {}
): Promise<void> {
  try {
    switch (key) {
      case 'api-url': {
        // Deliberately outside the scope model: getApiUrl() reads global only
        // so a repo config can't redirect authenticated syncs, which makes a
        // repo-scoped api-url a setting that silently does nothing.
        if (options.repo) {
          console.error(chalk.red('Error: api-url is global-only'));
          console.log(chalk.dim('A per-repo API URL is ignored, so setting one would be a lie.'));
          process.exit(1);
        }
        setApiUrl(value);
        console.log(chalk.green(`API URL set to: ${value}`));
        break;
      }
      case 'sync-enabled': {
        const scope = resolveScope(options, 'repo');
        requireRepoScopeTarget(scope);
        const enabled = value.toLowerCase() === 'true' || value === '1';
        setSyncEnabled(enabled, scope);
        console.log(chalk.green(`Sync ${enabled ? 'enabled' : 'disabled'} ${where(scope)}`));
        break;
      }
      case 'private-repo': {
        const scope = resolveScope(options, 'repo');
        requireRepoScopeTarget(scope);
        const isPrivate = value.toLowerCase() === 'true' || value === '1';
        setPrivateRepo(isPrivate, scope);
        console.log(
          chalk.green(`Privacy mode ${isPrivate ? 'enabled' : 'disabled'} ${where(scope)}`)
        );
        break;
      }
      default:
        console.error(chalk.red(`Unknown config key: ${key}`));
        console.log('Available keys: api-url, sync-enabled, private-repo');
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
