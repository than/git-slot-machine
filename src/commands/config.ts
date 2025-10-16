import chalk from 'chalk';
import {
  getApiUrl,
  setApiUrl,
  isSyncEnabled,
  setSyncEnabled,
  getConfig
} from '../config.js';

export async function configGetCommand(key: string): Promise<void> {
  try {
    const config = getConfig();

    switch (key) {
      case 'api-url':
        console.log(getApiUrl());
        break;
      case 'sync-enabled':
        console.log(isSyncEnabled());
        break;
      case 'all':
        console.log(chalk.bold('Configuration:'));
        console.log(`  API URL: ${chalk.cyan(getApiUrl())}`);
        console.log(`  Sync Enabled: ${chalk.cyan(isSyncEnabled())}`);
        console.log(`  Has Token: ${chalk.cyan(config.apiToken ? 'yes' : 'no')}`);
        break;
      default:
        console.error(chalk.red(`Unknown config key: ${key}`));
        console.log('Available keys: api-url, sync-enabled, all');
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

export async function configSetCommand(key: string, value: string): Promise<void> {
  try {
    switch (key) {
      case 'api-url':
        setApiUrl(value);
        console.log(chalk.green(`API URL set to: ${value}`));
        break;
      case 'sync-enabled':
        const enabled = value.toLowerCase() === 'true' || value === '1';
        setSyncEnabled(enabled);
        console.log(chalk.green(`Sync ${enabled ? 'enabled' : 'disabled'}`));
        break;
      default:
        console.error(chalk.red(`Unknown config key: ${key}`));
        console.log('Available keys: api-url, sync-enabled');
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
