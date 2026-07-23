import { api } from "./api";

// ---- Types ----

export interface Brand {
  id: number;
  name: string;
  origin: string | null;
  /** Presigned URL do backend sinh (hết hạn 60 phút) — CHỈ để hiển thị, không gửi ngược lên. */
  logoUrl?: string | null;
}

export interface BrandPayload {
  name: string;
  origin?: string | null;
  /** S3 key lấy từ imageApi.upload. Bỏ trống = giữ nguyên logo hiện có. */
  logoUrl?: string;
}

// ---- API ----

export const brandApi = {
  /**
   * GET /api/v1/brands
   * Returns all brands
   */
  getAll: async (): Promise<Brand[]> => {
    const response = await api.get("/api/v1/brands");
    return response.data;
  },

  /**
   * POST /api/v1/brands
   * Create a new brand
   */
  create: async (payload: BrandPayload): Promise<Brand> => {
    const response = await api.post("/api/v1/brands", payload);
    return response.data;
  },

  /**
   * PUT /api/v1/brands/{id}
   * Update an existing brand
   */
  update: async (id: number, payload: BrandPayload): Promise<Brand> => {
    const response = await api.put(`/api/v1/brands/${id}`, payload);
    return response.data;
  },

  /**
   * DELETE /api/v1/brands/{id}
   * Delete a brand by ID
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/brands/${id}`);
  },
};
