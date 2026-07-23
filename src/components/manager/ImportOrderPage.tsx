import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
    Package, ArrowLeft, LogOut, Search, Loader2,
    AlertCircle, Warehouse, MapPin, Phone, Clock,
    CheckCircle, ShoppingBag, Plus, Minus,
} from 'lucide-react';
import { inventoryApi, StoreAvailability } from '../../services/inventoryApi';

// --- Availability Badge ---
function AvailBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    if (s.includes('hết')) return <Badge className="bg-red-100 text-red-700 border-red-200">Hết hàng</Badge>;
    if (s.includes('ít') || s.includes('thấp')) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{status}</Badge>;
    return <Badge className="bg-green-100 text-green-700 border-green-200">{status}</Badge>;
}

// --- Order line: one store + quantity picker ---
interface OrderLine {
    store: StoreAvailability;
    quantity: number;
    selected: boolean;
}

export default function ImportOrderPage() {
    const navigate = useNavigate();
    const { adminUser, logoutAdmin } = useAdmin();

    // Step 1 – Search SKU
    const [skuIdInput, setSkuIdInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [skuId, setSkuId] = useState<number | null>(null);

    // Step 2 – Store availability list + order lines
    const [orderLines, setOrderLines] = useState<OrderLine[]>([]);

    // Step 3 – Submit result
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleLogout = () => {
        logoutAdmin();
        navigate('/login');
    };

    // Fetch store availability
    const handleSearch = async () => {
        const id = parseInt(skuIdInput.trim(), 10);
        if (isNaN(id) || id <= 0) {
            setFetchError('Vui lòng nhập SKU ID hợp lệ.');
            return;
        }
        setLoading(true);
        setFetchError(null);
        setOrderLines([]);
        setSubmitSuccess(false);
        setSubmitError(null);
        try {
            const res = await inventoryApi.getStoreAvailability(id);
            setSkuId(id);
            setOrderLines(
                res.data.map((store) => ({
                    store,
                    quantity: 10,
                    selected: store.availabilityStatus.toLowerCase().includes('hết'),
                }))
            );
        } catch (err: unknown) {
            setFetchError(err instanceof Error ? err.message : 'Không thể tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (storeId: number) =>
        setOrderLines((prev) =>
            prev.map((l) => (l.store.storeId === storeId ? { ...l, selected: !l.selected } : l))
        );

    const changeQty = (storeId: number, delta: number) =>
        setOrderLines((prev) =>
            prev.map((l) =>
                l.store.storeId === storeId
                    ? { ...l, quantity: Math.max(1, l.quantity + delta) }
                    : l
            )
        );

    const setQty = (storeId: number, val: string) => {
        const n = parseInt(val, 10);
        setOrderLines((prev) =>
            prev.map((l) =>
                l.store.storeId === storeId ? { ...l, quantity: isNaN(n) || n < 1 ? 1 : n } : l
            )
        );
    };

    const selectedLines = orderLines.filter((l) => l.selected);
    const totalQty = selectedLines.reduce((s, l) => s + l.quantity, 0);

    // Submit import order (mock — wire to POST API when available)
    const handleSubmit = async () => {
        if (selectedLines.length === 0) {
            setSubmitError('Vui lòng chọn ít nhất một cửa hàng để nhập hàng.');
            return;
        }
        setSubmitting(true);
        setSubmitError(null);
        try {
            // TODO: replace with real POST /api/v1/import-orders when BE provides endpoint
            await new Promise((r) => setTimeout(r, 900)); // simulate network
            setSubmitSuccess(true);
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : 'Tạo đơn thất bại.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setSubmitSuccess(false);
        setOrderLines([]);
        setSkuId(null);
        setSkuIdInput('');
    };

    return (
        <div className="min-h-full bg-white">

            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Warehouse className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#2C2C2C]">Tạo Đơn Nhập Hàng</h1>
                                <p className="text-sm text-gray-600">
                                    {adminUser?.name} · {adminUser?.storeName || 'Kho trung tâm'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => navigate('/manager/dashboard')} className="border-gray-300">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Quay lại
                            </Button>
                            <Button variant="outline" onClick={handleLogout}
                                className="border-[#AF140B] text-[#AF140B] hover:bg-[#AF140B] hover:text-white">
                                <LogOut className="w-4 h-4 mr-2" />
                                Đăng xuất
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Success State */}
                {submitSuccess && (
                    <Card className="border-green-300 bg-green-50 shadow-md">
                        <CardContent className="p-6 flex items-start gap-4">
                            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-green-800 mb-1">Đơn nhập hàng đã được tạo!</h3>
                                <p className="text-green-700 text-sm mb-1">
                                    SKU <strong>#{skuId}</strong> · {selectedLines.length} cửa hàng · Tổng <strong>{totalQty}</strong> đơn vị
                                </p>
                                <ul className="text-sm text-green-700 space-y-0.5 mb-4">
                                    {selectedLines.map((l) => (
                                        <li key={l.store.storeId}>• {l.store.storeName} — {l.quantity} đơn vị</li>
                                    ))}
                                </ul>
                                <Button onClick={handleReset} className="bg-green-600 hover:bg-green-700">
                                    Tạo đơn mới
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!submitSuccess && (
                    <>
                        {/* Step 1: SKU Search */}
                        <Card className="border border-gray-200 shadow-sm bg-white">
                            <CardHeader>
                                <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                                    Kiểm tra tồn kho theo SKU
                                </CardTitle>
                                <CardDescription>Nhập SKU ID để xem tình trạng hàng tại các cửa hàng</CardDescription>
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
                                            onChange={(e) => { setSkuIdInput(e.target.value); setFetchError(null); }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="VD: 1"
                                        />
                                    </div>
                                    <Button onClick={handleSearch} disabled={loading || !skuIdInput} className="bg-blue-600 hover:bg-blue-700">
                                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                                        Kiểm tra
                                    </Button>
                                </div>
                                {fetchError && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm mt-3">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {fetchError}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Step 2: Store List */}
                        {orderLines.length > 0 && (
                            <Card className="border border-gray-200 shadow-sm bg-white">
                                <CardHeader>
                                    <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                                        Chọn cửa hàng & số lượng nhập
                                        <Badge className="ml-1 bg-blue-600 text-white">{orderLines.length} cửa hàng</Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        SKU #{skuId} — Chọn cửa hàng cần nhập hàng và điền số lượng. Cửa hàng hết hàng được chọn sẵn.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-gray-100">
                                        {orderLines.map((line) => (
                                            <div
                                                key={line.store.storeId}
                                                className={`p-4 flex items-center gap-4 transition-colors ${line.selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                            >
                                                {/* Checkbox */}
                                                <input
                                                    type="checkbox"
                                                    checked={line.selected}
                                                    onChange={() => toggleSelect(line.store.storeId)}
                                                    className="w-4 h-4 accent-blue-600 flex-shrink-0"
                                                />

                                                {/* Store Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <p className="font-semibold text-[#2C2C2C]">{line.store.storeName}</p>
                                                        <AvailBadge status={line.store.availabilityStatus} />
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />{line.store.address}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />{line.store.phone}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />{line.store.openingTime} – {line.store.closingTime}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quantity Picker */}
                                                <div className={`flex items-center gap-2 flex-shrink-0 ${!line.selected ? 'opacity-40 pointer-events-none' : ''}`}>
                                                    <button
                                                        onClick={() => changeQty(line.store.storeId, -1)}
                                                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={line.quantity}
                                                        onChange={(e) => setQty(line.store.storeId, e.target.value)}
                                                        className="w-16 text-center h-8 text-sm"
                                                    />
                                                    <button
                                                        onClick={() => changeQty(line.store.storeId, 1)}
                                                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-xs text-gray-400 w-10">đơn vị</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 3: Summary & Submit */}
                        {orderLines.length > 0 && (
                            <Card className="border border-gray-200 shadow-sm bg-white">
                                <CardHeader>
                                    <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                                        Xác nhận đơn nhập hàng
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedLines.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">Chưa chọn cửa hàng nào.</p>
                                    ) : (
                                        <div className="space-y-2 mb-4">
                                            {selectedLines.map((l) => (
                                                <div key={l.store.storeId} className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-gray-700">
                                                        <Package className="w-4 h-4 text-blue-500" />
                                                        {l.store.storeName}
                                                    </span>
                                                    <span className="font-semibold text-blue-700">{l.quantity} đơn vị</span>
                                                </div>
                                            ))}
                                            <div className="border-t pt-2 flex justify-between font-bold text-[#2C2C2C]">
                                                <span>Tổng cộng</span>
                                                <span className="text-blue-700">{totalQty} đơn vị / {selectedLines.length} cửa hàng</span>
                                            </div>
                                        </div>
                                    )}

                                    {submitError && (
                                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            {submitError}
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={submitting || selectedLines.length === 0}
                                        className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                                    >
                                        {submitting
                                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang tạo đơn...</>
                                            : <><ShoppingBag className="w-4 h-4 mr-2" />Tạo đơn nhập hàng</>}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
