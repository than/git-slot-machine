import { playCommand } from './play';

interface TestOptions {
  quiet?: boolean;
  small?: boolean;
}

function generateRandomHash(): string {
  const hexChars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 7; i++) {
    hash += hexChars[Math.floor(Math.random() * hexChars.length)];
  }
  return hash;
}

export async function testCommand(options: TestOptions): Promise<void> {
  const randomHash = generateRandomHash();
  await playCommand(randomHash, options);
}
