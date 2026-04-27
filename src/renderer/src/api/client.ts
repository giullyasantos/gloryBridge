/**
 * API client for the local Express backend (http://localhost:3001/api/v1/).
 * All functions return typed data or throw on error.
 */

const BASE = 'http://localhost:3001/api/v1'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API error ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

import type {
  Song,
  Scripture,
  BibleVersion,
  MediaFile,
  ServicePlan,
  ServiceItem,
  ServiceItemType,
  AppSettings
} from '../types'

export const api = {
  // ─── Health ────────────────────────────────────────────────────────────────
  health: {
    check: () => request<{ status: string }>('/health')
  },

  // ─── Songs ─────────────────────────────────────────────────────────────────
  songs: {
    list: (search?: string) =>
      request<Song[]>(`/songs${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    get: (id: string) => request<Song>(`/songs/${id}`),
    create: (data: Partial<Song>) =>
      request<Song>('/songs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Song>) =>
      request<Song>(`/songs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/songs/${id}`, { method: 'DELETE' }),
    translate: (id: string, targetLanguage: string) =>
      request<Song>(`/songs/${id}/translate`, {
        method: 'POST',
        body: JSON.stringify({ targetLanguage })
      })
  },

  // ─── Scriptures ────────────────────────────────────────────────────────────
  scriptures: {
    list: () => request<Scripture[]>('/scriptures'),
    search: (query: string, version?: BibleVersion) =>
      request<Scripture[]>(
        `/scriptures/search?q=${encodeURIComponent(query)}${version ? `&version=${version}` : ''}`
      ),
    versions: () => request<BibleVersion[]>('/scriptures/versions'),
    save: (data: Partial<Scripture>) =>
      request<Scripture>('/scriptures', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/scriptures/${id}`, { method: 'DELETE' })
  },

  // ─── Services ──────────────────────────────────────────────────────────────
  services: {
    list: () => request<ServicePlan[]>('/services'),
    get: (id: string) => request<ServicePlan>(`/services/${id}`),
    create: (data: { title: string; date?: string }) =>
      request<ServicePlan>('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Pick<ServicePlan, 'title' | 'date' | 'notes'>>) =>
      request<ServicePlan>(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/services/${id}`, { method: 'DELETE' }),
    addItem: (
      planId: string,
      data: { type: ServiceItemType; refId?: string; text?: string }
    ) =>
      request<ServiceItem>(`/services/${planId}/items`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    removeItem: (planId: string, itemId: string) =>
      request<void>(`/services/${planId}/items/${itemId}`, { method: 'DELETE' }),
    reorder: (planId: string, itemIds: string[]) =>
      request<void>(`/services/${planId}/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ itemIds })
      })
  },

  // ─── Media ─────────────────────────────────────────────────────────────────
  media: {
    list: (type?: string) =>
      request<MediaFile[]>(`/media${type ? `?type=${type}` : ''}`),
    upload: (filePath: string) =>
      request<MediaFile>('/media/upload', { method: 'POST', body: JSON.stringify({ filePath }) }),
    delete: (id: string) => request<void>(`/media/${id}`, { method: 'DELETE' })
  },

  // ─── AI ────────────────────────────────────────────────────────────────────
  ai: {
    translate: (text: string, targetLanguage: string) =>
      request<{ translated: string }>('/ai/translate', {
        method: 'POST',
        body: JSON.stringify({ text, targetLanguage })
      }),
    suggest: (theme: string) =>
      request<{ songs: string[]; scriptures: string[] }>('/ai/suggest', {
        method: 'POST',
        body: JSON.stringify({ theme })
      }),
    createSong: (prompt: string) =>
      request<Partial<Song>>('/ai/create-song', {
        method: 'POST',
        body: JSON.stringify({ prompt })
      })
  },

  // ─── Settings ──────────────────────────────────────────────────────────────
  settings: {
    get: () => request<AppSettings>('/settings'),
    update: (data: Partial<AppSettings>) =>
      request<AppSettings>('/settings', { method: 'PUT', body: JSON.stringify(data) })
  }
}
