import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { AuthState, User } from '../types.js';
import { authApi, type ApiError } from '../services/api.js';
import { socketService } from '../services/socket.js';

// Create the auth store
function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: false
	});

	return {
		subscribe,
		login: async (email: string, password: string) => {
			update(state => ({ ...state, isLoading: true }));

			try {
				const response = await authApi.login({
					identifier: email,
					password
				});

				const user: User = {
					id: response.user._id,
					email: response.user.email,
					username: response.user.username,
					isOnline: response.user.isOnline,
					avatar: response.user.avatar,
					role: response.user.role || 'user'
				};

				set({
					user,
					isAuthenticated: true,
					isLoading: false
				});

				// Connect to Socket.io
				if (browser) {
					const token = localStorage.getItem('auth_token');
					if (token) {
						socketService.connect(token);
					}
				}

				return { success: true };
			} catch (error) {
				update(state => ({ ...state, isLoading: false }));
				const apiError = error as ApiError;
				return { success: false, error: apiError.message || 'Login failed' };
			}
		},
		
		signup: async (email: string, username: string, password: string) => {
			update(state => ({ ...state, isLoading: true }));

			try {
				const response = await authApi.register({
					username,
					email,
					password
				});

				const user: User = {
					id: response.user._id,
					email: response.user.email,
					username: response.user.username,
					isOnline: response.user.isOnline,
					avatar: response.user.avatar,
					role: response.user.role || 'user'
				};

				set({
					user,
					isAuthenticated: true,
					isLoading: false
				});

				// Connect to Socket.io
				if (browser) {
					const token = localStorage.getItem('auth_token');
					if (token) {
						socketService.connect(token);
					}
				}

				return { success: true };
			} catch (error) {
				update(state => ({ ...state, isLoading: false }));
				const apiError = error as ApiError;
				return { success: false, error: apiError.message || 'Signup failed' };
			}
		},
		
		logout: async () => {
			try {
				await authApi.logout();
			} catch (error) {
				console.error('Logout error:', error);
			} finally {
				// Disconnect socket
				socketService.disconnect();

				set({
					user: null,
					isAuthenticated: false,
					isLoading: false
				});
			}
		},
		
		checkAuth: async () => {
			if (!browser) return;

			const token = localStorage.getItem('auth_token');
			const storedUser = localStorage.getItem('auth_user');

			if (token && storedUser) {
				try {
					// Verify token with backend
					const response = await authApi.getCurrentUser();
					const user: User = {
						id: response.user._id,
						email: response.user.email,
						username: response.user.username,
						isOnline: response.user.isOnline,
						avatar: response.user.avatar,
						role: response.user.role || 'user'
					};

					set({
						user,
						isAuthenticated: true,
						isLoading: false
					});

					// Connect to Socket.io
					socketService.connect(token);
				} catch (error) {
					// Token is invalid, clear storage
					if (browser) {
						localStorage.removeItem('auth_token');
						localStorage.removeItem('auth_user');
					}
					set({
						user: null,
						isAuthenticated: false,
						isLoading: false
					});
				}
			} else {
				set({
					user: null,
					isAuthenticated: false,
					isLoading: false
				});
			}
		}
	};
}

export const authStore = createAuthStore();
