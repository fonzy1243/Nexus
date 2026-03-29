
// i did local muna (we can swap in real API calls later when ready)
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export interface AuthResponse {
  access_token: string
  user_id: string
  username: string
  last_login_at?: string | null
}

export interface Post {
  id: string
  title: string
  body: string
  author: string
  community_id: string
  community_name: string
  created_at: string
  is_pinned: boolean
  vote_count: number
  comment_count: number
  media_key?: string | null
}

export interface Comment {
  id: string
  body: string
  author: string
  user_id: string
  post_id: string
  parent_id?: string | null
  created_at: string
  is_pinned: boolean
  vote_count: number
  replies?: Comment[]
}

export interface Community {
  id: string
  name: string
  logo: string
  created_at: string
  member_count: number
  post_count: number
}

// token storage (in memory)
let _accessToken: string | null = null

export function getToken() { return _accessToken }
export function setToken(t: string | null) { _accessToken = t }

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  }
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include', // needed for refresh_token cookie
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/users/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.access_token)
  return data
}

export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/users/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  })
  setToken(data.access_token)
  return data
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/users/auth/logout', { method: 'POST' })
  } finally {
    setToken(null)
  }
}

export async function refreshToken(): Promise<string | null> {
  try {
    const data = await apiFetch<{ access_token: string }>('/users/auth/refresh', {
      method: 'POST',
    })
    setToken(data.access_token)
    return data.access_token
  } catch {
    setToken(null)
    return null
  }
}

// posts

export async function getPosts(page = 1, limit = 20): Promise<Post[]> {
  return apiFetch(`/posts?page=${page}&limit=${limit}`)
}

export async function getPost(id: string): Promise<Post> {
  return apiFetch(`/posts/${id}`)
}

export async function createPost(data: {
  title: string
  body: string
  community_id: string
}): Promise<Post> {
  return apiFetch('/posts', { method: 'POST', body: JSON.stringify(data) })
}

export async function votePost(postId: string, voteType: 1 | -1): Promise<void> {
  return apiFetch(`/votes`, {
    method: 'POST',
    body: JSON.stringify({ post_id: postId, vote_type: voteType }),
  })
}

// comments

export async function getComments(postId: string): Promise<Comment[]> {
  return apiFetch(`/posts/${postId}/comments`)
}

export async function createComment(data: {
  post_id: string
  body: string
  parent_id?: string
}): Promise<Comment> {
  return apiFetch('/comments', { method: 'POST', body: JSON.stringify(data) })
}

// commus

export async function getCommunities(): Promise<Community[]> {
  return apiFetch('/communities')
}

export async function getCommunity(name: string): Promise<Community> {
  return apiFetch(`/communities/${name}`)
}

export async function getCommunityPosts(name: string, page = 1): Promise<Post[]> {
  return apiFetch(`/communities/${name}/posts?page=${page}`)
}
