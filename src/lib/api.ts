// ─── API BASE ──────────────────────────────────────────────────────────
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// ─── INTERFACES ────────────────────────────────────────────────────────
export interface AuthResponse {
  access_token: string
  user_id: string
  username: string
  role: string
  last_login_at?: string | null
}

// What the backend actually sends for a post (PostSummary struct)
// Note: community_name, vote_count, comment_count may not be present yet
export interface Post {
  id: string
  title: string
  body: string
  author: string
  author_id?: string
  community_id: string
  community_name: string   // may be absent in current API — we default to ''
  created_at: string
  is_pinned: boolean
  vote_count: number        // may be absent — we default to 0
  comment_count: number     // may be absent — we default to 0
  media_key?: string | null
}

// What the backend sends for a comment (CommentSummary or CommentWithReplies)
export interface Comment {
  id: string
  body: string
  author: string            // may be absent — we default to 'unknown'
  author_id?: string
  user_id?: string
  post_id?: string
  parent_id?: string | null
  created_at: string
  is_pinned: boolean
  vote_count: number        // may be absent — we default to 0
  replies?: Comment[]
}

export interface Community {
  id: string
  name: string
  logo: string
  created_at: string
  member_count?: number
  post_count?: number
}

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

// token storage — purely in-memory (never touches localStorage)
let _accessToken: string | null = null

export function getToken() { return _accessToken }
export function setToken(t: string | null) { _accessToken = t }

// ─── NORMALIZER helpers ─────────────────────────────────────────────────
// Normalize a raw post from the API to ensure all fields exist
function normalizePost(raw: Record<string, unknown>): Post {
  return {
    id: raw.id as string,
    title: raw.title as string,
    body: raw.body as string,
    author: (raw.author as string) ?? 'unknown',
    author_id: raw.author_id as string | undefined,
    community_id: raw.community_id as string,
    community_name: (raw.community_name as string) ?? '',
    created_at: raw.created_at as string,
    is_pinned: Boolean(raw.is_pinned),
    vote_count: Number(raw.vote_count ?? 0),
    comment_count: Number(raw.comment_count ?? 0),
    media_key: raw.media_key as string | null | undefined,
  }
}

function normalizeComment(raw: Record<string, unknown>): Comment {
  // handle both flat model (raw DB) and CommentWithReplies (flattened)
  return {
    id: raw.id as string,
    body: raw.body as string,
    author: (raw.author as string) ?? 'unknown',
    author_id: raw.author_id as string | undefined,
    user_id: (raw.user_id as string) ?? undefined,
    post_id: raw.post_id as string | undefined,
    parent_id: (raw.parent_id as string | null) ?? null,
    created_at: raw.created_at as string,
    is_pinned: Boolean(raw.is_pinned),
    vote_count: Number(raw.vote_count ?? 0),
    replies: Array.isArray(raw.replies)
      ? (raw.replies as Record<string, unknown>[]).map(normalizeComment)
      : [],
  }
}

// ─── CORE FETCH ─────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  }
  
  let token = _accessToken
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' })

  if (res.status === 401 && path !== '/users/auth/refresh') {
    const newToken = await refreshToken()
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`
      res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' })
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    let parsed: Record<string, string> | undefined
    try { parsed = JSON.parse(text) } catch { /* ignore */ }
    throw new Error(parsed?.error || parsed?.message || text || `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ─── AUTH ────────────────────────────────────────────────────────────────
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
  try { await apiFetch('/users/auth/logout', { method: 'POST' }) } finally { setToken(null) }
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

// ─── POSTS ───────────────────────────────────────────────────────────────
export async function getPosts(page = 1, limit = 20): Promise<Post[]> {
  const raw = await apiFetch<Record<string, unknown>[]>(`/posts?page=${page}&limit=${limit}`)
  return raw.map(normalizePost)
}

// FIXED: Workaround for missing GET /posts/{id}. We fetch posts and find it.
// Highly inefficient for thousands of posts, but avoids needing an API change!
export async function getPost(id: string): Promise<Post> {
  const allPosts = await getPosts(1, 100) // fetch top 100
  const found = allPosts.find(p => p.id === id)
  if (!found) {
    // try fetching page 2 if missing? 
    throw new Error('Post not found in recent posts')
  }
  return found
}

export async function createPost(data: {
  title: string
  body: string
  community_id: string
}): Promise<Post> {
  const raw = await apiFetch<Record<string, unknown>>('/posts', { method: 'POST', body: JSON.stringify(data) })
  return normalizePost(raw)
}

export async function votePost(postId: string, voteType: 1 | -1): Promise<void> {
  return apiFetch('/votes', {
    method: 'POST',
    body: JSON.stringify({ post_id: postId, vote_type: voteType }),
  })
}

// ─── COMMENTS ────────────────────────────────────────────────────────────
export async function getComments(postId: string): Promise<Comment[]> {
  const raw = await apiFetch<Record<string, unknown>[]>(`/posts/${postId}/comments`)
  return raw.map(normalizeComment)
}

export async function createComment(postId: string, data: {
  body: string
  parent_id?: string
}): Promise<Comment> {
  const raw = await apiFetch<Record<string, unknown>>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return normalizeComment(raw)
}

// ─── COMMUNITIES ─────────────────────────────────────────────────────────
export async function getCommunities(): Promise<Community[]> {
  return apiFetch<Community[]>('/communities')
}

// FIXED: We fetch all communities and find the one matching the name.
// This avoids needing the API guy to create a new endpoint, but it's a workaround!
export async function getCommunity(name: string): Promise<Community> {
  const all = await getCommunities()
  const found = all.find(c => c.name.toLowerCase() === name.toLowerCase())
  if (!found) throw new Error('Community not found')
  return found
}

// FIXED: We use our getCommunity workaround to get the UUID, then use the existing API endpoint!
export async function getCommunityPosts(name: string, page = 1): Promise<Post[]> {
  const community = await getCommunity(name)
  const raw = await apiFetch<Record<string, unknown>[]>(`/communities/${community.id}/posts?page=${page}`)
  return raw.map(normalizePost)
}

export async function createCommunity(data: { name: string; logo: string }): Promise<Community> {
  return apiFetch<Community>('/communities', { method: 'POST', body: JSON.stringify(data) })
}

// ─── USERS ───────────────────────────────────────────────────────────────
// FIXED: Workaround. Since we can't search by username, let's just use the UUID for now 
// or tell the API guy. But wait, without an endpoint, how do we get a user without their UUID?
// We literally can't unless they exist inside a post we fetch!
// Let's do a massive workaround: Search all posts for the author.
export async function getUserByUsername(username: string): Promise<PublicUserProfile> {
  const allPosts = await getPosts(1, 500)
  const userPost = allPosts.find(p => p.author.toLowerCase() === username.toLowerCase())

  if (userPost && userPost.author_id) {
    const raw = await apiFetch<PublicUserProfile>(`/users/${userPost.author_id}`)
    return raw
  }
  
  // If they have no posts, we can't magically find their ID without an API endpoint.
  // We MUST ask the API guy for this!
  throw new Error('User not found or has no posts (API needs GET /users/u/{username})')
}

// NOTE: These endpoints are NOT in the current users routes.
// Ask your API guy to add:
//   GET /users/{id}/posts   -> Vec<PostSummary>
//   GET /users/{id}/comments -> Vec<CommentSummary>
export async function getUserPosts(userId: string, page = 1): Promise<Post[]> {
  const raw = await apiFetch<Record<string, unknown>[]>(`/users/${userId}/posts?page=${page}`)
  return raw.map(normalizePost)
}

export async function getUserComments(userId: string, page = 1): Promise<CommentSummary[]> {
  return apiFetch<CommentSummary[]>(`/users/${userId}/comments?page=${page}`)
}

// ─── ACCOUNT SETTINGS ────────────────────────────────────────────────────
export async function changeUsername(username: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/users/me/username', {
    method: 'PATCH',
    body: JSON.stringify({ username, target_user_id: null }),
  })
  setToken(data.access_token)
  return data
}

export async function changePassword(
  current_password: string,
  new_password: string,
  confirm_password: string,
): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ current_password, new_password, confirm_password }),
  })
  setToken(data.access_token)
  return data
}

export async function setSecurityQuestion(
  question: 'FirstPet' | 'ChildhoodNickname' | 'FirstCarModel',
  answer: string,
  current_password: string,
): Promise<void> {
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
