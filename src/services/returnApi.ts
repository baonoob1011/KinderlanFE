// Return Request API Service
// Uses api.get/post/patch (same pattern as productApi.ts)

import api from './api';
import { authenticatedFetch } from './api';

// ---- Types ----

export type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';

export interface ReturnResponseDTO {
    returnId: number;
    returnCode: string | null;
    orderItemId: number;
    orderId: number | null;
    returnReason: string;
    rejectionReason: string | null;
    returnStatus: ReturnStatus;
    description: string | null;
    photoUrls: string[] | null;
    refundAmount: number | null;
    refundType: string | null;
    bankAccountNumber: string | null;
    bankName: string | null;
    bankAccountName: string | null;
    refundTransactionCode: string | null;
    requestedAt: string;
    processedAt: string | null;
    refundedAt: string | null;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    productName: string | null;
    quantity: number | null;
    storeName: string | null;
    storeAddress: string | null;
    storePhone: string | null;
    processedByName: string | null;
}

export interface ReturnPageResponse {
    content: ReturnResponseDTO[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export interface ReturnRequestPayload {
    orderItemId: number;
    returnReason: string;
    description?: string;
    photoUrls: string[];
    bankAccountNumber: string;
    bankName: string;
    bankAccountName: string;
}

export interface RejectPayload {
    rejectionReason: string;
}

export interface RefundPayload {
    refundType: 'BANK_TRANSFER' | 'E_GIFT';
    bankTransactionCode?: string;
}

// ---- API ----

export const returnApi = {
    /**
     * [ADMIN/MANAGER] Get all return requests (paginated)
     * GET /api/v1/return-requests?page=0&size=20
     */
    getAll: async (page = 0, size = 20): Promise<ReturnPageResponse> => {
        const res = await api.get(`/api/v1/return-requests?page=${page}&size=${size}`);
        const raw = res?.data ?? res;
        return {
            content: raw.content ?? [],
            totalElements: raw.totalElements ?? 0,
            totalPages: raw.totalPages ?? 1,
            size: raw.size ?? size,
            number: raw.number ?? 0,
            first: raw.first ?? true,
            last: raw.last ?? true,
        };
    },

    /**
     * [CUSTOMER/MANAGER] Get return request by ID
     * GET /api/v1/return-requests/{id}
     */
    getById: async (id: number): Promise<ReturnResponseDTO> => {
        const res = await api.get(`/api/v1/return-requests/${id}`);
        return res?.data ?? res;
    },

    /**
     * [CUSTOMER] Get my return requests (paginated)
     * GET /api/v1/return-requests/my-requests?page=0&size=20
     */
    getMyRequests: async (page = 0, size = 20): Promise<ReturnPageResponse> => {
        const res = await api.get(`/api/v1/return-requests/my-requests?page=${page}&size=${size}`);
        const raw = res?.data ?? res;
        return {
            content: raw.content ?? [],
            totalElements: raw.totalElements ?? 0,
            totalPages: raw.totalPages ?? 1,
            size: raw.size ?? size,
            number: raw.number ?? 0,
            first: raw.first ?? true,
            last: raw.last ?? true,
        };
    },

    /**
     * [CUSTOMER] Create a return request
     * POST /api/v1/return-requests
     */
    create: async (payload: ReturnRequestPayload): Promise<ReturnResponseDTO> => {
        const res = await api.post('/api/v1/return-requests', payload);
        return res?.data ?? res;
    },

    /**
     * [MANAGER] Approve a return request
     * PATCH /api/v1/return-requests/{id}/approve
     */
    approve: async (id: number): Promise<ReturnResponseDTO> => {
        const res = await api.patch(`/api/v1/return-requests/${id}/approve`, {});
        return res?.data ?? res;
    },

    /**
     * [MANAGER] Reject a return request
     * PATCH /api/v1/return-requests/{id}/reject
     */
    reject: async (id: number, payload: RejectPayload): Promise<ReturnResponseDTO> => {
        const res = await api.patch(`/api/v1/return-requests/${id}/reject`, payload);
        return res?.data ?? res;
    },

    /**
     * [MANAGER] Mark return as received
     * PATCH /api/v1/return-requests/{id}/receive
     */
    receive: async (id: number): Promise<ReturnResponseDTO> => {
        const res = await api.patch(`/api/v1/return-requests/${id}/receive`, {});
        return res?.data ?? res;
    },

    /**
     * [MANAGER] Process refund
     * PATCH /api/v1/return-requests/{id}/refund
     */
    refund: async (id: number, payload: RefundPayload): Promise<ReturnResponseDTO> => {
        const res = await api.patch(`/api/v1/return-requests/${id}/refund`, payload);
        return res?.data ?? res;
    },

    /**
     * [CUSTOMER/MANAGER] Get printable shipping label (HTML)
     * GET /api/v1/return-requests/{id}/label
     */
    getShippingLabel: async (id: number): Promise<string> => {
        const response = await authenticatedFetch(`/api/v1/return-requests/${id}/label`, {
            method: 'GET',
            headers: { Accept: 'text/html' },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    },
};

export default returnApi;
