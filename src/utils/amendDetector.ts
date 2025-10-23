import { execSync } from 'child_process';

interface AmendDetectionResult {
  isAmended: boolean;
  recentAmendCount: number;
  suspiciousActivity: boolean;
  recentAmendHashes: string[];
}

/**
 * Detects if the current commit appears to be the result of hash grinding
 * by checking git reflog for suspicious amend patterns
 */
export function detectAmendGrinding(timeWindowMinutes: number = 5, suspiciousThreshold: number = 5): AmendDetectionResult {
  try {
    // Get reflog entries from the last timeWindowMinutes
    // Format: %gd = reflog selector, %gs = reflog subject, %H = commit hash, %ct = committer timestamp
    const reflogOutput = execSync(
      `git reflog --since="${timeWindowMinutes} minutes ago" --format="%gs|%H|%ct"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();

    if (!reflogOutput) {
      return {
        isAmended: false,
        recentAmendCount: 0,
        suspiciousActivity: false,
        recentAmendHashes: [],
      };
    }

    const entries = reflogOutput.split('\n');
    const amendEntries = entries.filter(entry => entry.includes('commit (amend)'));
    const amendHashes = amendEntries.map(entry => {
      const parts = entry.split('|');
      return parts[1]?.substring(0, 7) || '';
    }).filter(hash => hash.length === 7);

    const recentAmendCount = amendEntries.length;
    const suspiciousActivity = recentAmendCount >= suspiciousThreshold;

    // Check if the most recent action was an amend
    const isAmended = entries.length > 0 && entries[0].includes('commit (amend)');

    return {
      isAmended,
      recentAmendCount,
      suspiciousActivity,
      recentAmendHashes: amendHashes,
    };
  } catch (error) {
    // If git reflog fails, assume no amending
    return {
      isAmended: false,
      recentAmendCount: 0,
      suspiciousActivity: false,
      recentAmendHashes: [],
    };
  }
}

/**
 * Get a warning message for suspicious amend activity
 */
export function getAmendWarningMessage(result: AmendDetectionResult): string | null {
  if (!result.suspiciousActivity) {
    return null;
  }

  return `⚠️  Suspicious Activity Detected\n` +
    `   ${result.recentAmendCount} commit amends in the last 5 minutes\n` +
    `   This pattern suggests hash grinding/gaming\n` +
    `   Your commit will be flagged for review`;
}
