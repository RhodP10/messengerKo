<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { adminUsersApi } from '$lib/services/api.js';

	const authState = $derived(authStore);

	let users = $state<any[]>([]);
	let pagination = $state({
		currentPage: 1,
		totalPages: 1,
		totalUsers: 0,
		hasNextPage: false,
		hasPrevPage: false,
		limit: 10
	});
	let userStats = $state({
		totalUsers: 0,
		activeUsers: 0,
		inactiveUsers: 0,
		onlineUsers: 0,
		newUsers: 0
	});

	let isLoading = $state(false);
	let searchQuery = $state('');
	let sortBy = $state('createdAt');
	let sortOrder = $state<'asc' | 'desc'>('desc');
	let selectedUser = $state<any>(null);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let showCreateModal = $state(false);
	let newUser = $state({
		username: '',
		email: '',
		password: '',
		firstName: '',
		lastName: '',
		isActive: true
	});

	onMount(() => {
		// Check authentication
		if (!$authState.isAuthenticated || $authState.user?.userType !== 'admin') {
			goto('/login');
			return;
		}

		loadUsers();
		loadUserStats();
	});

	async function loadUsers() {
		isLoading = true;
		try {
			const response = await adminUsersApi.getAllUsers({
				page: pagination.currentPage,
				limit: pagination.limit,
				search: searchQuery,
				sortBy,
				sortOrder
			});

			users = response.users;
			pagination = response.pagination;
		} catch (error) {
			console.error('Error loading users:', error);
		} finally {
			isLoading = false;
		}
	}

	async function loadUserStats() {
		try {
			const response = await adminUsersApi.getUserStats();
			userStats = response.stats;
		} catch (error) {
			console.error('Error loading user stats:', error);
		}
	}

	function handleSearch() {
		pagination.currentPage = 1;
		loadUsers();
	}

	function handleSort(field: string) {
		if (sortBy === field) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = field;
			sortOrder = 'asc';
		}
		loadUsers();
	}

	function handlePageChange(page: number) {
		pagination.currentPage = page;
		loadUsers();
	}

	function openEditModal(user: any) {
		selectedUser = { ...user };
		showEditModal = true;
	}

	function openDeleteModal(user: any) {
		selectedUser = user;
		showDeleteModal = true;
	}

	function openCreateModal() {
		newUser = {
			username: '',
			email: '',
			password: '',
			firstName: '',
			lastName: '',
			isActive: true
		};
		showCreateModal = true;
	}

	async function handleCreateUser() {
		try {
			await adminUsersApi.createUser({
				username: newUser.username,
				email: newUser.email,
				password: newUser.password,
				firstName: newUser.firstName,
				lastName: newUser.lastName,
				isActive: newUser.isActive
			});

			showCreateModal = false;
			newUser = {
				username: '',
				email: '',
				password: '',
				firstName: '',
				lastName: '',
				isActive: true
			};
			loadUsers();
			loadUserStats();
		} catch (error) {
			console.error('Error creating user:', error);
		}
	}

	async function handleUpdateUser() {
		if (!selectedUser) return;

		try {
			await adminUsersApi.updateUser(selectedUser._id, {
				username: selectedUser.username,
				email: selectedUser.email,
				firstName: selectedUser.firstName,
				lastName: selectedUser.lastName,
				isActive: selectedUser.isActive
			});

			showEditModal = false;
			selectedUser = null;
			loadUsers();
			loadUserStats();
		} catch (error) {
			console.error('Error updating user:', error);
		}
	}

	async function handleDeleteUser() {
		if (!selectedUser) return;

		try {
			await adminUsersApi.deleteUser(selectedUser._id);
			showDeleteModal = false;
			selectedUser = null;
			loadUsers();
			loadUserStats();
		} catch (error) {
			console.error('Error deleting user:', error);
		}
	}

	async function toggleUserStatus(user: any) {
		try {
			await adminUsersApi.toggleUserStatus(user._id);
			loadUsers();
			loadUserStats();
		} catch (error) {
			console.error('Error toggling user status:', error);
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString();
	}

	function getStatusBadgeClass(isActive: boolean) {
		return isActive 
			? 'bg-green-100 text-green-800' 
			: 'bg-red-100 text-red-800';
	}
</script>

<svelte:head>
	<title>User Management - Admin Dashboard</title>
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
						<h1 class="text-2xl font-bold text-gray-900">User Management</h1>
					</div>
					<div>
						<button
							onclick={openCreateModal}
							class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
						>
							Create New User
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Stats Cards -->
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
									<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Total Users</dt>
									<dd class="text-lg font-medium text-gray-900">{userStats.totalUsers}</dd>
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
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Active</dt>
									<dd class="text-lg font-medium text-gray-900">{userStats.activeUsers}</dd>
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
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Inactive</dt>
									<dd class="text-lg font-medium text-gray-900">{userStats.inactiveUsers}</dd>
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
										<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Online</dt>
									<dd class="text-lg font-medium text-gray-900">{userStats.onlineUsers}</dd>
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
										<path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">New (30d)</dt>
									<dd class="text-lg font-medium text-gray-900">{userStats.newUsers}</dd>
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
								placeholder="Search users by name, email, or username..."
								bind:value={searchQuery}
								onkeydown={(e) => e.key === 'Enter' && handleSearch()}
								class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							/>
						</div>
						<button
							onclick={handleSearch}
							class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							Search
						</button>
					</div>
				</div>
			</div>

			<!-- Users Table -->
			<div class="bg-white shadow overflow-hidden sm:rounded-md">
				<div class="px-4 py-5 sm:px-6">
					<h3 class="text-lg leading-6 font-medium text-gray-900">
						Users ({pagination.totalUsers})
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
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onclick={() => handleSort('username')}>
										Username
										{#if sortBy === 'username'}
											<span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
										{/if}
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onclick={() => handleSort('email')}>
										Email
										{#if sortBy === 'email'}
											<span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
										{/if}
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Full Name
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
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
								{#each users as user}
									<tr>
										<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{user.username}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{user.email}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{user.fullName || '-'}
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusBadgeClass(user.isActive)}">
												{user.isActive ? 'Active' : 'Inactive'}
											</span>
											{#if user.isOnline}
												<span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
													Online
												</span>
											{/if}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{formatDate(user.createdAt)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div class="flex space-x-2">
												<button
													onclick={() => openEditModal(user)}
													class="text-indigo-600 hover:text-indigo-900"
												>
													Edit
												</button>
												<button
													onclick={() => toggleUserStatus(user)}
													class="text-yellow-600 hover:text-yellow-900"
												>
													{user.isActive ? 'Deactivate' : 'Activate'}
												</button>
												<button
													onclick={() => openDeleteModal(user)}
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

	<!-- Edit User Modal -->
	{#if showEditModal && selectedUser}
		<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
				<div class="mt-3">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700">Username</label>
							<input
								type="text"
								bind:value={selectedUser.username}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700">Email</label>
							<input
								type="email"
								bind:value={selectedUser.email}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700">First Name</label>
							<input
								type="text"
								bind:value={selectedUser.firstName}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700">Last Name</label>
							<input
								type="text"
								bind:value={selectedUser.lastName}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							/>
						</div>
						<div class="flex items-center">
							<input
								type="checkbox"
								bind:checked={selectedUser.isActive}
								class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
							/>
							<label class="ml-2 block text-sm text-gray-900">Active</label>
						</div>
					</div>
					<div class="flex justify-end space-x-3 mt-6">
						<button
							onclick={() => { showEditModal = false; selectedUser = null; }}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
						>
							Cancel
						</button>
						<button
							onclick={handleUpdateUser}
							class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
						>
							Save Changes
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Delete User Modal -->
	{#if showDeleteModal && selectedUser}
		<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
				<div class="mt-3">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Delete User</h3>
					<p class="text-sm text-gray-500 mb-4">
						Are you sure you want to delete user <strong>{selectedUser.username}</strong>? This action cannot be undone.
					</p>
					<div class="flex justify-end space-x-3">
						<button
							onclick={() => { showDeleteModal = false; selectedUser = null; }}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
						>
							Cancel
						</button>
						<button
							onclick={handleDeleteUser}
							class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
						>
							Delete User
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Create User Modal -->
	{#if showCreateModal}
		<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
				<div class="mt-3">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700">Username *</label>
							<input
								type="text"
								bind:value={newUser.username}
								placeholder="Enter username"
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								required
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700">Email *</label>
							<input
								type="email"
								bind:value={newUser.email}
								placeholder="Enter email address"
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								required
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700">Password *</label>
							<input
								type="password"
								bind:value={newUser.password}
								placeholder="Enter password"
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								required
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700">First Name</label>
							<input
								type="text"
								bind:value={newUser.firstName}
								placeholder="Enter first name (optional)"
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700">Last Name</label>
							<input
								type="text"
								bind:value={newUser.lastName}
								placeholder="Enter last name (optional)"
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							/>
						</div>
						<div class="flex items-center">
							<input
								type="checkbox"
								bind:checked={newUser.isActive}
								class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
							/>
							<label class="ml-2 block text-sm text-gray-900">Active Account</label>
						</div>
					</div>
					<div class="flex justify-end space-x-3 mt-6">
						<button
							onclick={() => { showCreateModal = false; }}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
						>
							Cancel
						</button>
						<button
							onclick={handleCreateUser}
							disabled={!newUser.username || !newUser.email || !newUser.password}
							class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Create User
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
			<p class="text-gray-600">Loading user management...</p>
		</div>
	</div>
{/if}
