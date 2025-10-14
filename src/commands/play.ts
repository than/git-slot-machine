interface PlayOptions {
  quiet?: boolean;
  small?: boolean;
}

export function playCommand(hash: string, options: PlayOptions): void {
  console.log(`Playing with hash: ${hash}`);
  console.log(`Options:`, options);
}
