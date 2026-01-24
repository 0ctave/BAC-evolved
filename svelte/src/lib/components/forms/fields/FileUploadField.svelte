<script lang="ts">
    import {Input} from '$lib/components/ui/input/index.js';

    interface FileUploadFieldProps {
		name: string;
		form: any;
	}

	const { name, form }: FileUploadFieldProps = $props();

    const formData = $derived(form.form);

    const onFileChange = (e: Event) => {
        $formData[name] = (e.target as HTMLInputElement).files?.[0];
    };
</script>

<Input type="file" id={name} onchange={onFileChange} />
