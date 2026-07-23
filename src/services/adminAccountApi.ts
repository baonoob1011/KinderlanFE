import { api } from './api';

// ---- Types ----

export interface AdminAccount {
    id: number;
    username: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: string;
    active: boolean;
}

export interface CreateAccountPayload {
    username: string;
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string; // "ADMIN" | "MANAGER" | "STAFF" (no ROLE_ prefix)
}

interface ApiResponse<T> {
    timestamp: string;
    statusCode: number;
    apiPath: string;
    message: string;
    data: T;
    success: boolean;
}

// ---- API ----

export const adminAccountApi = {
    /**
     * GET /api/v1/admin/accounts
     * Returns all user accounts (admin only)
     */
    getAccounts: async (): Promise<AdminAccount[]> => {
        const response = await api.get('/api/v1/admin/accounts');
        return response.data;
    },

    /**
     * POST /api/v1/admin/accounts/create
     * Create a new user account
     */
    createAccount: async (payload: CreateAccountPayload): Promise<void> => {
        await api.post('/api/v1/admin/accounts/create', payload);
    },

    /**
     * DELETE /api/v1/admin/accounts/{id}
     * Delete a user account by ID
     */
    deleteAccount: async (id: number): Promise<void> => {
        await api.delete(`/api/v1/admin/accounts/delete/${id}`);
    },
};
