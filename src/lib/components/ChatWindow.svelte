<script lang="ts">
	import { chatStore } from '../stores/chat.js';
	import Message from './Message.svelte';
	import MessageInput from './MessageInput.svelte';
	import type { User, Conversation } from '../types.js';

	interface Props {
		currentUser: User;
		activeConversation: Conversation | null;
		onBackToSidebar?: () => void;
	}

	let { currentUser, activeConversation, onBackToSidebar }: Props = $props();

	const chatState = $derived(chatStore);
	let messagesContainer = $state<HTMLDivElement>();

	// Scroll to bottom when messages change
	$effect(() => {
		if (messagesContainer && $chatState.messages.length > 0) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	});

	function formatLastSeen(date: Date): string {
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
		
		if (diffInMinutes < 1) return 'Active now';
		if (diffInMinutes < 60) return `Active ${diffInMinutes}m ago`;
		
		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `Active ${diffInHours}h ago`;
		
		const diffInDays = Math.floor(diffInHours / 24);
		return `Active ${diffInDays}d ago`;
	}
</script>

{#if activeConversation}
	{@const isGroup = activeConversation.type === 'group'}
	{@const otherUser = !isGroup ? activeConversation.participants.find(p => p.id !== currentUser.id) : null}

	{#if isGroup || otherUser}
		<div class="flex flex-col h-full">
		<!-- Chat header -->
		<div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
			<div class="flex items-center space-x-3">
				<!-- Mobile back button -->
				{#if onBackToSidebar}
					<button
						onclick={onBackToSidebar}
						aria-label="Back to conversations"
						class="md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
						</svg>
					</button>
				{/if}

				<div class="relative">
					{#if isGroup}
						<!-- Group avatar -->
						<div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
							</svg>
						</div>
					{:else if otherUser}
						<!-- Direct chat avatar -->
						<img
							src={otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.username}&background=22c55e&color=fff`}
							alt={otherUser.username}
							class="w-10 h-10 rounded-full"
						/>
						{#if otherUser.isOnline}
							<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
						{/if}
					{/if}
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="text-xl font-bold text-gray-900 truncate">
						{#if isGroup}
							{activeConversation.name || 'Group Chat'}
						{:else if otherUser}
							{otherUser.username}
						{:else}
							Unknown User
						{/if}
					</h3>
					<div class="flex items-center space-x-2">
						<p class="text-sm text-gray-500">
							{#if isGroup}
								{activeConversation.participants.length} members
							{:else if otherUser}
								{#if otherUser.isOnline}
									<span class="flex items-center">
										<span class="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
										Active now
									</span>
								{:else if otherUser.lastSeen}
									{formatLastSeen(otherUser.lastSeen)}
								{:else}
									Offline
								{/if}
							{/if}
						</p>
						{#if !isGroup && otherUser}
							<span class="text-xs text-gray-400">•</span>
							<p class="text-xs text-gray-400 truncate">{otherUser.email}</p>
						{/if}
					</div>
				</div>
			</div>
			
			<!-- Chat actions -->
			<div class="flex items-center space-x-2">
				<button aria-label="Voice call" class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
					</svg>
				</button>
				<button aria-label="Video call" class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
					</svg>
				</button>
				<button aria-label="Chat info" class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
				</button>
			</div>
		</div>

		<!-- Messages area -->
		<div 
			bind:this={messagesContainer}
			class="flex-1 overflow-y-auto px-4 py-4 bg-gray-50"
		>
			{#if $chatState.isLoading}
				<div class="flex justify-center items-center h-full">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
				</div>
			{:else if $chatState.messages.length === 0}
				<div class="flex flex-col items-center justify-center h-full text-gray-500">
					<svg class="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
					</svg>
					<p class="text-lg font-medium">No messages yet</p>
					<p class="text-sm">Send a message to start the conversation</p>
				</div>
			{:else}
				{#each $chatState.messages as message (message.id)}
					<Message
						{message}
						{currentUser}
						otherUser={otherUser || undefined}
						{isGroup}
						participants={activeConversation.participants}
					/>
				{/each}
			{/if}
		</div>

		<!-- Message input -->
		<MessageInput {currentUser} conversationId={activeConversation.id} />
	</div>
	{/if}
{:else}
	<!-- No conversation selected -->
	<div class="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
		<svg class="w-24 h-24 mb-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
		</svg>
		<h2 class="text-2xl font-semibold mb-2">Your Messages</h2>
		<p class="text-center max-w-sm">
			Select a conversation from the sidebar to start chatting with your friends.
		</p>
	</div>
{/if}
