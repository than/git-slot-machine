import { getCurrentCommitHash, getCurrentCommitFullHash } from '../utils/git.js';
import { playCommand } from './play.js';

interface SpinOptions {
  small?: boolean;
}

export async function spinCommand(options: SpinOptions): Promise<void> {
  try {
    const hash = getCurrentCommitHash();
    const fullHash = getCurrentCommitFullHash();
    await playCommand(hash, { ...options, fullHash });
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}
