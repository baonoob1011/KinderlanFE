// Blog API Service
// Uses api.get/post/put/delete (same pattern as productApi.ts)

import api from './api';

// --- Types ---

export interface BlogItem {
    blogId: number;
    accountId: number;
    authorName: string;
    title: string;
    content: string;
    categoryId: number;
    categoryName: string;
    status: boolean;
    publishedAt: string;
    createdAt: string;
    updatedAt: string | null;
    imageUrl: string;
    timeRead: number;
}

export interface AdminBlogPageResponse {
    content: BlogItem[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export interface CreateBlogPayload {
    title: string;
    content: string;
    categoryId: number;
    imageUrl?: string;
    timeRead?: number;
    status?: boolean;
}

// Helper to normalize blog list responses
const normalizeBlogs = (res: any): BlogItem[] => {
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.data?.content && Array.isArray(res.data.content)) return res.data.content;
    if (res?.content && Array.isArray(res.content)) return res.content;
    return [];
};

// --- API ---

export const blogApi = {
    /**
     * [PUBLIC] Get published blogs
     * GET /api/v1/blogs?page=0&size=20
     */
    getBlogs: async (page = 0, size = 20): Promise<BlogItem[]> => {
        const res = await api.get(`/api/v1/blogs?page=${page}&size=${size}`);
        return normalizeBlogs(res);
    },

    /**
     * [ADMIN] Get all blogs (paginated, with search)
     * GET /api/v1/blogs/admin?page=0&size=20&keyword=...
     */
    getAdminBlogs: async (params?: {
        page?: number;
        size?: number;
        keyword?: string;
    }): Promise<AdminBlogPageResponse> => {
        const q = new URLSearchParams();
        q.set('page', String(params?.page ?? 0));
        q.set('size', String(params?.size ?? 20));
        if (params?.keyword) q.set('keyword', params.keyword);

        const res = await api.get(`/api/v1/blogs/admin?${q}`);
        const raw = res?.data ?? res;
        return {
            content: raw.content ?? raw.items ?? [],
            totalElements: raw.totalElements ?? 0,
            totalPages: raw.totalPages ?? 1,
            size: raw.size ?? 20,
            number: raw.number ?? 0,
            first: raw.first ?? true,
            last: raw.last ?? true,
        };
    },

    /**
     * Get blog by ID
     * GET /api/v1/blogs/{id}
     */
    getBlogById: async (id: number | string): Promise<BlogItem> => {
        const res = await api.get(`/api/v1/blogs/${id}`);
        return res?.data ?? res;
    },

    /**
     * [ADMIN] Create a new blog post
     * POST /api/v1/blogs
     */
    createBlog: async (payload: CreateBlogPayload): Promise<BlogItem> => {
        const res = await api.post('/api/v1/blogs', payload);
        return res?.data ?? res;
    },

    /**
     * [ADMIN] Update a blog post
     * PUT /api/v1/blogs/{id}
     */
    updateBlog: async (id: number, payload: CreateBlogPayload): Promise<BlogItem> => {
        const res = await api.put(`/api/v1/blogs/${id}`, payload);
        return res?.data ?? res;
    },

    /**
     * [ADMIN] Delete a blog post
     * DELETE /api/v1/blogs/{id}
     */
    deleteBlog: async (id: number): Promise<void> => {
        await api.delete(`/api/v1/blogs/${id}`);
    },
};

export default blogApi;
