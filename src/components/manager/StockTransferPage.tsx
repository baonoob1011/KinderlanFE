import { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
    Truck, Loader2, AlertCircle, ArrowRight,
    CheckCircle, RefreshCw, Package,
    MapPin, Clock, Inbox, Send, Eye,
} from 'lucide-react';
import { inventoryApi, InventoryItem } from '../../services/inventoryApi';
import { storeApi, StoreItem } from '../../services/storeApi';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../ui/dialog';
import api from '../../services/api';
import { toast } from 'sonner';

// ─── Transfer status config ─────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string }> = {
    DRAFT:             { label: 'Nháp',           color: 'bg-gray-100 text-gray-700 border-gray-200' },
    PENDING_APPROVAL:  { label: 'Chờ duyệt',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    APPROVED:          { label: 'Đã duyệt',      color: 'bg-blue-100 text-blue-700 border-blue-200' },
    OUT_FOR_DELIVERY:  { label: 'Đang giao',      color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    RECEIVED:          { label: 'Đã nhận',        color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    COMPLETED:         { label: 'Hoàn tất',       color: 'bg-green-100 text-green-700 border-green-200' },
    REJECTED:          { label: 'Từ chối',        color: 'bg-red-100 text-red-700 border-red-200' },
    LOST_DAMAGED:      { label: 'Mất/Hỏng',      color: 'bg-rose-100 text-rose-700 border-rose-200' },
};

type Transfer = {
    id: number;
    fromStoreName: string;
    toStoreName: string;
    skuCode: string;
    quantity: number;
    status: string;
    createdBy: string;
};

/**
 * Chi nhánh có thể làm nguồn chuyển kho hay không.
 *
 * KHÔNG dò chuỗi tiếng Việt ("hết") trên availabilityStatus: API trả về mã enum
 * (IN_STOCK / LOW_STOCK / OUT_OF_STOCK), nên "OUT_OF_STOCK" không chứa "hết" và mọi
 * chi nhánh hết hàng đều lọt qua bộ lọc. Chọn phải một chi nhánh như vậy thì
 * quantity = 0 -> "Tối đa: 0" -> ô nhập bị kẹp về 0, không gõ được số nào.
 * quantity là con số thật, dùng nó làm căn cứ; status chỉ để hiển thị.
 */
const hasStock = (s: StoreAvailability): boolean => {
    if (typeof s.quantity === 'number') return s.quantity > 0;
    const status = (s.availabilityStatus || '').toLowerCase();
    return !status.includes('out_of_stock') && !status.includes('hết');
};

export default function StockTransferPage() {
    const { adminUser } = useAdmin();
    const storeId = adminUser?.storeId ?? localStorage.getItem('storeId') ?? '';
    const storeName = adminUser?.storeName || '';

    const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming' | 'create'>('outgoing');

    // ─── Transfer List ──────────────────────────────
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [loadingTransfers, setLoadingTransfers] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchTransfers = useCallback(async () => {
        setLoadingTransfers(true);
        try {
            const res = await api.get('/api/v1/transfer');
            const data = res?.data ?? res ?? [];
            setTransfers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch transfers', err);
        } finally {
            setLoadingTransfers(false);
        }
    }, []);

    useEffect(() => { fetchTransfers(); }, [fetchTransfers]);

    const handleAction = async (id: number, action: string, actionLabel: string) => {
        setActionLoading(id);
        try {
            await api.post(`/api/v1/transfer/${id}/${action}`);
            toast.success(`${actionLabel} thành công!`);
            await fetchTransfers();
        } catch (err: any) {
            toast.error(err?.message || 'Thao tác thất bại');
        } finally {
            setActionLoading(null);
        }
    };

    // Split transfers
    const outgoing = transfers.filter(t => t.fromStoreName === storeName);
    const incoming = transfers.filter(t => t.toStoreName === storeName);
    const incomingPendingCount = incoming.filter(t => t.status === 'PENDING_APPROVAL').length;

    // ─── Create Form State ──────────────────────────
    const [skuInput, setSkuInput] = useState('');
    const [storeSkus, setStoreSkus] = useState<InventoryItem[]>([]);
    const [loadingSkus, setLoadingSkus] = useState(true);

    useEffect(() => {
        const fetchStoreSkus = async () => {
            if (!storeId) { setLoadingSkus(false); return; }
            try {
                const skus = await inventoryApi.getAllInventory(storeId);
                setStoreSkus(skus);
                if (skus.length > 0) setSkuInput(String(skus[0].skuId));
            } catch (err) {
                console.error('Failed to fetch store SKUs', err);
            } finally { setLoadingSkus(false); }
        };
        fetchStoreSkus();
    }, [storeId]);

    // Chi nhánh NHẬN hàng. Backend luôn lấy cửa hàng của người tạo làm fromStore
    // (TransferService.createDraft), nên toStoreId BẮT BUỘC là nơi nhận — trước đây
    // FE gửi nhầm chi nhánh đang có hàng vào đây, làm hàng chạy ngược chiều.
    const [stores, setStores] = useState<StoreItem[]>([]);
    const [loadingStores, setLoadingStores] = useState(true);
    const [selectedDestId, setSelectedDestId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [sentSummary, setSentSummary] = useState<{ sku: string; qty: string; to: string } | null>(null);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                setStores(await storeApi.getStores());
            } catch (err) {
                console.error('Failed to fetch stores', err);
            } finally { setLoadingStores(false); }
        };
        fetchStores();
    }, []);

    // Không bao giờ cho chuyển hàng cho chính mình.
    const destinationStores = stores.filter(
        (s) => s.active && String(s.id) !== String(storeId),
    );

    const selectedSku = storeSkus.find((s) => String(s.skuId) === skuInput) || null;
    const availableQty = selectedSku?.quantity ?? 0;
    const selectedDest = destinationStores.find((s) => s.id === selectedDestId) || null;

    const qtyNum = parseInt(quantity, 10);
    // Tồn kho khả dụng là của CHÍNH chi nhánh hiện tại (bên gửi).
    const isExceeding = !isNaN(qtyNum) && qtyNum > availableQty;
    const canSubmit =
        selectedSku !== null && selectedDestId !== null &&
        !isNaN(qtyNum) && qtyNum > 0 && !isExceeding && !submitting;

    const handleSubmit = async () => {
        if (!canSubmit || !selectedSku || !selectedDest) return;
        setSubmitting(true); setSubmitError(null);
        try {
            const draft = await api.post('/api/v1/transfer/draft', {
                // Chi nhánh NHẬN hàng — bên gửi là cửa hàng hiện tại, do backend tự gán.
                toStoreId: selectedDest.id,
                skuId: selectedSku.skuId,
                quantity: qtyNum,
            });
            const draftId = draft?.data?.id ?? draft?.id;
            if (draftId) await api.post(`/api/v1/transfer/${draftId}/submit`);
            setSentSummary({
                sku: `[${selectedSku.skuCode}] ${selectedSku.productName}`,
                qty: String(qtyNum),
                to: selectedDest.name,
            });
            setSubmitSuccess(true);
            setConfirmOpen(false);
            toast.success(`Đã gửi phiếu chuyển ${qtyNum} sản phẩm đến ${selectedDest.name}`);
            fetchTransfers();
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : 'Tạo phiếu chuyển hàng thất bại.');
            setConfirmOpen(false);
        } finally { setSubmitting(false); }
    };

    const handleReset = () => {
        setSubmitSuccess(false); setSkuInput('');
        setSelectedDestId(null); setQuantity('');
        setSubmitError(null); setSentSummary(null);
    };

    return (
        <div className="min-h-full bg-white">
            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Truck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#2C2C2C]">Quản Lý Chuyển Kho</h1>
                            <p className="text-sm text-gray-600">
                                {storeName || 'Cửa hàng'} · Quản lý chuyển hàng giữa các chi nhánh
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── 3 Tabs ─────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                    <TabButton active={activeTab === 'outgoing'} onClick={() => setActiveTab('outgoing')}
                        icon={<Send className="w-4 h-4" />} label="Yêu cầu đã gửi" count={outgoing.length} />
                    <TabButton active={activeTab === 'incoming'} onClick={() => setActiveTab('incoming')}
                        icon={<Inbox className="w-4 h-4" />} label="Yêu cầu nhận được" badge={incomingPendingCount} />
                    <TabButton active={activeTab === 'create'} onClick={() => setActiveTab('create')}
                        icon={<Package className="w-4 h-4" />} label="Tạo phiếu chuyển hàng" />
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

                {/* ══════════════ TAB 1: OUTGOING (My requests) ══════════════ */}
                {activeTab === 'outgoing' && (
                    <>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Yêu cầu đã gửi</h2>
                                <p className="text-sm text-gray-500">Các yêu cầu chuyển kho bạn đã tạo và gửi đi</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchTransfers} disabled={loadingTransfers}>
                                <RefreshCw className={`w-4 h-4 mr-1 ${loadingTransfers ? 'animate-spin' : ''}`} />
                                Làm mới
                            </Button>
                        </div>

                        {loadingTransfers ? (
                            <LoadingState />
                        ) : outgoing.length === 0 ? (
                            <EmptyState text="Bạn chưa gửi yêu cầu chuyển kho nào" />
                        ) : (
                            <div className="space-y-2">
                                {outgoing.map(t => {
                                    const actions: ActionDef[] = [];
                                    if (t.status === 'DRAFT')
                                        actions.push({ label: 'Gửi yêu cầu', action: 'submit', variant: 'default' });
                                    if (t.status === 'APPROVED')
                                        actions.push({ label: 'Giao hàng', action: 'ship', variant: 'default' });
                                    return (
                                        <TransferCard key={t.id} t={t} actions={actions}
                                            actionLoading={actionLoading} onAction={handleAction} />
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ══════════════ TAB 2: INCOMING (From other stores) ══════════════ */}
                {activeTab === 'incoming' && (
                    <>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Yêu cầu nhận được</h2>
                                <p className="text-sm text-gray-500">Các chi nhánh khác yêu cầu chuyển hàng đến kho của bạn</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchTransfers} disabled={loadingTransfers}>
                                <RefreshCw className={`w-4 h-4 mr-1 ${loadingTransfers ? 'animate-spin' : ''}`} />
                                Làm mới
                            </Button>
                        </div>

                        {loadingTransfers ? (
                            <LoadingState />
                        ) : incoming.length === 0 ? (
                            <EmptyState text="Không có yêu cầu nào từ chi nhánh khác" />
                        ) : (
                            <div className="space-y-4">
                                {/* Pending approval — highlighted */}
                                {incoming.filter(t => t.status === 'PENDING_APPROVAL').length > 0 && (
                                    <Card className="border-yellow-300 bg-yellow-50/70 shadow-sm">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2 text-yellow-800">
                                                <AlertCircle className="w-4 h-4" />
                                                Cần phê duyệt ({incoming.filter(t => t.status === 'PENDING_APPROVAL').length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 pt-0">
                                            {incoming.filter(t => t.status === 'PENDING_APPROVAL').map(t => (
                                                <TransferCard key={t.id} t={t} highlight actions={[
                                                    { label: 'Duyệt', action: 'approve', variant: 'default' },
                                                    { label: 'Từ chối', action: 'reject', variant: 'destructive' },
                                                ]} actionLoading={actionLoading} onAction={handleAction} />
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Other incoming statuses */}
                                {incoming.filter(t => t.status !== 'PENDING_APPROVAL').length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Đã xử lý ({incoming.filter(t => t.status !== 'PENDING_APPROVAL').length})
                                        </h3>
                                        {incoming.filter(t => t.status !== 'PENDING_APPROVAL').map(t => {
                                            const actions: ActionDef[] = [];
                                            if (t.status === 'OUT_FOR_DELIVERY') {
                                                actions.push({ label: 'Xác nhận nhận', action: 'receive', variant: 'default' });
                                                actions.push({ label: 'Mất/Hỏng', action: 'lost-damaged', variant: 'destructive' });
                                            }
                                            if (t.status === 'RECEIVED')
                                                actions.push({ label: 'Hoàn tất', action: 'complete', variant: 'default' });
                                            return (
                                                <TransferCard key={t.id} t={t} actions={actions}
                                                    actionLoading={actionLoading} onAction={handleAction} />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ══════════════ TAB 3: CREATE (chuyển hàng ĐI) ══════════════ */}
                {activeTab === 'create' && (
                    <>
                        {submitSuccess && sentSummary && (
                            <Card className="border-green-300 bg-green-50 shadow-md">
                                <CardContent className="p-6 flex items-start gap-4">
                                    <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-green-800 mb-2">Đã gửi phiếu chuyển hàng!</h3>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-green-700 mb-1">
                                            <span className="font-medium">{storeName || `Store #${storeId}`}</span>
                                            <ArrowRight className="w-4 h-4 flex-shrink-0" />
                                            <span className="font-medium">{sentSummary.to}</span>
                                        </div>
                                        <p className="text-sm text-green-700">
                                            {sentSummary.sku} · Số lượng: <strong>{sentSummary.qty}</strong>
                                        </p>
                                        <p className="text-xs text-green-700/80 mt-1">
                                            Chờ chi nhánh nhận duyệt, sau đó bạn bấm “Giao hàng” để trừ kho và gửi đi.
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <Button onClick={handleReset} className="bg-green-600 hover:bg-green-700">
                                                <RefreshCw className="w-4 h-4 mr-2" />Tạo phiếu khác
                                            </Button>
                                            <Button variant="outline" onClick={() => setActiveTab('outgoing')}>
                                                <Eye className="w-4 h-4 mr-2" />Xem phiếu đã gửi
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {!submitSuccess && (
                            <>
                                {/* Step 1 — sản phẩm lấy từ kho CỦA CHÍNH chi nhánh hiện tại */}
                                <Card className="border border-gray-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                                            Chọn sản phẩm cần chuyển đi
                                        </CardTitle>
                                        <CardDescription>
                                            Hàng được lấy từ kho của <strong>{storeName || `Store #${storeId}`}</strong> — chi nhánh gửi luôn là cửa hàng bạn đang quản lý.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {!loadingSkus && storeSkus.length === 0 ? (
                                            <div className="flex items-center gap-2 text-red-600 text-sm">
                                                <AlertCircle className="w-4 h-4" />
                                                Kho của bạn chưa có sản phẩm nào để chuyển đi.
                                            </div>
                                        ) : (
                                            <div className="max-w-md">
                                                <Label htmlFor="sku" className="mb-1 block">Sản phẩm trong kho</Label>
                                                <Select value={skuInput}
                                                    onValueChange={(val: string) => { setSkuInput(val); setQuantity(''); setSubmitError(null); }}
                                                    disabled={loadingSkus || storeSkus.length === 0}>
                                                    <SelectTrigger id="sku" className="w-full">
                                                        <SelectValue placeholder={loadingSkus ? 'Đang tải...' : 'Chọn sản phẩm'} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {storeSkus.map(sku => (
                                                            <SelectItem key={sku.skuId} value={String(sku.skuId)} disabled={sku.quantity <= 0}>
                                                                [{sku.skuCode}] {sku.productName} · tồn {sku.quantity}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {selectedSku && (
                                                    <p className="text-xs text-gray-500 mt-1.5">
                                                        Tồn kho khả dụng tại chi nhánh của bạn: <strong>{availableQty}</strong>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Step 2 — chi nhánh NHẬN hàng (đã loại chi nhánh hiện tại) */}
                                {selectedSku && (
                                    <Card className="border border-gray-200 shadow-sm">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                                                Chi nhánh nhận hàng
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs ml-2">
                                                    {destinationStores.length} chi nhánh
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription>Chọn nơi hàng sẽ được chuyển đến</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            {loadingStores ? (
                                                <div className="p-6 text-center text-gray-400">
                                                    <Loader2 className="w-6 h-6 mx-auto animate-spin opacity-50" />
                                                </div>
                                            ) : destinationStores.length === 0 ? (
                                                <div className="flex items-center gap-2 text-red-600 text-sm p-4">
                                                    <AlertCircle className="w-4 h-4" />
                                                    Không có chi nhánh nào khác để nhận hàng.
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                                                    {destinationStores.map(store => (
                                                        <button key={store.id} type="button"
                                                            onClick={() => setSelectedDestId(store.id)}
                                                            className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                                                                selectedDestId === store.id
                                                                    ? 'bg-blue-50 border-l-4 border-blue-600'
                                                                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                                                            }`}>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm text-[#2C2C2C]">{store.name}</p>
                                                                <span className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                                                    <MapPin className="w-3 h-3 shrink-0" />{store.address}
                                                                </span>
                                                                {store.openingTime && (
                                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                                        <Clock className="w-3 h-3 shrink-0" />{store.openingTime}–{store.closingTime}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {selectedDestId === store.id && (
                                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">Nơi nhận</Badge>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Step 3 */}
                                {selectedSku && (
                                    <Card className="border border-gray-200 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                                                Số lượng và xác nhận
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center gap-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                                                <div className="flex-1 text-center min-w-0">
                                                    <p className="text-xs text-gray-500 mb-1">Chi nhánh gửi (của bạn)</p>
                                                    <p className="font-semibold text-sm text-blue-700 truncate">{storeName || `Store #${storeId}`}</p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                                <div className="flex-1 text-center min-w-0">
                                                    <p className="text-xs text-gray-500 mb-1">Chi nhánh nhận</p>
                                                    <p className="font-semibold text-sm text-green-700 truncate">
                                                        {selectedDest ? selectedDest.name : <span className="text-gray-400 italic">Chưa chọn</span>}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="max-w-xs">
                                                <Label htmlFor="qty" className="mb-1 block">
                                                    Số lượng chuyển <span className="text-[#AF140B]">*</span>
                                                    <span className="text-gray-500 font-normal text-xs ml-2">(Tồn kho của bạn: {availableQty})</span>
                                                </Label>
                                                <Input id="qty" type="number" min={1} max={availableQty} placeholder="VD: 5"
                                                    value={quantity} onChange={e => {
                                                        let val = e.target.value;
                                                        if (parseInt(val, 10) > availableQty) val = String(availableQty);
                                                        setQuantity(val);
                                                    }} />
                                                {isExceeding && (
                                                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                        Vượt quá tồn kho của chi nhánh bạn
                                                    </p>
                                                )}
                                            </div>

                                            {submitError && (
                                                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{submitError}
                                                </div>
                                            )}

                                            <Button onClick={() => setConfirmOpen(true)} disabled={!canSubmit}
                                                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                                                <Truck className="w-4 h-4 mr-2" />Tạo phiếu chuyển hàng
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Sub Components ──────────────────────────────────────

type ActionDef = { label: string; action: string; variant: 'default' | 'destructive' | 'outline' };

function TabButton({ active, onClick, icon, label, count, badge }: {
    active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number; badge?: number;
}) {
    return (
        <button onClick={onClick}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                active ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {icon}
            {label}
            {count !== undefined && count > 0 && (
                <span className="text-[10px] text-gray-400">({count})</span>
            )}
            {badge !== undefined && badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {badge}
                </span>
            )}
        </button>
    );
}

function TransferCard({ t, actions, actionLoading, onAction, highlight }: {
    t: Transfer; actions: ActionDef[]; actionLoading: number | null;
    onAction: (id: number, action: string, label: string) => void; highlight?: boolean;
}) {
    const cfg = STATUS_CFG[t.status] || { label: t.status, color: 'bg-gray-100 text-gray-600' };
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-all gap-3 ${
            highlight ? 'border-yellow-300 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
        }`}>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-sm text-gray-800">#{t.id}</span>
                    <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">{t.fromStoreName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{t.toStoreName}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                    SKU: <span className="font-mono">{t.skuCode}</span> · Số lượng: <strong>{t.quantity}</strong> · Tạo bởi: {t.createdBy}
                </p>
            </div>
            {actions.length > 0 && (
                <div className="flex gap-2 flex-shrink-0">
                    {actions.map(a => (
                        <Button key={a.action} size="sm"
                            variant={a.variant === 'destructive' ? 'destructive' : 'outline'}
                            className={a.variant === 'default' ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' : ''}
                            disabled={actionLoading === t.id}
                            onClick={() => onAction(t.id, a.action, a.label)}>
                            {actionLoading === t.id && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                            {a.label}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải...
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="py-16 text-center text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{text}</p>
            </CardContent>
        </Card>
    );
}

// API trả mã enum (IN_STOCK/LOW_STOCK/OUT_OF_STOCK); trước đây chỉ dò tiếng Việt nên
// "OUT_OF_STOCK" rơi vào nhánh mặc định -> hết hàng mà hiện badge XANH LÁ.
function AvailBadge({ status }: { status: string }) {
    const s = (status || '').toLowerCase();
    const isOut = s.includes('out_of_stock') || s.includes('hết');
    const isLow =
        s.includes('low_stock') || s.includes('ít') || s.includes('thấp') || s.includes('sắp');

    const label = isOut ? 'Hết hàng' : isLow ? 'Còn ít' : 'Còn hàng';
    const tone = isOut
        ? 'bg-red-100 text-red-700 border-red-200'
        : isLow
            ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
            : 'bg-green-100 text-green-700 border-green-200';

    return <Badge className={`${tone} text-xs`}>{label}</Badge>;
}
