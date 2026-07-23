// Image Upload API Service
// Uploads files to S3 via POST /api/v1/images (multipart/form-data)

import { authenticatedFetch } from './api';

const API_BASE_URL = '';

export interface ImageUploadResponse {
    id: number;
    key: string;       // S3 object key (short, for DB storage)
    url: string;       // presigned URL (for immediate display in browser)
    entityType: string;
    entityId: number;
}

export type ImageEntityType = 'PRODUCT' | 'BLOG' | 'PRODUCT_BRAND' | 'SKU';

export const imageApi = {
    /**
     * POST /api/v1/images
     * Upload a file to S3 and associate it with an entity.
     *
     * Usage:
     *   result.key → store in DB (short, fits VARCHAR(255))
     *   result.url → display in <img> immediately (presigned, temporary)
     */
    upload: async (
        file: File,
        entityType: ImageEntityType,
        entityId: number,
    ): Promise<ImageUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType);
        formData.append('entityId', String(entityId));

        const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/images`, {
            method: 'POST',
            // Let the browser set Content-Type with boundary for multipart
            body: formData,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Upload failed: HTTP ${response.status}`);
        }

        const json = await response.json();
        return json.data as ImageUploadResponse;
    },

    /**
     * GET /api/v1/images/{id}
     * Get image info with a fresh presigned URL.
     */
    getById: async (id: number): Promise<ImageUploadResponse> => {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/images/${id}`, {
            method: 'GET',
            headers: { Accept: '*/*' },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `HTTP ${response.status}`);
        }

        const json = await response.json();
        return json.data as ImageUploadResponse;
    },

    /**
     * GET /api/v1/images?entityType=...&entityId=...
     * Tất cả ảnh gắn với 1 đối tượng, kèm presigned URL.
     *
     * Trả [] thay vì ném lỗi khi không đọc được (khách chưa đăng nhập sẽ nhận 401 vì
     * gateway không mở public GET cho /api/v1/images) — ảnh bìa chỉ là trang trí,
     * không đáng để làm hỏng cả trang.
     */
    listByEntity: async (
        entityType: ImageEntityType,
        entityId: number,
    ): Promise<ImageUploadResponse[]> => {
        if (!entityId) return [];
        try {
            const response = await authenticatedFetch(
                `${API_BASE_URL}/api/v1/images?entityType=${entityType}&entityId=${entityId}`,
                { method: 'GET', headers: { Accept: '*/*' } },
            );
            if (!response.ok) return [];
            const json = await response.json();
            return Array.isArray(json?.data) ? (json.data as ImageUploadResponse[]) : [];
        } catch {
            return [];
        }
    },

    /**
     * DELETE /api/v1/images/{id}
     * Delete an image from S3.
     */
    delete: async (id: number): Promise<void> => {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/images/${id}`, {
            method: 'DELETE',
            headers: { Accept: '*/*' },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `HTTP ${response.status}`);
        }
    },
};

export default imageApi;
