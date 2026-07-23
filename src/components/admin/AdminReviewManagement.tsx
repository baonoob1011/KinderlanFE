import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
    ArrowLeft,
    Search,
    Edit,
    RefreshCw,
    Star,
    MessageSquare,
    Package
} from 'lucide-react';
import { toast } from 'sonner';
import { productApi, Product as APIProduct } from '../../services/productApi';
import { reviewApi, Review } from '../../services/reviewApi';

export default function AdminReviewManagement() {
    const navigate = useNavigate();
    const [productList, setProductList] = useState<APIProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<APIProduct | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingReview, setEditingReview] = useState<Review | null>(null);

    // Form state for editing
    const [formData, setFormData] = useState({
        rating: 5,
        comment: '',
    });

    const fetchProducts = async () => {
        setProductsLoading(true);
        try {
            const data = await productApi.getAll();
            setProductList(data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            toast.error('Không thể tải danh sách sản phẩm');
        } finally {
            setProductsLoading(false);
        }
    };

    const fetchReviews = async (productId: number) => {
        setLoading(true);
        try {
            const data = await reviewApi.getByProduct(productId);
            setReviews(data);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            toast.error('Không thể tải danh sách đánh giá');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            fetchReviews(selectedProduct.id);
        }
    }, [selectedProduct]);

    const filteredProducts = productList.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toString().includes(searchQuery)
    );

    const handleUpdateReview = async () => {
        if (!editingReview) return;

        try {
            await reviewApi.edit(editingReview.id, formData);
            toast.success('Cập nhật đánh giá thành công!');
            setEditingReview(null);
            if (selectedProduct) fetchReviews(Number(selectedProduct.id));
        } catch (error) {
            toast.error('Cập nhật đánh giá thất bại');
        }
    };

    const openEditDialog = (review: Review) => {
        setEditingReview(review);
        setFormData({
            rating: review.rating,
            comment: review.comment,
        });
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                        key={s}
                        className={`w-4 h-4 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-full bg-white">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="font-bold text-xl">Quản lý đánh giá</h1>
                                <p className="text-xs text-gray-500">
                                    {selectedProduct ? `Đang xem đánh giá cho: ${selectedProduct.name}` : 'Chọn sản phẩm để xem đánh giá'}
                                </p>
                            </div>
                        </div>
                        {selectedProduct && (
                            <Button variant="outline" size="sm" onClick={() => setSelectedProduct(null)}>
                                Thay đổi sản phẩm
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!selectedProduct ? (
                    <div className="space-y-6">
                        <div className="max-w-md relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Tìm sản phẩm (Tên hoặc ID)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                            {productsLoading && (
                                <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProducts.map((product) => (
                                <Card
                                    key={product.id}
                                    className="cursor-pointer hover:border-[#AF140B]/50 transition-colors group"
                                    onClick={() => setSelectedProduct(product)}
                                >
                                    <CardContent className="p-4 flex gap-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0 border">
                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col justify-center min-w-0">
                                            <h3 className="font-semibold text-sm truncate group-hover:text-[#AF140B]">{product.name}</h3>
                                            <p className="text-xs text-gray-500">ID: #{product.id}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <Card className="bg-white border-gray-200">
                            <CardHeader className="border-b bg-gray-50/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded border flex items-center justify-center">
                                            <Package className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{selectedProduct.name}</CardTitle>
                                            <CardDescription>ID: #{selectedProduct.id} • {reviews.length} đánh giá trực tiếp</CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="icon" onClick={() => fetchReviews(Number(selectedProduct.id))} disabled={loading}>
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-6">Người dùng</TableHead>
                                            <TableHead>Đánh giá</TableHead>
                                            <TableHead className="max-w-md">Nhận xét</TableHead>
                                            <TableHead>Ngày tạo</TableHead>
                                            <TableHead className="pr-6 text-right">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                                    Đang tải đánh giá...
                                                </TableCell>
                                            </TableRow>
                                        ) : reviews.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-48 text-center py-10">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <MessageSquare className="w-10 h-10 text-gray-200" />
                                                        <p className="text-gray-500">Sản phẩm này chưa có đánh giá nào</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            reviews.map((review) => (
                                                <TableRow key={review.id}>
                                                    <TableCell className="pl-6 font-medium text-gray-900">
                                                        #{review.accountId}
                                                    </TableCell>
                                                    <TableCell>
                                                        {renderStars(review.rating)}
                                                    </TableCell>
                                                    <TableCell className="max-w-md">
                                                        <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-gray-500">
                                                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                                    </TableCell>
                                                    <TableCell className="pr-6 text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(review)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Sửa
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Edit Review Dialog */}
                <Dialog open={!!editingReview} onOpenChange={(open: boolean) => !open && setEditingReview(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Chỉnh sửa đánh giá</DialogTitle>
                            <DialogDescription>
                                Cập nhật đánh giá từ khách hàng #{editingReview?.accountId}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Xếp hạng sao</Label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, rating: star })}
                                            className="focus:outline-none"
                                        >
                                            <Star
                                                className={`w-8 h-8 ${star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-comment">Nhận xét của khách hàng</Label>
                                <Textarea
                                    id="edit-comment"
                                    value={formData.comment}
                                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                    placeholder="Nhập nội dung đánh giá..."
                                    rows={4}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingReview(null)}>
                                Hủy
                            </Button>
                            <Button onClick={handleUpdateReview} className="bg-[#AF140B] hover:bg-[#8e1009] text-white">
                                Lưu thay đổi
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
