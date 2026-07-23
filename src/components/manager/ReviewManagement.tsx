import { useEffect, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import {
    MessageSquare, Search,
    Star, AlertCircle, Loader2, User, Calendar,
    Trash2, CheckCircle, RefreshCw, Reply, ChevronLeft, ChevronRight,
    Package, Tag, ChevronDown, ChevronUp
} from 'lucide-react';
import { reviewApi, ReviewItem } from '../../services/reviewApi';

// --- Interfaces for Grouping ---
interface GroupedSKU {
    skuId: number;
    skuCode: string;
    size: string;
    color: string;
    reviews: ReviewItem[];
}

interface GroupedProduct {
    productId: number;
    productName: string;
    skus: GroupedSKU[];
}

// --- Star Rating Display ---
function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={`w-4 h-4 ${i < rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'}`}
                />
            ))}
            <span className="ml-1 text-sm font-medium text-gray-700">{rating}/5</span>
        </div>
    );
}

// --- Rating Badge ---
function RatingBadge({ rating }: { rating: number }) {
    if (rating >= 4) return <Badge className="bg-green-100 text-green-700 border-green-200">Tích cực</Badge>;
    if (rating === 3) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Trung bình</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-red-200">Cần xử lý</Badge>;
}

// --- Skeleton ---
function SkeletonCard() {
    return (
        <div className="border rounded-xl p-4 animate-pulse space-y-3 mb-4">
            <div className="flex justify-between">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
            </div>
            <div className="h-20 bg-gray-100 rounded w-full" />
            <div className="h-20 bg-gray-100 rounded w-full" />
        </div>
    );
}

export default function ReviewManagement() {
    const { adminUser } = useAdmin();

    // Data
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter
    const [filterRating, setFilterRating] = useState<'all' | 'good' | 'neutral' | 'bad'>('all');
    const [searchText, setSearchText] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 5;

    // Toggle Expand/Collapse State cho SKU
    // Lưu trữ dạng: { [skuId]: boolean } -> true là mở, false hoặc undefined là đóng
    const [expandedSkus, setExpandedSkus] = useState<Record<number, boolean>>({});

    // Reply dialog
    const [replyingReview, setReplyingReview] = useState<ReviewItem | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replySaving, setReplySaving] = useState(false);
    const [replyError, setReplyError] = useState<string | null>(null);
    const [replySuccess, setReplySuccess] = useState(false);

    // Delete dialog
    const [deletingReview, setDeletingReview] = useState<ReviewItem | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Fetch all reviews
    const fetchReviews = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await reviewApi.getAllReviews();
            setReviews(data || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Không thể tải đánh giá.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, []);

    // 1. Filter Reviews
    const filteredReviews = reviews.filter((r) => {
        const matchRating =
            filterRating === 'all' ||
            (filterRating === 'good' && r.rating >= 4) ||
            (filterRating === 'neutral' && r.rating === 3) ||
            (filterRating === 'bad' && r.rating <= 2);
        const q = searchText.toLowerCase();
        const matchSearch = !q ||
            (r.comment || '').toLowerCase().includes(q) ||
            (r.productName || '').toLowerCase().includes(q) ||
            (r.reviewerName || '').toLowerCase().includes(q) ||
            (r.skuCode || '').toLowerCase().includes(q);
        return matchRating && matchSearch;
    });

    // 2. Group Reviews by Product -> SKU
    const groupedProducts = filteredReviews.reduce((acc: GroupedProduct[], review) => {
        let product = acc.find(p => p.productId === review.productId);
        if (!product) {
            product = { productId: review.productId, productName: review.productName, skus: [] };
            acc.push(product);
        }

        let sku = product.skus.find(s => s.skuId === review.skuId);
        if (!sku) {
            sku = {
                skuId: review.skuId,
                skuCode: review.skuCode,
                size: review.size,
                color: review.color,
                reviews: []
            };
            product.skus.push(sku);
        }

        sku.reviews.push(review);
        return acc;
    }, []);

    // 3. Pagination (by Product)
    const totalPages = Math.max(1, Math.ceil(groupedProducts.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pagedProducts = groupedProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    useEffect(() => { setPage(1); }, [searchText, filterRating]);

    // Hàm xử lý đóng/mở SKU
    const toggleSku = (skuId: number) => {
        setExpandedSkus(prev => ({
            ...prev,
            [skuId]: !prev[skuId]
        }));
    };

    // Stats
    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;
    const goodCount = reviews.filter((r) => r.rating >= 4).length;
    const badCount = reviews.filter((r) => r.rating <= 2).length;
    const repliedCount = reviews.filter((r) => r.managerReply).length;

    // --- Reply ---
    const openReply = (review: ReviewItem) => {
        setReplyingReview(review);
        setReplyText(review.managerReply || '');
        setReplyError(null);
        setReplySuccess(false);
    };

    const handleSaveReply = async () => {
        if (!replyingReview || !replyText.trim()) return;
        setReplySaving(true);
        setReplyError(null);
        setReplySuccess(false);
        try {
            const updated = await reviewApi.replyToReview(replyingReview.id, replyText.trim());
            setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setReplySuccess(true);
            setTimeout(() => { setReplyingReview(null); setReplySuccess(false); }, 1200);
        } catch (err: unknown) {
            setReplyError(err instanceof Error ? err.message : 'Gửi phản hồi thất bại.');
        } finally {
            setReplySaving(false);
        }
    };

    // --- Delete ---
    const openDelete = (review: ReviewItem) => {
        setDeletingReview(review);
        setDeleteError(null);
    };

    const handleDelete = async () => {
        if (!deletingReview) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await reviewApi.deleteReview(deletingReview.id);
            setReviews((prev) => prev.filter((r) => r.id !== deletingReview.id));
            setDeletingReview(null);
        } catch (err: unknown) {
            setDeleteError(err instanceof Error ? err.message : 'Xóa thất bại.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-full bg-gray-50/50">

            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#2C2C2C]">Quản Lý Đánh Giá</h1>
                                <p className="text-sm text-gray-600">
                                    {adminUser?.name} · {adminUser?.storeName || 'Tất cả chi nhánh'}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={fetchReviews} disabled={loading} className="border-gray-300 bg-white">
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Stats Row */}
                {reviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: 'Tổng đánh giá', value: reviews.length, color: 'text-purple-600', border: 'border-purple-200' },
                            { label: 'Điểm TB', value: `⭐ ${avgRating}`, color: 'text-[#D4AF37]', border: 'border-amber-200' },
                            { label: 'Tích cực (≥4★)', value: goodCount, color: 'text-green-600', border: 'border-green-200' },
                            { label: 'Cần xử lý (≤2★)', value: badCount, color: 'text-red-600', border: 'border-red-200' },
                            { label: 'Đã phản hồi', value: repliedCount, color: 'text-blue-600', border: 'border-blue-200' },
                        ].map((s, i) => (
                            <Card key={i} className={`bg-white border ${s.border} shadow-sm`}>
                                <CardContent className="p-4">
                                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Filter bar */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex flex-wrap gap-3 items-center">
                            <span className="text-sm font-medium text-gray-600">Lọc:</span>
                            {([
                                { key: 'all', label: 'Tất cả' },
                                { key: 'good', label: '⭐ Tích cực' },
                                { key: 'neutral', label: '🟡 Trung bình' },
                                { key: 'bad', label: '🔴 Cần xử lý' },
                            ] as const).map((f) => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilterRating(f.key)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterRating === f.key
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                            <div className="ml-auto flex-1 min-w-[200px] max-w-xs relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm tên, sản phẩm, SKU, bình luận..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    className="h-8 text-sm pl-9"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Grouped Reviews List */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg text-[#2C2C2C]">
                                Danh sách đánh giá theo Sản phẩm
                                {filteredReviews.length > 0 && (
                                    <Badge className="ml-2 bg-purple-600 text-white">{filteredReviews.length} đánh giá</Badge>
                                )}
                            </CardTitle>
                        </div>
                        <CardDescription>
                            Hiện {pagedProducts.length} / {groupedProducts.length} Sản phẩm (trang {safePage}/{totalPages})
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading && (
                            <div className="space-y-4">
                                {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        )}

                        {!loading && reviews.length === 0 && !error && (
                            <div className="py-16 text-center text-gray-400">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Chưa có đánh giá nào.</p>
                            </div>
                        )}

                        {!loading && reviews.length > 0 && groupedProducts.length === 0 && (
                            <div className="py-12 text-center text-gray-400">
                                Không có đánh giá nào khớp bộ lọc.
                            </div>
                        )}

                        {!loading && pagedProducts.length > 0 && (
                            <div className="space-y-8">
                                {pagedProducts.map((product) => (
                                    <div key={product.productId} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        {/* Product Header */}
                                        <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-2">
                                            <Package className="w-5 h-5 text-purple-600" />
                                            <h3 className="font-semibold text-gray-800 text-lg">{product.productName}</h3>
                                            <span className="text-sm text-gray-400 font-mono ml-2">ID: {product.productId}</span>
                                        </div>

                                        <div className="p-4 space-y-4 bg-white">
                                            {product.skus.map((sku) => {
                                                const isExpanded = !!expandedSkus[sku.skuId];

                                                return (
                                                    <div key={sku.skuId} className="border border-indigo-100 rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-200">
                                                        
                                                        {/* SKU Header (Clickable to Toggle) */}
                                                        <div 
                                                            onClick={() => toggleSku(sku.skuId)}
                                                            className={`px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-indigo-50/80 transition-colors ${
                                                                isExpanded ? 'bg-indigo-50/50 border-b border-indigo-100' : 'bg-gray-50/30'
                                                            }`}
                                                        >
                                                            <Tag className="w-4 h-4 text-indigo-500" />
                                                            <span className="font-medium text-indigo-900 text-sm">SKU: {sku.skuCode}</span>
                                                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs ml-2">
                                                                {sku.reviews.length} đánh giá
                                                            </Badge>

                                                            <div className="flex items-center gap-2 ml-auto">
                                                                {sku.size && <Badge variant="outline" className="bg-white text-xs border-indigo-200">Size: {sku.size}</Badge>}
                                                                {sku.color && <Badge variant="outline" className="bg-white text-xs border-indigo-200">Màu: {sku.color}</Badge>}
                                                                
                                                                {/* Toggle Icon */}
                                                                <div className="ml-2 text-gray-400 p-1 rounded-full hover:bg-indigo-100 transition-colors">
                                                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Expandable Reviews Section */}
                                                        {isExpanded && (
                                                            <div className="divide-y divide-gray-100">
                                                                {sku.reviews.map((review) => (
                                                                    <div key={review.id} className={`p-4 transition-all hover:bg-gray-50 ${review.rating <= 2 ? 'bg-red-50/20' : ''}`}>
                                                                        <div className="flex items-start justify-between gap-4">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                                    <div className="flex items-center gap-1.5 text-sm">
                                                                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                                                                        <span className="font-medium text-gray-700">{review.reviewerName || `User #${review.accountId}`}</span>
                                                                                    </div>
                                                                                    <span className="text-gray-300">·</span>
                                                                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                                                                        <Calendar className="w-3 h-3" />
                                                                                        {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                                                                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                                                                            hour: '2-digit', minute: '2-digit',
                                                                                        })}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="mb-2">
                                                                                    <StarRating rating={review.rating} />
                                                                                </div>

                                                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                                                    {review.comment || <span className="italic text-gray-400">Không có bình luận</span>}
                                                                                </p>

                                                                                {review.managerReply && (
                                                                                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                                                        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mb-1">
                                                                                            <Reply className="w-3.5 h-3.5" />
                                                                                            Phản hồi của quản lý
                                                                                            {review.managerReplyAt && (
                                                                                                <span className="text-blue-400 font-normal ml-1">
                                                                                                    · {new Date(review.managerReplyAt).toLocaleDateString('vi-VN', {
                                                                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                                                                    })}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className="text-sm text-blue-800">{review.managerReply}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex-shrink-0 flex flex-col items-end gap-2">
                                                                                <RatingBadge rating={review.rating} />
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() => openReply(review)}
                                                                                    className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs h-8"
                                                                                >
                                                                                    <Reply className="w-3 h-3 mr-1" />
                                                                                    {review.managerReply ? 'Sửa' : 'Phản hồi'}
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() => openDelete(review)}
                                                                                    className="border-red-300 text-red-600 hover:bg-red-50 text-xs h-8"
                                                                                >
                                                                                    <Trash2 className="w-3 h-3 mr-1" />
                                                                                    Xóa
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination (Products) */}
                        {!loading && totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                <p className="text-xs text-gray-500">
                                    Hiển thị sản phẩm {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, groupedProducts.length)} / {groupedProducts.length}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button size="sm" variant="outline" disabled={safePage <= 1}
                                        onClick={() => setPage(p => p - 1)}
                                        className="h-8 w-8 p-0">
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                                        .reduce<(number | 'dots')[]>((acc, p, idx, arr) => {
                                            if (idx > 0 && p - (arr[idx - 1]) > 1) acc.push('dots');
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((p, i) => p === 'dots' ? (
                                            <span key={`d${i}`} className="px-2 text-gray-400 text-xs">…</span>
                                        ) : (
                                            <Button key={p} size="sm" variant={p === safePage ? 'default' : 'outline'}
                                                onClick={() => setPage(p)}
                                                className={`h-8 w-8 p-0 text-xs ${p === safePage ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}>
                                                {p}
                                            </Button>
                                        ))}
                                    <Button size="sm" variant="outline" disabled={safePage >= totalPages}
                                        onClick={() => setPage(p => p + 1)}
                                        className="h-8 w-8 p-0">
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Reply Dialog */}
            <Dialog open={!!replyingReview} onOpenChange={(open: boolean) => !open && setReplyingReview(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Phản hồi đánh giá</DialogTitle>
                        <DialogDescription className="truncate">
                            Sản phẩm: {replyingReview?.productName} <br/>
                            SKU: {replyingReview?.skuCode} — Khách: {replyingReview?.reviewerName || `User #${replyingReview?.accountId}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Original review */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <StarRating rating={replyingReview?.rating || 0} />
                            </div>
                            <p className="text-sm text-gray-700">{replyingReview?.comment || 'Không có bình luận'}</p>
                        </div>

                        <div>
                            <Label htmlFor="reply-text" className="mb-1 block">
                                Nội dung phản hồi <span className="text-[#AF140B]">*</span>
                            </Label>
                            <textarea
                                id="reply-text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={4}
                                placeholder="Nhập phản hồi cho khách hàng..."
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                            />
                        </div>
                        {replyError && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />{replyError}
                            </div>
                        )}
                        {replySuccess && (
                            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />Phản hồi thành công!
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReplyingReview(null)} disabled={replySaving}>Hủy</Button>
                        <Button onClick={handleSaveReply} disabled={replySaving || !replyText.trim() || replySuccess} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {replySaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {replySuccess ? 'Đã gửi ✓' : 'Gửi phản hồi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingReview} onOpenChange={(open: boolean) => !open && setDeletingReview(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Xác nhận xóa đánh giá</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc muốn xóa đánh giá của {deletingReview?.reviewerName || `User #${deletingReview?.accountId}`} cho SKU {deletingReview?.skuCode}?
                            Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    {deleteError && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />{deleteError}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingReview(null)} disabled={deleting}>Hủy</Button>
                        <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
                            {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Xóa đánh giá
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}