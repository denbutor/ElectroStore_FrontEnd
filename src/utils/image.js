const DEFAULT_FALLBACK = "https://placehold.co/400x300?text=No+Image";

export const resolveImageUrl = (url, fallback = DEFAULT_FALLBACK) => {
    if (!url) return fallback;
    return url.replace("http://minio:9000", "http://localhost:9000");
};