<script lang="ts">
	import { onMount } from 'svelte';
	import { conversationsApi } from '../services/api.js';
	import type { User, Conversation } from '../types.js';

	interface Props {
		conversation: Conversation;
		currentUser: User;
		isOpen: boolean;
		onClose: () => void;
		onMembersUpdated?: () => void;
	}

	let { conversation, currentUser, isOpen, onClose, onMembersUpdated }: Props = $props();

	let members = $state<any[]>([]);
	let availableUsers = $state<any[]>([]);
	let selectedUsers = $state<string[]>([]);
	let isLoading = $state(false);
	let isLoadingMembers = $state(false);
	let searchQuery = $state('');
	let activeTab = $state<'members' | 'add'>('members');
	let error = $state('');

	// Check if current user is the creator
	const isCreator = $derived(conversation.createdBy === currentUser.id);

	onMount(() => {
		if (isOpen) {
			loadMembers();
			loadAvailableUsers();
		}
	});

	$effect(() => {
		if (isOpen) {
			loadMembers();
			loadAvailableUsers();
		}
	});

	async function loadMembers() {
		isLoadingMembers = true;
		try {
			const response = await conversationsApi.getGroupMembers(conversation.id);
			members = response.members;
		} catch (err) {
			console.error('Error loading members:', err);
			error = 'Failed to load group members';
		} finally {
			isLoadingMembers = false;
		}
	}

	async function loadAvailableUsers() {
		try {
			console.log('🔍 Loading available users for conversation:', conversation.id);
			const response = await conversationsApi.getAvailableUsers(conversation.id);
			console.log('✅ Available users loaded:', response.availableUsers.length);
			availableUsers = response.availableUsers;
		} catch (err) {
			console.error('❌ Error loading available users:', err);
		}
	}

	async function addSelectedUsers() {
		if (selectedUsers.length === 0) return;

		isLoading = true;
		error = '';
		try {
			console.log('🔍 Adding users to group:', {
				conversationId: conversation.id,
				conversationType: conversation.type,
				userIds: selectedUsers,
				selectedCount: selectedUsers.length
			});
			const response = await conversationsApi.addGroupMembers(conversation.id, selectedUsers);
			console.log('Add members response:', response);
			selectedUsers = [];
			activeTab = 'members';
			await loadMembers();
			await loadAvailableUsers();
			onMembersUpdated?.();
		} catch (err: any) {
			console.error('Error adding members:', err);
			error = `Failed to add members to group: ${err.message || 'Unknown error'}`;
		} finally {
			isLoading = false;
		}
	}

	async function removeMember(userId: string) {
		if (!confirm('Are you sure you want to remove this member from the group?')) {
			return;
		}

		isLoading = true;
		error = '';
		try {
			await conversationsApi.removeGroupMember(conversation.id, userId);
			await loadMembers();
			await loadAvailableUsers();
			onMembersUpdated?.();
		} catch (err) {
			console.error('Error removing member:', err);
			error = 'Failed to remove member from group';
		} finally {
			isLoading = false;
		}
	}

	async function leaveGroup() {
		if (!confirm('Are you sure you want to leave this group? You will no longer receive messages from this group.')) {
			return;
		}

		isLoading = true;
		error = '';
		try {
			await conversationsApi.removeGroupMember(conversation.id, currentUser.id);
			onClose();
			onMembersUpdated?.();
		} catch (err) {
			console.error('Error leaving group:', err);
			error = 'Failed to leave group';
		} finally {
			isLoading = false;
		}
	}

	function toggleUserSelection(userId: string) {
		if (selectedUsers.includes(userId)) {
			selectedUsers = selectedUsers.filter(id => id !== userId);
		} else {
			selectedUsers = [...selectedUsers, userId];
		}
	}

	const filteredAvailableUsers = $derived(
		availableUsers.filter(user =>
			user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
			(user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
		)
	);
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<!-- Header -->
				<div class="flex justify-between items-center mb-6">
					<h3 class="text-lg font-medium text-gray-900">
						{conversation.name || 'Group Chat'} - Members
					</h3>
					<button
						onclick={onClose}
						aria-label="Close modal"
						class="text-gray-400 hover:text-gray-600"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>

				<!-- Error message -->
				{#if error}
					<div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
						{error}
					</div>
				{/if}

				<!-- Tabs -->
				<div class="flex border-b border-gray-200 mb-6">
					<button
						onclick={() => activeTab = 'members'}
						class="py-2 px-4 text-sm font-medium {activeTab === 'members' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
					>
						Members ({members.length})
					</button>
					<button
						onclick={() => activeTab = 'add'}
						class="py-2 px-4 text-sm font-medium {activeTab === 'add' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
					>
						Add Members
					</button>
				</div>

				<!-- Members Tab -->
				{#if activeTab === 'members'}
					<div class="space-y-4">
						{#if isLoadingMembers}
							<div class="flex justify-center py-8">
								<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
							</div>
						{:else}
							{#each members as member}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div class="flex items-center space-x-3">
										<img
											src={member.avatar || `https://ui-avatars.com/api/?name=${member.username}&background=22c55e&color=fff`}
											alt={member.username}
											class="w-10 h-10 rounded-full"
										/>
										<div>
											<p class="font-medium text-gray-900">{member.username}</p>
											<p class="text-sm text-gray-500">{member.email}</p>
											{#if member.firstName || member.lastName}
												<p class="text-xs text-gray-400">{member.firstName} {member.lastName}</p>
											{/if}
										</div>
										{#if member.isOnline}
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
												Online
											</span>
										{/if}
										{#if conversation.createdBy === member._id}
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
												Creator
											</span>
										{/if}
									</div>
									<div class="flex space-x-2">
										{#if member._id === currentUser.id}
											<button
												onclick={leaveGroup}
												disabled={isLoading}
												class="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
											>
												Leave Group
											</button>
										{:else if isCreator}
											<button
												onclick={() => removeMember(member._id)}
												disabled={isLoading}
												class="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
											>
												Remove
											</button>
										{/if}
									</div>
								</div>
							{/each}
						{/if}
					</div>
				{/if}

				<!-- Add Members Tab -->
				{#if activeTab === 'add'}
					<div class="space-y-4">
						<!-- Search -->
						<div>
							<input
								type="text"
								placeholder="Search users..."
								bind:value={searchQuery}
								class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							/>
						</div>

						<!-- Available Users -->
						<div class="max-h-64 overflow-y-auto space-y-2">
							{#each filteredAvailableUsers as user}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div class="flex items-center space-x-3">
										<img
											src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=22c55e&color=fff`}
											alt={user.username}
											class="w-10 h-10 rounded-full"
										/>
										<div>
											<p class="font-medium text-gray-900">{user.username}</p>
											<p class="text-sm text-gray-500">{user.email}</p>
											{#if user.firstName || user.lastName}
												<p class="text-xs text-gray-400">{user.firstName} {user.lastName}</p>
											{/if}
										</div>
									</div>
									<div>
										<input
											type="checkbox"
											checked={selectedUsers.includes(user._id)}
											onchange={() => toggleUserSelection(user._id)}
											class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
										/>
									</div>
								</div>
							{/each}
						</div>

						<!-- Add Selected Button -->
						{#if selectedUsers.length > 0}
							<div class="flex justify-end">
								<button
									onclick={addSelectedUsers}
									disabled={isLoading}
									class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{#if isLoading}
										Adding...
									{:else}
										Add {selectedUsers.length} Member{selectedUsers.length === 1 ? '' : 's'}
									{/if}
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
