import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
    ClipboardList, ArrowLeft, LogOut, RefreshCw,
    AlertCircle, CheckCircle, Loader2, Package,
    Save,
} from 'lucide-react';
import { inventoryApi, InventoryItem } from '../../services/inventoryApi';
import { useStoreId } from '../../hooks/useStoreId';

interface CountRow {
    item: InventoryItem;
    actualQty: string;       // what manager typed
    saving: boolean;
    saved: boolean;
    error: string | null;
}

export default function PhysicalCountPage() {
    const navigate = useNavigate();
    const { adminUser, logoutAdmin } = useAdmin();

    const [rows, setRows] = useState<CountRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const { storeId, setStoreId } = useStoreId();
    const [storeIdInput, setStoreIdInput] = useState(storeId ?? '');

    const handleLogout = () => { logoutAdmin(); navigate('/login'); };

    const fetchInventory = async (sid?: string) => {
        const effectiveId = sid ?? storeId ?? '';
        setLoading(true);
        setFetchError(null);
        try {
            const data = await inventoryApi.getAllInventory(effectiveId || undefined);
            setRows(data.map((item) => ({
                item,
                actualQty: String(item.quantity), // pre-fill with current qty
                saving: false,
                saved: false,
                error: null,
            })));
            setLastUpdated(new Date());
        } catch (err: unknown) {
            setFetchError(err instanceof Error ? err.message : 'Không thể tải danh sách tồn kho.');
        } finally {
            setLoading(false);
        }
    };

    const applyStoreId = () => {
        const trimmed = storeIdInput.trim();
        if (!trimmed) return;
        setStoreId(trimmed);
        fetchInventory(trimmed);
    };

    useEffect(() => { if (storeId) fetchInventory(); }, [storeId]);

    const updateActual = (id: number, val: string) => {
        setRows((prev) => prev.map((r) =>
            r.item.id === id ? { ...r, actualQty: val, saved: false, error: null } : r
        ));
    };

    const saveRow = async (row: CountRow) => {
        const actual = parseInt(row.actualQty, 10);
        if (isNaN(actual) || actual < 0) {
            setRows((prev) => prev.map((r) =>
                r.item.id === row.item.id ? { ...r, error: 'Số lượng không hợp lệ.' } : r
            ));
            return;
        }
        const delta = actual - row.item.quantity;
        if (delta === 0) {
            setRows((prev) => prev.map((r) =>
                r.item.id === row.item.id ? { ...r, saved: true } : r
            ));
            return;
        }
        setRows((prev) => prev.map((r) =>
            r.item.id === row.item.id ? { ...r, saving: true, error: null } : r
        ));
        try {
            await inventoryApi.adjustInventory(row.item.storeId, row.item.skuId, delta);
            setRows((prev) => prev.map((r) =>
                r.item.id === row.item.id
                    ? { ...r, saving: false, saved: true, item: { ...r.item, quantity: actual } }
                    : r
            ));
        } catch (err: unknown) {
            setRows((prev) => prev.map((r) =>
                r.item.id === row.item.id
                    ? { ...r, saving: false, error: err instanceof Error ? err.message : 'Lưu thất bại.' }
                    : r
            ));
        }
    };

    const saveAll = async () => {
        const unsaved = rows.filter((r) => {
            const actual = parseInt(r.actualQty, 10);
            return !isNaN(actual) && actual >= 0 && actual !== r.item.quantity && !r.saving && !r.saved;
        });
        for (const r of unsaved) await saveRow(r);
    };

    const changedCount = rows.filter((r) => {
        const a = parseInt(r.actualQty, 10);
        return !isNaN(a) && a !== r.item.quantity;
    }).length;

    const savedCount = rows.filter((r) => r.saved).length;

    return (
        <div className="min-h-full bg-white">

            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                                <ClipboardList className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#2C2C2C]">Kiểm Kê Thực Tế</h1>
                                <p className="text-sm text-gray-600">{adminUser?.name} · {adminUser?.storeName || 'Kho trung tâm'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {changedCount > 0 && (
                                <Button onClick={saveAll}
                                    className="bg-blue-700 hover:bg-blue-800">
                                    <Save className="w-4 h-4 mr-2" />
                                    Lưu tất cả ({changedCount})
                                </Button>
                            )}
                            <Button variant="outline" onClick={fetchInventory} disabled={loading} className="border-gray-300">
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Tải lại
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/manager/dashboard')} className="border-gray-300">
                                <ArrowLeft className="w-4 h-4 mr-2" />Quay lại
                            </Button>
                            <Button variant="outline" onClick={handleLogout}
                                className="border-[#AF140B] text-[#AF140B] hover:bg-[#AF140B] hover:text-white">
                                <LogOut className="w-4 h-4 mr-2" />Đăng xuất
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* StoreId Banner */}
                {!storeId && (
                    <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-xl p-4">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <p className="text-sm text-yellow-800 font-medium flex-1">
                            Nhập Store ID của cửa hàng bạn quản lý:
                        </p>
                        <Input type="number" min={1} placeholder="VD: 1"
                            value={storeIdInput}
                            onChange={(e) => setStoreIdInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyStoreId()}
                            className="w-28 h-8 text-sm" />
                        <Button size="sm" onClick={applyStoreId} disabled={!storeIdInput}
                            className="h-8 bg-yellow-600 hover:bg-yellow-700 text-white">
                            Xác nhận
                        </Button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Tổng bản ghi', value: rows.length, color: 'text-blue-700', border: 'border-blue-200' },
                        { label: 'Đã thay đổi', value: changedCount, color: 'text-orange-600', border: 'border-orange-200' },
                        { label: 'Đã lưu', value: savedCount, color: 'text-green-700', border: 'border-green-200' },
                        { label: 'Có lỗi', value: rows.filter(r => r.error).length, color: 'text-red-600', border: 'border-red-200' },
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
                {fetchError && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Không thể tải dữ liệu</p>
                            <p className="text-sm">{fetchError}</p>
                        </div>
                    </div>
                )}

                {/* Table */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg text-[#2C2C2C]">
                            Danh sách kiểm kê
                            {rows.length > 0 && <Badge className="ml-2 bg-blue-700 text-white">{rows.length}</Badge>}
                        </CardTitle>
                        <CardDescription>
                            {lastUpdated ? `Tải lúc ${lastUpdated.toLocaleTimeString('vi-VN')}` : 'Đang tải...'}
                            {' · '}Nhập số lượng thực tế → nhấn <strong>Lưu</strong> để điều chỉnh
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto rounded-b-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        {['ID', 'Cửa hàng', 'SKU ID', 'SKU Code', 'Qty hệ thống', 'Qty thực tế', 'Chênh lệch', ''].map((h) => (
                                            <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading && Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array.from({ length: 8 }).map((_, j) => (
                                                <td key={j} className="px-4 py-3">
                                                    <div className="h-4 bg-gray-200 rounded w-4/5" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                    {!loading && rows.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="py-14 text-center text-gray-400">
                                                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                                Chưa có dữ liệu tồn kho.
                                            </td>
                                        </tr>
                                    )}

                                    {!loading && rows.map((row) => {
                                        const actual = parseInt(row.actualQty, 10);
                                        const diff = isNaN(actual) ? null : actual - row.item.quantity;
                                        const isChanged = diff !== null && diff !== 0;

                                        return (
                                            <tr key={row.item.id}
                                                className={`transition-colors ${row.saved ? 'bg-green-50' : isChanged ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                                                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{row.item.id}</td>
                                                <td className="px-4 py-3 font-medium text-[#2C2C2C]">{row.item.storeName}</td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{row.item.skuId}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="font-mono text-xs">{row.item.skuCode}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-center font-semibold">{row.item.quantity}</td>
                                                <td className="px-4 py-2">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={row.actualQty}
                                                        onChange={(e) => updateActual(row.item.id, e.target.value)}
                                                        className="w-20 h-8 text-sm text-center"
                                                        disabled={row.saving || row.saved}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center font-bold">
                                                    {diff === null ? (
                                                        <span className="text-gray-400">—</span>
                                                    ) : diff === 0 ? (
                                                        <span className="text-gray-400">0</span>
                                                    ) : diff > 0 ? (
                                                        <span className="text-green-600">+{diff}</span>
                                                    ) : (
                                                        <span className="text-red-600">{diff}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {row.saved ? (
                                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                    ) : row.error ? (
                                                        <div className="flex items-center gap-1 text-red-600 text-xs">
                                                            <AlertCircle className="w-4 h-4" />
                                                            {row.error}
                                                        </div>
                                                    ) : (
                                                        <Button size="sm" variant="outline"
                                                            onClick={() => saveRow(row)}
                                                            disabled={row.saving || !isChanged}
                                                            className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50">
                                                            {row.saving
                                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                : <><Save className="w-3 h-3 mr-1" />Lưu</>}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
