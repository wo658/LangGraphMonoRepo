export type UserProfile = {
  id: string
  email: string
  name: string
  avatarUrl?: string
  provider?: string
  aiUsage?: {
    month: string
    count: number
    limit?: number
  }
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'

// Fetch current user profile using HttpOnly cookie (credentials included)
export async function fetchMe(): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    })
    if (res.status === 401) return null
    if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`)
    return (await res.json()) as UserProfile
  } catch (e) {
    // Network errors should not crash the app, just return null
    return null
  }
}

export async function logout(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    return res.ok
  } catch (e) {
    return false
  }
}

export function getOAuthUrl(provider: 'github' | 'google'): string {
  return `${API_BASE_URL}/auth/${provider}`
}
