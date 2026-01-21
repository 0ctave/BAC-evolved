<script lang="ts">
	import { cn } from '$lib/utils';

	interface TextProps {
		content: string;
		class?: string;
		'data-directus'?: string | undefined;
	}

	let { content, 'data-directus': dataDirectus, ...props }: TextProps = $props();
</script>

<div
		class={cn(
        'prose prose-lg max-w-none font-sans leading-relaxed',
        'text-iron-muted dark:text-limestone-300',
        'prose-headings:font-heading prose-headings:font-bold prose-headings:text-iron dark:prose-headings:text-limestone-50',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:bg-primary/5 prose-blockquote:p-4',
        'prose-strong:text-iron dark:prose-strong:text-limestone-100',
        props.class
    )}
		data-directus={dataDirectus}
>
	{@html content}
</div>