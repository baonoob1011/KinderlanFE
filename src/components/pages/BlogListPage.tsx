import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Loader2, LayoutGrid, List, ChevronDown } from "lucide-react";
import { blogApi, BlogItem } from "../../services/blogApi";
import type { BlogCategory } from "../../services/blogCategoryApi";

type ViewMode = "list" | "grid";

export default function BlogListPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [blogList, setBlogList] = useState<BlogItem[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  useEffect(() => {
    const fetchCategories = async (): Promise<BlogCategory[]> => {
      try {
        const res = await fetch('/api/v1/blog-categories', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', Accept: '*/*' },
        });
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        const raw = json?.data;
        if (Array.isArray(raw)) return raw;
        if (raw?.content && Array.isArray(raw.content)) return raw.content;
        return [];
      } catch {
        return [];
      }
    };

    Promise.all([
      blogApi.getBlogs(0, 50),
      fetchCategories(),
    ])
      .then(([blogs, cats]) => {
        setBlogList(blogs);
        // If API categories are empty, extract from blog data
        if (cats.length > 0) {
          setCategories(cats);
        } else {
          const uniqueNames = Array.from(new Set(blogs.map((b) => b.categoryName).filter(Boolean)));
          setCategories(uniqueNames.map((name, i) => ({ id: i + 1, name })));
        }
      })
      .catch((err) => setError(err.message || "Không thể tải bài viết"))
      .finally(() => setLoading(false));
  }, []);

  const filteredBlogs =
    selectedCategory === "all"
      ? blogList
      : blogList.filter((b) => b.categoryName === selectedCategory);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const toggleCategory = (id: number) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-3 text-gray-500">
        <Loader2 className="size-6 animate-spin" />
        <span>Đang tải bài viết...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 font-semibold text-lg mb-2">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#AF140B] text-white rounded-xl font-semibold"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* ===== Left Sidebar - Categories ===== */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <h2 className="text-sm font-bold text-[#AF140B] mb-3 uppercase tracking-wide">
              Danh mục bài viết
            </h2>
            <div>
              {categories.map((cat) => {
                const isExpanded = expandedCategory === cat.id;
                const isActive = selectedCategory === cat.name;
                // Get blogs in this category to show count or sub-items
                const blogsInCat = blogList.filter(b => b.categoryName === cat.name);

                return (
                  <div key={cat.id} className="border-b border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedCategory(isActive ? "all" : cat.name);
                        toggleCategory(cat.id);
                      }}
                      className={`w-full text-left px-1 py-3 text-sm transition-all flex items-center justify-between group
                        ${isActive ? 'text-[#AF140B] font-bold' : 'text-gray-700 hover:text-[#AF140B]'}`}
                    >
                      <span>{cat.name}</span>
                      {blogsInCat.length > 0 && (
                        <ChevronDown
                          className={`size-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      )}
                    </button>
                    {/* Expanded sub-items (blog titles) */}
                    {isExpanded && blogsInCat.length > 0 && (
                      <div className="pl-3 pb-2 space-y-1">
                        {blogsInCat.map((blog) => (
                          <Link
                            key={blog.blogId}
                            to={`/blog/${blog.blogId}`}
                            className="block text-xs text-gray-500 hover:text-[#AF140B] py-1.5 transition-colors"
                          >
                            {blog.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* ===== Right Content ===== */}
          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-xl font-bold text-gray-900">
                {selectedCategory === "all" ? "Tất Cả Bài Viết" : selectedCategory}
              </h1>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition-all ${viewMode === "grid"
                    ? 'text-[#AF140B]'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                  title="Xem dạng lưới"
                >
                  <LayoutGrid className="size-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded transition-all ${viewMode === "list"
                    ? 'text-[#AF140B]'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                  title="Xem dạng danh sách"
                >
                  <List className="size-5" />
                </button>
              </div>
            </div>

            {/* Mobile Category Filter */}
            <div className="md:hidden mb-5 overflow-x-auto">
              <div className="flex gap-2 pb-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === "all"
                    ? "bg-[#AF140B] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  Tất cả
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat.name
                      ? "bg-[#AF140B] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Blog Content */}
            {filteredBlogs.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm">Không tìm thấy bài viết nào</p>
              </div>
            ) : viewMode === "list" ? (
              /* ========= LIST VIEW ========= */
              <div className="space-y-5">
                {filteredBlogs.map((blog) => (
                  <Link
                    key={blog.blogId}
                    to={`/blog/${blog.blogId}`}
                    className="flex bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all group"
                  >
                    <div className="w-64 h-44 flex-shrink-0 overflow-hidden">
                      <img
                        src={blog.imageUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                      <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#AF140B] transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                        <span>{formatDate(blog.publishedAt)}</span>
                        <span>{blog.authorName}</span>
                      </div>
                      <p className="text-gray-500 text-xs line-clamp-3 mb-2">
                        {stripHtml(blog.content)}
                      </p>
                      <span className="text-[#AF140B] font-semibold text-xs">
                        Xem Thêm
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* ========= GRID VIEW ========= */
              <div className="grid grid-cols-2 gap-5">
                {filteredBlogs.map((blog) => (
                  <Link
                    key={blog.blogId}
                    to={`/blog/${blog.blogId}`}
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all group"
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={blog.imageUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-1.5 group-hover:text-[#AF140B] transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                        <span>{formatDate(blog.publishedAt)}</span>
                        <span>{blog.authorName}</span>
                      </div>
                      <p className="text-gray-500 text-xs line-clamp-2 mb-2">
                        {stripHtml(blog.content)}
                      </p>
                      <span className="text-[#AF140B] font-semibold text-xs">
                        Xem Thêm
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}