import { api } from './api';

// ---- Types ----

export interface Category {
    id: number;
    name: string;
    parentId: number | null;
    parentName: string | null;
}

export interface CategoryPayload {
    name: string;
    parentId?: number | null;
}

// ---- API ----

export const categoryApi = {
    /**
     * GET /api/v1/categories
     * Returns all categories
     */
    getAll: async (): Promise<Category[]> => {
        const response = await api.get('/api/v1/categories');
        return response.data;
    },

    /**
     * POST /api/v1/categories
     * Create a new category
     */
    create: async (payload: CategoryPayload): Promise<Category> => {
        const response = await api.post('/api/v1/categories', payload);
        return response.data;
    },

    /**
     * PUT /api/v1/categories/{id}
     * Update an existing category
     */
    update: async (id: number, payload: CategoryPayload): Promise<Category> => {
        const response = await api.put(`/api/v1/categories/${id}`, payload);
        return response.data;
    },

    /**
     * DELETE /api/v1/categories/{id}
     * Delete a category by ID
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/v1/categories/${id}`);
    },
};
