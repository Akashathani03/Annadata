// Single place the frontend's real API base URL is defined. Vite only
// exposes env vars prefixed VITE_ to client code - see .env.example.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8123/api/v1';
