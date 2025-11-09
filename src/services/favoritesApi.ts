import { apiGet, apiPost, apiDelete } from '@/lib/api';
import type { Tool } from '@/types';

export interface FavoritesListResponse {
  items: Tool[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export const favoritesApi = {
  list: (params: { page?: number; limit?: number; q?: string; category?: string }) =>
    apiGet<FavoritesListResponse>('/favorites', params),
  add: (tool_id: string) => apiPost('/favorites', { tool_id }),
  remove: (toolId: string) => apiDelete(`/favorites/${toolId}`),
  exists: async (toolId: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/favorites/${toolId}/exists`, {
      method: 'GET',
      headers: {
        ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}),
      },
    });
    return res.json();
  }
};
