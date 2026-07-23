import { api, authenticatedFetch } from './api';

// ── Types ─────────────────────────────────────────────────

export interface Review {
    id: number;
    accountId: number;
    reviewerName: string;
    rating: number;
    comment: string;
    createdAt: string;
    productName: string;
    productId: number;
    managerReply: string | null;
    managerReplyAt: string | null;
}

export interface ReviewUpdatePayload {
    rating: number;
    comment: string;
}

export interface AddReviewPayload {
    rating: number;
    comment: string;
}

// ── API ────────────────────────────────────────────────────

export const reviewApi = {
    /**
     * GET /api/v1/reviews/sku/{skuId}
     * Get all reviews for a specific SKU
     */
    getBySku: async (skuId: number): Promise<Review[]> => {
        const response = await api.get(`/api/v1/reviews/sku/${skuId}`);
        return Array.isArray(response) ? response : (response?.data ?? []);
    },

    /**
     * GET /api/v1/reviews/product/{productId}
     * Get all reviews across all SKUs for a product
     */
    getByProduct: async (productId: number): Promise<Review[]> => {
        const response = await api.get(`/api/v1/reviews/product/${productId}`);
        return Array.isArray(response) ? response : (response?.data ?? []);
    },

    /**
     * POST /api/v1/reviews/sku/{skuId}
     * Submit a new review for a specific SKU (requires purchase + CUSTOMER role)
     */
    addReview: async (skuId: number, payload: AddReviewPayload): Promise<Review> => {
        const params = new URLSearchParams({
            rating: payload.rating.toString(),
            comment: payload.comment,
        });
        const response = await authenticatedFetch(`/api/v1/reviews/sku/${skuId}?${params.toString()}`, {
            method: 'POST',
        });
        if (!response.ok) {
            const errBody = await response.text();
            console.error('addReview failed:', response.status, errBody);
            throw new Error(errBody || `HTTP error! status: ${response.status}`);
        }
        const res = await response.json();
        return res?.data ?? res;
    },

    /**
     * PUT /api/v1/reviews/{reviewId}
     * Edit an existing review (CUSTOMER role, must be review owner)
     */
    edit: async (reviewId: number, payload: ReviewUpdatePayload): Promise<Review> => {
        const params = new URLSearchParams({
            rating: payload.rating.toString(),
            comment: payload.comment,
        });
        const response = await api.put(`/api/v1/reviews/${reviewId}?${params.toString()}`, null);
        return response?.data ?? response;
    },

    // ── Manager-only APIs (kept for ReviewManagement) ──────

    /**
     * GET /api/v1/reviews  (manager)
     */
    getAllReviews: async (): Promise<Review[]> => {
        const response = await api.get('/api/v1/reviews');
        return response?.data ?? [];
    },

    /**
     * POST /api/v1/reviews/{reviewId}/reply  (manager)
     */
    replyToReview: async (reviewId: number, reply: string): Promise<Review> => {
        const response = await api.post(
            `/api/v1/reviews/${reviewId}/reply?reply=${encodeURIComponent(reply)}`,
            null
        );
        return response?.data ?? response;
    },

    /**
     * DELETE /api/v1/reviews/{reviewId}  (manager)
     */
    deleteReview: async (reviewId: number): Promise<void> => {
        await api.delete(`/api/v1/reviews/${reviewId}`);
    },
};
