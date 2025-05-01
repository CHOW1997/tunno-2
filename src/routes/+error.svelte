<script lang="ts">
    import { page } from '$app/stores';
</script>

<div class="error-container">
    <h1>{$page.status}: {$page.error?.message}</h1>
    <a href="/">Go back home</a>
</div>

<style>
    .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        text-align: center;
    }

    a {
        margin-top: 1rem;
        color: #0066cc;
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }
</style>