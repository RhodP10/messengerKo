<script lang="ts">
	import { usersApi } from '$lib/services/api';
	import { chatStore } from '$lib/stores/chat';
	import type { User, Conversation } from '$lib/types';

	interface Props {
		currentUser: User;
		onGroupCreated: (conversation: Conversation) => void;
		onClose: () => void;
	}

	let { currentUser, onGroupCreated, onClose }: Props = $props();

	let groupName = $state('');
	let groupDescription = $state('');
	let searchQuery = $state('');
	let allUsers = $state<User[]>([]);
	let selectedUsers = $state<User[]>([]);
	let isLoadingUsers = $state(false);
	let isCreating = $state(false);
	let searchResults = $state<User[]>([]);

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
			
			// Filter out current user and show all available users
			searchResults = allUsers.filter(user => user.id !== currentUser.id);
		} catch (error) {
			console.error('Load users error:', error);
			allUsers = [];
			searchResults = [];
		} finally {
			isLoadingUsers = false;
		}
	}

	// Filter users based on search query
	function handleSearch() {
		if (!searchQuery.trim()) {
			searchResults = allUsers.filter(user => user.id !== currentUser.id);
			return;
		}

		searchResults = allUsers.filter(user => 
			user.id !== currentUser.id &&
			(user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
			 user.email.toLowerCase().includes(searchQuery.toLowerCase()))
		);
	}

	// Toggle user selection
	function toggleUserSelection(user: User) {
		const isSelected = selectedUsers.find(u => u.id === user.id);
		if (isSelected) {
			selectedUsers = selectedUsers.filter(u => u.id !== user.id);
		} else {
			selectedUsers = [...selectedUsers, user];
		}
	}

	// Create group chat
	async function createGroup() {
		if (!groupName.trim()) {
			alert('Please enter a group name');
			return;
		}

		if (selectedUsers.length < 1) {
			alert('Please select at least one user to add to the group');
			return;
		}

		isCreating = true;
		try {
			const participantIds = selectedUsers.map(user => user.id);

			const conversation = await chatStore.createConversation(
				participantIds,
				currentUser.id,
				{
					type: 'group',
					name: groupName.trim(),
					description: groupDescription.trim() || undefined
				}
			);

			onGroupCreated(conversation);
			onClose();
		} catch (error) {
			console.error('Error creating group:', error);
			alert('Failed to create group. Please try again.');
		} finally {
			isCreating = false;
		}
	}

	// Load users when component mounts
	$effect(() => {
		loadAllUsers();
	});

	// Watch for search query changes
	$effect(() => {
		handleSearch();
	});
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">Create Group Chat</h2>
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

		<!-- Group Details Form -->
		<div class="p-4 border-b border-gray-200">
			<div class="space-y-4">
				<div>
					<label for="groupName" class="block text-sm font-medium text-gray-700 mb-1">
						Group Name *
					</label>
					<input
						id="groupName"
						type="text"
						bind:value={groupName}
						placeholder="Enter group name..."
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
						maxlength="100"
					/>
				</div>
				
				<div>
					<label for="groupDescription" class="block text-sm font-medium text-gray-700 mb-1">
						Description (optional)
					</label>
					<textarea
						id="groupDescription"
						bind:value={groupDescription}
						placeholder="Enter group description..."
						rows="2"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none"
						maxlength="500"
					></textarea>
				</div>
			</div>
		</div>

		<!-- Selected Users -->
		{#if selectedUsers.length > 0}
			<div class="p-4 border-b border-gray-200">
				<h3 class="text-sm font-medium text-gray-700 mb-2">
					Selected Members ({selectedUsers.length})
				</h3>
				<div class="flex flex-wrap gap-2">
					{#each selectedUsers as user (user.id)}
						<div class="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
							<img
								src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=22c55e&color=fff`}
								alt={user.username}
								class="w-4 h-4 rounded-full mr-1"
							/>
							<span>{user.username}</span>
							<button
								onclick={() => toggleUserSelection(user)}
								class="ml-1 text-green-600 hover:text-green-800"
								aria-label="Remove {user.username} from selection"
							>
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
								</svg>
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- User Search -->
		<div class="p-4 border-b border-gray-200">
			<div class="relative">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
					</svg>
				</div>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search users to add..."
					class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
				/>
			</div>
		</div>

		<!-- User List -->
		<div class="flex-1 overflow-y-auto">
			{#if isLoadingUsers}
				<div class="flex justify-center items-center py-8">
					<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
					<span class="ml-2 text-gray-500">Loading users...</span>
				</div>
			{:else if searchResults.length === 0}
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
					{@const isSelected = selectedUsers.find(u => u.id === user.id)}
					<button
						onclick={() => toggleUserSelection(user)}
						class="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors {isSelected ? 'bg-green-50' : ''}"
					>
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
						
						<div class="flex-1 text-left">
							<p class="text-sm font-medium text-gray-900">{user.username}</p>
							<p class="text-xs text-gray-500">{user.email}</p>
						</div>
						
						{#if isSelected}
							<div class="flex-shrink-0">
								<svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
								</svg>
							</div>
						{/if}
					</button>
				{/each}
			{/if}
		</div>

		<!-- Footer -->
		<div class="p-4 border-t border-gray-200 flex justify-end space-x-3">
			<button
				onclick={onClose}
				class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
			>
				Cancel
			</button>
			<button
				onclick={createGroup}
				disabled={!groupName.trim() || selectedUsers.length === 0 || isCreating}
				class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if isCreating}
					<div class="flex items-center">
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
						Creating...
					</div>
				{:else}
					Create Group ({selectedUsers.length} members)
				{/if}
			</button>
		</div>
	</div>
</div>
