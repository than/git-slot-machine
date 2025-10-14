import chalk from 'chalk';
import { PatternResult } from '../patterns';

const HEX_CHARS = '0123456789abcdef'.split('');
const ANIMATION_SPEED = 50; // ms per frame
const SPIN_DURATION = 2000; // total animation time
const FRAMES = SPIN_DURATION / ANIMATION_SPEED;

export interface SlotConfig {
  finalHash: string;
  small: boolean;
  patternResult?: PatternResult;
}

function getRandomHexChar(): string {
  return HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
}

function clearLine(): void {
  process.stdout.write('\r\x1b[K');
}

function drawSlotMachine(chars: string[], spinning: boolean, highlightIndices: number[] = [], flash: boolean = false): void {
  // Casino color palette: red borders, white title
  const borderColor = chalk.rgb(220, 20, 60); // Crimson red
  const titleColor = chalk.white; // White

  const borderWidth = 39;
  const border = '═'.repeat(borderWidth);
  const topBorder = borderColor('╔' + border + '╗');
  const middleBorder = borderColor('╠' + border + '╣');
  const bottomBorder = borderColor('╚' + border + '╝');

  // Title line - emojis count as 2 visual chars each
  const titleText = 'GIT SLOT MACHINE';
  const titleVisualWidth = 2 + 2 + titleText.length + 2 + 2; // emoji + spaces + text + spaces + emoji
  const titlePadding = Math.floor((borderWidth - titleVisualWidth) / 2);
  const titleRightPad = borderWidth - titleVisualWidth - titlePadding;
  const titleLine = borderColor('║') + ' '.repeat(titlePadding) + chalk.rgb(255, 255, 255)('🎰  ' + titleText + '  🎰') + ' '.repeat(titleRightPad) + borderColor('║');

  console.log(topBorder);
  console.log(titleLine);
  console.log(middleBorder);

  // Display the 7 characters as slot reels
  const display = chars.map((char, i) => {
    if (spinning) {
      // Spinning - white blur
      return chalk.rgb(255, 255, 255).bold(char);
    } else {
      // Check if this character should be highlighted
      const isHighlighted = highlightIndices.includes(i);

      if (isHighlighted && flash) {
        // Flash state - yellow inverse (yellow background, black text)
        return chalk.bgRgb(255, 255, 0).rgb(0, 0, 0).bold(char);
      } else if (isHighlighted) {
        // Normal highlighted state - yellow inverse (yellow background, black text)
        return chalk.bgRgb(255, 255, 0).rgb(0, 0, 0).bold(char);
      } else {
        // Not highlighted - white text
        return chalk.rgb(255, 255, 255)(char);
      }
    }
  }).join('  ');

  // Calculate padding for character display (7 chars + 6 double-space separators = 19 visual chars)
  const displayVisualWidth = 7 + 12; // 7 chars + 6*2 spaces
  const displayPadding = Math.floor((borderWidth - displayVisualWidth) / 2);
  const displayRightPad = borderWidth - displayVisualWidth - displayPadding;
  const displayLine = borderColor('║') + ' '.repeat(displayPadding) + display + ' '.repeat(displayRightPad) + borderColor('║');

  console.log(displayLine);
  console.log(bottomBorder);
}

export async function animateSlotMachine(config: SlotConfig): Promise<void> {
  const { finalHash, patternResult } = config;
  const highlightIndices = patternResult?.highlightIndices || [];

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

  // Final reveal with flashing
  const finalChars = finalHash.split('');

  // Flash 3 times if there are highlighted characters
  if (highlightIndices.length > 0) {
    for (let flashCount = 0; flashCount < 3; flashCount++) {
      // Flash on
      console.clear();
      drawSlotMachine(finalChars, false, highlightIndices, true);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Flash off
      console.clear();
      drawSlotMachine(finalChars, false, highlightIndices, false);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Steady state
  console.clear();
  drawSlotMachine(finalChars, false, highlightIndices, false);
}

export async function animateSmallMode(config: SlotConfig): Promise<void> {
  const { finalHash, patternResult } = config;
  const highlightIndices = patternResult?.highlightIndices || [];

  // Single line, rapid character flicker
  process.stdout.write(chalk.cyan('🎰 '));

  for (let frame = 0; frame < 20; frame++) {
    const chars = Array(7).fill(0).map(() => getRandomHexChar()).join('');
    clearLine();
    process.stdout.write(chalk.cyan('🎰 ') + chalk.rgb(255, 255, 255)(chars));
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Final with highlighting - don't add newline, let the caller add result info
  clearLine();
  const display = finalHash.split('').map((char, i) => {
    if (highlightIndices.includes(i)) {
      return chalk.bgRgb(255, 255, 0).rgb(0, 0, 0).bold(char);
    } else {
      return chalk.rgb(255, 255, 255)(char);
    }
  }).join('');
  process.stdout.write(chalk.cyan('🎰 ') + display);
  // Don't write newline - let caller continue on same line
}
