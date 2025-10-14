import chalk from 'chalk';

const HEX_CHARS = '0123456789abcdef'.split('');
const ANIMATION_SPEED = 50; // ms per frame
const SPIN_DURATION = 2000; // total animation time
const FRAMES = SPIN_DURATION / ANIMATION_SPEED;

export interface SlotConfig {
  finalHash: string;
  quiet: boolean;
  small: boolean;
}

function getRandomHexChar(): string {
  return HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
}

function clearLine(): void {
  process.stdout.write('\r\x1b[K');
}

function drawSlotMachine(chars: string[], spinning: boolean): void {
  const border = chalk.cyan('═'.repeat(30));
  const topBorder = chalk.cyan('╔') + border + chalk.cyan('╗');
  const bottomBorder = chalk.cyan('╚') + border + chalk.cyan('╣');

  console.log(topBorder);
  console.log(chalk.cyan('║') + '   ' + chalk.yellow('GIT SLOT MACHINE') + '    ' + chalk.cyan('║'));
  console.log(chalk.cyan('╠') + border + chalk.cyan('╣'));

  // Display the 7 characters as slot reels
  const display = chars.map((char, i) => {
    if (spinning) {
      return chalk.white.bold(char);
    } else {
      // Highlight final result
      return chalk.green.bold(char);
    }
  }).join(' ');

  console.log(chalk.cyan('║') + '       ' + display + '       ' + chalk.cyan('║'));
  console.log(bottomBorder);
}

export async function animateSlotMachine(config: SlotConfig): Promise<void> {
  const { finalHash } = config;

  // Clear screen
  console.clear();

  // Initialize with random characters
  let currentChars = Array(7).fill(0).map(() => getRandomHexChar());

  // Animate spinning
  for (let frame = 0; frame < FRAMES; frame++) {
    // Gradually slow down and settle on final hash
    const progress = frame / FRAMES;

    if (progress < 0.9) {
      // Still spinning - show random
      currentChars = currentChars.map(() => getRandomHexChar());
    } else {
      // Start settling - reveal characters one by one
      const revealIndex = Math.floor((progress - 0.9) / 0.1 * 7);
      for (let i = 0; i < revealIndex; i++) {
        currentChars[i] = finalHash[i];
      }
    }

    // Redraw
    console.clear();
    drawSlotMachine(currentChars, progress < 0.9);

    // Wait for next frame
    await new Promise(resolve => setTimeout(resolve, ANIMATION_SPEED));
  }

  // Final reveal
  console.clear();
  drawSlotMachine(finalHash.split(''), false);
}

export async function animateQuietMode(config: SlotConfig): Promise<void> {
  const { finalHash } = config;

  // Single line, rapid character flicker
  process.stdout.write(chalk.cyan('🎰 '));

  for (let frame = 0; frame < 20; frame++) {
    const chars = Array(7).fill(0).map(() => getRandomHexChar()).join('');
    clearLine();
    process.stdout.write(chalk.cyan('🎰 ') + chalk.white(chars));
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Final
  clearLine();
  process.stdout.write(chalk.cyan('🎰 ') + chalk.green.bold(finalHash));
  console.log();
}

export async function showSmallMode(config: SlotConfig): Promise<void> {
  const { finalHash } = config;
  console.log(chalk.cyan('🎰 ') + chalk.green.bold(finalHash));
}
