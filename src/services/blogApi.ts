// Blog API Service
// Uses api.get/post/put/delete (same pattern as productApi.ts)
//
// Backend (product-service BlogController) luôn bọc kết quả trong BaseResponse:
//   { timestamp, statusCode, message, data, success }
// => MỌI chỗ đọc dữ liệu phải lấy `res.data`, không phải `res`.
//
// Thêm nữa, BlogResponse của backend dùng field `id` + `authorEmail`, KHÔNG có
// `blogId` / `accountId` / `authorName` / `imageUrl` như type cũ khai báo. Vì vậy
// mọi response đều đi qua `toBlogItem()` để chuẩn hoá về một shape duy nhất.

import api from "./api";
import { imageApi } from "./imageApi";

// --- Types ---

export interface BlogItem {
  /** Alias của `id` từ backend — giữ tên cũ để component không phải đổi. */
  blogId: number;
  id: number;
  authorEmail: string | null;
  /** Backend chưa trả tên tác giả; fallback về authorEmail. */
  authorName: string | null;
  title: string;
  content: string;
  categoryId: number | null;
  categoryName: string | null;
  status: boolean;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** Backend chưa lưu ảnh bìa cho blog -> luôn rỗng cho tới khi có field này. */
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
  /** Đếm trên TOÀN BỘ danh sách (không chỉ trang hiện tại). */
  publishedCount: number;
  draftCount: number;
}

export interface CreateBlogPayload {
  title: string;
  content: string;
  categoryId: number | null;
  imageUrl?: string;
  timeRead?: number;
  status?: boolean;
}

// --- Helpers ---

/** Bóc BaseResponse: { data: ... } -> ...; chấp nhận cả payload trần. */
const unwrap = (res: any): any =>
  res && typeof res === "object" && "data" in res ? res.data : res;

/** Chuẩn hoá 1 bản ghi backend -> BlogItem. */
const toBlogItem = (raw: any): BlogItem => {
  const id = Number(raw?.id ?? raw?.blogId ?? 0);
  return {
    blogId: id,
    id,
    authorEmail: raw?.authorEmail ?? null,
    authorName: raw?.authorName ?? raw?.authorEmail ?? null,
    title: raw?.title ?? "",
    content: raw?.content ?? "",
    categoryId: raw?.categoryId ?? null,
    categoryName: raw?.categoryName ?? null,
    // status có thể về dạng boolean hoặc chuỗi "true" tuỳ serializer.
    status: raw?.status === true || raw?.status === "true",
    publishedAt: raw?.publishedAt ?? null,
    createdAt: raw?.createdAt ?? null,
    updatedAt: raw?.updatedAt ?? null,
    imageUrl: raw?.imageUrl ?? "",
    timeRead: Number(raw?.timeRead ?? 0),
  };
};

/**
 * Lấy mảng blog từ mọi shape backend có thể trả:
 *   [...]                      (hiếm)
 *   { data: [...] }            (BaseResponse<List<BlogResponse>>) ← thực tế
 *   { data: { content: [...] } } / { content: [...] }  (nếu sau này đổi sang Page)
 */
const normalizeBlogs = (res: any): BlogItem[] => {
  const raw = unwrap(res);
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.content)
      ? raw.content
      : Array.isArray(raw?.items)
        ? raw.items
        : [];
  return arr.map(toBlogItem);
};

/**
 * Gắn ảnh bìa vào các bài viết.
 *
 * BlogResponse của backend KHÔNG có field imageUrl (khác ProductResponse), nên ảnh
 * phải đọc riêng từ bảng images qua GET /api/v1/images?entityType=BLOG&entityId={id}.
 * Mỗi bài 1 request -> chỉ gọi cho các bài đang hiển thị, và lỗi thì bỏ qua.
 */
const attachCovers = async (items: BlogItem[]): Promise<BlogItem[]> => {
  const covers = await Promise.all(
    items.map((b) => imageApi.listByEntity("BLOG", b.blogId)),
  );
  return items.map((b, i) => ({ ...b, imageUrl: covers[i][0]?.url ?? "" }));
};

/** Xoá toàn bộ ảnh bìa của 1 blog. */
export const removeBlogCover = async (blogId: number): Promise<void> => {
  const existing = await imageApi.listByEntity("BLOG", blogId);
  await Promise.all(
    existing.map((img) => imageApi.delete(img.id).catch(() => undefined)),
  );
};

/** Upload ảnh bìa mới cho blog, xoá ảnh cũ để mỗi bài chỉ giữ 1 ảnh. */
export const uploadBlogCover = async (
  blogId: number,
  file: File,
): Promise<string> => {
  const existing = await imageApi.listByEntity("BLOG", blogId);
  const uploaded = await imageApi.upload(file, "BLOG", blogId);
  // Xoá sau khi upload thành công — nếu upload lỗi thì ảnh cũ vẫn còn nguyên.
  await Promise.all(
    existing.map((img) => imageApi.delete(img.id).catch(() => undefined)),
  );
  return uploaded.url;
};

// --- API ---

export const blogApi = {
  /**
   * [PUBLIC] Get published blogs
   * GET /api/v1/blogs
   */
  getBlogs: async (page = 0, size = 20): Promise<BlogItem[]> => {
    // Backend chưa hỗ trợ phân trang cho endpoint này -> cắt trang ở client.
    const all = normalizeBlogs(await api.get(`/api/v1/blogs`));
    const start = page * size;
    return attachCovers(all.slice(start, start + size));
  },

  /**
   * [ADMIN] Get all blogs (kể cả bài nháp).
   * GET /api/v1/blogs/admin — nếu không truy cập được (chưa đăng nhập admin,
   * 401/403/404) thì fallback sang GET /api/v1/blogs để trang vẫn có dữ liệu.
   *
   * Backend trả BaseResponse<List<BlogResponse>> — `data` là MẢNG THUẦN, không
   * phải Page. Code cũ đọc `res.content` (trên envelope!) nên luôn ra [] dù DB có
   * bài, khiến bảng admin trống và "Tổng bài viết" luôn = 0.
   */
  getAdminBlogs: async (params?: {
    page?: number;
    size?: number;
    keyword?: string;
    categoryId?: number | null;
    /** true = chỉ bài đã đăng, false = chỉ nháp, null/undefined = tất cả. */
    status?: boolean | null;
  }): Promise<AdminBlogPageResponse> => {
    let all: BlogItem[];
    try {
      all = normalizeBlogs(await api.get(`/api/v1/blogs/admin`));
    } catch {
      all = normalizeBlogs(await api.get(`/api/v1/blogs`));
    }

    const page = params?.page ?? 0;
    const size = params?.size ?? 20;
    const keyword = (params?.keyword ?? "").trim().toLowerCase();
    const categoryId = params?.categoryId ?? null;

    // Backend chưa hỗ trợ keyword/categoryId/page/size -> lọc & cắt trang ở client.
    let filtered = all;
    if (keyword) {
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(keyword) ||
          b.content.toLowerCase().includes(keyword) ||
          (b.categoryName ?? "").toLowerCase().includes(keyword),
      );
    }
    if (categoryId != null) {
      filtered = filtered.filter((b) => Number(b.categoryId) === categoryId);
    }

    // Đếm Đã đăng / Nháp TRƯỚC khi lọc theo trạng thái, nếu không một trong hai
    // ô thống kê sẽ luôn bằng 0 khi người dùng bấm tab "Đã đăng"/"Nháp".
    const publishedCount = filtered.filter((b) => b.status).length;
    const draftCount = filtered.length - publishedCount;

    if (params?.status != null) {
      filtered = filtered.filter((b) => b.status === params.status);
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / size));
    // Nếu bộ lọc thu hẹp kết quả khiến trang hiện tại vượt quá cuối danh sách,
    // trả về trang cuối thay vì một trang rỗng.
    const safePage = Math.min(page, totalPages - 1);
    const safeStart = safePage * size;

    return {
      content: await attachCovers(filtered.slice(safeStart, safeStart + size)),
      totalElements: filtered.length,
      totalPages,
      size,
      number: safePage,
      first: safePage === 0,
      last: safeStart + size >= filtered.length,
      publishedCount,
      draftCount,
    };
  },

  /**
   * Get blog by ID
   * GET /api/v1/blogs/{id}
   */
  getBlogById: async (id: number | string): Promise<BlogItem> => {
    const blog = toBlogItem(unwrap(await api.get(`/api/v1/blogs/${id}`)));
    return (await attachCovers([blog]))[0];
  },

  /**
   * [ADMIN] Create a new blog post
   * POST /api/v1/blogs
   */
  createBlog: async (payload: CreateBlogPayload): Promise<BlogItem> => {
    return toBlogItem(unwrap(await api.post("/api/v1/blogs", payload)));
  },

  /**
   * [ADMIN] Update a blog post
   * PUT /api/v1/blogs/{id}
   */
  updateBlog: async (
    id: number,
    payload: CreateBlogPayload,
  ): Promise<BlogItem> => {
    return toBlogItem(unwrap(await api.put(`/api/v1/blogs/${id}`, payload)));
  },

  /**
   * [ADMIN] Bật/tắt xuất bản.
   * PATCH /api/v1/blogs/{id}/status
   */
  toggleStatus: async (id: number): Promise<BlogItem> => {
    return toBlogItem(unwrap(await api.patch(`/api/v1/blogs/${id}/status`, {})));
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
