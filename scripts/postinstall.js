#!/usr/bin/env node

// Use ANSI codes directly since chalk might not be installed yet during postinstall
const green = '\x1b[32m';
const cyan = '\x1b[36m';
const dim = '\x1b[2m';
const bold = '\x1b[1m';
const reset = '\x1b[0m';

console.log();
console.log(`${green}${bold}🎰 Git Slot Machine installed successfully!${reset}`);
console.log();
console.log(`${cyan}Quick Start:${reset}`);
console.log();
console.log(`  ${bold}1. Navigate to a git repository:${reset}`);
console.log(`${dim}     cd /path/to/your/repo${reset}`);
console.log();
console.log(`  ${bold}2. Initialize Git Slot Machine:${reset}`);
console.log(`${cyan}     git-slot-machine init${reset}`);
console.log();
console.log(`  ${bold}3. Make commits and watch the magic happen!${reset}`);
console.log();
console.log(`${dim}Learn more: https://gitslotmachine.com${reset}`);
console.log();
