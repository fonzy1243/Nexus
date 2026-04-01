// i did local muna (we can swap in real API calls later when ready)
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface AuthResponse {
  access_token: string
  user_id: string
  username: string
  role: string
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

// token storage — purely in-memory (never touches localStorage)
let _accessToken: string | null = null

export function getToken() { return _accessToken }
export function setToken(t: string | null) { _accessToken = t }

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  }
  
  let token = _accessToken
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  // If unauthorized and NOT already trying to refresh, attempt automatic token refresh
  if (res.status === 401 && path !== '/users/auth/refresh') {
    const newToken = await refreshToken()
    if (newToken) {
      // Update the header with the fresh token and retry exactly once
      headers['Authorization'] = `Bearer ${newToken}`
      res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
        credentials: 'include',
      })
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    let parsed
    try { parsed = JSON.parse(text) } catch { /* ignore */ }
    throw new Error(parsed?.error || parsed?.message || text || `HTTP ${res.status}`)
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
    const res = await fetch(`${API_BASE}/users/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    
    if (!res.ok) throw new Error('Refresh failed')
      
    const data = await res.json()
    setToken(data.access_token)
    return data.access_token
  } catch {
    setToken(null)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:logout'))
    }
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

// User profiles & settings

export interface PublicUserProfile {
  id: string
  username: string
  created_at: string
}

export interface CommentSummary {
  id: string
  body: string
  created_at: string
  post_id: string
  post_title: string
  author: string
}

export async function getUserByUsername(username: string): Promise<PublicUserProfile> {
  return apiFetch(`/users/by-username/${encodeURIComponent(username)}`)
}

export async function getUserComments(userId: string, page = 1): Promise<CommentSummary[]> {
  return apiFetch(`/users/${userId}/comments?page=${page}`)
}

export async function getUserPosts(userId: string, page = 1): Promise<Post[]> {
  return apiFetch(`/users/${userId}/posts?page=${page}`)
}

export async function changeUsername(username: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/users/me/username', {
    method: 'PATCH',
    body: JSON.stringify({ username, target_user_id: null }),
  })
  setToken(data.access_token)
  return data
}

export async function changePassword(current_password: string, new_password: string, confirm_password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ current_password, new_password, confirm_password }),
  })
  setToken(data.access_token)
  return data
}

export async function setSecurityQuestion(question: 'firstPet' | 'childhoodNickname' | 'firstCarModel', answer: string, current_password: string): Promise<void> {
  return apiFetch('/users/me/security-question', {
    method: 'POST',
    body: JSON.stringify({ question, answer, current_password }),
  })
}

// search

export interface SearchUserResult {
  id: string
  username: string
  created_at: string
}

export interface SearchPostResult {
  id: string
  title: string
  body: string
  author: string
  author_id: string
  community_id: string
  is_pinned: boolean
  created_at: string
}

export interface SearchResults {
  users: SearchUserResult[]
  posts: SearchPostResult[]
}

export async function search(q: string, page = 1): Promise<SearchResults> {
  return apiFetch(`/search?q=${encodeURIComponent(q)}&page=${page}`)
}

// admin

export interface LogEntry {
  id: string
  actor_id: string
  action: string
  target_type: string
  target_id: string
  created_at: string
}

export async function getAdminLogs(): Promise<LogEntry[]> {
  return apiFetch('/logs/')
}
