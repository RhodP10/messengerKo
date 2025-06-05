<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { adminConversationsApi } from '$lib/services/api.js';

	const authState = $derived(authStore);

	let conversations = $state<any[]>([]);
	let pagination = $state({
		currentPage: 1,
		totalPages: 1,
		totalConversations: 0,
		hasNextPage: false,
		hasPrevPage: false,
		limit: 10
	});
	let conversationStats = $state({
		totalConversations: 0,
		directChats: 0,
		groupChats: 0,
		totalMessages: 0,
		recentMessages: 0,
		activeConversations: 0
	});

	let isLoading = $state(false);
	let searchQuery = $state('');
	let typeFilter = $state<'' | 'direct' | 'group'>('');
	let sortBy = $state('updatedAt');
	let sortOrder = $state<'asc' | 'desc'>('desc');
	let selectedConversation = $state<any>(null);
	let showDeleteModal = $state(false);
	let showBulkDeleteModal = $state(false);
	let bulkDeleteType = $state<'all' | 'direct' | 'group' | ''>(''); // 'all', 'direct', 'group'
	let confirmText = $state('');

	onMount(() => {
		// Check authentication
		if (!$authState.isAuthenticated || $authState.user?.userType !== 'admin') {
			goto('/login');
			return;
		}

		loadConversations();
		loadConversationStats();
	});

	async function loadConversations() {
		isLoading = true;
		try {
			const response = await adminConversationsApi.getAllConversations({
				page: pagination.currentPage,
				limit: pagination.limit,
				search: searchQuery,
				type: typeFilter,
				sortBy,
				sortOrder
			});

			conversations = response.conversations;
			pagination = response.pagination;
		} catch (error) {
			console.error('Error loading conversations:', error);
		} finally {
			isLoading = false;
		}
	}

	async function loadConversationStats() {
		try {
			const response = await adminConversationsApi.getConversationStats();
			conversationStats = response.stats;
		} catch (error) {
			console.error('Error loading conversation stats:', error);
		}
	}

	function handleSearch() {
		pagination.currentPage = 1;
		loadConversations();
	}

	function handleSort(field: string) {
		if (sortBy === field) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = field;
			sortOrder = 'asc';
		}
		loadConversations();
	}

	function handlePageChange(page: number) {
		pagination.currentPage = page;
		loadConversations();
	}

	function handleTypeFilter(type: string) {
		typeFilter = type as '' | 'direct' | 'group';
		pagination.currentPage = 1;
		loadConversations();
	}

	function openDeleteModal(conversation: any) {
		selectedConversation = conversation;
		showDeleteModal = true;
	}

	function openBulkDeleteModal(type: string) {
		bulkDeleteType = type as 'all' | 'direct' | 'group';
		showBulkDeleteModal = true;
	}

	async function handleDeleteConversation() {
		if (!selectedConversation) return;

		try {
			await adminConversationsApi.deleteConversation(selectedConversation._id);
			showDeleteModal = false;
			selectedConversation = null;
			loadConversations();
			loadConversationStats();
		} catch (error) {
			console.error('Error deleting conversation:', error);
		}
	}

	async function handleBulkDelete() {
		try {
			if (bulkDeleteType === 'all') {
				await adminConversationsApi.deleteAllConversations();
			} else if (bulkDeleteType === 'direct' || bulkDeleteType === 'group') {
				await adminConversationsApi.deleteConversationsByType(bulkDeleteType);
			}

			showBulkDeleteModal = false;
			bulkDeleteType = '';
			loadConversations();
			loadConversationStats();
		} catch (error) {
			console.error('Error during bulk delete:', error);
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString();
	}

	function formatDateTime(dateString: string) {
		return new Date(dateString).toLocaleString();
	}

	function getConversationTypeClass(isGroup: boolean) {
		return isGroup
			? 'bg-purple-100 text-purple-800'
			: 'bg-blue-100 text-blue-800';
	}

	function getConversationTypeName(isGroup: boolean) {
		return isGroup ? 'Group' : 'Direct';
	}
</script>

<svelte:head>
	<title>Conversation Monitoring - Admin Dashboard</title>
</svelte:head>

{#if $authState.user && $authState.user.userType === 'admin'}
	<div class="min-h-screen bg-gray-50">
		<!-- Header -->
		<div class="bg-white shadow">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between items-center py-6">
					<div class="flex items-center space-x-4">
						<button
							onclick={() => goto('/admin')}
							class="text-gray-500 hover:text-gray-700"
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
							</svg>
						</button>
						<h1 class="text-2xl font-bold text-gray-900">Conversation Monitoring</h1>
					</div>
					<div class="flex space-x-3">
						<button
							onclick={() => openBulkDeleteModal('direct')}
							class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium"
						>
							Delete All Direct Chats
						</button>
						<button
							onclick={() => openBulkDeleteModal('group')}
							class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
						>
							Delete All Group Chats
						</button>
						<button
							onclick={() => openBulkDeleteModal('all')}
							class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
						>
							Delete ALL Conversations
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Stats Cards -->
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
									<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Total</dt>
									<dd class="text-lg font-medium text-gray-900">{conversationStats.totalConversations}</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
									<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z"></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Direct</dt>
									<dd class="text-lg font-medium text-gray-900">{conversationStats.directChats}</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
									<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Groups</dt>
									<dd class="text-lg font-medium text-gray-900">{conversationStats.groupChats}</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
									<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Messages</dt>
									<dd class="text-lg font-medium text-gray-900">{conversationStats.totalMessages}</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
									<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Recent (24h)</dt>
									<dd class="text-lg font-medium text-gray-900">{conversationStats.recentMessages}</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
									<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Active (7d)</dt>
									<dd class="text-lg font-medium text-gray-900">{conversationStats.activeConversations}</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Search and Filters -->
			<div class="bg-white shadow rounded-lg mb-6">
				<div class="px-4 py-5 sm:p-6">
					<div class="flex flex-col sm:flex-row gap-4">
						<div class="flex-1">
							<input
								type="text"
								placeholder="Search conversations by name or description..."
								bind:value={searchQuery}
								onkeydown={(e) => e.key === 'Enter' && handleSearch()}
								class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							/>
						</div>
						<div class="flex gap-2">
							<select
								bind:value={typeFilter}
								onchange={() => handleTypeFilter(typeFilter)}
								class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							>
								<option value="">All Types</option>
								<option value="direct">Direct Chats</option>
								<option value="group">Group Chats</option>
							</select>
							<button
								onclick={handleSearch}
								class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							>
								Search
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Conversations Table -->
			<div class="bg-white shadow overflow-hidden sm:rounded-md">
				<div class="px-4 py-5 sm:px-6">
					<h3 class="text-lg leading-6 font-medium text-gray-900">
						Conversations ({pagination.totalConversations})
					</h3>
				</div>

				{#if isLoading}
					<div class="flex justify-center py-8">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Type
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onclick={() => handleSort('name')}>
										Name/Participants
										{#if sortBy === 'name'}
											<span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
										{/if}
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Participants
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Messages
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onclick={() => handleSort('updatedAt')}>
										Last Activity
										{#if sortBy === 'updatedAt'}
											<span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
										{/if}
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onclick={() => handleSort('createdAt')}>
										Created
										{#if sortBy === 'createdAt'}
											<span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
										{/if}
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each conversations as conversation}
									<tr>
										<td class="px-6 py-4 whitespace-nowrap">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getConversationTypeClass(conversation.isGroup)}">
												{getConversationTypeName(conversation.isGroup)}
											</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{conversation.displayName}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{conversation.participantCount}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{conversation.messageCount}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{formatDateTime(conversation.updatedAt)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{formatDate(conversation.createdAt)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div class="flex space-x-2">
												<button
													onclick={() => goto(`/admin/conversations/${conversation._id}`)}
													class="text-indigo-600 hover:text-indigo-900"
												>
													View
												</button>
												<button
													onclick={() => openDeleteModal(conversation)}
													class="text-red-600 hover:text-red-900"
												>
													Delete
												</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Pagination -->
					{#if pagination.totalPages > 1}
						<div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
							<div class="flex-1 flex justify-between sm:hidden">
								<button
									onclick={() => handlePageChange(pagination.currentPage - 1)}
									disabled={!pagination.hasPrevPage}
									class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Previous
								</button>
								<button
									onclick={() => handlePageChange(pagination.currentPage + 1)}
									disabled={!pagination.hasNextPage}
									class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Next
								</button>
							</div>
							<div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
								<div>
									<p class="text-sm text-gray-700">
										Showing page <span class="font-medium">{pagination.currentPage}</span> of <span class="font-medium">{pagination.totalPages}</span>
									</p>
								</div>
								<div>
									<nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
										<button
											onclick={() => handlePageChange(pagination.currentPage - 1)}
											disabled={!pagination.hasPrevPage}
											class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Previous
										</button>
										<button
											onclick={() => handlePageChange(pagination.currentPage + 1)}
											disabled={!pagination.hasNextPage}
											class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Next
										</button>
									</nav>
								</div>
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>

	<!-- Delete Conversation Modal -->
	{#if showDeleteModal && selectedConversation}
		<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
				<div class="mt-3">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Delete Conversation</h3>
					<p class="text-sm text-gray-500 mb-4">
						Are you sure you want to delete the conversation <strong>"{selectedConversation.displayName}"</strong>?
						This will permanently delete the conversation and all its messages. This action cannot be undone.
					</p>
					<div class="flex justify-end space-x-3">
						<button
							onclick={() => { showDeleteModal = false; selectedConversation = null; }}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
						>
							Cancel
						</button>
						<button
							onclick={handleDeleteConversation}
							class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
						>
							Delete Conversation
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Bulk Delete Modal -->
	{#if showBulkDeleteModal}
		<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
				<div class="mt-3">
					<h3 class="text-lg font-medium text-gray-900 mb-4">
						{#if bulkDeleteType === 'all'}
							Delete ALL Conversations
						{:else if bulkDeleteType === 'direct'}
							Delete All Direct Chats
						{:else if bulkDeleteType === 'group'}
							Delete All Group Chats
						{/if}
					</h3>
					<div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
								</svg>
							</div>
							<div class="ml-3">
								<h3 class="text-sm font-medium text-red-800">
									⚠️ DANGER ZONE
								</h3>
								<div class="mt-2 text-sm text-red-700">
									<p>
										{#if bulkDeleteType === 'all'}
											This will permanently delete ALL conversations and messages in the entire system.
											This includes both direct chats and group chats.
										{:else if bulkDeleteType === 'direct'}
											This will permanently delete ALL direct conversations and their messages.
										{:else if bulkDeleteType === 'group'}
											This will permanently delete ALL group conversations and their messages.
										{/if}
									</p>
									<p class="mt-2 font-semibold">This action cannot be undone!</p>
								</div>
							</div>
						</div>
					</div>
					<p class="text-sm text-gray-500 mb-4">
						Type <strong>DELETE</strong> to confirm this action:
					</p>
					<input
						type="text"
						placeholder="Type DELETE to confirm"
						bind:value={confirmText}
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm mb-4"
					/>
					<div class="flex justify-end space-x-3">
						<button
							onclick={() => { showBulkDeleteModal = false; bulkDeleteType = ''; confirmText = ''; }}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
						>
							Cancel
						</button>
						<button
							onclick={handleBulkDelete}
							disabled={confirmText !== 'DELETE'}
							class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if bulkDeleteType === 'all'}
								Delete ALL Conversations
							{:else if bulkDeleteType === 'direct'}
								Delete All Direct Chats
							{:else if bulkDeleteType === 'group'}
								Delete All Group Chats
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<!-- Loading state -->
	<div class="h-screen flex items-center justify-center bg-gray-50">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
			<p class="text-gray-600">Loading conversation monitoring...</p>
		</div>
	</div>
{/if}