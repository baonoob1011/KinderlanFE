import { useEffect, useState } from 'react';

import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import {
    Warehouse, RefreshCw,
    AlertCircle, Search, Package, ChevronLeft, ChevronRight,
    Truck, Loader2, ArrowRight, CheckCircle, MapPin, Clock, Plus,
} from 'lucide-react';
import { inventoryApi, InventoryItem, StoreAvailability } from '../../services/inventoryApi';
import { skuApi, SkuItem } from '../../services/skuApi';
import api from '../../services/api';


// --- Skeleton Row ---
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-4/5" />
                </td>
            ))}
        </tr>
    );
}

// --- Availability Badge ---
function AvailBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    if (s.includes('ít') || s.includes('thấp') || s.includes('sắp'))
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">{status}</Badge>;
    return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">{status}</Badge>;
}

export default function InventoryManagementPage() {
    const { adminUser } = useAdmin();

    // ========================
    // TAB 1: Inventory State
    // ========================
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    const storeId = adminUser?.storeId ?? localStorage.getItem('storeId') ?? '';

    const fetchInventory = async () => {
        if (!storeId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await inventoryApi.getAllInventory(storeId);
            setItems(data);
            setLastUpdated(new Date());
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu tồn kho.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (storeId) fetchInventory(); }, [storeId]);

    const COLUMN_COUNT = 6;

    const filtered = items.filter((item) => {
        const q = search.toLowerCase();
        return (
            (item.productName || '').toLowerCase().includes(q) ||
            item.skuCode.toLowerCase().includes(q) ||
            String(item.skuId).includes(q)
        );
    }).sort((a, b) => b.skuId - a.skuId);

    const outOfStock = items.filter((i) => i.quantity === 0).length;
    const lowStock = items.filter((i) => i.quantity > 0 && i.quantity <= 5).length;

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    useEffect(() => { setPage(1); }, [search]);

    // ========================
    // TAB 2: Transfer State
    // ========================
    const [skuInput, setSkuInput] = useState('');
    const [searchedSkuId, setSearchedSkuId] = useState<number | null>(null);
    const [storeSkus, setStoreSkus] = useState<InventoryItem[]>([]);
    const [loadingSkus, setLoadingSkus] = useState(true);

    useEffect(() => {
        const fetchStoreSkus = async () => {
            if (!storeId) {
                setLoadingSkus(false);
                return;
            }
            try {
                const skus = await inventoryApi.getAllInventory(storeId);
                setStoreSkus(skus);
                if (skus.length > 0) {
                    setSkuInput(String(skus[0].skuId));
                }
            } catch (err) {
                console.error("Failed to fetch store SKUs", err);
            } finally {
                setLoadingSkus(false);
            }
        };
        fetchStoreSkus();
    }, [storeId]);

    const [storeAvailability, setStoreAvailability] = useState<StoreAvailability[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleSearch = async () => {
        const id = parseInt(skuInput.trim(), 10);
        if (isNaN(id) || id <= 0) {
            setSearchError('Vui lòng chọn sản phẩm hợp lệ.');
            return;
        }
        setSearching(true);
        setSearchError(null);
        setStoreAvailability([]);
        setSelectedSourceId(null);
        setQuantity('');
        setSubmitSuccess(false);
        setSubmitError(null);
        try {
            const res = await inventoryApi.getStoreAvailability(id);
            setSearchedSkuId(id);
            const available = (res.data || []).filter(
                (s) => !s.availabilityStatus.toLowerCase().includes('hết') && String(s.storeId) !== String(storeId)
            );
            setStoreAvailability(available);
            if (available.length === 0) {
                setSearchError('Không có chi nhánh nào còn hàng cho SKU này.');
            }
        } catch (err: unknown) {
            setSearchError(err instanceof Error ? err.message : 'Không thể tải dữ liệu.');
        } finally {
            setSearching(false);
        }
    };

    const selectedStore = storeAvailability.find(s => s.storeId === selectedSourceId);
    const qtyNum = parseInt(quantity, 10);
    const isExceeding = selectedStore?.quantity !== undefined && qtyNum > selectedStore.quantity;
    const canSubmit = selectedSourceId !== null && searchedSkuId !== null && !isNaN(qtyNum) && qtyNum > 0 && !isExceeding;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            await api.post('/api/v1/transfer/draft', {
                toStoreId: selectedSourceId,
                skuId: searchedSkuId,
                quantity: qtyNum,
            });
            setSubmitSuccess(true);
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : 'Tạo yêu cầu thất bại.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setSubmitSuccess(false);
        setSkuInput('');
        setSearchedSkuId(null);
        setStoreAvailability([]);
        setSelectedSourceId(null);
        setQuantity('');
        setSubmitError(null);
        setSearchError(null);
    };

    // ========================
    // TAB 3: Import Stock State
    // ========================
    const [allSkus, setAllSkus] = useState<SkuItem[]>([]);
    const [allSkusLoading, setAllSkusLoading] = useState(false);
    const [importSkuId, setImportSkuId] = useState('');
    const [importQty, setImportQty] = useState('');
    const [importSubmitting, setImportSubmitting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    const fetchAllSkus = async () => {
        setAllSkusLoading(true);
        try {
            const skus = await skuApi.getAll();
            setAllSkus(skus);
        } catch (err) {
            console.error('Failed to fetch SKUs', err);
        } finally {
            setAllSkusLoading(false);
        }
    };

    const handleImportStock = async () => {
        const skuId = parseInt(importSkuId, 10);
        const qty = parseInt(importQty, 10);
        if (isNaN(skuId) || isNaN(qty) || qty <= 0) {
            setImportError('Vui lòng chọn SKU và nhập số lượng hợp lệ.');
            return;
        }
        setImportSubmitting(true);
        setImportError(null);
        try {
            await inventoryApi.importStock(skuId, qty);
            setImportSuccess(true);
            fetchInventory(); // refresh inventory tab
        } catch (err: unknown) {
            setImportError(err instanceof Error ? err.message : 'Nhập hàng thất bại.');
        } finally {
            setImportSubmitting(false);
        }
    };

    const handleImportReset = () => {
        setImportSuccess(false);
        setImportSkuId('');
        setImportQty('');
        setImportError(null);
    };

    return (
        <div className="min-h-full bg-white">

            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#AF140B] rounded-lg flex items-center justify-center">
                                <Warehouse className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#2C2C2C]">Quản Lý Tồn Kho</h1>
                                <p className="text-sm text-gray-600">
                                    {adminUser?.name} · {adminUser?.storeName || 'Tất cả chi nhánh'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={fetchInventory} disabled={loading} className="border-gray-300">
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Làm mới
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* StoreId warning */}
                {!storeId && (
                    <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-xl p-4">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <p className="text-sm text-yellow-800 font-medium flex-1">
                            Không tìm thấy cửa hàng được gán cho tài khoản này. Vui lòng liên hệ admin.
                        </p>
                    </div>
                )}

                <Tabs defaultValue="inventory" className="w-full">
                    <TabsList className="w-full !bg-transparent p-0 !rounded-none gap-4 !h-auto">
                        <TabsTrigger value="inventory" className="flex-1 !border-2 !border-gray-600 !bg-gray-600 !text-white data-[state=active]:!border-[#AF140B] data-[state=active]:!bg-[#AF140B] data-[state=active]:!text-white data-[state=active]:!shadow-lg !rounded-xl text-sm !font-semibold !py-3 !px-4 transition-all">
                            <Warehouse className="w-4 h-4 mr-2" />
                            Kiểm tra tồn kho
                        </TabsTrigger>
                        <TabsTrigger value="import" onClick={() => { if (allSkus.length === 0) fetchAllSkus(); }} className="flex-1 !border-2 !border-gray-600 !bg-gray-600 !text-white data-[state=active]:!border-green-600 data-[state=active]:!bg-green-600 data-[state=active]:!text-white data-[state=active]:!shadow-lg !rounded-xl text-sm !font-semibold !py-3 !px-4 transition-all">
                            <Plus className="w-4 h-4 mr-2" />
                            Nhập hàng
                        </TabsTrigger>
                        <TabsTrigger value="transfer" className="flex-1 !border-2 !border-gray-600 !bg-gray-600 !text-white data-[state=active]:!border-blue-600 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:!shadow-lg !rounded-xl text-sm !font-semibold !py-3 !px-4 transition-all">
                            <Truck className="w-4 h-4 mr-2" />
                            Yêu cầu chuyển kho
                        </TabsTrigger>
                    </TabsList>

                    {/* ========== TAB 1: INVENTORY ========== */}
                    <TabsContent value="inventory" className="mt-4 space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Tổng bản ghi', value: items.length, color: 'text-[#AF140B]', border: 'border-red-200' },
                                { label: 'Hết hàng', value: outOfStock, color: 'text-red-600', border: 'border-red-300' },
                                { label: 'Sắp hết', value: lowStock, color: 'text-yellow-600', border: 'border-yellow-200' },
                            ].map((s, i) => (
                                <Card key={i} className={`bg-white border ${s.border} shadow-sm`}>
                                    <CardContent className="p-4">
                                        <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                                        <p className={`text-2xl font-bold ${s.color}`}>
                                            {loading ? '…' : s.value}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">Không thể tải dữ liệu</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Table Card */}
                        <Card className="border border-gray-200 shadow-sm bg-white">
                            <CardHeader>
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div>
                                        <CardTitle className="text-lg text-[#2C2C2C]">
                                            Danh sách tồn kho
                                            {filtered.length > 0 && (
                                                <Badge className="ml-2 bg-[#AF140B] text-white">{filtered.length}</Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            {lastUpdated
                                                ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString('vi-VN')}`
                                                : 'Đang tải...'}
                                        </CardDescription>
                                    </div>
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder="Tìm sản phẩm, SKU..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-9 h-9 text-sm"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto rounded-b-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">SKU Code</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Tên sản phẩm</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Màu sắc</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Kích cỡ</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Loại</th>
                                                <th className="px-4 py-3 text-center font-semibold text-gray-600 whitespace-nowrap">Số lượng</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {loading && (
                                                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                            )}

                                            {!loading && paged.length === 0 && (
                                                <tr>
                                                    <td colSpan={COLUMN_COUNT} className="py-16 text-center text-gray-400">
                                                        <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                                        {items.length === 0
                                                            ? 'Chưa có dữ liệu tồn kho.'
                                                            : 'Không tìm thấy kết quả.'}
                                                    </td>
                                                </tr>
                                            )}

                                            {!loading && paged.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline" className="font-mono text-xs">{item.skuCode}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-[#2C2C2C]">{item.productName || '—'}</td>
                                                    <td className="px-4 py-3">
                                                        {item.color ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: item.color.toLowerCase() }} />
                                                                {item.color}
                                                            </div>
                                                        ) : '—'}
                                                    </td>
                                                    <td className="px-4 py-3">{item.size || '—'}</td>
                                                    <td className="px-4 py-3">{item.type || '—'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`font-bold text-base ${item.quantity === 0 ? 'text-red-600' : item.quantity <= 5 ? 'text-yellow-600' : 'text-green-700'}`}>
                                                            {item.quantity}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {!loading && totalPages > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                                        <p className="text-xs text-gray-500">
                                            Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} / {filtered.length} sản phẩm
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <Button size="sm" variant="outline" disabled={safePage <= 1}
                                                onClick={() => setPage(p => p - 1)}
                                                className="h-7 w-7 p-0">
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
                                                    <span key={`d${i}`} className="px-1 text-gray-400 text-xs">…</span>
                                                ) : (
                                                    <Button key={p} size="sm" variant={p === safePage ? 'default' : 'outline'}
                                                        onClick={() => setPage(p)}
                                                        className={`h-7 w-7 p-0 text-xs ${p === safePage ? 'bg-[#AF140B] hover:bg-[#8D0F08] text-white' : ''}`}>
                                                        {p}
                                                    </Button>
                                                ))}
                                            <Button size="sm" variant="outline" disabled={safePage >= totalPages}
                                                onClick={() => setPage(p => p + 1)}
                                                className="h-7 w-7 p-0">
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ========== TAB 2: IMPORT STOCK ========== */}
                    <TabsContent value="import" className="mt-4 space-y-6">

                        {/* Success */}
                        {importSuccess && (
                            <Card className="border-green-300 bg-green-50 shadow-md">
                                <CardContent className="p-6 flex items-start gap-4">
                                    <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-green-800 mb-2">Nhập hàng thành công!</h3>
                                        <p className="text-sm text-green-700">
                                            Đã thêm <strong>{importQty}</strong> sản phẩm cho SKU <strong>#{importSkuId}</strong> vào kho của bạn.
                                        </p>
                                        <Button onClick={handleImportReset} className="mt-4 bg-green-600 hover:bg-green-700">
                                            <Plus className="w-4 h-4 mr-2" />Nhập thêm
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {!importSuccess && (
                            <Card className="border border-gray-200 shadow-sm bg-white">
                                <CardHeader>
                                    <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">+</span>
                                        Nhập hàng vào kho
                                    </CardTitle>
                                    <CardDescription>Chọn SKU và nhập số lượng để tăng tồn kho tại cửa hàng của bạn</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* SKU Selector */}
                                        <div>
                                            <Label className="mb-1 block">Sản phẩm (SKU) <span className="text-[#AF140B]">*</span></Label>
                                            <Select
                                                value={importSkuId}
                                                onValueChange={(val: string) => { setImportSkuId(val); setImportError(null); }}
                                                disabled={allSkusLoading}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={allSkusLoading ? 'Đang tải...' : 'Chọn SKU'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allSkus.map(sku => (
                                                        <SelectItem key={sku.id} value={String(sku.id)}>
                                                            [{sku.skuCode}] {sku.productName} {sku.color ? `- ${sku.color}` : ''} {sku.size ? `(${sku.size})` : ''} {sku.type ? `· ${sku.type}` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Quantity */}
                                        <div>
                                            <Label className="mb-1 block">Số lượng nhập <span className="text-[#AF140B]">*</span></Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                placeholder="VD: 50"
                                                value={importQty}
                                                onChange={(e) => setImportQty(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {importError && (
                                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />{importError}
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleImportStock}
                                        disabled={importSubmitting || !importSkuId || !importQty}
                                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                    >
                                        {importSubmitting
                                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang nhập...</>
                                            : <><Plus className="w-4 h-4 mr-2" />Nhập hàng</>}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* ========== TAB 2: STOCK TRANSFER ========== */}
                    <TabsContent value="transfer" className="mt-4 space-y-6">

                        {/* Success */}
                        {submitSuccess && (
                            <Card className="border-green-300 bg-green-50 shadow-md">
                                <CardContent className="p-6 flex items-start gap-4">
                                    <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-green-800 mb-2">Yêu cầu chuyển kho đã được tạo!</h3>
                                        <div className="flex items-center gap-3 text-sm text-green-700 mb-1">
                                            <span className="font-medium">{selectedStore?.storeName}</span>
                                            <ArrowRight className="w-4 h-4" />
                                            <span className="font-medium">{adminUser?.storeName}</span>
                                        </div>
                                        <p className="text-sm text-green-700">
                                            SKU <strong>#{searchedSkuId}</strong> · Số lượng: <strong>{quantity}</strong>
                                        </p>
                                        <Button onClick={handleReset} className="mt-4 bg-green-600 hover:bg-green-700">
                                            <RefreshCw className="w-4 h-4 mr-2" />Tạo yêu cầu mới
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {!submitSuccess && (
                            <>
                                {/* Step 1 — Search SKU */}
                                <Card className="border border-gray-200 shadow-sm bg-white">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                                            Chọn sản phẩm cần nhập
                                        </CardTitle>
                                        <CardDescription>Chọn sản phẩm để tìm chi nhánh có hàng</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-3 items-end">
                                            <div className="max-w-xs flex-1">
                                                <Label htmlFor="sku" className="mb-1 block">Sản phẩm</Label>
                                                <Select
                                                    value={skuInput}
                                                    onValueChange={(val: string) => { setSkuInput(val); setSearchError(null); }}
                                                    disabled={loadingSkus || storeSkus.length === 0}
                                                >
                                                    <SelectTrigger id="sku" className="w-full">
                                                        <SelectValue placeholder={loadingSkus ? "Đang tải..." : "Chọn sản phẩm"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {storeSkus.map(sku => (
                                                            <SelectItem key={sku.skuId} value={String(sku.skuId)}>
                                                                [{sku.skuCode}] {sku.productName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button onClick={handleSearch} disabled={searching || !skuInput} className="bg-blue-600 hover:bg-blue-700">
                                                {searching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                                                Tìm kiếm
                                            </Button>
                                        </div>
                                        {searchError && (
                                            <div className="flex items-center gap-2 text-red-600 text-sm mt-3">
                                                <AlertCircle className="w-4 h-4" />{searchError}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Step 2 — Select source store */}
                                {storeAvailability.length > 0 && (
                                    <Card className="border border-gray-200 shadow-sm bg-white">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                                                Chọn chi nhánh gửi hàng
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs ml-2">
                                                    {storeAvailability.length} chi nhánh có hàng
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription>Chọn chi nhánh bạn muốn yêu cầu chuyển hàng về</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                                                {storeAvailability.map((store) => (
                                                    <button key={store.storeId} type="button"
                                                        onClick={() => setSelectedSourceId(store.storeId)}
                                                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${selectedSourceId === store.storeId
                                                            ? 'bg-blue-50 border-l-4 border-blue-600'
                                                            : 'hover:bg-gray-50 border-l-4 border-transparent'
                                                            }`}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm text-[#2C2C2C]">{store.storeName}</p>
                                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                                    <MapPin className="w-3 h-3" />{store.address}
                                                                </span>
                                                                {store.openingTime && (
                                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                                        <Clock className="w-3 h-3" />{store.openingTime}–{store.closingTime}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <AvailBadge status={store.availabilityStatus} />
                                                    </button>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Step 3 — Quantity & Submit */}
                                {storeAvailability.length > 0 && (
                                    <Card className="border border-gray-200 shadow-sm bg-white">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                                                Xác nhận yêu cầu
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Transfer preview */}
                                            <div className="flex items-center gap-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                                                <div className="flex-1 text-center">
                                                    <p className="text-xs text-gray-500 mb-1">Chi nhánh gửi</p>
                                                    <p className="font-semibold text-sm text-blue-700">
                                                        {selectedStore ? selectedStore.storeName : <span className="text-gray-400 italic">Chưa chọn</span>}
                                                    </p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                                <div className="flex-1 text-center">
                                                    <p className="text-xs text-gray-500 mb-1">Cửa hàng của bạn</p>
                                                    <p className="font-semibold text-sm text-green-700">
                                                        {adminUser?.storeName || `Store #${storeId}`}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Quantity */}
                                            <div className="max-w-xs">
                                                <Label htmlFor="qty" className="mb-1 block">
                                                    Số lượng cần <span className="text-[#AF140B]">*</span>
                                                    {selectedStore?.quantity !== undefined && (
                                                        <span className="text-gray-500 font-normal text-xs ml-2">
                                                            (Tối đa: {selectedStore.quantity})
                                                        </span>
                                                    )}
                                                </Label>
                                                <Input id="qty" type="number" min={1} max={selectedStore?.quantity} placeholder="VD: 5"
                                                    value={quantity} onChange={(e) => {
                                                        let val = e.target.value;
                                                        if (selectedStore?.quantity !== undefined && parseInt(val, 10) > selectedStore.quantity) {
                                                            val = String(selectedStore.quantity);
                                                        }
                                                        setQuantity(val);
                                                    }} />
                                                {isExceeding && (
                                                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                        Vượt quá số lượng chi nhánh có
                                                    </p>
                                                )}
                                            </div>

                                            {submitError && (
                                                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{submitError}
                                                </div>
                                            )}

                                            <Button onClick={handleSubmit} disabled={submitting || !canSubmit}
                                                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                                                {submitting
                                                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang gửi...</>
                                                    : <><Truck className="w-4 h-4 mr-2" />Gửi yêu cầu chuyển kho</>}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
