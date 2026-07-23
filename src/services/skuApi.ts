// SKU API Service
import { api } from './api';

// --- Types ---

export interface SkuItem {
    id: number;
    skuCode: string;
    size: string;
    color: string;
    type: string;
    imageUrl: string;
    price: number;
    productId: number;
    productName: string;
}

export interface SkuResponse {
    timestamp: string;
    statusCode: number;
    apiPath: string;
    message: string;
    data: SkuItem;
    success: boolean;
}

export interface CreateSkuPayload {
    productId: number;
    size: string;
    color: string;
    type: string;
    price: number;
}

export interface UpdateSkuPayload {
    skuCode?: string;
    size?: string;
    color?: string;
    type?: string;
    price: number;
}

// --- API ---

export const skuApi = {
    /**
     * GET /api/v1/sku
     * Lấy tất cả SKUs
     */
    getAll: async (): Promise<SkuItem[]> => {
        const res = await api.get('/api/v1/sku');
        if (Array.isArray(res)) return res;
        if (res?.data && Array.isArray(res.data)) return res.data;
        return [];
    },

    /**
     * Lấy SKUs theo productId (client-side filter)
     */
    getByProduct: async (productId: number): Promise<SkuItem[]> => {
        const all = await skuApi.getAll();
        return all.filter((s: SkuItem) => s.productId === productId);
    },

    /**
     * GET /api/v1/sku/{id}
     */
    getSkuById: async (id: number): Promise<SkuItem> => {
        const response: SkuResponse = await api.get(`/api/v1/sku/${id}`);
        return response.data;
    },

    /**
     * POST /api/v1/sku
     * Tạo SKU mới
     */
    create: async (payload: CreateSkuPayload): Promise<SkuItem> => {
        const res = await api.post('/api/v1/sku', payload);
        return res?.data ?? res;
    },

    /**
     * PUT /api/v1/sku/{id}
     */
    updateSku: async (id: number, payload: UpdateSkuPayload): Promise<SkuItem> => {
        const response: SkuResponse = await api.put(`/api/v1/sku/${id}`, payload);
        return response.data;
    },

    /**
     * DELETE /api/v1/sku/{id}
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/v1/sku/${id}`);
    },
};

export default skuApi;

