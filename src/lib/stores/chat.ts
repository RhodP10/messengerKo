import { writable } from 'svelte/store';
import type { ChatState, Conversation, Message, User } from '../types.js';
import { conversationsApi, messagesApi, type ApiError } from '../services/api.js';
import { socketService } from '../services/socket.js';

// Helper function to convert backend data to frontend types
function convertBackendUser(backendUser: any): User {
	return {
		id: backendUser._id,
		email: backendUser.email,
		username: backendUser.username,
		avatar: backendUser.avatar,
		isOnline: backendUser.isOnline,
		lastSeen: backendUser.lastSeen ? new Date(backendUser.lastSeen) : undefined
	};
}

function convertBackendMessage(backendMessage: any): Message {
	return {
		id: backendMessage._id,
		senderId: backendMessage.sender._id || backendMessage.sender,
		receiverId: '', // Will be determined from conversation participants
		content: backendMessage.content,
		timestamp: new Date(backendMessage.createdAt),
		isRead: backendMessage.readBy?.length > 0,
		type: backendMessage.type
	};
}

function convertBackendConversation(backendConversation: any): Conversation {
	const participants = backendConversation.participants.map(convertBackendUser);
	const lastMessage = backendConversation.lastMessage ? convertBackendMessage(backendConversation.lastMessage) : undefined;

	return {
		id: backendConversation._id,
		participants,
		lastMessage,
		unreadCount: backendConversation.unreadCount || 0,
		updatedAt: new Date(backendConversation.lastActivity || backendConversation.updatedAt),
		type: backendConversation.type || 'direct',
		name: backendConversation.name,
		description: backendConversation.description,
		avatar: backendConversation.avatar,
		createdBy: backendConversation.createdBy
	};
}

function createChatStore() {
	const { subscribe, set, update } = writable<ChatState>({
		conversations: [],
		activeConversation: null,
		messages: [],
		isLoading: false
	});

	let currentUserId: string | null = null;
	let processedMessageIds = new Set<string>();

	// Set up Socket.io event listeners
	socketService.on('new_message', (message: any) => {
		console.log('📨 Received new message via Socket.io:', message);
		console.log('📨 Message details:', {
			id: message._id,
			content: message.content,
			senderId: message.sender?._id || message.senderId,
			conversationId: message.conversationId || message.conversation
		});

		// COMPLETELY SKIP our own messages - we handle them through optimistic updates
		if (currentUserId && message.senderId === currentUserId) {
			console.log('⏭️ Skipping own message from Socket.io - handled by optimistic update');
			return;
		}

		const convertedMessage = convertBackendMessage(message);

		update(state => {
			// Only add message if it belongs to the active conversation
			if (state.activeConversation && message.conversationId === state.activeConversation.id) {
				console.log('✅ Adding OTHER USER message to active conversation:', convertedMessage);
				return {
					...state,
					messages: [...state.messages, convertedMessage]
				};
			}

			console.log('📝 Updating conversation list with new message');
			// Update conversation list with latest message
			const updatedConversations = state.conversations.map(conv => {
				if (conv.id === message.conversationId) {
					return {
						...conv,
						lastMessage: convertedMessage,
						unreadCount: state.activeConversation?.id === conv.id ? 0 : conv.unreadCount + 1
					};
				}
				return conv;
			});

			return {
				...state,
				conversations: updatedConversations
			};
		});
	});

	socketService.on('user_online', (data: { userId: string; username: string }) => {
		update(state => ({
			...state,
			conversations: state.conversations.map(conv => ({
				...conv,
				participants: conv.participants.map(p =>
					p.id === data.userId ? { ...p, isOnline: true } : p
				)
			}))
		}));
	});

	socketService.on('user_offline', (data: { userId: string; username: string; lastSeen: Date }) => {
		update(state => ({
			...state,
			conversations: state.conversations.map(conv => ({
				...conv,
				participants: conv.participants.map(p =>
					p.id === data.userId ? { ...p, isOnline: false, lastSeen: new Date(data.lastSeen) } : p
				)
			}))
		}));
	});

	return {
		subscribe,

		loadConversations: async (userId: string) => {
			currentUserId = userId; // Store the current user ID
			update(state => ({ ...state, isLoading: true }));

			try {
				const response = await conversationsApi.getConversations();
				const conversations = response.conversations.map(convertBackendConversation);

				update(state => ({
					...state,
					conversations,
					isLoading: false
				}));
			} catch (error) {
				console.error('Load conversations error:', error);
				update(state => ({ ...state, isLoading: false }));
			}
		},
		
		selectConversation: async (conversation: Conversation, userId: string) => {
			currentUserId = userId; // Store the current user ID
			// Clear messages immediately when switching conversations to prevent mixing
			update(state => ({ ...state, activeConversation: conversation, messages: [], isLoading: true }));

			try {
				// Join conversation room for real-time updates
				socketService.joinConversation(conversation.id);

				// Load messages for this conversation
				const response = await messagesApi.getMessages(conversation.id);
				const newMessages = response.messages.map(convertBackendMessage);

				update(state => {
					return {
						...state,
						messages: newMessages,
						isLoading: false
					};
				});

				// Mark unread messages as read
				const unreadMessages = newMessages.filter(msg =>
					msg.senderId !== currentUserId && !msg.isRead
				);

				if (unreadMessages.length > 0) {
					const messageIds = unreadMessages.map(msg => msg.id);
					socketService.markMessagesAsRead(conversation.id, messageIds);
				}
			} catch (error) {
				console.error('Select conversation error:', error);
				update(state => ({ ...state, isLoading: false }));
			}
		},
		
		sendMessage: async (content: string, conversationId: string, senderId: string) => {
			currentUserId = senderId; // Store the current user ID
			try {
				// Create optimistic message for immediate UI update
				const optimisticMessage: Message = {
					id: `temp-${Date.now()}`,
					content,
					senderId,
					conversationId,
					timestamp: new Date(),
					type: 'text',
					isRead: false,
					isDelivered: false
				};

				// Add optimistic message to current conversation
				update(state => {
					if (state.activeConversation?.id === conversationId) {
						return {
							...state,
							messages: [...state.messages, optimisticMessage]
						};
					}
					return state;
				});

				// Send via API for persistence and real-time delivery
				console.log('🚀 Sending message via API:', { conversationId, content });
				const response = await messagesApi.sendMessage({
					conversationId,
					content,
					type: 'text'
				});

				// Replace optimistic message with real message
				const realMessage = convertBackendMessage(response.message);
				update(state => {
					if (state.activeConversation?.id === conversationId) {
						return {
							...state,
							messages: state.messages.map(msg =>
								msg.id === optimisticMessage.id ? realMessage : msg
							)
						};
					}
					return state;
				});

				// Update conversations list to move this conversation to top
				update(state => {
					const updatedConversations = [...state.conversations];
					const conversationIndex = updatedConversations.findIndex(conv => conv.id === conversationId);

					if (conversationIndex > -1) {
						const conversation = updatedConversations[conversationIndex];
						conversation.updatedAt = new Date();

						// Move to top
						updatedConversations.splice(conversationIndex, 1);
						updatedConversations.unshift(conversation);
					}

					return {
						...state,
						conversations: updatedConversations
					};
				});
			} catch (error) {
				console.error('Send message error:', error);
			}
		},

		createConversation: async (participantIds: string[], currentUserId: string, options?: { type?: 'direct' | 'group'; name?: string; description?: string }) => {
			try {
				const response = await conversationsApi.createConversation({
					participants: participantIds,
					type: options?.type || 'direct',
					name: options?.name,
					description: options?.description
				});

				const conversation = convertBackendConversation(response.conversation);

				update(state => ({
					...state,
					conversations: [conversation, ...state.conversations]
				}));

				return conversation;
			} catch (error) {
				console.error('Create conversation error:', error);
				throw error;
			}
		}
	};
}

export const chatStore = createChatStore();
