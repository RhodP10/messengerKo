<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';

	const authState = $derived(authStore);

	onMount(() => {
		// Check authentication on mount
		authStore.checkAuth();

		// Redirect if not authenticated
		if (!$authState.isAuthenticated) {
			goto('/login');
			return;
		}

		// Redirect if not admin
		if ($authState.user?.userType !== 'admin') {
			goto('/chat');
			return;
		}
	});

	// Redirect if user logs out or loses admin status
	$effect(() => {
		if (!$authState.isAuthenticated) {
			goto('/login');
		} else if ($authState.user?.userType !== 'admin') {
			goto('/chat');
		}
	});

	async function handleLogout() {
		await authStore.logout();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Admin Dashboard - Messenger</title>
</svelte:head>

{#if $authState.user && $authState.user.userType === 'admin'}
	<div class="min-h-screen bg-gray-50">
		<!-- Header -->
		<header class="bg-white shadow">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between items-center py-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
						</div>
					</div>
					<div class="flex items-center space-x-4">
						<div class="text-sm text-gray-700">
							Welcome, <span class="font-medium">{$authState.user.fullName || $authState.user.username}</span>
						</div>
						<button
							onclick={handleLogout}
							class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
						>
							Logout
						</button>
					</div>
				</div>
			</div>
		</header>

		<!-- Main Content -->
		<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
			<div class="px-4 py-6 sm:px-0">
				<!-- Welcome Card -->
				<div class="bg-white overflow-hidden shadow rounded-lg mb-6">
					<div class="px-4 py-5 sm:p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
									<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
									</svg>
								</div>
							</div>
							<div class="ml-5">
								<h3 class="text-lg leading-6 font-medium text-gray-900">
									Admin Login Successful!
								</h3>
								<p class="mt-1 text-sm text-gray-500">
									You have successfully logged in as an administrator.
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Admin Info Card -->
				<div class="bg-white overflow-hidden shadow rounded-lg mb-6">
					<div class="px-4 py-5 sm:p-6">
						<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
							Admin Information
						</h3>
						<dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
							<div>
								<dt class="text-sm font-medium text-gray-500">Full Name</dt>
								<dd class="mt-1 text-sm text-gray-900">{$authState.user.fullName || 'N/A'}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">Username</dt>
								<dd class="mt-1 text-sm text-gray-900">{$authState.user.username}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">Email</dt>
								<dd class="mt-1 text-sm text-gray-900">{$authState.user.email}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">Role</dt>
								<dd class="mt-1 text-sm text-gray-900">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
										{$authState.user.role}
									</span>
								</dd>
							</div>
							<div class="sm:col-span-2">
								<dt class="text-sm font-medium text-gray-500">Permissions</dt>
								<dd class="mt-1 text-sm text-gray-900">
									<div class="flex flex-wrap gap-2">
										{#each $authState.user.permissions || [] as permission}
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
												{permission.replace('_', ' ')}
											</span>
										{/each}
									</div>
								</dd>
							</div>
						</dl>
					</div>
				</div>

				<!-- Quick Actions -->
				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
							Quick Actions
						</h3>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<button class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border border-gray-300 hover:border-gray-400">
								<div>
									<span class="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
										<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
										</svg>
									</span>
								</div>
								<div class="mt-8">
									<h3 class="text-lg font-medium">
										<span class="absolute inset-0" aria-hidden="true"></span>
										Manage Users
									</h3>
									<p class="mt-2 text-sm text-gray-500">
										View and manage user accounts
									</p>
								</div>
							</button>

							<button class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border border-gray-300 hover:border-gray-400">
								<div>
									<span class="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
										<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
										</svg>
									</span>
								</div>
								<div class="mt-8">
									<h3 class="text-lg font-medium">
										<span class="absolute inset-0" aria-hidden="true"></span>
										Monitor Conversations
									</h3>
									<p class="mt-2 text-sm text-gray-500">
										View and moderate conversations
									</p>
								</div>
							</button>

							<button class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border border-gray-300 hover:border-gray-400">
								<div>
									<span class="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
										<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"></path>
										</svg>
									</span>
								</div>
								<div class="mt-8">
									<h3 class="text-lg font-medium">
										<span class="absolute inset-0" aria-hidden="true"></span>
										View Analytics
									</h3>
									<p class="mt-2 text-sm text-gray-500">
										System statistics and reports
									</p>
								</div>
							</button>
						</div>
					</div>
				</div>
			</div>
		</main>
	</div>
{:else}
	<!-- Loading state -->
	<div class="h-screen flex items-center justify-center bg-gray-50">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
			<p class="text-gray-600">Loading admin dashboard...</p>
		</div>
	</div>
{/if}
