import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import {
    Tag, ArrowLeft, LogOut, Search, Edit,
    AlertCircle, CheckCircle, Loader2,
} from 'lucide-react';
import { skuApi, SkuItem } from '../../services/skuApi';

// --- Format tiền VNĐ ---
const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);

// --- Skeleton Row ---
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 7 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                </td>
            ))}
        </tr>
    );
}

export default function SkuPriceManagement() {
    const navigate = useNavigate();
    const { adminUser, logoutAdmin } = useAdmin();

    // Lookup state
    const [skuIdInput, setSkuIdInput] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);

    // SKU list (loaded one by one for now, can extend to bulk)
    const [skuList, setSkuList] = useState<SkuItem[]>([]);

    // Edit dialog state
    const [editingSku, setEditingSku] = useState<SkuItem | null>(null);
    const [editPrice, setEditPrice] = useState('');
    const [editSize, setEditSize] = useState('');
    const [editColor, setEditColor] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleLogout = () => {
        logoutAdmin();
        navigate('/login');
    };

    // Load SKU by ID
    const handleLookup = async () => {
        const id = parseInt(skuIdInput.trim(), 10);
        if (isNaN(id) || id <= 0) {
            setLookupError('Vui lòng nhập SKU ID hợp lệ (số nguyên dương).');
            return;
        }
        // Avoid duplicates
        if (skuList.some((s) => s.id === id)) {
            setLookupError(`SKU #${id} đã có trong danh sách.`);
            return;
        }
        setLookupLoading(true);
        setLookupError(null);
        try {
            const sku = await skuApi.getSkuById(id);
            setSkuList((prev) => [sku, ...prev]);
            setSkuIdInput('');
        } catch (err: unknown) {
            setLookupError(err instanceof Error ? err.message : 'Không thể tải SKU.');
        } finally {
            setLookupLoading(false);
        }
    };

    // Open edit dialog
    const openEdit = (sku: SkuItem) => {
        setEditingSku(sku);
        setEditPrice(String(sku.price));
        setEditSize(sku.size);
        setEditColor(sku.color);
        setSaveError(null);
        setSaveSuccess(false);
    };

    // Save SKU
    const handleSave = async () => {
        if (!editingSku) return;
        const price = parseFloat(editPrice);
        if (isNaN(price) || price < 0) {
            setSaveError('Giá không hợp lệ.');
            return;
        }
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);
        try {
            const updated = await skuApi.updateSku(editingSku.id, {
                skuCode: editingSku.skuCode,
                size: editSize.trim() || editingSku.size,
                color: editColor.trim() || editingSku.color,
                price,
            });
            // Update list in place
            setSkuList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setSaveSuccess(true);
            setTimeout(() => {
                setEditingSku(null);
                setSaveSuccess(false);
            }, 1200);
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : 'Lưu thất bại.');
        } finally {
            setSaving(false);
        }
    };

    // Remove from list
    const removeSku = (id: number) => {
        setSkuList((prev) => prev.filter((s) => s.id !== id));
    };

    return (
        <div className="min-h-full bg-white">

            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#AF140B] rounded-lg flex items-center justify-center">
                                <Tag className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#2C2C2C]">Quản Lý Giá SKU</h1>
                                <p className="text-sm text-gray-600">
                                    {adminUser?.name} · {adminUser?.storeName || 'Tất cả chi nhánh'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => navigate('/manager/dashboard')} className="border-gray-300">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Quay lại
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="border-[#AF140B] text-[#AF140B] hover:bg-[#AF140B] hover:text-white"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Đăng xuất
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Lookup Card */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg text-[#2C2C2C]">Tra cứu SKU theo ID</CardTitle>
                        <CardDescription>Nhập ID của SKU để tải thông tin và chỉnh sửa giá</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-3">
                            <div className="flex-1 max-w-xs">
                                <Label htmlFor="skuId" className="mb-1 block">SKU ID</Label>
                                <Input
                                    id="skuId"
                                    type="number"
                                    min={1}
                                    value={skuIdInput}
                                    onChange={(e) => {
                                        setSkuIdInput(e.target.value);
                                        setLookupError(null);
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                    placeholder="VD: 1"
                                    className="w-full"
                                />
                            </div>
                            <Button
                                onClick={handleLookup}
                                disabled={lookupLoading || !skuIdInput}
                                className="bg-[#AF140B] hover:bg-[#8D0F08]"
                            >
                                {lookupLoading
                                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    : <Search className="w-4 h-4 mr-2" />}
                                Tra cứu
                            </Button>
                        </div>

                        {lookupError && (
                            <div className="flex items-center gap-2 text-red-600 text-sm mt-3">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {lookupError}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* SKU Table */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg text-[#2C2C2C]">
                            Danh sách SKU đã tra cứu
                            {skuList.length > 0 && (
                                <Badge className="ml-2 bg-[#AF140B] text-white">{skuList.length}</Badge>
                            )}
                        </CardTitle>
                        <CardDescription>Nhấn biểu tượng bút để chỉnh sửa giá và thông tin</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto rounded-b-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        {['ID', 'SKU Code', 'Sản phẩm', 'Size', 'Màu', 'Giá hiện tại', 'Thao tác'].map((h) => (
                                            <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {lookupLoading && skuList.length === 0 && (
                                        Array.from({ length: 2 }).map((_, i) => <SkeletonRow key={i} />)
                                    )}
                                    {skuList.length === 0 && !lookupLoading && (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-400">
                                                Chưa có SKU nào. Hãy tra cứu bằng ID ở trên.
                                            </td>
                                        </tr>
                                    )}
                                    {skuList.map((sku) => (
                                        <tr key={sku.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-gray-700">#{sku.id}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="font-mono">{sku.skuCode || '—'}</Badge>
                                            </td>
                                            <td className="px-4 py-3 max-w-[200px]">
                                                <p className="font-medium text-[#2C2C2C] truncate">{sku.productName}</p>
                                                <p className="text-xs text-gray-400">Product #{sku.productId}</p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{sku.size || '—'}</td>
                                            <td className="px-4 py-3">
                                                {sku.color ? (
                                                    <Badge variant="outline">{sku.color}</Badge>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-green-700">
                                                {formatCurrency(sku.price)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEdit(sku)}
                                                        className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
                                                    >
                                                        <Edit className="w-3.5 h-3.5 mr-1" />
                                                        Sửa giá
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => removeSku(sku.id)}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        ✕
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingSku} onOpenChange={(open: boolean) => !open && setEditingSku(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#2C2C2C]">Chỉnh sửa SKU #{editingSku?.id}</DialogTitle>
                        <DialogDescription className="truncate">
                            {editingSku?.productName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* SKU Code - readonly */}
                        <div>
                            <Label className="text-gray-500 text-xs mb-1">SKU Code (chỉ đọc)</Label>
                            <Input value={editingSku?.skuCode || ''} disabled className="bg-gray-50 font-mono" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-size" className="mb-1 block">Size</Label>
                                <Input
                                    id="edit-size"
                                    value={editSize}
                                    onChange={(e) => setEditSize(e.target.value)}
                                    placeholder="VD: M, L, XL"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-color" className="mb-1 block">Màu sắc</Label>
                                <Input
                                    id="edit-color"
                                    value={editColor}
                                    onChange={(e) => setEditColor(e.target.value)}
                                    placeholder="VD: Đỏ, Xanh"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="edit-price" className="mb-1 block">
                                Giá bán <span className="text-[#AF140B]">*</span>
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₫</span>
                                <Input
                                    id="edit-price"
                                    type="number"
                                    min={0}
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    className="pl-7"
                                    placeholder="0"
                                />
                            </div>
                            {editPrice && !isNaN(parseFloat(editPrice)) && (
                                <p className="text-xs text-gray-500 mt-1">
                                    = {formatCurrency(parseFloat(editPrice))}
                                </p>
                            )}
                        </div>

                        {saveError && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {saveError}
                            </div>
                        )}
                        {saveSuccess && (
                            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                Cập nhật thành công!
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingSku(null)} disabled={saving}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || saveSuccess}
                            className="bg-[#AF140B] hover:bg-[#8D0F08]"
                        >
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {saveSuccess ? 'Đã lưu ✓' : 'Lưu thay đổi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
