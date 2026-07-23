import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { blogApi, BlogItem } from "../../services/blogApi";
import {
  Calendar,
  User,
  ArrowLeft,
  Share2,
  BookmarkPlus,
  Loader2,
} from "lucide-react";

export default function BlogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [allBlogs, setAllBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // Gọi song song: chi tiết blog + danh sách để lấy bài liên quan
    Promise.all([
      blogApi.getBlogById(id),
      blogApi.getBlogs(0, 50),
    ])
      .then(([detail, list]) => {
        setBlog(detail);
        setAllBlogs(list);
      })
      .catch((err) => setError(err.message || "Không thể tải bài viết"))
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-3 text-gray-500">
        <Loader2 className="size-6 animate-spin" />
        <span>Đang tải bài viết...</span>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-red-500 text-lg font-semibold mb-4">
          ⚠️ {error || "Không tìm thấy bài viết"}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-[#AF140B] text-white rounded-xl font-semibold"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const relatedBlogs = allBlogs
    .filter((b) => b.categoryName === blog.categoryName && b.blogId !== blog.blogId)
    .slice(0, 3);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#AF140B] hover:text-[#8D0F08] mb-6 font-semibold"
        >
          <ArrowLeft className="size-5" />
          Quay lại
        </button>

        {/* Blog Content */}
        <article className="max-w-4xl mx-auto">
          {/* Thumbnail */}
          {blog.imageUrl && (
            <div className="w-full max-h-[400px] overflow-hidden rounded-2xl mb-8 shadow-lg">
              <img
                src={blog.imageUrl}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 mb-8">
            <div className="inline-block bg-[#FFE5E3] text-[#AF140B] px-4 py-2 rounded-full text-sm font-semibold mb-4">
              {blog.categoryName}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 leading-tight">
              {blog.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-gray-500 text-sm pb-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <User className="size-4" />
                <span className="font-medium">{blog.authorName}</span>
              </div>
              {blog.publishedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  <span>{formatDate(blog.publishedAt)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-[#AF140B] text-white rounded-xl hover:bg-[#8D0F08] transition-all font-semibold text-sm">
                <Share2 className="size-4" />
                Chia sẻ
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#AF140B] text-[#AF140B] rounded-xl hover:bg-[#FFE5E3] transition-all font-semibold text-sm">
                <BookmarkPlus className="size-4" />
                Lưu bài
              </button>
            </div>
          </div>

          {/* Content from API */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 mb-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                {blog.content}
              </p>
            </div>
          </div>


          {/* Related Blogs */}
          {relatedBlogs.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Bài viết liên quan
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedBlogs.map((relatedBlog) => (
                  <Link
                    key={relatedBlog.blogId}
                    to={`/blog/${relatedBlog.blogId}`}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all group border-2 border-gray-200 hover:border-[#AF140B]"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={relatedBlog.imageUrl}
                        alt={relatedBlog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <div className="inline-block bg-[#FFE5E3] text-[#AF140B] px-3 py-1 rounded-full text-xs font-semibold mb-2">
                        {relatedBlog.categoryName}
                      </div>
                      <h3 className="font-bold text-gray-800 line-clamp-2 group-hover:text-[#AF140B] transition-colors">
                        {relatedBlog.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">
                        {relatedBlog.timeRead} phút đọc
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}