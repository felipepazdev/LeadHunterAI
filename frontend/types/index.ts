export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    leads: number;
    searchHistory: number;
  };
}

export type LeadStatus = 'FOUND' | 'CONTACTED' | 'REPLIED' | 'MEETING' | 'CLIENT';

export interface Lead {
  id: string;
  name: string;
  phone:          string | null;
  website:        string | null;
  googleMapsLink: string | null;
  address:        string | null;   // novo
  rating:         number | null;
  reviewsCount:   number | null;
  searchQuery:    string | null;   // novo — origem da busca (ex: "Academia - SP")
  notes:          string | null;   // novo — anotações do usuário
  status:   LeadStatus;
  userId:   string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchHistory {
  id:           string;
  keyword:      string;
  city:         string;
  resultsCount: number;   // novo
  userId:       string;
  createdAt:    string;
}

export interface UserWithHistory {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  searchHistory: SearchHistory[];
}

export interface UserWithLeads {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  leads: Lead[];
}

export interface SearchResult {
  name: string;
  phone?: string;
  website?: string;
  googleMapsLink?: string;
  rating?: number;
  reviewsCount?: number;
  address?: string;
  instagram?: string | null;
}

export interface ApiError {
  message?: string;
  errors?: { field: string; message: string }[];
}

export interface LeadPagination {
  total: number;
  page:  number;
  limit: number;
  pages: number;
}
