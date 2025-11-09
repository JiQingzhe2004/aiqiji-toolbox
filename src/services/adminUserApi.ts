import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface AdminUser {
  id: string;
  username: string;
  email?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  avatar_file?: string | null;
  role: UserRole;
  status: UserStatus;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
}

export interface UserListResponse {
  users: AdminUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  }
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  q?: string;
  role?: UserRole;
  status?: UserStatus | 'all';
  sort?: 'latest' | 'name';
}

export const adminUserApi = {
  list: (params: ListUsersParams) => apiGet<UserListResponse>('/users', params),
  create: (data: Partial<AdminUser> & { password: string }) => apiPost<{ user: AdminUser }>('/users', data),
  update: (id: string, data: Partial<AdminUser>) => apiPut<{ user: AdminUser }>(`/users/${id}`, data),
  resetPassword: (id: string, newPassword: string) => apiPost(`/users/${id}/reset-password`, { newPassword }),
  updateStatus: (id: string, status: UserStatus) => apiPatchUserStatus(id, status),
  delete: (id: string) => apiDelete(`/users/${id}`),
  uploadAvatar: async (id: string, file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${id}/avatar`, {
      method: 'POST',
      headers: {
        ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}),
      },
      body: form
    });
    return res.json();
  }
};

// helper for PATCH not directly provided in lib/api
async function apiPatchUserStatus(id: string, status: UserStatus) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}),
    },
    body: JSON.stringify({ status })
  });
  return res.json();
}
