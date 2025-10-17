import { getApiUrl, getApiToken, isSyncEnabled } from './config.js';
import { getFetch } from './utils/fetch-polyfill.js';

// Fallback domains to try in order (if primary fails)
const FALLBACK_DOMAINS = [
  'https://gitslotmachinecom-main-vilmm1.laravel.cloud',
];

export interface PlayData {
  commit_hash: string;
  commit_full_hash: string;
  pattern_type: string;
  pattern_name: string;
  payout: number;
  wager: number;
  balance_before: number;
  balance_after: number;
  repo_url: string;
  github_username: string;
  repo_owner: string;
  repo_name: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface BalanceResponse {
  balance: number;
  total_commits: number;
  total_winnings: number;
  biggest_win: number;
  biggest_win_pattern?: string;
  biggest_win_hash?: string;
}

// Helper to build headers with authentication
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const token = getApiToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// Check if API sync is enabled and available
export function isApiAvailable(): boolean {
  return isSyncEnabled() && getApiToken() !== null;
}

export interface PlayResponse {
  balance: number;
  payout: number;
  pattern_name: string;
  share_url?: string;
}

// Helper to try API call with fallback domains
async function fetchWithFallback(endpoint: string, options: RequestInit): Promise<Response | null> {
  const configuredUrl = getApiUrl();
  const fetchFn = await getFetch();

  // Build list of URLs to try: configured URL first, then fallbacks (excluding duplicates)
  const urlsToTry = [
    configuredUrl,
    ...FALLBACK_DOMAINS.filter(domain => !configuredUrl.startsWith(domain))
  ];

  for (const baseUrl of urlsToTry) {
    try {
      const url = `${baseUrl.replace(/\/api$/, '')}/api${endpoint}`;
      const response = await fetchFn(url, options);

      if (response.ok) {
        return response;
      }

      // If not ok, try next domain
      continue;
    } catch (error) {
      // Network error, try next domain
      continue;
    }
  }

  return null;
}

// Send play data to API
export async function sendPlayToAPI(data: PlayData): Promise<PlayResponse | null> {
  if (!isApiAvailable()) {
    return null;
  }

  try {
    const response = await fetchWithFallback('/play', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response) {
      return null;
    }

    const result = await response.json() as ApiResponse<PlayResponse>;
    return result.data || null;
  } catch (error) {
    // Silently fail if offline or API unavailable
    // The user still gets local feedback
    return null;
  }
}

// Get balance from API
export async function getBalance(): Promise<BalanceResponse | null> {
  if (!isApiAvailable()) {
    return null;
  }

  try {
    const response = await fetchWithFallback('/balance', {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response) {
      return null;
    }

    const result = await response.json() as ApiResponse<BalanceResponse>;
    return result.data || null;
  } catch (error) {
    return null;
  }
}

// Create API token (simplified - just pass github username)
export async function createToken(githubUsername: string): Promise<string | null> {
  try {
    const response = await fetchWithFallback('/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        github_username: githubUsername,
      }),
    });

    if (!response) {
      console.error('Failed to reach API server. Please check your network connection.');
      return null;
    }

    const result = await response.json() as ApiResponse<{ token: string }>;
    return result.data?.token || null;
  } catch (error) {
    console.error('API request failed:', (error as Error).message);
    return null;
  }
}

// Verify token is valid
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetchWithFallback('/auth/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return response !== null && response.ok;
  } catch (error) {
    return false;
  }
}

// Logout (revoke token)
export async function logout(): Promise<boolean> {
  if (!getApiToken()) {
    return true;
  }

  try {
    const response = await fetchWithFallback('/auth/token', {
      method: 'DELETE',
      headers: getHeaders(),
    });

    return response !== null && response.ok;
  } catch (error) {
    return false;
  }
}
