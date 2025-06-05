<script lang="ts">
	import '../app.css';
	// import { onMount } from 'svelte';
	// import { authStore } from '$lib/stores/auth.js';

	let { children } = $props();

	// onMount(() => {
	// 	// Check for existing authentication on app load
	// 	authStore.checkAuth();
	// });
</script>

{@render children()}
