export interface User {
	id: string;
	email: string;
	username: string;
	avatar?: string;
	isOnline: boolean;
	lastSeen?: Date;
	userType?: 'user' | 'admin';
	role?: string;
	permissions?: string[];
	fullName?: string;
}

export interface Message {
	id: string;
	senderId: string;
	senderName?: string;
	receiverId?: string;
	conversationId: string;
	content: string;
	timestamp: Date;
	isRead: boolean;
	isDelivered?: boolean;
	type: 'text' | 'image' | 'file';
}

export interface Conversation {
	id: string;
	participants: User[];
	lastMessage?: Message;
	unreadCount: number;
	updatedAt: Date;
	type?: 'direct' | 'group';
	name?: string;
	description?: string;
	avatar?: string;
	createdBy?: string;
}

export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

export interface ChatState {
	conversations: Conversation[];
	activeConversation: Conversation | null;
	messages: Message[];
	isLoading: boolean;
}
