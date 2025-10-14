import { getCurrentCommitHash } from '../utils/git';
import { playCommand } from './play';

interface SpinOptions {
  small?: boolean;
}

export async function spinCommand(options: SpinOptions): Promise<void> {
  try {
    const hash = getCurrentCommitHash();
    await playCommand(hash, options);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}
