export const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/300';
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    // Normalize path (ensure it starts with /)
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '');
    return `${apiBase}${normalizedPath}`;
};
