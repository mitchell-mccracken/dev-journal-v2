import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, type User, type LoginData, type SignupData } from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const setAuth = (newToken: string, newUser: User) => {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('token', newToken);
  };

  const clearAuth = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  };

  const login = async (data: LoginData) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await authApi.login(data);
      setAuth(response.data.token, response.data.user);
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const signup = async (data: SignupData) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await authApi.signup(data);
      setAuth(response.data.token, response.data.user);
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Signup failed';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const fetchUser = async () => {
    if (!token.value) return false;
    
    loading.value = true;
    try {
      const response = await authApi.me();
      user.value = response.data.user;
      return true;
    } catch {
      clearAuth();
      return false;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    clearAuth();
  };

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    signup,
    logout,
    fetchUser,
  };
});
