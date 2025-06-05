<script lang="ts">
	import AuthForm from '$lib/components/AuthForm.svelte';
	import { authStore } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const authState = $derived(authStore);

	onMount(() => {
		// Redirect if already authenticated
		if ($authState.isAuthenticated) {
			goto('/chat');
		}
	});
</script>

<svelte:head>
	<title>Login - Messenger</title>
</svelte:head>

<AuthForm mode="login" />
