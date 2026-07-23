import { useEffect, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import {
    AlertTriangle, RefreshCw,
    AlertCircle, CheckCircle, Loader2, Package,
    Trash2, Search, ChevronLeft, ChevronRight, Calendar,
} from 'lucide-react';
import { inventoryApi, InventoryItem } from '../../services/inventoryApi';
import { useStoreId } from '../../hooks/useStoreId';

type ReasonType = 'broken' | 'cancelled' | 'expired' | 'lost' | 'other';

interface SubmittedRecord {
    item: InventoryItem;
    quantity: number;
    reason: ReasonType;
    note: string;
    submittedAt: Date;
}

const REASONS: { value: ReasonType; label: string; icon: string }[] = [
    { value: 'broken', label: 'Hàng vỡ / hỏng', icon: '💥' },
    { value: 'cancelled', label: 'Đơn hủy trả về', icon: '🔄' },
    { value: 'expired', label: 'Hết hạn sử dụng', icon: '⏰' },
    { value: 'lost', label: 'Mất / thất lạc', icon: '❓' },
    { value: 'other', label: 'Lý do khác', icon: '📋' },
];

const PAGE_SIZE = 10;

export default function DefectiveReportPage() {
    const { adminUser } = useAdmin();

    // Inventory list
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loadingInv, setLoadingInv] = useState(false);
    const [invError, setInvError] = useState<string | null>(null);

    // StoreId
    const { storeId } = useStoreId();

    // Search & Pagination
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [dQty, setDQty] = useState('1');
    const [dReason, setDReason] = useState<ReasonType>('broken');
    const [dNote, setDNote] = useState('');
    const [dSubmitting, setDSubmitting] = useState(false);
    const [dError, setDError] = useState<string | null>(null);
    const [dSuccess, setDSuccess] = useState(false);

    // History of submitted records — persisted in localStorage
    const HISTORY_KEY = 'defective_report_history';
    const [history, setHistory] = useState<SubmittedRecord[]>(() => {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.map((r: SubmittedRecord & { submittedAt: string }) => ({
                    ...r,
                    submittedAt: new Date(r.submittedAt),
                }));
            }
        } catch { /* ignore */ }
        return [];
    });

    const fetchInventory = async () => {
        const effectiveId = storeId ?? '';
        if (!effectiveId) return;
        setLoadingInv(true);
        setInvError(null);
        try {
            const data = await inventoryApi.getAllInventory(effectiveId || undefined);
            setInventory(data);
        } catch (err: unknown) {
            setInvError(err instanceof Error ? err.message : 'Không thể tải dữ liệu.');
        } finally {
            setLoadingInv(false);
        }
    };

    useEffect(() => { if (storeId) fetchInventory(); }, [storeId]);

    // Filter
    const filtered = inventory.filter((item) => {
        const q = search.toLowerCase();
        return (item.productName || '').toLowerCase().includes(q) ||
            item.skuCode.toLowerCase().includes(q) ||
            String(item.skuId).includes(q);
    });

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    // Reset page when search changes
    useEffect(() => { setPage(1); }, [search]);

    // Open dialog
    const openDialog = (item: InventoryItem) => {
        setSelectedItem(item);
        setDQty('1');
        setDReason('broken');
        setDNote('');
        setDError(null);
        setDSuccess(false);
        setDialogOpen(true);
    };

    // Submit dispose
    const handleSubmit = async () => {
        if (!selectedItem) return;
        const qty = parseInt(dQty, 10);
        if (isNaN(qty) || qty <= 0) {
            setDError('Số lượng phải > 0.');
            return;
        }
        if (qty > selectedItem.quantity) {
            setDError(`Không thể thanh lý nhiều hơn tồn kho (${selectedItem.quantity}).`);
            return;
        }
        setDSubmitting(true);
        setDError(null);
        try {
            await inventoryApi.disposeInventory(selectedItem.storeId, selectedItem.skuId, qty);
            setDSuccess(true);
            const newRecord: SubmittedRecord = {
                item: selectedItem,
                quantity: qty,
                reason: dReason,
                note: dNote,
                submittedAt: new Date(),
            };
            setHistory(prev => {
                const updated = [newRecord, ...prev];
                localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
                return updated;
            });
            // Refresh inventory
            fetchInventory();
            // Auto-close after short delay
            setTimeout(() => {
                setDialogOpen(false);
                setDSuccess(false);
            }, 1200);
        } catch (err: unknown) {
            setDError(err instanceof Error ? err.message : 'Thanh lý thất bại.');
        } finally {
            setDSubmitting(false);
        }
    };

    return (
        <div className="min-h-full bg-white">

            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#2C2C2C]">Báo Cáo Hàng Lỗi</h1>
                                <p className="text-sm text-gray-600">{adminUser?.storeName || 'Cửa hàng'} · Thanh lý sản phẩm lỗi</p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={fetchInventory} disabled={loadingInv} className="border-gray-300">
                            <RefreshCw className={`w-4 h-4 mr-2 ${loadingInv ? 'animate-spin' : ''}`} />
                            Tải lại
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                <Tabs defaultValue="dispose" className="w-full">
                    <TabsList className="w-full !bg-transparent p-0 !rounded-none gap-4 !h-auto">
                        <TabsTrigger value="dispose" className="flex-1 !border-2 !border-gray-600 !bg-gray-600 !text-white data-[state=active]:!border-orange-600 data-[state=active]:!bg-orange-600 data-[state=active]:!text-white data-[state=active]:!shadow-lg !rounded-xl text-sm !font-semibold !py-3 !px-4 transition-all">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Thanh lý hàng lỗi
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex-1 !border-2 !border-gray-600 !bg-gray-600 !text-white data-[state=active]:!border-green-600 data-[state=active]:!bg-green-600 data-[state=active]:!text-white data-[state=active]:!shadow-lg !rounded-xl text-sm !font-semibold !py-3 !px-4 transition-all">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Lịch sử thanh lý
                            {history.length > 0 && (
                                <Badge className="ml-2 bg-green-600 text-white text-[10px] px-1.5 py-0">{history.length}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Dispose */}
                    <TabsContent value="dispose" className="mt-4 space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Tổng SKU kho', value: inventory.length, color: 'text-blue-700', border: 'border-blue-200' },
                                { label: 'Hết hàng', value: inventory.filter(i => i.quantity === 0).length, color: 'text-red-600', border: 'border-red-300' },
                                { label: 'Kết quả tìm kiếm', value: filtered.length, color: 'text-orange-600', border: 'border-orange-200' },
                            ].map((s, i) => (
                                <Card key={i} className={`bg-white border ${s.border} shadow-sm`}>
                                    <CardContent className="p-4">
                                        <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                                        <p className={`text-2xl font-bold ${s.color}`}>{loadingInv ? '…' : s.value}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Inventory Table */}
                        <Card className="border border-gray-200 shadow-sm bg-white">
                            <CardHeader>
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div>
                                        <CardTitle className="text-lg text-[#2C2C2C]">Chọn sản phẩm cần thanh lý</CardTitle>
                                        <CardDescription>Nhấn <strong>Thanh lý</strong> để báo cáo hàng lỗi</CardDescription>
                                    </div>
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder="Tìm sản phẩm, SKU…"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-9 h-9 text-sm"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {invError && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm px-4 py-3">
                                        <AlertCircle className="w-4 h-4" />{invError}
                                    </div>
                                )}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600">SKU Code</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tên sản phẩm</th>
                                                <th className="px-4 py-3 text-center font-semibold text-gray-600 w-24">Tồn kho</th>
                                                <th className="px-4 py-3 text-center font-semibold text-gray-600 w-28"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {loadingInv && Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-40" /></td>
                                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-10 mx-auto" /></td>
                                                    <td className="px-4 py-3"><div className="h-7 bg-gray-100 rounded w-20 mx-auto" /></td>
                                                </tr>
                                            ))}

                                            {!loadingInv && paged.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="py-14 text-center text-gray-400">
                                                        <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                        {inventory.length === 0 ? 'Chưa có dữ liệu tồn kho.' : 'Không tìm thấy sản phẩm.'}
                                                    </td>
                                                </tr>
                                            )}

                                            {!loadingInv && paged.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-2.5">
                                                        <Badge variant="outline" className="font-mono text-xs">{item.skuCode}</Badge>
                                                    </td>
                                                    <td className="px-4 py-2.5 font-medium text-[#2C2C2C]">{item.productName || '—'}</td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <span className={`font-bold ${item.quantity === 0 ? 'text-red-600' : item.quantity <= 5 ? 'text-yellow-600' : 'text-green-700'}`}>
                                                            {item.quantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <Button size="sm" variant="outline"
                                                            onClick={() => openDialog(item)}
                                                            disabled={item.quantity === 0}
                                                            className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-50">
                                                            <Trash2 className="w-3 h-3 mr-1" />
                                                            Thanh lý
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {!loadingInv && totalPages > 1 && (
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
                                                        className={`h-7 w-7 p-0 text-xs ${p === safePage ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}`}>
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

                    {/* Tab 2: History */}
                    <TabsContent value="history" className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-white border border-green-200 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-xs text-gray-500 mb-1">Tổng đã thanh lý</p>
                                    <p className="text-2xl font-bold text-green-700">{history.length}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-white border border-red-200 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-xs text-gray-500 mb-1">Tổng SL thanh lý</p>
                                    <p className="text-2xl font-bold text-red-600">{history.reduce((sum, r) => sum + r.quantity, 0)}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border border-gray-200 shadow-sm bg-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    Lịch sử thanh lý
                                </CardTitle>
                                <CardDescription>Danh sách các sản phẩm đã thanh lý trong phiên làm việc</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {history.length === 0 ? (
                                    <div className="py-14 text-center text-gray-400">
                                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">Chưa có mục nào được thanh lý.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-green-50 border-b border-green-100">
                                            <tr>
                                                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 text-xs">Sản phẩm</th>
                                                <th className="px-4 py-2.5 text-center font-semibold text-gray-600 text-xs w-16">SL</th>
                                                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 text-xs">Lý do</th>
                                                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 text-xs">Ghi chú</th>
                                                <th className="px-4 py-2.5 text-right font-semibold text-gray-600 text-xs w-24">Thời gian</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-green-50">
                                            {history.map((rec, i) => (
                                                <tr key={i} className="hover:bg-green-50/50">
                                                    <td className="px-4 py-2.5">
                                                        <span className="font-medium text-[#2C2C2C]">{rec.item.productName || rec.item.skuCode}</span>
                                                        <Badge variant="outline" className="ml-2 font-mono text-[10px] px-1 py-0">{rec.item.skuCode}</Badge>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center font-bold text-red-600">{rec.quantity}</td>
                                                    <td className="px-4 py-2.5 text-xs">{REASONS.find(r => r.value === rec.reason)?.icon} {REASONS.find(r => r.value === rec.reason)?.label}</td>
                                                    <td className="px-4 py-2.5 text-xs text-gray-500">{rec.note || '—'}</td>
                                                    <td className="px-4 py-2.5 text-right text-xs text-gray-500">
                                                        <span className="flex items-center justify-end gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {rec.submittedAt.toLocaleTimeString('vi-VN')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Dispose Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open: boolean) => { if (!open && !dSubmitting) setDialogOpen(false); }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-orange-700">Thanh lý hàng lỗi</DialogTitle>
                        <DialogDescription>
                            {selectedItem && (
                                <span>
                                    <strong>{selectedItem.productName || selectedItem.skuCode}</strong>
                                    <Badge variant="outline" className="ml-2 font-mono text-[10px] px-1 py-0">{selectedItem.skuCode}</Badge>
                                    <span className="ml-2 text-gray-500">· Tồn kho: <strong className="text-[#2C2C2C]">{selectedItem.quantity}</strong></span>
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {dSuccess ? (
                        <div className="flex flex-col items-center gap-2 py-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                            <p className="font-semibold text-green-700">Thanh lý thành công!</p>
                        </div>
                    ) : (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="d-qty" className="text-xs mb-1 block">
                                        Số lượng <span className="text-[#AF140B]">*</span>
                                        {selectedItem && (
                                            <span className="text-gray-400 font-normal ml-1">(max {selectedItem.quantity})</span>
                                        )}
                                    </Label>
                                    <Input id="d-qty" type="number" min={1} max={selectedItem?.quantity}
                                        value={dQty}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (selectedItem && parseInt(val, 10) > selectedItem.quantity) {
                                                val = String(selectedItem.quantity);
                                            }
                                            setDQty(val);
                                            setDError(null);
                                        }}
                                        disabled={dSubmitting}
                                        className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs mb-1 block">Lý do</Label>
                                    <select
                                        value={dReason}
                                        onChange={(e) => setDReason(e.target.value as ReasonType)}
                                        disabled={dSubmitting}
                                        className="w-full h-9 rounded-md border border-gray-300 text-sm px-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300">
                                        {REASONS.map(r => (
                                            <option key={r.value} value={r.value}>
                                                {r.icon} {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="d-note" className="text-xs mb-1 block">Ghi chú</Label>
                                <Input id="d-note" placeholder="Mô tả chi tiết tình trạng hàng…"
                                    value={dNote}
                                    onChange={(e) => setDNote(e.target.value)}
                                    disabled={dSubmitting}
                                    className="h-9" />
                            </div>

                            {dError && (
                                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{dError}
                                </div>
                            )}
                        </div>
                    )}

                    {!dSuccess && (
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={dSubmitting}>Hủy</Button>
                            <Button onClick={handleSubmit} disabled={dSubmitting}
                                className="bg-orange-600 hover:bg-orange-700">
                                {dSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {dSubmitting ? 'Đang gửi…' : 'Xác nhận thanh lý'}
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
