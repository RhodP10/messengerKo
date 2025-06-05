<script lang="ts">
	import { usersApi } from '../services/api.js';
	import { conversationsApi } from '../services/api.js';
	import type { User } from '../types.js';

	interface Props {
		currentUser: User;
		onConversationCreated: (conversationId: string) => void;
		onClose: () => void;
	}

	let { currentUser, onConversationCreated, onClose }: Props = $props();

	let searchQuery = $state('');
	let searchResults = $state<User[]>([]);
	let allUsers = $state<User[]>([]);
	let isSearching = $state(false);
	let isLoadingUsers = $state(false);
	let searchTimeout: NodeJS.Timeout | null = null;

	// Load all users initially
	async function loadAllUsers() {
		isLoadingUsers = true;
		try {
			const response = await usersApi.getAllUsers(50);
			allUsers = response.users.map(user => ({
				id: user._id,
				username: user.username,
				email: user.email,
				avatar: user.avatar,
				isOnline: user.isOnline
			}));

			// If no search query, show all users
			if (!searchQuery.trim()) {
				searchResults = allUsers;
			}
		} catch (error) {
			console.error('Load users error:', error);
			allUsers = [];
			searchResults = [];
		} finally {
			isLoadingUsers = false;
		}
	}

	// Debounced search function
	function handleSearch() {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		// If no search query, show all users
		if (!searchQuery.trim()) {
			searchResults = allUsers;
			return;
		}

		// Filter from all users locally for instant results
		const filtered = allUsers.filter(user =>
			user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase())
		);
		searchResults = filtered;

		// Also do server search for more comprehensive results
		searchTimeout = setTimeout(async () => {
			if (searchQuery.trim().length >= 2) {
				isSearching = true;
				try {
					const response = await usersApi.searchUsers(searchQuery.trim());
					const serverResults = response.users.map(user => ({
						id: user._id,
						username: user.username,
						email: user.email,
						avatar: user.avatar,
						isOnline: user.isOnline
					}));

					// Merge with local results and remove duplicates
					const allResults = [...filtered];
					serverResults.forEach(serverUser => {
						if (!allResults.find(u => u.id === serverUser.id)) {
							allResults.push(serverUser);
						}
					});

					searchResults = allResults;
				} catch (error) {
					console.error('Search error:', error);
					// Keep local filtered results on error
				} finally {
					isSearching = false;
				}
			}
		}, 300);
	}

	// Start conversation with selected user
	async function startConversation(user: User) {
		try {
			const response = await conversationsApi.createConversation({
				participants: [user.id],
				type: 'direct'
			});
			
			onConversationCreated(response.conversation._id);
			onClose();
		} catch (error) {
			console.error('Error creating conversation:', error);
		}
	}

	// Load all users when component mounts
	$effect(() => {
		loadAllUsers();
	});

	// Watch for search query changes
	$effect(() => {
		handleSearch();
	});
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">Start New Conversation</h2>
			<button
				onclick={onClose}
				class="p-1 text-gray-400 hover:text-gray-600 rounded"
				aria-label="Close"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
				</svg>
			</button>
		</div>

		<!-- Search Input -->
		<div class="p-4">
			<div class="relative">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
					</svg>
				</div>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by username or email..."
					class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
				/>
			</div>
		</div>

		<!-- Search Results -->
		<div class="max-h-96 overflow-y-auto">
			{#if isLoadingUsers}
				<div class="flex justify-center items-center py-8">
					<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
					<span class="ml-2 text-gray-500">Loading users...</span>
				</div>
			{:else if searchResults.length === 0 && !isSearching}
				<div class="text-center py-8 text-gray-500">
					<svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
					</svg>
					<p class="text-sm">
						{#if searchQuery.trim()}
							No users found matching "{searchQuery}"
						{:else}
							No users available
						{/if}
					</p>
				</div>
			{:else}
				{#each searchResults as user (user.id)}
					<button
						onclick={() => startConversation(user)}
						class="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
					>
						<!-- Avatar with online status -->
						<div class="relative flex-shrink-0">
							<img
								src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=22c55e&color=fff`}
								alt={user.username}
								class="w-10 h-10 rounded-full"
							/>
							{#if user.isOnline}
								<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
							{/if}
						</div>

						<!-- User info -->
						<div class="flex-1 min-w-0 text-left">
							<p class="text-sm font-medium text-gray-900 truncate">
								{user.username}
							</p>
							<p class="text-xs text-gray-500 truncate">
								{user.email}
							</p>
							<p class="text-xs text-gray-400">
								{user.isOnline ? 'Online' : 'Offline'}
							</p>
						</div>

						<!-- Start chat icon -->
						<div class="flex-shrink-0">
							<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
							</svg>
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</div>
</div>
