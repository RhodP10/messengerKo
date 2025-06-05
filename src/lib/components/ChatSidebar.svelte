<script lang="ts">
	import { chatStore } from '../stores/chat.js';
	import { authStore } from '../stores/auth.js';
	import UserSearch from './UserSearch.svelte';
	import GroupChatCreator from './GroupChatCreator.svelte';
	import type { User, Conversation } from '../types.js';

	interface Props {
		currentUser: User;
		activeConversation: Conversation | null;
		onSelectConversation: (conversation: Conversation) => void;
	}

	let { currentUser, activeConversation, onSelectConversation }: Props = $props();

	const chatState = $derived(chatStore);
	let searchQuery = $state('');
	let showUserSearch = $state(false);
	let showGroupCreator = $state(false);

	const filteredConversations = $derived(
		$chatState.conversations.filter(conv => {
			if (!searchQuery) return true;

			// For group conversations, search in group name
			if (conv.type === 'group' && conv.name) {
				return conv.name.toLowerCase().includes(searchQuery.toLowerCase());
			}

			// For direct conversations, search in other user's details
			const otherUser = conv.participants.find(p => p.id !== currentUser.id);
			if (!otherUser) return false;
			return otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
				   otherUser.email.toLowerCase().includes(searchQuery.toLowerCase());
		})
	);

	function formatTime(date: Date): string {
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
		
		if (diffInMinutes < 1) return 'now';
		if (diffInMinutes < 60) return `${diffInMinutes}m`;
		
		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `${diffInHours}h`;
		
		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays < 7) return `${diffInDays}d`;
		
		return date.toLocaleDateString();
	}

	function truncateMessage(message: string, maxLength: number = 50): string {
		return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
	}

	function handleLogout() {
		authStore.logout();
	}

	function openUserSearch() {
		showUserSearch = true;
	}

	function closeUserSearch() {
		showUserSearch = false;
	}

	function openGroupCreator() {
		showGroupCreator = true;
	}

	function closeGroupCreator() {
		showGroupCreator = false;
	}

	async function handleConversationCreated(conversationId: string) {
		// Refresh conversations to include the new one
		await chatStore.loadConversations(currentUser.id);

		// Find and select the new conversation
		const newConversation = $chatState.conversations.find(conv => conv.id === conversationId);
		if (newConversation) {
			onSelectConversation(newConversation);
		}
	}

	function handleGroupCreated(conversation: Conversation) {
		onSelectConversation(conversation);
		showGroupCreator = false;
	}
</script>

<div class="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-full">
	<!-- Header -->
	<div class="px-4 py-3 border-b border-gray-200">
		<div class="flex items-center justify-between mb-4">
			<h1 class="text-xl font-bold text-gray-900">Chats</h1>
			<div class="flex items-center space-x-2">
				<!-- New direct chat button -->
				<button
					onclick={openUserSearch}
					aria-label="New direct chat"
					class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
					title="Start direct conversation"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
					</svg>
				</button>

				<!-- New group chat button -->
				<button
					onclick={openGroupCreator}
					aria-label="New group chat"
					class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
					title="Create group chat"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
					</svg>
				</button>
				
				<!-- User menu -->
				<div class="relative">
					<button class="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100">
						<img
							src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.username}&background=0084ff&color=fff`}
							alt={currentUser.username}
							class="w-8 h-8 rounded-full"
						/>
					</button>
					
					<!-- Dropdown menu (simplified for now) -->
					<div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 hidden">
						<div class="py-1">
							<button
								onclick={handleLogout}
								class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
							>
								Sign out
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Search -->
		<div class="relative">
			<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
				</svg>
			</div>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search conversations..."
				class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
			/>
		</div>
	</div>

	<!-- Conversations list -->
	<div class="flex-1 overflow-y-auto">
		{#if $chatState.isLoading}
			<div class="flex justify-center items-center h-32">
				<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
			</div>
		{:else if filteredConversations.length === 0}
			<div class="flex flex-col items-center justify-center h-32 text-gray-500">
				<svg class="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
				</svg>
				<p class="text-sm">No conversations found</p>
			</div>
		{:else}
			{#each filteredConversations as conversation (conversation.id)}
				{@const isActive = activeConversation?.id === conversation.id}
				{@const isGroup = conversation.type === 'group'}
				{@const otherUser = !isGroup ? conversation.participants.find(p => p.id !== currentUser.id) : null}

				{#if isGroup || otherUser}
					<button
						onclick={() => onSelectConversation(conversation)}
						class="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors {isActive ? 'bg-green-50 border-r-2 border-green-500' : ''}"
					>
					<!-- Avatar with online status -->
					<div class="relative flex-shrink-0">
						{#if isGroup}
							<!-- Group avatar -->
							<div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
								<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
								</svg>
							</div>
							<!-- Group member count indicator -->
							<div class="absolute -bottom-1 -right-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
								{conversation.participants.length}
							</div>
						{:else if otherUser}
							<!-- Direct chat avatar -->
							<img
								src={otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.username}&background=22c55e&color=fff`}
								alt={otherUser.username}
								class="w-12 h-12 rounded-full"
							/>
							{#if otherUser.isOnline}
								<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
							{/if}
						{/if}
					</div>

					<!-- Conversation info -->
					<div class="flex-1 min-w-0 text-left">
						<div class="flex items-center justify-between">
							<div class="flex-1 min-w-0">
								<p class="text-base font-semibold text-gray-900 truncate">
									{#if isGroup}
										{conversation.name || 'Group Chat'}
									{:else if otherUser}
										{otherUser.username}
									{:else}
										Unknown User
									{/if}
								</p>
								{#if !isGroup && otherUser}
									<p class="text-xs text-gray-500 truncate">{otherUser.email}</p>
								{/if}
							</div>
							{#if conversation.lastMessage}
								<p class="text-xs text-gray-500 flex-shrink-0 ml-2">
									{formatTime(conversation.lastMessage.timestamp)}
								</p>
							{/if}
						</div>

						<div class="flex items-center justify-between">
							<p class="text-sm text-gray-500 truncate">
								{#if conversation.lastMessage}
									{#if conversation.lastMessage.senderId === currentUser.id}
										You: {truncateMessage(conversation.lastMessage.content)}
									{:else if isGroup}
										{#if conversation.lastMessage.senderName}
											{conversation.lastMessage.senderName}: {truncateMessage(conversation.lastMessage.content)}
										{:else}
											{truncateMessage(conversation.lastMessage.content)}
										{/if}
									{:else}
										{truncateMessage(conversation.lastMessage.content)}
									{/if}
								{:else}
									{#if isGroup}
										Group created
									{:else}
										Start a conversation
									{/if}
								{/if}
							</p>

							{#if conversation.unreadCount > 0}
								<span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
									{conversation.unreadCount}
								</span>
							{/if}
						</div>
					</div>
				</button>
				{/if}
			{/each}
		{/if}
	</div>

	<!-- User info at bottom -->
	<div class="border-t border-gray-200 px-4 py-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-3">
				<div class="relative">
					<img
						src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.username}&background=22c55e&color=fff`}
						alt={currentUser.username}
						class="w-8 h-8 rounded-full"
					/>
					<div class="absolute bottom-0 right-0 w-2 h-2 bg-green-400 border border-white rounded-full"></div>
				</div>
				<div class="min-w-0">
					<p class="text-sm font-medium text-gray-900 truncate">{currentUser.username}</p>
					<p class="text-xs text-gray-500">Active now</p>
				</div>
			</div>
			
			<button
				onclick={handleLogout}
				class="p-1 text-gray-400 hover:text-gray-600 rounded"
				aria-label="Sign out"
				title="Sign out"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
				</svg>
			</button>
		</div>
	</div>

	<!-- User Search Modal -->
	{#if showUserSearch}
		<UserSearch
			{currentUser}
			onConversationCreated={handleConversationCreated}
			onClose={closeUserSearch}
		/>
	{/if}

	<!-- Group Chat Creator Modal -->
	{#if showGroupCreator}
		<GroupChatCreator
			{currentUser}
			onGroupCreated={handleGroupCreated}
			onClose={closeGroupCreator}
		/>
	{/if}
</div>
