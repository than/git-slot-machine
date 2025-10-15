import { getApiUrl, getApiToken, isSyncEnabled } from './config';

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
}

// Send play data to API
export async function sendPlayToAPI(data: PlayData): Promise<PlayResponse | null> {
  if (!isApiAvailable()) {
    return null;
  }

  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/play`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`API Error (${response.status}):`, error);
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
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/balance`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
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
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        github_username: githubUsername,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json() as ApiResponse<{ token: string }>;
    return result.data?.token || null;
  } catch (error) {
    return null;
  }
}

// Verify token is valid
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/auth/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.ok;
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
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/auth/token`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}
