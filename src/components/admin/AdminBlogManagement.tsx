import { useState, useEffect, useCallback, useRef } from "react";
import {
    Plus, Search, Edit2, Trash2, Eye, EyeOff,
    FileText, Calendar, Tag, ChevronLeft,
    Image as ImageIcon, Save, X, BookOpen,
    ChevronLeft as Prev, ChevronRight as Next,
    Loader2, RefreshCw, Settings, Upload
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";
import { blogApi, BlogItem, CreateBlogPayload } from "../../services/blogApi";
import { blogCategoryApi, BlogCategory } from "../../services/blogCategoryApi";
import { imageApi } from "../../services/imageApi";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (matches backend config)
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type ViewMode = "list" | "create" | "edit";
type ActiveTab = "posts" | "categories";

export default function AdminBlogManagement() {
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [activeTab, setActiveTab] = useState<ActiveTab>("posts");

    // ── List state ──
    const [posts, setPosts] = useState<BlogItem[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const PAGE_SIZE = 10;

    // ── Category state ──
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [isLoadingCats, setIsLoadingCats] = useState(false);
    const [catForm, setCatForm] = useState({ name: "", description: "" });
    const [editingCat, setEditingCat] = useState<BlogCategory | null>(null);
    const [isSavingCat, setIsSavingCat] = useState(false);

    // ── Form state ──
    const [editingPost, setEditingPost] = useState<BlogItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        categoryId: "",
        imageUrl: "",
        status: false,
    });

    // Image file upload state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Fetch posts ──
    const fetchPosts = useCallback(async (page = 0, keyword = "") => {
        setIsLoadingList(true);
        try {
            const result = await blogApi.getAdminBlogs({ page, size: PAGE_SIZE, keyword });
            setPosts(result.content);
            setTotalPages(result.totalPages);
            setTotalElements(result.totalElements);
            setCurrentPage(result.number);
        } catch (err) {
            toast.error("Không thể tải danh sách blog.");
        } finally {
            setIsLoadingList(false);
        }
    }, []);

    // ── Fetch categories ──
    const fetchCategories = useCallback(async () => {
        setIsLoadingCats(true);
        try {
            const data = await blogCategoryApi.getCategories();
            setCategories(data);
        } catch {
            toast.error("Không thể tải danh mục.");
        } finally {
            setIsLoadingCats(false);
        }
    }, []);

    useEffect(() => { fetchPosts(0); fetchCategories(); }, [fetchPosts, fetchCategories]);

    useEffect(() => {
        const t = setTimeout(() => fetchPosts(0, searchKeyword), 400);
        return () => clearTimeout(t);
    }, [searchKeyword, fetchPosts]);

    // ── Category CRUD ──
    const handleSaveCat = async () => {
        if (!catForm.name.trim()) { toast.error("Vui lòng nhập tên danh mục!"); return; }
        setIsSavingCat(true);
        try {
            if (editingCat) {
                await blogCategoryApi.updateCategory(editingCat.id, { name: catForm.name.trim(), description: catForm.description.trim() || undefined });
                toast.success("Cập nhật danh mục thành công!");
            } else {
                await blogCategoryApi.createCategory({ name: catForm.name.trim(), description: catForm.description.trim() || undefined });
                toast.success("Tạo danh mục thành công!");
            }
            setCatForm({ name: "", description: "" });
            setEditingCat(null);
            await fetchCategories();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Lưu thất bại.");
        } finally {
            setIsSavingCat(false);
        }
    };

    const handleDeleteCat = async (cat: BlogCategory) => {
        if (!window.confirm(`Xoá danh mục "${cat.name}"?`)) return;
        try {
            await blogCategoryApi.deleteCategory(cat.id);
            toast.success("Đã xoá danh mục.");
            await fetchCategories();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Xoá thất bại.");
        }
    };

    // ── Image file helpers ──
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error('Chỉ chấp nhận ảnh JPG, PNG, WebP, GIF');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error('Ảnh không được vượt quá 10 MB');
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview("");
        setFormData((f) => ({ ...f, imageUrl: "" }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Post helpers ──
    const resetForm = () => {
        setFormData({ title: "", content: "", categoryId: "", imageUrl: "", status: false });
        setEditingPost(null);
        clearImage();
    };
    const openCreate = () => { resetForm(); setViewMode("create"); };
    const openEdit = (post: BlogItem) => {
        setEditingPost(post);
        setFormData({ title: post.title, content: post.content, categoryId: String(post.categoryId), imageUrl: post.imageUrl, status: post.status });
        setImageFile(null);
        setImagePreview(post.imageUrl || "");
        setViewMode("edit");
    };
    const handleBack = () => { resetForm(); setViewMode("list"); };

    // ── Save post ──
    const handleSave = async () => {
        if (!formData.title.trim()) { toast.error("Vui lòng nhập tiêu đề!"); return; }
        if (!formData.content.trim()) { toast.error("Vui lòng nhập nội dung!"); return; }
        if (!formData.categoryId) { toast.error("Vui lòng chọn danh mục!"); return; }

        setIsSaving(true);
        try {
            // Upload image file if selected
            let finalImageUrl = formData.imageUrl;
            if (imageFile) {
                setUploadingImage(true);
                try {
                    // Use editingPost id if editing, otherwise use 0 as placeholder
                    const entityId = editingPost?.blogId ?? 0;
                    const result = await imageApi.upload(imageFile, 'BLOG', entityId);
                    finalImageUrl = result.key; // Store S3 key (backend resolves to presigned URL)
                } finally {
                    setUploadingImage(false);
                }
            }

            const payload: CreateBlogPayload = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                categoryId: Number(formData.categoryId),
                imageUrl: finalImageUrl || undefined,
                status: formData.status,
            };

            if (editingPost) {
                await blogApi.updateBlog(editingPost.blogId, payload);
                toast.success("Cập nhật bài viết thành công!");
            } else {
                await blogApi.createBlog(payload);
                toast.success("Tạo bài viết thành công!");
            }
            handleBack();
            await fetchPosts(0);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Lưu thất bại.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (post: BlogItem) => {
        if (!window.confirm(`Xoá bài viết "${post.title}"?`)) return;
        try {
            await blogApi.deleteBlog(post.blogId);
            toast.success("Đã xoá bài viết.");
            await fetchPosts(currentPage);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Xoá thất bại.");
        }
    };

    const handleToggleStatus = async (post: BlogItem) => {
        try {
            await blogApi.updateBlog(post.blogId, {
                title: post.title, content: post.content,
                categoryId: post.categoryId, imageUrl: post.imageUrl, status: !post.status,
            });
            toast.success(!post.status ? "Đã đăng bài viết." : "Đã chuyển về Nháp.");
            await fetchPosts(currentPage);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Cập nhật thất bại.");
        }
    };

    const filtered = posts.filter((p) => {
        if (filterStatus === "published") return p.status === true;
        if (filterStatus === "draft") return p.status === false;
        return true;
    });

    const stats = { total: totalElements, published: posts.filter((p) => p.status).length, draft: posts.filter((p) => !p.status).length };

    // ╔═══════════════════════════╗
    // ║        FORM VIEW          ║
    // ╚═══════════════════════════╝
    if (viewMode === "create" || viewMode === "edit") {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={handleBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors text-sm">
                        <ChevronLeft className="w-4 h-4" /> Quay lại
                    </button>
                    <div className="h-4 border-l border-gray-300" />
                    <h2 className="text-xl font-bold text-gray-800">
                        {viewMode === "edit" ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main */}
                    <div className="lg:col-span-2 space-y-5">
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Nội dung bài viết</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Tiêu đề <span className="text-red-500">*</span>
                                    </Label>
                                    <Input id="title" placeholder="Nhập tiêu đề bài viết..."
                                        value={formData.title}
                                        onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                                        className="text-base"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="content" className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Nội dung <span className="text-red-500">*</span>
                                    </Label>
                                    <textarea id="content" rows={14}
                                        placeholder="Nhập nội dung bài viết..."
                                        value={formData.content}
                                        onChange={(e) => setFormData((f) => ({ ...f, content: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#AF140B]/30 focus:border-[#AF140B]"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Cài đặt đăng bài</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Trạng thái</Label>
                                    <div className="flex gap-2">
                                        {[{ label: "Nháp", value: false }, { label: "Đăng", value: true }].map((opt) => (
                                            <button key={String(opt.value)}
                                                onClick={() => setFormData((f) => ({ ...f, status: opt.value }))}
                                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${formData.status === opt.value
                                                    ? opt.value ? "bg-green-100 border-green-400 text-green-700" : "bg-gray-100 border-gray-400 text-gray-700"
                                                    : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}
                                            >{opt.label}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dropdown danh mục từ API */}
                                <div>
                                    <Label htmlFor="category" className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Danh mục <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="category"
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData((f) => ({ ...f, categoryId: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AF140B]/30 focus:border-[#AF140B] bg-white"
                                    >
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    {categories.length === 0 && (
                                        <p className="text-xs text-amber-600 mt-1">⚠ Chưa có danh mục. Vào tab "Danh mục" để tạo.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Ảnh bìa</CardTitle></CardHeader>
                            <CardContent>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="rounded-lg overflow-hidden border-2 border-dashed border-gray-200 aspect-video bg-gray-50 flex flex-col items-center justify-center relative">
                                    {imagePreview
                                        ? <>
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                            <button
                                                type="button"
                                                onClick={clearImage}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                        : <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <Upload className="w-8 h-8 text-gray-300 mb-1" />
                                            <span className="text-sm text-gray-500">Nhấn để chọn ảnh</span>
                                            <span className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, GIF · Tối đa 10 MB</span>
                                        </button>
                                    }
                                </div>
                                {imagePreview && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mt-2 text-xs text-[#AF140B] hover:underline"
                                    >
                                        Đổi ảnh khác
                                    </button>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={handleBack}><X className="w-4 h-4 mr-1.5" />Huỷ</Button>
                            <Button className="flex-1 bg-[#AF140B] hover:bg-[#8B0000] text-white" onClick={handleSave} disabled={isSaving || uploadingImage}>
                                {isSaving || uploadingImage ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />{uploadingImage ? 'Đang tải ảnh...' : 'Đang lưu...'}</> : <><Save className="w-4 h-4 mr-1.5" />Lưu bài</>}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ╔═══════════════════════════╗
    // ║        LIST VIEW          ║
    // ╚═══════════════════════════╝
    return (
        <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-[#AF140B]" />Quản lý Blog
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Tạo và quản lý bài viết blog của cửa hàng</p>
                </div>
                {activeTab === "posts" && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => fetchPosts(currentPage, searchKeyword)} disabled={isLoadingList}>
                            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoadingList ? "animate-spin" : ""}`} />Làm mới
                        </Button>
                        <Button onClick={openCreate} className="bg-[#AF140B] hover:bg-[#8B0000] text-white">
                            <Plus className="w-4 h-4 mr-2" />Tạo bài viết
                        </Button>
                    </div>
                )}
                {activeTab === "categories" && (
                    <Button variant="outline" onClick={fetchCategories} disabled={isLoadingCats}>
                        <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoadingCats ? "animate-spin" : ""}`} />Làm mới
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                {[
                    { key: "posts", label: "Bài viết", icon: FileText },
                    { key: "categories", label: "Danh mục", icon: Settings },
                ].map((tab) => (
                    <button key={tab.key}
                        onClick={() => setActiveTab(tab.key as ActiveTab)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                            ? "border-[#AF140B] text-[#AF140B]"
                            : "border-transparent text-gray-500 hover:text-gray-700"}`}
                    >
                        <tab.icon className="w-4 h-4" />{tab.label}
                    </button>
                ))}
            </div>

            {/* ─── TAB: BÀI VIẾT ─── */}
            {activeTab === "posts" && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Tổng bài viết", value: stats.total, icon: FileText, color: "text-blue-600 bg-blue-50" },
                            { label: "Đã đăng (trang này)", value: stats.published, icon: Eye, color: "text-green-600 bg-green-50" },
                            { label: "Nháp (trang này)", value: stats.draft, icon: EyeOff, color: "text-gray-500 bg-gray-100" },
                        ].map((s) => (
                            <Card key={s.label} className="border border-gray-100">
                                <CardContent className="pt-5 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${s.color}`}><s.icon className="w-5 h-5" /></div>
                                        <div>
                                            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                                            <p className="text-xs text-gray-500">{s.label}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input placeholder="Tìm kiếm bài viết..." value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)} className="pl-9" />
                        </div>
                        <div className="flex gap-2">
                            {(["all", "published", "draft"] as const).map((s) => (
                                <button key={s} onClick={() => setFilterStatus(s)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${filterStatus === s
                                        ? "bg-[#AF140B] text-white border-[#AF140B]"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                                >
                                    {s === "all" ? "Tất cả" : s === "published" ? "Đã đăng" : "Nháp"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <Card className="border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600 w-12">#</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Bài viết</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Danh mục</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Ngày tạo</th>
                                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {isLoadingList ? (
                                        <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                                            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-40" /><p>Đang tải...</p>
                                        </td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Chưa có bài viết</p>
                                        </td></tr>
                                    ) : filtered.map((post, idx) => (
                                        <tr key={post.blogId} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-4 py-3 text-gray-400">{currentPage * PAGE_SIZE + idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {post.imageUrl
                                                        ? <img src={post.imageUrl} alt="" className="w-12 h-10 rounded object-cover border border-gray-100 shrink-0" />
                                                        : <div className="w-12 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0"><ImageIcon className="w-4 h-4 text-gray-300" /></div>
                                                    }
                                                    <p className="font-medium text-gray-800 line-clamp-1 max-w-xs">{post.title}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                                    <Tag className="w-3 h-3" />{post.categoryName}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => handleToggleStatus(post)} title="Click để đổi trạng thái"
                                                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border transition-all hover:opacity-80 ${post.status
                                                        ? "bg-green-50 text-green-600 border-green-200"
                                                        : "bg-gray-100 text-gray-500 border-gray-200"}`}
                                                >
                                                    {post.status ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    {post.status ? "Đã đăng" : "Nháp"}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button onClick={() => openEdit(post)}
                                                        className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(post)}
                                                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                                <p className="text-xs text-gray-500">Trang {currentPage + 1} / {totalPages} · {totalElements} bài viết</p>
                                <div className="flex gap-1">
                                    <button disabled={currentPage === 0 || isLoadingList} onClick={() => fetchPosts(currentPage - 1, searchKeyword)}
                                        className="p-1.5 rounded border border-gray-200 hover:bg-white disabled:opacity-40 transition-colors"><Prev className="w-4 h-4" /></button>
                                    <button disabled={currentPage >= totalPages - 1 || isLoadingList} onClick={() => fetchPosts(currentPage + 1, searchKeyword)}
                                        className="p-1.5 rounded border border-gray-200 hover:bg-white disabled:opacity-40 transition-colors"><Next className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )}
                    </Card>
                </>
            )}

            {/* ─── TAB: DANH MỤC ─── */}
            {activeTab === "categories" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form thêm/sửa */}
                    <Card className="border border-gray-100">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{editingCat ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Tên danh mục <span className="text-red-500">*</span></Label>
                                <Input placeholder="VD: Đồ chơi giáo dục"
                                    value={catForm.name}
                                    onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Mô tả</Label>
                                <Input placeholder="Mô tả ngắn (tuỳ chọn)"
                                    value={catForm.description}
                                    onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-2">
                                {editingCat && (
                                    <Button variant="outline" className="flex-1" onClick={() => { setEditingCat(null); setCatForm({ name: "", description: "" }); }}>
                                        <X className="w-4 h-4 mr-1" />Huỷ
                                    </Button>
                                )}
                                <Button className="flex-1 bg-[#AF140B] hover:bg-[#8B0000] text-white" onClick={handleSaveCat} disabled={isSavingCat}>
                                    {isSavingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                                    {editingCat ? "Cập nhật" : "Thêm"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danh sách danh mục */}
                    <div className="lg:col-span-2">
                        <Card className="border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 w-12">#</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Tên danh mục</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Mô tả</th>
                                            <th className="text-right px-4 py-3 font-semibold text-gray-600">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {isLoadingCats ? (
                                            <tr><td colSpan={4} className="text-center py-12 text-gray-400">
                                                <Loader2 className="w-6 h-6 mx-auto animate-spin opacity-40" />
                                            </td></tr>
                                        ) : categories.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-12 text-gray-400">Chưa có danh mục nào</td></tr>
                                        ) : categories.map((cat, idx) => (
                                            <tr key={cat.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                                                <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{cat.description || "—"}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name, description: cat.description || "" }); }}
                                                            className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeleteCat(cat)}
                                                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
