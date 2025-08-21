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
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://langgraphmonorepo-production.up.railway.app'

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

// AI generate types and client
export type AiGenerateRequest = {
  language: 'python' | 'typescript' | 'javascript'
  instruction: string
  code?: string
  stream?: boolean
}

export type AiGenerateResponse = {
  message: string
  code: string
  usage: { promptTokens: number; completionTokens: number; totalTokens: number }
  model: string
}

export async function aiGenerate(req: AiGenerateRequest): Promise<AiGenerateResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/generate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`AI generate failed: ${res.status} ${text}`)
  }
  const data = (await res.json()) as Partial<AiGenerateResponse>
  return {
    message: typeof data.message === 'string' ? data.message : '',
    code: typeof data.code === 'string' ? data.code : '',
    usage: data.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    model: data.model || '',
  }
}

// Templates API
export type TemplateItem = {
  _id: string
  title: string
  description?: string
  code: string
  language: 'python' | 'typescript' | 'javascript'
  author: string
  createdAt: string
  updatedAt: string
  likedBy?: string[]
  likedByCount?: number
  visibility?: 'public' | 'private'
}

export type TemplateListResponse = {
  items: TemplateItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function listTemplates(params: {
  q?: string
  sort?: 'latest' | 'likes'
  page?: number
  limit?: number
  authorId?: string
  scope?: 'public' | 'mine'
} = {}): Promise<TemplateListResponse> {
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.sort) query.set('sort', params.sort)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.authorId) query.set('authorId', params.authorId)
  if (params.scope) query.set('scope', params.scope)
  const res = await fetch(`${API_BASE_URL}/templates?${query.toString()}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`Failed to load templates: ${res.status}`)
  return (await res.json()) as TemplateListResponse
}

export async function createTemplate(body: {
  title: string
  description?: string
  code: string
  language: 'python' | 'typescript' | 'javascript'
  visibility?: 'public' | 'private'
}): Promise<TemplateItem> {
  const res = await fetch(`${API_BASE_URL}/templates`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Failed to create template: ${res.status}`)
  return (await res.json()) as TemplateItem
}

export async function toggleTemplateLike(id: string): Promise<{ liked: boolean; likes: number }> {
  const res = await fetch(`${API_BASE_URL}/templates/${id}/like`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`Failed to toggle like: ${res.status}`)
  return (await res.json()) as { liked: boolean; likes: number }
}

export async function getTemplate(id: string): Promise<TemplateItem> {
  const res = await fetch(`${API_BASE_URL}/templates/${id}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`Failed to fetch template: ${res.status}`)
  return (await res.json()) as TemplateItem
}

export async function updateTemplate(
  id: string,
  body: Partial<{
    title: string
    description?: string
    code: string
    language: 'python' | 'typescript' | 'javascript'
    visibility: 'public' | 'private'
  }>,
): Promise<TemplateItem> {
  const res = await fetch(`${API_BASE_URL}/templates/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Failed to update template: ${res.status}`)
  return (await res.json()) as TemplateItem
}

export async function deleteTemplate(id: string): Promise<{ deleted: true }> {
  const res = await fetch(`${API_BASE_URL}/templates/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`Failed to delete template: ${res.status}`)
  return (await res.json()) as { deleted: true }
}

// sharing API removed

export type UserSearchItem = {
  _id: string
  name?: string
  email?: string
  avatarUrl?: string
}

export async function searchUsers(q: string, limit = 10): Promise<UserSearchItem[]> {
  const query = new URLSearchParams({ q, limit: String(limit) })
  const res = await fetch(`${API_BASE_URL}/users/search?${query.toString()}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`Failed to search users: ${res.status}`)
  return (await res.json()) as UserSearchItem[]
}
