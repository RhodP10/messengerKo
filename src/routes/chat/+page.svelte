<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { chatStore } from '$lib/stores/chat.js';
	import ChatSidebar from '$lib/components/ChatSidebar.svelte';
	import ChatWindow from '$lib/components/ChatWindow.svelte';
	import type { Conversation } from '$lib/types.js';

	const authState = $derived(authStore);

	let activeConversation = $state<Conversation | null>(null);

	onMount(() => {
		// Check authentication on mount
		authStore.checkAuth();
		
		// Redirect if not authenticated
		if (!$authState.isAuthenticated) {
			goto('/login');
			return;
		}

		// Load conversations
		if ($authState.user) {
			chatStore.loadConversations($authState.user.id);
		}
	});

	// Redirect if user logs out
	$effect(() => {
		if (!$authState.isAuthenticated) {
			goto('/login');
		}
	});

	function handleSelectConversation(conversation: Conversation) {
		activeConversation = conversation;
		if ($authState.user) {
			chatStore.selectConversation(conversation, $authState.user.id);
		}
	}
</script>

<svelte:head>
	<title>Chat - Messenger</title>
</svelte:head>

{#if $authState.user}
	<div class="h-screen flex bg-gray-100">
		<!-- Mobile: Show sidebar or chat based on selection -->
		<div class="md:hidden w-full">
			{#if !activeConversation}
				<!-- Mobile Sidebar -->
				<ChatSidebar
					currentUser={$authState.user}
					{activeConversation}
					onSelectConversation={handleSelectConversation}
				/>
			{:else}
				<!-- Mobile Chat Window -->
				<ChatWindow
					currentUser={$authState.user}
					{activeConversation}
					onBackToSidebar={() => activeConversation = null}
				/>
			{/if}
		</div>

		<!-- Desktop: Show both sidebar and chat -->
		<div class="hidden md:flex w-full">
			<!-- Desktop Sidebar -->
			<ChatSidebar
				currentUser={$authState.user}
				{activeConversation}
				onSelectConversation={handleSelectConversation}
			/>

			<!-- Desktop Chat Window -->
			<div class="flex-1 flex flex-col">
				<ChatWindow
					currentUser={$authState.user}
					{activeConversation}
				/>
			</div>
		</div>
	</div>
{:else}
	<!-- Loading state -->
	<div class="h-screen flex items-center justify-center bg-gray-50">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
			<p class="text-gray-600">Loading...</p>
		</div>
	</div>
{/if}
