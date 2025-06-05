<script lang="ts">
	import { chatStore } from '../stores/chat.js';
	import type { User } from '../types.js';

	interface Props {
		currentUser: User;
		conversationId: string;
	}

	let { currentUser, conversationId }: Props = $props();

	let message = $state('');
	let textareaRef: HTMLTextAreaElement;

	function handleSubmit(event: Event) {
		event.preventDefault();
		
		if (message.trim()) {
			chatStore.sendMessage(message.trim(), conversationId, currentUser.id);
			message = '';
			
			// Reset textarea height
			if (textareaRef) {
				textareaRef.style.height = 'auto';
			}
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit(event);
		}
	}

	function autoResize() {
		if (textareaRef) {
			textareaRef.style.height = 'auto';
			textareaRef.style.height = Math.min(textareaRef.scrollHeight, 120) + 'px';
		}
	}
</script>

<div class="border-t border-gray-200 bg-white px-4 py-3">
	<form onsubmit={handleSubmit} class="flex items-end space-x-3">
		<!-- Emoji button -->
		<button
			type="button"
			aria-label="Add emoji"
			class="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full"
		>
			<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clip-rule="evenodd"></path>
			</svg>
		</button>

		<!-- Message input -->
		<div class="flex-1 relative">
			<textarea
				bind:this={textareaRef}
				bind:value={message}
				onkeydown={handleKeydown}
				oninput={autoResize}
				placeholder="Type a message..."
				rows="1"
				class="w-full px-4 py-2 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent max-h-30 overflow-y-auto"
			></textarea>
		</div>

		<!-- Attachment button -->
		<button
			type="button"
			aria-label="Attach file"
			class="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
			</svg>
		</button>

		<!-- Send button -->
		<button
			type="submit"
			disabled={!message.trim()}
			aria-label="Send message"
			class="flex-shrink-0 p-2 bg-green-600 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
			</svg>
		</button>
	</form>
</div>
