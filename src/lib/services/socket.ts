import { io, type Socket } from 'socket.io-client';
import { browser } from '$app/environment';
import type { Message, User } from '../types.js';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event listeners
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    // Auto-connect if user is authenticated (only in browser)
    if (browser) {
      this.checkAndConnect();
    }
  }

  private checkAndConnect() {
    if (!browser) return;

    const token = localStorage.getItem('auth_token');
    if (token && !this.isConnected) {
      this.connect(token);
    }
  }

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io('http://localhost:3002', {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }
      
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
      this.emit('connection_error', error);
      this.handleReconnect();
    });

    // Message events
    this.socket.on('new_message', (data: { message: Message }) => {
      console.log('📨 New message received:', data.message);
      this.emit('new_message', data.message);
    });

    // User status events
    this.socket.on('user_online', (data: { userId: string; username: string }) => {
      console.log('🟢 User online:', data.username);
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data: { userId: string; username: string; lastSeen: Date }) => {
      console.log('🔴 User offline:', data.username);
      this.emit('user_offline', data);
    });

    // Typing events
    this.socket.on('user_typing', (data: { userId: string; username: string; conversationId: string }) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data: { userId: string; username: string; conversationId: string }) => {
      this.emit('user_stopped_typing', data);
    });

    // Read receipts
    this.socket.on('messages_read', (data: { userId: string; conversationId: string; messageIds: string[] }) => {
      this.emit('messages_read', data);
    });

    // Conversation events
    this.socket.on('user_joined_conversation', (data: { userId: string; username: string; conversationId: string }) => {
      this.emit('user_joined_conversation', data);
    });

    this.socket.on('user_left_conversation', (data: { userId: string; username: string; conversationId: string }) => {
      this.emit('user_left_conversation', data);
    });

    // Error events
    this.socket.on('error', (error: { message: string }) => {
      console.error('🚨 Socket error:', error);
      this.emit('error', error);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('max_reconnect_attempts_reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      if (browser) {
        const token = localStorage.getItem('auth_token');
        if (token) {
          this.connect(token);
        }
      }
    }, delay);
  }

  // Event emitter methods
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.eventListeners.delete(event);
      return;
    }

    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Socket actions
  joinConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  sendMessage(messageData: {
    conversationId: string;
    content: string;
    type?: string;
    replyTo?: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', messageData);
    }
  }

  startTyping(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { conversationId });
    }
  }

  stopTyping(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { conversationId });
    }
  }

  markMessagesAsRead(conversationId: string, messageIds: string[]) {
    if (this.socket?.connected) {
      this.socket.emit('mark_messages_read', { conversationId, messageIds });
    }
  }

  updateStatus(status: string) {
    if (this.socket?.connected) {
      this.socket.emit('update_status', { status });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
    }
  }

  // Getters
  get connected() {
    return this.isConnected && this.socket?.connected;
  }

  get socketId() {
    return this.socket?.id;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
