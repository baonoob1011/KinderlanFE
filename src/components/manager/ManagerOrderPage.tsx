import { useEffect, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import {
    ShoppingBag, RefreshCw, Search, AlertCircle,
    Clock, CheckCircle, XCircle, Truck, Package, CreditCard,
    Loader2, Eye, ChevronLeft, ChevronRight, User, MapPin, ChevronDown as ChevronDownIcon,
} from 'lucide-react';
import api from '../../services/api';
import { inventoryApi, type InventoryItem } from '../../services/inventoryApi';
import { AlertTriangle } from 'lucide-react';

// --- Types matching BE DTOs ---
type OrderStatus = 'PENDING' | 'PENDING_PAYMENT' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'PAID';

interface CustomerDTO {
    id: number;
    fullName: string;
    email: string;
}

interface OrderItemDTO {
    skuId: number;
    size: string | null;
    color: string | null;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface OrderResponseDTO {
    orderId: number;
    orderStatus: OrderStatus;
    totalAmount: number;
    customer: CustomerDTO;
    items: OrderItemDTO[];
    shippingAddress: string | null;
}

// --- Helpers ---
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
    PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
    PENDING_PAYMENT: { label: 'Chờ thanh toán', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: CreditCard },
    PAID: { label: 'Đã thanh toán', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: CheckCircle },
    DELIVERED: { label: 'Đã giao', color: 'bg-green-100 text-green-700 border-green-300', icon: Truck },
    COMPLETED: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: Package },
    CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
    FAILED: { label: 'Thất bại', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: XCircle },
};

const ALL_STATUSES: OrderStatus[] = ['PENDING', 'PENDING_PAYMENT', 'PAID', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED'];

function StatusBadge({ status }: { status: OrderStatus }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Icon = cfg.icon;
    return (
        <Badge variant="outline" className={`${cfg.color} text-xs`}>
            <Icon className="w-3 h-3 mr-1" />
            {cfg.label}
        </Badge>
    );
}

// --- Skeleton ---
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-4/5" />
                </td>
            ))}
        </tr>
    );
}

export default function ManagerOrderPage() {
    const { adminUser } = useAdmin();
    const storeId = adminUser?.storeId ?? localStorage.getItem('storeId') ?? '';

    const [orders, setOrders] = useState<OrderResponseDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Inventory cross-reference
    const [skuStockMap, setSkuStockMap] = useState<Map<number, number>>(new Map());

    // Filters
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');

    // Pagination
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    // Detail dialog
    const [selectedOrder, setSelectedOrder] = useState<OrderResponseDTO | null>(null);
    const [showAddress, setShowAddress] = useState(false);

    // Status update (only PENDING/PAID → DELIVERED)
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    // Can update?
    const canDeliver = (order: OrderResponseDTO) =>
        order.orderStatus === 'PENDING' || order.orderStatus === 'PAID';

    const fetchOrders = async () => {
        if (!storeId) return;
        setLoading(true);
        setError(null);
        try {
            const [ordersRes, inventoryData] = await Promise.all([
                api.get(`/api/v1/orders/store/${storeId}`),
                inventoryApi.getAllInventory(storeId).catch(() => [] as InventoryItem[]),
            ]);
            setOrders(ordersRes.data || []);

            // Build SKU → quantity map
            const stockMap = new Map<number, number>();
            for (const inv of inventoryData) {
                stockMap.set(inv.skuId, (stockMap.get(inv.skuId) || 0) + inv.quantity);
            }
            setSkuStockMap(stockMap);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Không thể tải đơn hàng.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (storeId) fetchOrders(); }, [storeId]);

    // Check if an order has any items with stock issues
    const getOrderStockWarnings = (order: OrderResponseDTO): string[] => {
        if (!order.items) return [];
        const warnings: string[] = [];
        for (const item of order.items) {
            const stock = skuStockMap.get(item.skuId);
            if (stock === undefined) {
                warnings.push(`SKU #${item.skuId} (${item.productName}) — không có trong kho`);
            } else if (stock < item.quantity) {
                warnings.push(`SKU #${item.skuId} (${item.productName}) — tồn kho: ${stock}, cần: ${item.quantity}`);
            }
        }
        return warnings;
    };

    // Filtered
    const filtered = orders.filter((o) => {
        const matchStatus = filterStatus === 'all' || o.orderStatus === filterStatus;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            String(o.orderId).includes(q) ||
            (o.customer?.fullName || '').toLowerCase().includes(q) ||
            (o.customer?.email || '').toLowerCase().includes(q) ||
            o.items?.some((item) => (item.productName || '').toLowerCase().includes(q));
        return matchStatus && matchSearch;
    });

    // Sort by latest first
    const sorted = [...filtered].sort((a, b) => b.orderId - a.orderId);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paged = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    useEffect(() => { setPage(1); }, [search, filterStatus]);

    // Stats
    const getCount = (s: OrderStatus) => orders.filter((o) => o.orderStatus === s).length;

    // Deliver order (PENDING/PAID → DELIVERED)
    const handleDeliver = async (orderId: number) => {
        setUpdatingId(orderId);
        setUpdateError(null);
        setUpdateSuccess(false);
        try {
            await api.patch(`/api/v1/orders/${orderId}`, { orderStatus: 'DELIVERED' });
            setOrders((prev) => prev.map((o) =>
                o.orderId === orderId ? { ...o, orderStatus: 'DELIVERED' as OrderStatus } : o
            ));
            if (selectedOrder?.orderId === orderId) {
                setSelectedOrder((prev) => prev ? { ...prev, orderStatus: 'DELIVERED' as OrderStatus } : null);
            }
            setUpdateSuccess(true);
            setTimeout(() => setUpdateSuccess(false), 2000);
        } catch (err: unknown) {
            setUpdateError(err instanceof Error ? err.message : 'Cập nhật thất bại.');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="min-h-full bg-white">

            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#2C2C2C]">Quản Lý Đơn Hàng</h1>
                                <p className="text-sm text-gray-600">
                                    {adminUser?.name} · {adminUser?.storeName || 'Cửa hàng'}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={fetchOrders} disabled={loading} className="border-gray-300">
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* No storeId warning */}
                {!storeId && (
                    <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-xl p-4">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <p className="text-sm text-yellow-800 font-medium">
                            Không tìm thấy cửa hàng được gán. Vui lòng liên hệ admin.
                        </p>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {ALL_STATUSES.map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        const Icon = cfg.icon;
                        return (
                            <Card key={s}
                                className={`bg-white border shadow-sm cursor-pointer transition-all hover:shadow-md ${filterStatus === s ? 'ring-2 ring-indigo-500' : 'border-gray-200'}`}
                                onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
                            >
                                <CardContent className="p-3 flex items-center gap-2">
                                    <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-gray-500 leading-tight">{cfg.label}</p>
                                        <p className="text-lg font-bold text-[#2C2C2C]">{getCount(s)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                        <AlertCircle className="w-5 h-5 mt-0.5" />
                        <div>
                            <p className="font-semibold">Lỗi</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Success toast */}
                {updateSuccess && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Cập nhật trạng thái thành công!
                    </div>
                )}

                {/* Update error */}
                {updateError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {updateError}
                    </div>
                )}

                {/* Filter & Search */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm mã đơn, tên KH, email, sản phẩm..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-sm"
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={(v: string) => setFilterStatus(v as typeof filterStatus)}>
                                <SelectTrigger className="w-48 h-9">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    {ALL_STATUSES.map((s) => (
                                        <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Orders Table */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg text-[#2C2C2C]">
                            Danh sách đơn hàng
                            {filtered.length > 0 && <Badge className="ml-2 bg-indigo-600 text-white">{filtered.length}</Badge>}
                        </CardTitle>
                        <CardDescription>
                            Hiện {paged.length} / {filtered.length} đơn
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Mã đơn</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Khách hàng</th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Tổng tiền</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Số SP</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Trạng thái</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

                                    {!loading && paged.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-16 text-center text-gray-400">
                                                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                                {orders.length === 0 ? 'Chưa có đơn hàng nào.' : 'Không tìm thấy kết quả.'}
                                            </td>
                                        </tr>
                                    )}

                                    {!loading && paged.map((order) => (
                                        <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="font-mono text-xs">#{order.orderId}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-[#2C2C2C]">{order.customer?.fullName || '—'}</p>
                                                    <p className="text-xs text-gray-500">{order.customer?.email || ''}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="font-bold text-[#AF140B]">
                                                    {Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className="text-xs">{order.items?.length || 0}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusBadge status={order.orderStatus} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs h-7"
                                                        onClick={() => { setSelectedOrder(order); setShowAddress(false); }}
                                                    >
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        Chi tiết
                                                    </Button>
                                                    {canDeliver(order) && (
                                                        <Button
                                                            size="sm"
                                                            className="text-xs h-7 bg-green-600 hover:bg-green-700 text-white"
                                                            disabled={updatingId === order.orderId}
                                                            onClick={() => handleDeliver(order.orderId)}
                                                        >
                                                            {updatingId === order.orderId
                                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                : <><Truck className="w-3 h-3 mr-1" />Giao hàng</>}
                                                        </Button>
                                                    )}
                                                </div>
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
                                    Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} / {filtered.length}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button size="sm" variant="outline" disabled={safePage <= 1}
                                        onClick={() => setPage(p => p - 1)} className="h-7 w-7 p-0">
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
                                                className={`h-7 w-7 p-0 text-xs ${p === safePage ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}>
                                                {p}
                                            </Button>
                                        ))}
                                    <Button size="sm" variant="outline" disabled={safePage >= totalPages}
                                        onClick={() => setPage(p => p + 1)} className="h-7 w-7 p-0">
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Order Detail Dialog */}
            <Dialog open={!!selectedOrder} onOpenChange={(open: boolean) => { if (!open) setSelectedOrder(null); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>Đơn hàng #{selectedOrder?.orderId}</span>
                            {selectedOrder && <StatusBadge status={selectedOrder.orderStatus} />}
                        </DialogTitle>
                        <DialogDescription>Chi tiết đơn hàng</DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-5">
                            {/* Customer */}
                            <Card className="border border-gray-200">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <User className="w-4 h-4" />Thông tin khách hàng
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-1">
                                    <p><span className="text-gray-500">Họ tên:</span> <strong>{selectedOrder.customer?.fullName || '—'}</strong></p>
                                    <p><span className="text-gray-500">Email:</span> {selectedOrder.customer?.email || '—'}</p>

                                    {/* Address toggle */}
                                    {selectedOrder.shippingAddress && (
                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowAddress(!showAddress)}
                                                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                                            >
                                                <MapPin className="w-3.5 h-3.5" />
                                                Địa chỉ giao hàng
                                                <ChevronDownIcon className={`w-3 h-3 transition-transform ${showAddress ? 'rotate-180' : ''}`} />
                                            </button>
                                            {showAddress && (
                                                <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 flex items-start gap-2">
                                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                    {selectedOrder.shippingAddress}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Items */}
                            <Card className="border border-gray-200">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Package className="w-4 h-4" />Sản phẩm ({selectedOrder.items?.length || 0})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {selectedOrder.items?.map((item, idx) => {
                                            const stock = skuStockMap.get(item.skuId);
                                            const noStock = stock === undefined;
                                            const lowStock = !noStock && stock < item.quantity;
                                            const hasWarning = noStock || lowStock;
                                            return (
                                            <div key={idx} className={`flex items-center justify-between py-2 border-b last:border-0 ${hasWarning ? 'bg-amber-50 -mx-2 px-2 rounded-lg' : ''}`}>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{item.productName}</p>
                                                    <p className="text-xs text-gray-500">
                                                        SKU: {item.skuId}
                                                        {item.size && ` · Size: ${item.size}`}
                                                        {item.color && ` · Màu: ${item.color}`}
                                                        {` · SL: ${item.quantity}`}
                                                    </p>
                                                    {noStock && (
                                                        <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" />Không có trong kho cửa hàng!
                                                        </p>
                                                    )}
                                                    {lowStock && (
                                                        <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" />Không đủ hàng — tồn kho: {stock}, cần: {item.quantity}
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="font-medium text-sm">{Number(item.totalPrice || 0).toLocaleString('vi-VN')}đ</p>
                                            </div>);
                                        })}
                                        <div className="flex items-center justify-between pt-3 border-t-2">
                                            <p className="font-bold">Tổng cộng</p>
                                            <p className="text-xl font-bold text-[#AF140B]">
                                                {Number(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')}đ
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Deliver Action */}
                            {canDeliver(selectedOrder) ? (
                                <Card className="border border-green-200 bg-green-50/40">
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                                                    <Truck className="w-4 h-4" />
                                                    Giao hàng qua GHN
                                                </p>
                                                {/* <p className="text-xs text-green-600 mt-1">
                                                    Chuyển trạng thái đơn hàng sang "Đã giao" và trừ kho tồn.
                                                </p> */}
                                                {(() => {
                                                    const warnings = getOrderStockWarnings(selectedOrder);
                                                    if (warnings.length > 0) return (
                                                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
                                                            <p className="text-xs text-amber-700 font-medium flex items-center gap-1 mb-1">
                                                                <AlertTriangle className="w-3 h-3" />Cảnh báo kho:
                                                            </p>
                                                            {warnings.map((w, i) => (
                                                                <p key={i} className="text-xs text-amber-600 ml-4">• {w}</p>
                                                            ))}
                                                        </div>
                                                    );
                                                    return null;
                                                })()}
                                            </div>
                                            <Button
                                                onClick={() => handleDeliver(selectedOrder.orderId)}
                                                disabled={updatingId === selectedOrder.orderId}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                {updatingId === selectedOrder.orderId
                                                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang xử lý...</>
                                                    : <><Truck className="w-4 h-4 mr-2" />Xác nhận giao hàng</>}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="text-center py-3 text-sm text-gray-400 border border-gray-200 rounded-lg bg-gray-50">
                                    Đơn hàng đang ở trạng thái <strong className="text-gray-600">{STATUS_CONFIG[selectedOrder.orderStatus]?.label}</strong> — không thể cập nhật.
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedOrder(null)}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
