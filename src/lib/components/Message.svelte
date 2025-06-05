<script lang="ts">
	import type { Message, User } from '../types.js';

	interface Props {
		message: Message;
		currentUser: User;
		otherUser?: User;
		isGroup?: boolean;
		participants?: User[];
	}

	let { message, currentUser, otherUser, isGroup = false, participants = [] }: Props = $props();

	const isOwnMessage = $derived(message.senderId === currentUser.id);

	// For group chats, find the sender from participants or use senderName
	const sender = $derived((() => {
		if (isOwnMessage) return currentUser;

		if (isGroup && participants.length > 0) {
			const foundSender = participants.find(p => p.id === message.senderId);
			if (foundSender) return foundSender;
		}

		// Fallback to otherUser for direct chats or create a placeholder for group chats
		if (otherUser) return otherUser;

		// Create placeholder user for group chat when sender not found
		return {
			id: message.senderId,
			username: message.senderName || 'Unknown User',
			email: '',
			avatar: null,
			isOnline: false
		};
	})());

	function formatTime(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}).format(date);
	}
</script>

<div class="flex {isOwnMessage ? 'justify-end' : 'justify-start'} mb-4">
	<div class="flex max-w-xs lg:max-w-md {isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2">
		<!-- Avatar -->
		<div class="flex-shrink-0 {isOwnMessage ? 'ml-2' : 'mr-2'}">
			<img
				src={sender.avatar || `https://ui-avatars.com/api/?name=${sender.username}&background=22c55e&color=fff`}
				alt={sender.username}
				class="w-8 h-8 rounded-full"
			/>
		</div>

		<!-- Message bubble -->
		<div class="flex flex-col">
			<!-- Username (show for all messages) -->
			<div class="mb-1 {isOwnMessage ? 'text-right' : 'text-left'}">
				<span class="text-xs font-medium text-gray-600">
					{isOwnMessage ? 'You' : sender.username}
				</span>
			</div>

			<div
				class="px-4 py-2 rounded-2xl {isOwnMessage
					? 'bg-green-600 text-white rounded-br-sm'
					: 'bg-gray-200 text-gray-900 rounded-bl-sm'}"
			>
				<p class="text-sm whitespace-pre-wrap break-words">{message.content}</p>
			</div>
			
			<!-- Timestamp -->
			<div class="flex {isOwnMessage ? 'justify-end' : 'justify-start'} mt-1">
				<span class="text-xs text-gray-500">
					{formatTime(message.timestamp)}
					{#if isOwnMessage}
						<span class="ml-1">
							{#if message.isRead}
								<svg class="inline w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
								</svg>
								<svg class="inline w-3 h-3 text-green-500 -ml-1" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
								</svg>
							{:else}
								<svg class="inline w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
								</svg>
							{/if}
						</span>
					{/if}
				</span>
			</div>
		</div>
	</div>
</div>
