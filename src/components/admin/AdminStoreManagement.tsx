import { useEffect, useState, useCallback } from "react";
import {
    Store as StoreIcon, RefreshCw, Search, Save, X, Loader2,
    UserCog, AlertTriangle, CheckCircle2, MapPin,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { toast } from "sonner";
import { storeApi, StoreItem } from "../../services/storeApi";

/**
 * Gán tài khoản quản lý cho từng cửa hàng.
 *
 * Backend map manager → cửa hàng bằng ĐÚNG email (StoreService.getMyStore /
 * InventoryService.currentManagerStore đều gọi storeRepository.findByManagerEmail).
 * Nếu không cửa hàng nào có managerEmail khớp với người đang đăng nhập thì mọi thao
 * tác kho của họ (nhập hàng, điều chỉnh, huỷ hàng hỏng, chuyển kho) đều trả
 * 404 "Store not found" — trước đây không có màn hình nào sửa được field này.
 */
export default function AdminStoreManagement() {
    const [stores, setStores] = useState<StoreItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ managerName: "", managerEmail: "" });
    const [saving, setSaving] = useState(false);

    const fetchStores = useCallback(async () => {
        setLoading(true);
        try {
            setStores(await storeApi.getStores());
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Không thể tải danh sách cửa hàng.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStores(); }, [fetchStores]);

    const openEdit = (store: StoreItem) => {
        setEditingId(store.id);
        setForm({
            managerName: store.managerName ?? "",
            managerEmail: store.managerEmail ?? "",
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ managerName: "", managerEmail: "" });
    };

    const handleSave = async (store: StoreItem) => {
        const email = form.managerEmail.trim();
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            toast.error("Email quản lý không hợp lệ.");
            return;
        }
        // Cảnh báo sớm: backend tìm cửa hàng theo managerEmail nên hai cửa hàng
        // trùng email sẽ khiến findByManagerEmail không xác định được lấy cái nào.
        const duplicate = stores.find(
            (s) => s.id !== store.id && (s.managerEmail ?? "").toLowerCase() === email.toLowerCase() && email !== "",
        );
        if (duplicate) {
            toast.error(`Email này đã được gán cho "${duplicate.name}". Mỗi quản lý chỉ nên phụ trách 1 cửa hàng.`);
            return;
        }

        setSaving(true);
        try {
            const updated = await storeApi.updateStore(store.id, {
                name: store.name, // @NotBlank — bắt buộc gửi kèm dù không đổi
                managerName: form.managerName.trim(),
                managerEmail: email,
            });
            setStores((prev) => prev.map((s) => (s.id === store.id ? { ...s, ...updated } : s)));
            toast.success(`Đã gán quản lý cho "${store.name}".`);
            cancelEdit();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Lưu thất bại.");
        } finally {
            setSaving(false);
        }
    };

    const filtered = stores.filter((s) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
            (s.name ?? "").toLowerCase().includes(q) ||
            (s.code ?? "").toLowerCase().includes(q) ||
            (s.address ?? "").toLowerCase().includes(q) ||
            (s.managerEmail ?? "").toLowerCase().includes(q)
        );
    });

    const unassigned = stores.filter((s) => !s.managerEmail).length;

    return (
        <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <StoreIcon className="w-6 h-6 text-[#AF140B]" />Quản lý Cửa hàng
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Gán tài khoản quản lý cho từng chi nhánh
                    </p>
                </div>
                <Button variant="outline" onClick={fetchStores} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />Làm mới
                </Button>
            </div>

            {unassigned > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>
                        Có <strong>{unassigned}</strong> cửa hàng chưa gán quản lý. Tài khoản manager
                        không được gán sẽ không nhập kho hay chuyển kho được (lỗi "Store not found").
                    </p>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Tìm theo tên, mã, địa chỉ hoặc email quản lý..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Table */}
            <Card className="border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-12">#</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cửa hàng</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Quản lý</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email quản lý</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-16 text-gray-400">
                                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-40" /><p>Đang tải...</p>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-16 text-gray-400">
                                    <StoreIcon className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Không có cửa hàng nào</p>
                                </td></tr>
                            ) : filtered.map((store, idx) => {
                                const isEditing = editingId === store.id;
                                return (
                                    <tr key={store.id} className="hover:bg-gray-50/60 transition-colors align-top">
                                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-800">{store.name}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3 shrink-0" />
                                                {store.address || "—"}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <div className="min-w-[10rem]">
                                                    <Label className="text-xs text-gray-500 mb-1 block">Tên quản lý</Label>
                                                    <Input
                                                        value={form.managerName}
                                                        onChange={(e) => setForm((f) => ({ ...f, managerName: e.target.value }))}
                                                        placeholder="VD: Nguyễn Văn A"
                                                        className="h-8"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-gray-700">{store.managerName || "—"}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <div className="min-w-[14rem]">
                                                    <Label className="text-xs text-gray-500 mb-1 block">
                                                        Email tài khoản manager
                                                    </Label>
                                                    <Input
                                                        type="email"
                                                        value={form.managerEmail}
                                                        onChange={(e) => setForm((f) => ({ ...f, managerEmail: e.target.value }))}
                                                        onKeyDown={(e) => { if (e.key === "Enter") handleSave(store); }}
                                                        placeholder="manager@kinderland.vn"
                                                        className="h-8"
                                                    />
                                                </div>
                                            ) : store.managerEmail ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full">
                                                    <CheckCircle2 className="w-3 h-3" />{store.managerEmail}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full">
                                                    <AlertTriangle className="w-3 h-3" />Chưa gán
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {isEditing ? (
                                                    <>
                                                        <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                                                            <X className="w-4 h-4 mr-1" />Huỷ
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-[#AF140B] hover:bg-[#8B0000] text-white"
                                                            onClick={() => handleSave(store)}
                                                            disabled={saving}
                                                        >
                                                            {saving
                                                                ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                                : <Save className="w-4 h-4 mr-1" />}
                                                            Lưu
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={() => openEdit(store)}>
                                                        <UserCog className="w-4 h-4 mr-1" />Gán quản lý
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            <CardContent className="p-0 text-xs text-gray-500">
                Email phải trùng <strong>chính xác</strong> email đăng nhập của tài khoản manager.
                Sau khi gán, manager cần đăng xuất và đăng nhập lại để tải đúng cửa hàng.
            </CardContent>
        </div>
    );
}
