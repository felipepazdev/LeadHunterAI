const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('leadhunter_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Token inválido — limpa e redireciona
    if (typeof window !== 'undefined') {
      localStorage.removeItem('leadhunter_token');
      localStorage.removeItem('leadhunter_user');
      window.location.href = '/login';
    }
    throw new Error('Sessão expirada');
  }

  const data = await res.json();

  if (!res.ok) {
    // Repassa a mensagem de erro da API
    const msg =
      data?.message ||
      data?.errors?.map((e: { message: string }) => e.message).join(', ') ||
      'Erro desconhecido';
    throw new Error(msg);
  }

  return data as T;
}

/* ───── AUTH ───── */
export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string }) =>
      request<{ token: string; user: { id: string; name: string; email: string } }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(body) }
      ),

    login: (body: { email: string; password: string }) =>
      request<{ token: string; user: { id: string; name: string; email: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify(body) }
      ),

    me: () =>
      request<{ user: { id: string; name: string; email: string } }>('/auth/me'),
  },

  /* ───── USERS ───── */
  users: {
    getById: (id: string) =>
      request<{ user: import('../types').User }>(`/users/${id}`),

    getWithLeads: (id: string) =>
      request<{ user: import('../types').UserWithLeads }>(`/users/${id}/leads`),

    getWithHistory: (id: string) =>
      request<{ user: import('../types').UserWithHistory }>(`/users/${id}/history`),

    update: (id: string, body: { name?: string; email?: string; password?: string }) =>
      request<{ message: string; user: import('../types').User }>(
        `/users/${id}`,
        { method: 'PUT', body: JSON.stringify(body) }
      ),

    delete: (id: string) =>
      request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
  },

  /* ───── LEADS ───── */
  leads: {
    /** Lista todos os leads — suporta query params: status, search, page, limit */
    getAll: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
      const qs = params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString() : '';
      return request<{ leads: import('../types').Lead[]; pagination: { total: number; page: number; limit: number; pages: number } }>(`/leads${qs}`);
    },

    /** Busca um lead por ID */
    getById: (id: string) =>
      request<import('../types').Lead>(`/leads/${id}`),

    /** Cria um novo lead */
    create: (body: {
      name: string;
      phone?: string;
      website?: string;
      googleMapsLink?: string;
      address?: string;
      rating?: number;
      reviewsCount?: number;
      searchQuery?: string;
      notes?: string;
    }) =>
      request<import('../types').Lead>('/leads', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    /** Atualiza qualquer campo do lead */
    update: (id: string, body: {
      name?: string;
      phone?: string;
      website?: string;
      googleMapsLink?: string;
      address?: string;
      rating?: number;
      reviewsCount?: number;
      notes?: string;
      status?: import('../types').LeadStatus;
    }) =>
      request<import('../types').Lead>(`/leads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),

    /** Atalho rápido para mudar só o status */
    updateStatus: (id: string, status: import('../types').LeadStatus) =>
      request<import('../types').Lead>(`/leads/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),

    /** Remove um lead */
    delete: (id: string) =>
      request<{ message: string }>(`/leads/${id}`, { method: 'DELETE' }),

    /** Remove múltiplos leads de uma vez */
    deleteMany: (ids: string[]) =>
      request<{ message: string }>('/leads', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      }),

    /** Realiza a busca de leads no backend (scrapper) e salva no histórico */
    search: (body: { keyword: string; city: string }) =>
      request<Array<{
        name: string;
        phone?: string;
        website?: string;
        googleMapsLink?: string;
        address?: string;
        rating?: number;
        reviewsCount?: number;
      }>>('/leads/search', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  /* ───── HISTÓRICO DE BUSCAS ───── */
  searchHistory: {
    /** Salva uma pesquisa realizada no histórico do usuário */
    save: (body: { keyword: string; city: string; resultsCount?: number }) =>
      request<import('../types').SearchHistory>('/leads/search-history', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
};

