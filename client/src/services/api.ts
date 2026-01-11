import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

// Camera types
export interface Camera {
  _id: string;
  make: string;
  name: string;
  format?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CameraInput {
  make: string;
  name: string;
  format?: string;
  notes?: string;
}

// FilmStock types
export interface FilmStock {
  _id: string;
  make: string;
  name: string;
  iso?: number;
  format?: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilmStockInput {
  make: string;
  name: string;
  iso?: number;
  format?: string;
  type?: string;
}

// ChemicalBatch types
export interface ChemicalBatch {
  _id: string;
  name: string;
  description?: string;
  chemicalType: string;
  status: string;
  notes?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChemicalBatchInput {
  name: string;
  description?: string;
  chemicalType: string;
  status?: string;
  notes?: string;
}

// FilmRoll types
export interface FilmRoll {
  _id: string;
  filmStock: FilmStock;
  camera?: Camera;
  chemicalBatch?: ChemicalBatch;
  dateLoaded?: string;
  dateFinished?: string;
  frameCount: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilmRollInput {
  filmStock: string;
  camera?: string;
  chemicalBatch?: string;
  dateLoaded?: string;
  dateFinished?: string;
  frameCount?: number;
  status?: string;
  notes?: string;
}

export const authApi = {
  login: (data: LoginData) => api.post<AuthResponse>('/auth/login', data),
  signup: (data: SignupData) => api.post<AuthResponse>('/auth/signup', data),
  me: () => api.get<{ user: User }>('/auth/me'),
};

export const camerasApi = {
  getAll: () => api.get<Camera[]>('/cameras'),
  getOne: (id: string) => api.get<Camera>(`/cameras/${id}`),
  create: (data: CameraInput) => api.post<Camera>('/cameras', data),
  update: (id: string, data: CameraInput) => api.put<Camera>(`/cameras/${id}`, data),
  delete: (id: string) => api.delete(`/cameras/${id}`),
};

export const filmStocksApi = {
  getAll: () => api.get<FilmStock[]>('/film-stocks'),
  getOne: (id: string) => api.get<FilmStock>(`/film-stocks/${id}`),
  create: (data: FilmStockInput) => api.post<FilmStock>('/film-stocks', data),
  update: (id: string, data: FilmStockInput) => api.put<FilmStock>(`/film-stocks/${id}`, data),
  delete: (id: string) => api.delete(`/film-stocks/${id}`),
};

export const chemicalBatchesApi = {
  getAll: (includeDeleted = false) => api.get<ChemicalBatch[]>(`/chemical-batches?includeDeleted=${includeDeleted}`),
  getOne: (id: string) => api.get<ChemicalBatch>(`/chemical-batches/${id}`),
  getRolls: (id: string) => api.get<FilmRoll[]>(`/chemical-batches/${id}/rolls`),
  create: (data: ChemicalBatchInput) => api.post<ChemicalBatch>('/chemical-batches', data),
  update: (id: string, data: ChemicalBatchInput) => api.put<ChemicalBatch>(`/chemical-batches/${id}`, data),
  delete: (id: string) => api.delete(`/chemical-batches/${id}`),
  restore: (id: string) => api.post<ChemicalBatch>(`/chemical-batches/${id}/restore`),
};

export const filmRollsApi = {
  getAll: (status?: string) => api.get<FilmRoll[]>(`/film-rolls${status ? `?status=${status}` : ''}`),
  getOne: (id: string) => api.get<FilmRoll>(`/film-rolls/${id}`),
  create: (data: FilmRollInput) => api.post<FilmRoll>('/film-rolls', data),
  update: (id: string, data: FilmRollInput) => api.put<FilmRoll>(`/film-rolls/${id}`, data),
  delete: (id: string) => api.delete(`/film-rolls/${id}`),
};

export default api;
