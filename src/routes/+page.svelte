<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		// Simple redirect to login page
		goto('/login');
	});
</script>

<svelte:head>
	<title>Messenger</title>
</svelte:head>

<!-- Loading state while checking authentication -->
<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="text-center">
		<div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
			<svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
			</svg>
		</div>
		<h1 class="text-2xl font-bold text-gray-900 mb-2">Messenger</h1>
		<p class="text-gray-600">Loading...</p>
	</div>
</div>
