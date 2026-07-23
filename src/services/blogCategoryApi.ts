// Blog Category API Service
import { authenticatedFetch } from './api';

const API_BASE_URL = '';

// ─── Types ───────────────────────────────────────────────

export interface BlogCategory {
    id: number;
    name: string;
    description?: string;
}

interface ApiResponse<T> {
    timestamp: string;
    statusCode: number;
    message: string;
    data: T;
    success: boolean;
}

// ─── API ─────────────────────────────────────────────────

export const blogCategoryApi = {
    /**
     * GET /api/v1/blog-categories
     */
    getCategories: async (): Promise<BlogCategory[]> => {
        const response = await authenticatedFetch(
            `${API_BASE_URL}/api/v1/blog-categories`,
            { method: 'GET', headers: { 'Content-Type': 'application/json', Accept: '*/*' } }
        );
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `HTTP ${response.status}`);
        }
        const json: ApiResponse<BlogCategory[] | { content?: BlogCategory[] }> = await response.json();
        const raw = json.data;
        if (Array.isArray(raw)) return raw;
        if (raw && Array.isArray((raw as any).content)) return (raw as any).content;
        return [];
    },

    /**
     * POST /api/v1/blog-categories
     */
    createCategory: async (payload: { name: string; description?: string }): Promise<BlogCategory> => {
        const response = await authenticatedFetch(
            `${API_BASE_URL}/api/v1/blog-categories`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: '*/*' },
                body: JSON.stringify(payload),
            }
        );
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `HTTP ${response.status}`);
        }
        const json: ApiResponse<BlogCategory> = await response.json();
        return json.data;
    },

    /**
     * PUT /api/v1/blog-categories/{id}
     */
    updateCategory: async (id: number, payload: { name: string; description?: string }): Promise<BlogCategory> => {
        const response = await authenticatedFetch(
            `${API_BASE_URL}/api/v1/blog-categories/${id}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Accept: '*/*' },
                body: JSON.stringify(payload),
            }
        );
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `HTTP ${response.status}`);
        }
        const json: ApiResponse<BlogCategory> = await response.json();
        return json.data;
    },

    /**
     * DELETE /api/v1/blog-categories/{id}
     */
    deleteCategory: async (id: number): Promise<void> => {
        const response = await authenticatedFetch(
            `${API_BASE_URL}/api/v1/blog-categories/${id}`,
            {
                method: 'DELETE',
                headers: { Accept: '*/*' },
            }
        );
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `HTTP ${response.status}`);
        }
    },
};

export default blogCategoryApi;
