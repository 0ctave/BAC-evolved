export function reveal(node: HTMLElement, options = { threshold: 0.1, once: true }) {
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					node.dispatchEvent(new CustomEvent('reveal'));
					if (options.once) observer.unobserve(node);
				}
			});
		},
		{ threshold: options.threshold }
	);

	observer.observe(node);
	return {
		destroy() {
			observer.disconnect();
		}
	};
}
