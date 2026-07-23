import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import {
  ArrowLeft, LogOut, RefreshCw, Search,
  Users, UserPlus, Trash2, AlertCircle,
  CheckCircle2, XCircle, Loader2, Shield,
  UserCog, Crown, User,
} from 'lucide-react';
import { adminAccountApi, AdminAccount, CreateAccountPayload } from '../../services/adminAccountApi';

// ---- Helpers ----

function roleBadge(role: string) {
  const r = role?.toLowerCase() ?? '';
  if (r.includes('admin')) return { label: 'Admin', cls: 'bg-red-50 text-red-700', Icon: Shield };
  if (r.includes('manager')) return { label: 'Quản lý', cls: 'bg-purple-50 text-purple-700', Icon: Crown };
  if (r.includes('staff')) return { label: 'Nhân viên', cls: 'bg-gray-100 text-gray-700', Icon: UserCog };
  return { label: 'Khách hàng', cls: 'bg-blue-50 text-blue-700', Icon: User };
}

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Quản lý' },
  { value: 'STAFF', label: 'Nhân viên' },
];

const EMPTY_FORM: CreateAccountPayload = {
  username: '', email: '', phone: '',
  firstName: '', lastName: '', password: '', role: 'STAFF',
};

// ---- Component ----

export default function UserManagement() {
  const navigate = useNavigate();
  const { adminUser, logoutAdmin } = useAdmin();

  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateAccountPayload>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleLogout = () => { logoutAdmin(); navigate('/login'); };

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAccountApi.getAccounts();
      setAccounts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.username ?? '').toLowerCase().includes(q) ||
      (a.phone ?? '').includes(q);
    const matchRole = roleFilter === 'all' || a.role?.toLowerCase().includes(roleFilter.toLowerCase());
    return matchSearch && matchRole;
  });

  // Stats
  const active = accounts.filter(a => a.active).length;
  const managers = accounts.filter(a => a.role?.toLowerCase().includes('manager')).length;
  const staff = accounts.filter(a => a.role?.toLowerCase().includes('staff')).length;

  // Create
  const handleCreate = async () => {
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      setCreateError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await adminAccountApi.createAccount(form);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await fetchAccounts();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Tạo tài khoản thất bại.');
    } finally {
      setCreating(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await adminAccountApi.deleteAccount(deleteTarget.id);
      setDeleteTarget(null);
      await fetchAccounts();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Xóa tài khoản thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-full bg-white">

      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#AF140B] rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#2C2C2C]">Quản Lý Tài Khoản</h1>
                <p className="text-sm text-gray-600">{adminUser?.email} · Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={() => setShowCreate(true)}
                className="bg-[#AF140B] hover:bg-[#8D0F08]">
                <UserPlus className="w-4 h-4 mr-2" />Tạo tài khoản
              </Button>
              <Button variant="outline" onClick={fetchAccounts} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Tải lại
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tổng tài khoản', value: accounts.length, color: 'text-[#AF140B]', border: 'border-red-200' },
            { label: 'Đang hoạt động', value: active, color: 'text-green-700', border: 'border-green-200' },
            { label: 'Quản lý', value: managers, color: 'text-purple-700', border: 'border-purple-200' },
            { label: 'Nhân viên', value: staff, color: 'text-gray-700', border: 'border-gray-200' },
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
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Tìm theo tên, email, username, SĐT…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'admin', label: 'Admin' },
              { key: 'manager', label: 'Quản lý' },
              { key: 'staff', label: 'Nhân viên' },
            ].map(f => (
              <Button key={f.key} size="sm"
                variant={roleFilter === f.key ? 'default' : 'outline'}
                onClick={() => setRoleFilter(f.key)}
                className={roleFilter === f.key ? 'bg-[#AF140B] hover:bg-[#8D0F08]' : ''}>
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base text-[#2C2C2C]">
              Danh sách tài khoản
              {filtered.length > 0 && (
                <Badge className="ml-2 bg-[#AF140B] text-white">{filtered.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['ID', 'Họ tên', 'Email', 'SĐT', 'Vai trò', 'Trạng thái', 'Ngày tạo', ''].map(h => (
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
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-14 text-center text-gray-400">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        Không tìm thấy tài khoản.
                      </td>
                    </tr>
                  )}
                  {!loading && filtered.map((acc) => {
                    const rb = roleBadge(acc.role);
                    const RoleIcon = rb.Icon;
                    return (
                      <tr key={acc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{acc.id}</td>
                        <td className="px-4 py-3 font-medium text-[#2C2C2C] whitespace-nowrap">
                          {acc.firstName} {acc.lastName}
                          {acc.username && <span className="text-xs text-gray-400 ml-1">@{acc.username}</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{acc.email}</td>
                        <td className="px-4 py-3 text-gray-500">{acc.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge className={`${rb.cls} border-0 text-xs gap-1`}>
                            <RoleIcon className="w-3 h-3" />
                            {rb.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {acc.active ? (
                            <Badge className="bg-green-50 text-green-700 border-0 text-xs gap-1">
                              <CheckCircle2 className="w-3 h-3" />Hoạt động
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-500 border-0 text-xs gap-1">
                              <XCircle className="w-3 h-3" />Vô hiệu
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="ghost"
                            onClick={() => { setDeleteTarget(acc); setDeleteError(null); }}
                            className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* ---- Create Account Dialog ---- */}
      <Dialog open={showCreate} onOpenChange={(o: boolean) => { setShowCreate(o); if (!o) { setForm(EMPTY_FORM); setCreateError(null); } }}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#2C2C2C] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#AF140B]" />
              Tạo tài khoản mới
            </DialogTitle>
            <DialogDescription>Chỉ Admin mới có quyền tạo tài khoản Staff/Manager.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Họ <span className="text-[#AF140B]">*</span></Label>
                <Input placeholder="Nguyễn" value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Tên <span className="text-[#AF140B]">*</span></Label>
                <Input placeholder="Văn A" value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Username</Label>
              <Input placeholder="nguyenvana" value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Email <span className="text-[#AF140B]">*</span></Label>
              <Input type="email" placeholder="email@kinderland.vn" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Số điện thoại</Label>
              <Input placeholder="09xxxxxxxx" value={form.phone ?? ''}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Mật khẩu <span className="text-[#AF140B]">*</span></Label>
              <Input type="password" placeholder="Tối thiểu 8 ký tự" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Vai trò</Label>
              <select value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full h-9 rounded-md border border-gray-300 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#AF140B]">
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {createError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {createError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>Hủy</Button>
            <Button onClick={handleCreate} disabled={creating}
              className="bg-[#AF140B] hover:bg-[#8D0F08]">
              {creating
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang tạo...</>
                : <><UserPlus className="w-4 h-4 mr-2" />Tạo tài khoản</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirm Dialog ---- */}
      <Dialog open={!!deleteTarget} onOpenChange={(o: boolean) => { if (!o) { setDeleteTarget(null); setDeleteError(null); } }}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />Xác nhận xóa tài khoản
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa tài khoản <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong> ({deleteTarget?.email})?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {deleteError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Hủy</Button>
            <Button onClick={handleDelete} disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white">
              {deleting
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang xóa...</>
                : <><Trash2 className="w-4 h-4 mr-2" />Xác nhận xóa</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
