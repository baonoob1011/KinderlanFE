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
    CheckCircle, RefreshCw, Search, Package,
    MapPin, Clock, Inbox, Send, Eye,
} from 'lucide-react';
import { inventoryApi, StoreAvailability, InventoryItem } from '../../services/inventoryApi';
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
    const [searchedSkuId, setSearchedSkuId] = useState<number | null>(null);
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
        if (isNaN(id) || id <= 0) { setSearchError('Vui lòng chọn sản phẩm hợp lệ.'); return; }
        setSearching(true); setSearchError(null); setStoreAvailability([]); setSelectedSourceId(null);
        setQuantity(''); setSubmitSuccess(false); setSubmitError(null);
        try {
            const res = await inventoryApi.getStoreAvailability(id);
            setSearchedSkuId(id);
            const available = (res.data || []).filter(
                (s) => !s.availabilityStatus.toLowerCase().includes('hết') && String(s.storeId) !== String(storeId)
            );
            setStoreAvailability(available);
            if (available.length === 0) setSearchError('Không có chi nhánh nào còn hàng cho SKU này.');
        } catch (err: unknown) {
            setSearchError(err instanceof Error ? err.message : 'Không thể tải dữ liệu.');
        } finally { setSearching(false); }
    };

    const selectedStore = storeAvailability.find(s => s.storeId === selectedSourceId);
    const qtyNum = parseInt(quantity, 10);
    const isExceeding = selectedStore?.quantity !== undefined && qtyNum > selectedStore.quantity;
    const canSubmit = selectedSourceId !== null && searchedSkuId !== null && !isNaN(qtyNum) && qtyNum > 0 && !isExceeding;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true); setSubmitError(null);
        try {
            const draft = await api.post('/api/v1/transfer/draft', {
                toStoreId: selectedSourceId,
                skuId: searchedSkuId,
                quantity: qtyNum,
            });
            const draftId = draft?.data?.id ?? draft?.id;
            if (draftId) await api.post(`/api/v1/transfer/${draftId}/submit`);
            setSubmitSuccess(true);
            toast.success('Yêu cầu chuyển kho đã được gửi!');
            fetchTransfers();
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : 'Tạo yêu cầu thất bại.');
        } finally { setSubmitting(false); }
    };

    const handleReset = () => {
        setSubmitSuccess(false); setSkuInput(''); setSearchedSkuId(null);
        setStoreAvailability([]); setSelectedSourceId(null); setQuantity('');
        setSubmitError(null); setSearchError(null);
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
                        icon={<Package className="w-4 h-4" />} label="Tạo yêu cầu mới" />
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

                {/* ══════════════ TAB 3: CREATE ══════════════ */}
                {activeTab === 'create' && (
                    <>
                        {submitSuccess && (
                            <Card className="border-green-300 bg-green-50 shadow-md">
                                <CardContent className="p-6 flex items-start gap-4">
                                    <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-green-800 mb-2">Yêu cầu chuyển kho đã được gửi!</h3>
                                        <div className="flex items-center gap-3 text-sm text-green-700 mb-1">
                                            <span className="font-medium">{selectedStore?.storeName}</span>
                                            <ArrowRight className="w-4 h-4" />
                                            <span className="font-medium">{storeName}</span>
                                        </div>
                                        <p className="text-sm text-green-700">
                                            SKU <strong>#{searchedSkuId}</strong> · Số lượng: <strong>{quantity}</strong>
                                        </p>
                                        <div className="flex gap-2 mt-4">
                                            <Button onClick={handleReset} className="bg-green-600 hover:bg-green-700">
                                                <RefreshCw className="w-4 h-4 mr-2" />Tạo yêu cầu mới
                                            </Button>
                                            <Button variant="outline" onClick={() => setActiveTab('outgoing')}>
                                                <Eye className="w-4 h-4 mr-2" />Xem yêu cầu đã gửi
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {!submitSuccess && (
                            <>
                                {/* Step 1 */}
                                <Card className="border border-gray-200 shadow-sm">
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
                                                <Select value={skuInput}
                                                    onValueChange={val => { setSkuInput(val); setSearchError(null); }}
                                                    disabled={loadingSkus || storeSkus.length === 0}>
                                                    <SelectTrigger id="sku" className="w-full">
                                                        <SelectValue placeholder={loadingSkus ? 'Đang tải...' : 'Chọn sản phẩm'} />
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

                                {/* Step 2 */}
                                {storeAvailability.length > 0 && (
                                    <Card className="border border-gray-200 shadow-sm">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                                                Chọn chi nhánh gửi hàng
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs ml-2">
                                                    {storeAvailability.length} chi nhánh có hàng
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                                                {storeAvailability.map(store => (
                                                    <button key={store.storeId} type="button"
                                                        onClick={() => setSelectedSourceId(store.storeId)}
                                                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                                                            selectedSourceId === store.storeId
                                                                ? 'bg-blue-50 border-l-4 border-blue-600'
                                                                : 'hover:bg-gray-50 border-l-4 border-transparent'
                                                        }`}>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm text-[#2C2C2C]">{store.storeName}</p>
                                                            <span className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                                                <MapPin className="w-3 h-3" />{store.address}
                                                            </span>
                                                            {store.openingTime && (
                                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                                    <Clock className="w-3 h-3" />{store.openingTime}–{store.closingTime}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <AvailBadge status={store.availabilityStatus} />
                                                    </button>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Step 3 */}
                                {storeAvailability.length > 0 && (
                                    <Card className="border border-gray-200 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                                                Xác nhận yêu cầu
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
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
                                                    <p className="font-semibold text-sm text-green-700">{storeName || `Store #${storeId}`}</p>
                                                </div>
                                            </div>

                                            <div className="max-w-xs">
                                                <Label htmlFor="qty" className="mb-1 block">
                                                    Số lượng cần <span className="text-[#AF140B]">*</span>
                                                    {selectedStore?.quantity !== undefined && (
                                                        <span className="text-gray-500 font-normal text-xs ml-2">(Tối đa: {selectedStore.quantity})</span>
                                                    )}
                                                </Label>
                                                <Input id="qty" type="number" min={1} max={selectedStore?.quantity} placeholder="VD: 5"
                                                    value={quantity} onChange={e => {
                                                        let val = e.target.value;
                                                        if (selectedStore?.quantity !== undefined && parseInt(val, 10) > selectedStore.quantity)
                                                            val = String(selectedStore.quantity);
                                                        setQuantity(val);
                                                    }} />
                                                {isExceeding && (
                                                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />Vượt quá số lượng
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

function AvailBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    if (s.includes('ít') || s.includes('thấp') || s.includes('sắp'))
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">{status}</Badge>;
    return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">{status}</Badge>;
}
