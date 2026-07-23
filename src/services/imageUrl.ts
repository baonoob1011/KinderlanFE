// Chuẩn hoá URL ảnh trả về từ backend.
//
// Backend hiện trả presigned S3 URL tuyệt đối (https://...s3...amazonaws.com/...),
// nhưng một số endpoint/cấu hình cũ trả đường dẫn tương đối ("/uploads/brands/logo.png").
// Helper này xử lý cả hai trường hợp để component không phải tự đoán.

// api.ts mặc định dùng đường dẫn tương đối ("") vì Vercel rewrite /api/* sang backend.
// Ảnh tĩnh KHÔNG nằm trong rewrite đó, nên khi cần ghép host phải dùng host thật của API.
const IMAGE_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://api.kinderland.io.vn"
).replace(/\/+$/, "");

/**
 * - http/https/data/blob  -> giữ nguyên
 * - đường dẫn tương đối   -> ghép với IMAGE_BASE_URL
 * - rỗng/null/undefined   -> trả "" để component tự hiển thị fallback
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  if (/^(https?:)?\/\//i.test(trimmed) || /^(data|blob):/i.test(trimmed)) {
    return trimmed;
  }

  return `${IMAGE_BASE_URL}/${trimmed.replace(/^\/+/, "")}`;
}

export default resolveImageUrl;
