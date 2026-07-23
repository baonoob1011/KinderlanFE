import { useEffect, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import {
    RotateCcw, RefreshCw, Search, AlertCircle,
    Clock, CheckCircle, XCircle,
    Loader2, Eye, ChevronLeft, ChevronRight, User,
    DollarSign, Ban, PackageCheck, ImageIcon, ShoppingBag,
} from 'lucide-react';
import api from '../../services/api';

// ─── Types ───────────────────────────────────────────────
type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';

interface ReturnResponseDTO {
    returnId: number;
    returnCode: string | null;
    orderItemId: number;
    orderId: number | null;
    returnReason: string;
    rejectionReason: string | null;
    returnStatus: ReturnStatus;
    description: string | null;
    photoUrls: string[] | null;
    refundAmount: number | null;
    refundType: string | null;
    bankAccountNumber: string | null;
    bankName: string | null;
    bankAccountName: string | null;
    refundTransactionCode: string | null;
    requestedAt: string;
    processedAt: string | null;
    refundedAt: string | null;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    productName: string | null;
    quantity: number | null;
    storeName: string | null;
    storeAddress: string | null;
    storePhone: string | null;
    processedByName: string | null;
}

// ─── Status config ───────────────────────────────────────
const STATUS_CONFIG: Record<ReturnStatus, { label: string; color: string; icon: typeof Clock }> = {
    PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
    APPROVED: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: CheckCircle },
    REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
    RECEIVED: { label: 'Đã nhận hàng', color: 'bg-indigo-100 text-indigo-700 border-indigo-300', icon: PackageCheck },
    REFUNDED: { label: 'Đã hoàn tiền', color: 'bg-green-100 text-green-700 border-green-300', icon: DollarSign },
};

const ALL_STATUSES: ReturnStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED'];

function StatusBadge({ status }: { status: ReturnStatus }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Icon = cfg.icon;
    return (
        <Badge variant="outline" className={`${cfg.color} text-xs`}>
            <Icon className="w-3 h-3 mr-1" />
            {cfg.label}
        </Badge>
    );
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return dateStr; }
}

function formatMoney(amount: number | null): string {
    if (amount == null) return '—';
    return Number(amount).toLocaleString('vi-VN') + 'đ';
}

// ─── Component ───────────────────────────────────────────
export default function ManagerReturnPage() {
    const { adminUser } = useAdmin();

    // Data
    const [returns, setReturns] = useState<ReturnResponseDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Server-side pagination (0-indexed)
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 10;
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Client-side filters on current page
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | ReturnStatus>('all');

    // Detail dialog
    const [selected, setSelected] = useState<ReturnResponseDTO | null>(null);

    // Action states
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    // Reject dialog
    const [rejectDialog, setRejectDialog] = useState<ReturnResponseDTO | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Refund dialog
    const [refundDialog, setRefundDialog] = useState<ReturnResponseDTO | null>(null);
    const [bankTransactionCode, setBankTransactionCode] = useState('');
    const [refundType, setRefundType] = useState<'BANK_TRANSFER' | 'E_GIFT'>('BANK_TRANSFER');

    // ─── Fetch ───────────────────────────────────────────
    const fetchReturns = async (pageNum = page) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/api/v1/return-requests?page=${pageNum}&size=${PAGE_SIZE}`);
            const data = res.data;
            setReturns(data?.content || []);
            setTotalPages(data?.totalPages || 1);
            setTotalElements(data?.totalElements || 0);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Không thể tải yêu cầu hoàn trả.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReturns(); }, [page]);

    // Client-side filter
    const filtered = returns.filter((r) => {
        const matchStatus = filterStatus === 'all' || r.returnStatus === filterStatus;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            (r.customerName || '').toLowerCase().includes(q) ||
            (r.customerEmail || '').toLowerCase().includes(q) ||
            (r.returnReason || '').toLowerCase().includes(q) ||
            (r.returnCode || '').toLowerCase().includes(q) ||
            (r.productName || '').toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    // Stats
    const getCount = (s: ReturnStatus) => returns.filter((r) => r.returnStatus === s).length;

    // ─── Actions ─────────────────────────────────────────

    // Helper: parse error message from API response
    const parseApiError = async (err: unknown): Promise<string> => {
        if (err instanceof Response) {
            try {
                const body = await err.json();
                return body?.message || body?.error || `Lỗi ${err.status}`;
            } catch { return `Lỗi ${err.status}`; }
        }
        if (err instanceof Error) return err.message;
        return 'Đã xảy ra lỗi không xác định.';
    };

    // APPROVE — no body
    const handleApprove = async (id: number) => {
        setActionLoading(true);
        setActionError(null);
        try {
            await api.patch(`/api/v1/return-requests/${id}/approve`, {});
            setReturns(prev => prev.map(r => r.returnId === id ? { ...r, returnStatus: 'APPROVED' as ReturnStatus } : r));
            if (selected?.returnId === id) setSelected(prev => prev ? { ...prev, returnStatus: 'APPROVED' as ReturnStatus } : null);
            setActionSuccess('Đã duyệt yêu cầu hoàn trả!');
            setTimeout(() => setActionSuccess(null), 3000);
        } catch (err: unknown) {
            setActionError(await parseApiError(err));
        } finally {
            setActionLoading(false);
        }
    };

    // REJECT — { rejectionReason }
    const handleReject = async () => {
        if (!rejectDialog || !rejectionReason.trim()) return;
        setActionLoading(true);
        setActionError(null);
        try {
            await api.patch(`/api/v1/return-requests/${rejectDialog.returnId}/reject`, {
                rejectionReason: rejectionReason.trim(),
            });
            setReturns(prev => prev.map(r => r.returnId === rejectDialog.returnId
                ? { ...r, returnStatus: 'REJECTED' as ReturnStatus, rejectionReason: rejectionReason.trim() } : r));
            setRejectDialog(null);
            setRejectionReason('');
            setActionSuccess('Đã từ chối yêu cầu hoàn trả.');
            setTimeout(() => setActionSuccess(null), 3000);
        } catch (err: unknown) {
            const msg = await parseApiError(err);
            console.error('Reject error details:', err);
            setActionError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    // RECEIVE — no body
    const handleReceive = async (id: number) => {
        setActionLoading(true);
        setActionError(null);
        try {
            await api.patch(`/api/v1/return-requests/${id}/receive`, {});
            setReturns(prev => prev.map(r => r.returnId === id ? { ...r, returnStatus: 'RECEIVED' as ReturnStatus } : r));
            if (selected?.returnId === id) setSelected(prev => prev ? { ...prev, returnStatus: 'RECEIVED' as ReturnStatus } : null);
            setActionSuccess('Đã xác nhận nhận hàng!');
            setTimeout(() => setActionSuccess(null), 3000);
        } catch (err: unknown) {
            setActionError(await parseApiError(err));
        } finally {
            setActionLoading(false);
        }
    };

    // REFUND — { refundType, bankTransactionCode? }
    const handleRefund = async () => {
        if (!refundDialog) return;
        if (refundType === 'BANK_TRANSFER' && !bankTransactionCode.trim()) return;
        setActionLoading(true);
        setActionError(null);
        try {
            const body: Record<string, string> = { refundType };
            if (refundType === 'BANK_TRANSFER') body.bankTransactionCode = bankTransactionCode.trim();
            await api.patch(`/api/v1/return-requests/${refundDialog.returnId}/refund`, body);
            setReturns(prev => prev.map(r => r.returnId === refundDialog.returnId
                ? { ...r, returnStatus: 'REFUNDED' as ReturnStatus, refundType } : r));
            if (selected?.returnId === refundDialog.returnId)
                setSelected(prev => prev ? { ...prev, returnStatus: 'REFUNDED' as ReturnStatus, refundType } : null);
            setRefundDialog(null);
            setBankTransactionCode('');
            setRefundType('BANK_TRANSFER');
            setActionSuccess('Đã hoàn tiền thành công!');
            setTimeout(() => setActionSuccess(null), 3000);
        } catch (err: unknown) {
            setActionError(await parseApiError(err));
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Render action buttons by status ─────────────────
    const renderActions = (ret: ReturnResponseDTO, size: 'sm' | 'default' = 'default') => {
        const cls = size === 'sm' ? 'text-xs h-7' : '';
        switch (ret.returnStatus) {
            case 'PENDING':
                return (
                    <>
                        <Button size={size} className={`bg-green-600 hover:bg-green-700 text-white ${cls}`}
                            onClick={() => handleApprove(ret.returnId)} disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3 mr-1" />Duyệt</>}
                        </Button>
                        <Button size={size} variant="outline" className={`text-red-600 hover:text-red-700 border-red-200 ${cls}`}
                            onClick={() => { setRejectDialog(ret); setRejectionReason(''); }} disabled={actionLoading}>
                            <Ban className="w-3 h-3 mr-1" />Từ chối
                        </Button>
                    </>
                );
            case 'APPROVED':
                return (
                    <Button size={size} className={`bg-indigo-600 hover:bg-indigo-700 text-white ${cls}`}
                        onClick={() => handleReceive(ret.returnId)} disabled={actionLoading}>
                        {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><PackageCheck className="w-3 h-3 mr-1" />Nhận hàng</>}
                    </Button>
                );
            case 'RECEIVED':
                return (
                    <Button size={size} className={`bg-emerald-600 hover:bg-emerald-700 text-white ${cls}`}
                        onClick={() => { setRefundDialog(ret); setBankTransactionCode(''); setRefundType('BANK_TRANSFER'); }} disabled={actionLoading}>
                        <DollarSign className="w-3 h-3 mr-1" />Hoàn tiền
                    </Button>
                );
            default:
                return null;
        }
    };

    // ─── JSX ─────────────────────────────────────────────
    return (
        <div className="min-h-full bg-white">
            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                                <RotateCcw className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#2C2C2C]">Xử Lý Hoàn Trả</h1>
                                <p className="text-sm text-gray-600">
                                    {adminUser?.name} · {adminUser?.storeName || 'Cửa hàng'}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => fetchReturns()} disabled={loading} className="border-gray-300">
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {ALL_STATUSES.map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        const Icon = cfg.icon;
                        return (
                            <Card key={s}
                                className={`bg-white border shadow-sm cursor-pointer transition-all hover:shadow-md ${filterStatus === s ? 'ring-2 ring-orange-500' : 'border-gray-200'}`}
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

                {/* Messages */}
                {error && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                        <AlertCircle className="w-5 h-5 mt-0.5" />
                        <div><p className="font-semibold">Lỗi</p><p className="text-sm">{error}</p></div>
                    </div>
                )}
                {actionSuccess && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
                        <CheckCircle className="w-4 h-4" />{actionSuccess}
                    </div>
                )}
                {actionError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                        <AlertCircle className="w-4 h-4" />{actionError}
                    </div>
                )}

                {/* Filter & Search */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input placeholder="Tìm mã, tên KH, email, sản phẩm..." value={search}
                                    onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
                            </div>
                            <Select value={filterStatus} onValueChange={(v: string) => setFilterStatus(v as typeof filterStatus)}>
                                <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
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

                {/* Table */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg text-[#2C2C2C]">
                            Danh sách yêu cầu hoàn trả
                            {totalElements > 0 && <Badge className="ml-2 bg-orange-600 text-white">{totalElements}</Badge>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-600 w-12">STT</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Khách hàng</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Sản phẩm</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Lý do</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Ngày yêu cầu</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Trạng thái</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading && Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-4/5" /></td>
                                            ))}
                                        </tr>
                                    ))}

                                    {!loading && filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center text-gray-400">
                                                <RotateCcw className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                                {returns.length === 0 ? 'Chưa có yêu cầu hoàn trả nào.' : 'Không tìm thấy kết quả.'}
                                            </td>
                                        </tr>
                                    )}

                                    {!loading && filtered.map((ret: ReturnResponseDTO, index: number) => (
                                        <tr key={ret.returnId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-sm font-medium text-gray-600">{page * PAGE_SIZE + index + 1}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-[#2C2C2C]">{ret.customerName || '—'}</p>
                                                <p className="text-xs text-gray-500">{ret.customerEmail || ''}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-gray-700 truncate max-w-[180px]">{ret.productName || '—'}</p>
                                                {ret.quantity && <p className="text-xs text-gray-400">SL: {ret.quantity}</p>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-gray-700 truncate max-w-[180px]">{ret.returnReason || '—'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {formatDate(ret.requestedAt)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusBadge status={ret.returnStatus} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1 justify-center">
                                                    <Button size="sm" variant="outline" className="text-xs h-7"
                                                        onClick={() => setSelected(ret)}>
                                                        <Eye className="w-3 h-3 mr-1" />Chi tiết
                                                    </Button>
                                                    {renderActions(ret, 'sm')}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!loading && (
                            <div className="flex items-center justify-center gap-2 px-4 py-4 border-t">
                                {totalPages > 1 && (
                                    <Button size="sm" variant="outline" disabled={page <= 0}
                                        onClick={() => setPage(p => p - 1)} className="h-8 w-8 p-0">
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                )}
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <Button key={i} size="sm"
                                        variant={i === page ? 'default' : 'outline'}
                                        onClick={() => setPage(i)}
                                        className={`h-8 w-8 p-0 text-xs ${i === page ? 'bg-gray-800 text-white hover:bg-gray-700' : ''}`}>
                                        {i + 1}
                                    </Button>
                                ))}
                                {totalPages > 1 && (
                                    <Button size="sm" variant="outline" disabled={page >= totalPages - 1}
                                        onClick={() => setPage(p => p + 1)} className="h-8 w-8 p-0">
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ─── Detail Dialog ──────────────────────────── */}
            <Dialog open={!!selected} onOpenChange={(open: boolean) => { if (!open) setSelected(null); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>Yêu cầu hoàn trả {selected?.returnCode ? `(${selected.returnCode})` : `#${selected?.returnId}`}</span>
                            {selected && <StatusBadge status={selected.returnStatus} />}
                        </DialogTitle>
                        <DialogDescription>Chi tiết yêu cầu hoàn trả</DialogDescription>
                    </DialogHeader>

                    {selected && (
                        <div className="space-y-4">
                            {/* Customer */}
                            <Card className="border border-gray-200">
                                <CardContent className="pt-4 pb-4 text-sm space-y-1">
                                    <div className="flex items-center gap-2 mb-2"><User className="w-4 h-4" /><span className="font-semibold">Khách hàng</span></div>
                                    <p><span className="text-gray-500">Họ tên:</span> <strong>{selected.customerName || '—'}</strong></p>
                                    <p><span className="text-gray-500">Email:</span> {selected.customerEmail || '—'}</p>
                                    {selected.customerPhone && <p><span className="text-gray-500">SĐT:</span> {selected.customerPhone}</p>}
                                </CardContent>
                            </Card>

                            {/* Action bar */}
                            {(selected.returnStatus === 'PENDING' || selected.returnStatus === 'APPROVED' || selected.returnStatus === 'RECEIVED') && (
                                <div className="flex items-center justify-between bg-gray-50 border rounded-lg p-3">
                                    <span className="text-sm text-gray-600 font-medium">Cập nhật trạng thái:</span>
                                    <div className="flex items-center gap-2">
                                        {renderActions(selected)}
                                    </div>
                                </div>
                            )}

                            {/* Product info */}
                            {(selected.productName || selected.orderId) && (
                                <Card className="border border-gray-200">
                                    <CardContent className="pt-4 pb-4 text-sm space-y-1">
                                        <div className="flex items-center gap-2 mb-2"><ShoppingBag className="w-4 h-4" /><span className="font-semibold">Sản phẩm</span></div>
                                        {selected.productName && <p><span className="text-gray-500">Tên:</span> <strong>{selected.productName}</strong></p>}
                                        {selected.quantity && <p><span className="text-gray-500">Số lượng:</span> {selected.quantity}</p>}
                                        {selected.orderId && <p><span className="text-gray-500">Mã đơn hàng:</span> #{selected.orderId}</p>}
                                        <p><span className="text-gray-500">Order Item ID:</span> <Badge variant="outline" className="font-mono text-xs">#{selected.orderItemId}</Badge></p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Reason */}
                            <Card className="border border-gray-200">
                                <CardContent className="pt-4 pb-4 text-sm">
                                    <p className="font-semibold mb-2">Lý do hoàn trả</p>
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                                        {selected.returnReason || '—'}
                                    </div>
                                    {selected.description && (
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500 mb-1">Mô tả thêm:</p>
                                            <p className="text-sm text-gray-700">{selected.description}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Photos */}
                            {selected.photoUrls && selected.photoUrls.length > 0 && (
                                <Card className="border border-gray-200">
                                    <CardContent className="pt-4 pb-4">
                                        <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" />Hình ảnh ({selected.photoUrls.length})
                                        </p>
                                        <div className="flex gap-2 flex-wrap">
                                            {selected.photoUrls.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                    className="block w-20 h-20 rounded-lg border overflow-hidden hover:ring-2 ring-orange-400 transition-all">
                                                    <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Refund info */}
                            {(selected.refundAmount || selected.refundType || selected.refundTransactionCode) && (
                                <Card className="border border-gray-200">
                                    <CardContent className="pt-4 pb-4 text-sm space-y-1">
                                        <p className="font-semibold mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" />Thông tin hoàn tiền</p>
                                        {selected.refundAmount != null && (
                                            <p><span className="text-gray-500">Số tiền:</span> <strong className="text-green-600">{formatMoney(selected.refundAmount)}</strong></p>
                                        )}
                                        {selected.refundType && <p><span className="text-gray-500">Hình thức:</span> {selected.refundType}</p>}
                                        {selected.bankName && <p><span className="text-gray-500">Ngân hàng:</span> {selected.bankName}</p>}
                                        {selected.bankAccountNumber && <p><span className="text-gray-500">STK:</span> {selected.bankAccountNumber}</p>}
                                        {selected.bankAccountName && <p><span className="text-gray-500">Chủ TK:</span> {selected.bankAccountName}</p>}
                                        {selected.refundTransactionCode && <p><span className="text-gray-500">Mã GD:</span> <Badge variant="outline" className="font-mono text-xs">{selected.refundTransactionCode}</Badge></p>}
                                        {selected.refundedAt && <p><span className="text-gray-500">Hoàn tiền lúc:</span> {formatDate(selected.refundedAt)}</p>}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Rejection */}
                            {selected.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-red-700 mb-1">Lý do từ chối:</p>
                                    <p className="text-sm text-red-600">{selected.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelected(null)}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Reject Dialog ──────────────────────────── */}
            <Dialog open={!!rejectDialog} onOpenChange={(open: boolean) => { if (!open) setRejectDialog(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Từ chối yêu cầu {rejectDialog?.returnCode || `#${rejectDialog?.returnId}`}</DialogTitle>
                        <DialogDescription>{rejectDialog?.customerName} — {rejectDialog?.returnReason}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Lý do từ chối *</label>
                            <Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                                placeholder="Nhập lý do từ chối..." rows={3} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog(null)} disabled={actionLoading}>Hủy</Button>
                        <Button onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white">
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                            Xác nhận từ chối
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Refund Dialog ──────────────────────────── */}
            <Dialog open={!!refundDialog} onOpenChange={(open: boolean) => { if (!open) setRefundDialog(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hoàn tiền yêu cầu {refundDialog?.returnCode || `#${refundDialog?.returnId}`}</DialogTitle>
                        <DialogDescription>
                            {refundDialog?.customerName} — {refundDialog?.productName || refundDialog?.returnReason}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Refund type selector */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Hình thức hoàn tiền *</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRefundType('BANK_TRANSFER')}
                                    className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                                        refundType === 'BANK_TRANSFER'
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                    }`}
                                >
                                    🏦 Chuyển khoản
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRefundType('E_GIFT')}
                                    className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                                        refundType === 'E_GIFT'
                                            ? 'bg-orange-500 text-white border-orange-500'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                                    }`}
                                >
                                    🎁 E-Gift Card
                                </button>
                            </div>
                        </div>

                        {/* Show bank info if available and BANK_TRANSFER selected */}
                        {refundType === 'BANK_TRANSFER' && refundDialog?.bankName && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm space-y-1">
                                <p className="font-semibold text-blue-700 mb-1">Thông tin ngân hàng KH:</p>
                                <p><span className="text-gray-600">Ngân hàng:</span> {refundDialog.bankName}</p>
                                {refundDialog.bankAccountNumber && <p><span className="text-gray-600">STK:</span> {refundDialog.bankAccountNumber}</p>}
                                {refundDialog.bankAccountName && <p><span className="text-gray-600">Chủ TK:</span> {refundDialog.bankAccountName}</p>}
                            </div>
                        )}

                        {/* E-Gift notice */}
                        {refundType === 'E_GIFT' && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                                <p className="font-semibold text-orange-700 mb-1">🎁 Hoàn tiền bằng E-Gift Card</p>
                                <p className="text-gray-600">Hệ thống sẽ tự động tạo và gửi E-Gift Card cho khách hàng qua email.</p>
                            </div>
                        )}

                        {refundDialog?.refundAmount != null && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                                <span className="text-gray-600">Số tiền hoàn: </span>
                                <strong className="text-green-700">{formatMoney(refundDialog.refundAmount)}</strong>
                            </div>
                        )}

                        {refundType === 'BANK_TRANSFER' && (
                            <div>
                                <label className="text-sm font-medium mb-1 block">Mã giao dịch ngân hàng *</label>
                                <Input value={bankTransactionCode} onChange={e => setBankTransactionCode(e.target.value)}
                                    placeholder="Nhập mã giao dịch chuyển khoản..." />
                                <p className="text-xs text-gray-400 mt-1">Mã xác nhận chuyển khoản hoàn tiền cho khách hàng</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRefundDialog(null)} disabled={actionLoading}>Hủy</Button>
                        <Button
                            onClick={handleRefund}
                            disabled={actionLoading || (refundType === 'BANK_TRANSFER' && !bankTransactionCode.trim())}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
                            Xác nhận hoàn tiền
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
