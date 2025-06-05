import { browser } from '$app/environment';

// API Configuration
const API_BASE_URL = 'http://localhost:3002/api';

// API Response Types
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    value: any;
  }>;
}

// API Error Class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API Request Function
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage (only in browser)
  const token = browser ? localStorage.getItem('auth_token') : null;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'Request failed',
        response.status,
        data.errors
      );
    }

    if (!data.success) {
      throw new ApiError(
        data.message || 'API request failed',
        response.status,
        data.errors
      );
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

// Authentication API
export const authApi = {


  async login(credentials: {
    identifier: string;
    password: string;
  }) {
    const response = await apiRequest<{
      user: any;
      token: string;
      userType?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store token and user data (only in browser)
    if (browser) {
      localStorage.setItem('auth_token', response.token);
      // Store user data with userType for proper handling
      const userDataToStore = {
        ...response.user,
        userType: response.userType || 'user'
      };
      localStorage.setItem('auth_user', JSON.stringify(userDataToStore));
    }

    return response;
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      });
    } finally {
      // Always clear local storage (only in browser)
      if (browser) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  },

  async getCurrentUser() {
    return await apiRequest<{ user: any }>('/auth/me');
  },

  async refreshToken() {
    const response = await apiRequest<{ token: string }>('/auth/refresh', {
      method: 'POST',
    });
    
    if (browser) {
      localStorage.setItem('auth_token', response.token);
    }
    return response;
  }
};

// Users API
export const usersApi = {
  async getAllUsers(limit = 50) {
    return await apiRequest<{ users: any[] }>(`/users?limit=${limit}`);
  },

  async searchUsers(query: string, limit = 10) {
    return await apiRequest<{ users: any[] }>(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  async getUserProfile(userId: string) {
    return await apiRequest<{ user: any }>(`/users/${userId}`);
  },

  async updateProfile(profileData: {
    username?: string;
    email?: string;
    avatar?: string;
  }) {
    return await apiRequest<{ user: any }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return await apiRequest('/users/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },

  async getOnlineUsers() {
    return await apiRequest<{ users: any[] }>('/users/online');
  }
};

// Conversations API
export const conversationsApi = {
  async getConversations() {
    return await apiRequest<{ conversations: any[] }>('/conversations');
  },

  async createConversation(conversationData: {
    participants: string[];
    type?: 'direct' | 'group';
    name?: string;
    description?: string;
  }) {
    return await apiRequest<{ conversation: any }>('/conversations', {
      method: 'POST',
      body: JSON.stringify(conversationData),
    });
  },

  async getConversation(conversationId: string) {
    return await apiRequest<{ conversation: any }>(`/conversations/${conversationId}`);
  },

  async updateConversation(conversationId: string, updateData: {
    name?: string;
    description?: string;
  }) {
    return await apiRequest<{ conversation: any }>(`/conversations/${conversationId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  async leaveConversation(conversationId: string) {
    return await apiRequest(`/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  },

  async addParticipant(conversationId: string, userId: string) {
    return await apiRequest<{ conversation: any }>(`/conversations/${conversationId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  // Group member management
  async getGroupMembers(conversationId: string) {
    return await apiRequest<{
      conversation: any;
      members: any[];
    }>(`/conversations/${conversationId}/members`);
  },

  async addGroupMembers(conversationId: string, userIds: string[]) {
    return await apiRequest<{
      addedUsers: any[];
      alreadyMembers: any[];
      totalMembers: number;
    }>(`/conversations/${conversationId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  },

  async removeGroupMember(conversationId: string, userId: string) {
    return await apiRequest<{
      removedUser: any;
      remainingMembers: number;
    }>(`/conversations/${conversationId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  async getAvailableUsers(conversationId: string) {
    return await apiRequest<{
      availableUsers: any[];
    }>(`/conversations/${conversationId}/available-users`);
  }
};

// Messages API
export const messagesApi = {
  async getMessages(conversationId: string, page = 1, limit = 50) {
    return await apiRequest<{
      messages: any[];
      pagination: {
        page: number;
        limit: number;
        hasMore: boolean;
      };
    }>(`/messages/${conversationId}?page=${page}&limit=${limit}`);
  },

  async sendMessage(messageData: {
    conversationId: string;
    content: string;
    type?: 'text' | 'image' | 'file';
    replyTo?: string;
  }) {
    return await apiRequest<{ message: any }>('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  async editMessage(messageId: string, content: string) {
    return await apiRequest<{ message: any }>(`/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  async deleteMessage(messageId: string) {
    return await apiRequest(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  async markAsRead(messageId: string) {
    return await apiRequest(`/messages/${messageId}/read`, {
      method: 'POST',
    });
  }
};

// Admin Users API
export const adminUsersApi = {
  async getAllUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    return await apiRequest<{
      users: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalUsers: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        limit: number;
      };
    }>(`/admin/users?${queryParams.toString()}`);
  },

  async getUser(userId: string) {
    return await apiRequest<{ user: any }>(`/admin/users/${userId}`);
  },

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
  }) {
    return await apiRequest<{ user: any }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(userId: string, userData: {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
  }) {
    return await apiRequest<{ user: any }>(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(userId: string) {
    return await apiRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  async toggleUserStatus(userId: string) {
    return await apiRequest<{ user: any }>(`/admin/users/${userId}/toggle-status`, {
      method: 'POST',
    });
  },

  async getUserStats() {
    return await apiRequest<{
      stats: {
        totalUsers: number;
        activeUsers: number;
        inactiveUsers: number;
        onlineUsers: number;
        newUsers: number;
      };
    }>('/admin/users/stats/overview');
  }
};

// Admin Conversations API
export const adminConversationsApi = {
  async getAllConversations(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: 'direct' | 'group' | '';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.type) queryParams.append('type', params.type);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    return await apiRequest<{
      conversations: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalConversations: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        limit: number;
      };
    }>(`/admin/conversations?${queryParams.toString()}`);
  },

  async getConversation(conversationId: string) {
    return await apiRequest<{
      conversation: any;
      messages: any[];
    }>(`/admin/conversations/${conversationId}`);
  },

  async deleteConversation(conversationId: string) {
    return await apiRequest<{
      deletedMessages: number;
    }>(`/admin/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  },

  async deleteAllConversations() {
    return await apiRequest<{
      deletedConversations: number;
      deletedMessages: number;
    }>('/admin/conversations/bulk/all', {
      method: 'DELETE',
    });
  },

  async deleteConversationsByType(type: 'direct' | 'group') {
    return await apiRequest<{
      deletedConversations: number;
      deletedMessages: number;
    }>(`/admin/conversations/bulk/type/${type}`, {
      method: 'DELETE',
    });
  },

  async deleteConversationMessages(conversationId: string) {
    return await apiRequest<{
      deletedMessages: number;
    }>(`/admin/conversations/${conversationId}/messages`, {
      method: 'DELETE',
    });
  },

  async getConversationStats() {
    return await apiRequest<{
      stats: {
        totalConversations: number;
        directChats: number;
        groupChats: number;
        totalMessages: number;
        recentMessages: number;
        activeConversations: number;
      };
    }>('/admin/conversations/stats/overview');
  }
};

// Health Check
export const healthApi = {
  async checkHealth() {
    return await apiRequest('/health');
  }
};
