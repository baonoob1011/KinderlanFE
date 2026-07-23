import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  Edit,
  Save,
  X,
  ArrowLeft,
  Shield,
  Loader2,
  Trash2,
  Plus,
  KeyRound,
  MapPin,
  Star,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { accountApi, UserResponse, AddressRequest } from '../../services/accountApi';
import api from '../../services/api';

interface Address {
  addressId: number;
  street: string;
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
  wardId: string;
  wardName: string;
  isDefault: boolean;
  fullAddress?: string;
}

const EMPTY_ADDRESS: AddressRequest = {
  street: '',
  provinceId: '',
  provinceName: '',
  districtId: '',
  districtName: '',
  wardId: '',
  wardName: '',
};

export default function CustomerProfile() {
  const { user, setUser } = useApp();

  // ─── Profile state ───────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserResponse | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // ─── Address state ───────────────────────────────────────
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<AddressRequest>({ ...EMPTY_ADDRESS });
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState<AddressRequest>({ ...EMPTY_ADDRESS });
  const [addressSaving, setAddressSaving] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);

  // ─── Change Password state ───────────────────────────────
  const [pwDialog, setPwDialog] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // ─── Fetch helpers ───────────────────────────────────────
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await accountApi.getProfile();
      if (response?.data) {
        setProfileData(response.data);
        setFormData({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
        });
      }
    } catch (error) {
      toast.error('Không thể tải thông tin tài khoản');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/api/v1/address/my-addresses');
      setAddresses(res.data || []);
    } catch (error) {
      console.error('Fetch address error:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAddresses();
  }, []);

  // ─── Profile handlers ────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await accountApi.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });
      toast.success('Cập nhật thông tin thành công!');
      setIsEditing(false);
      await fetchProfile();
      // Sync context so navbar name updates
      if (user) {
        setUser({
          ...user,
          firstName: formData.firstName,
          lastName: formData.lastName,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật thất bại');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
      });
    }
    setIsEditing(false);
  };

  // ─── Address handlers ─────────────────────────────────────
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAddressForm({ ...newAddressForm, [e.target.name]: e.target.value });
  };

  const startEditAddress = (addr: Address) => {
    setEditingAddressId(addr.addressId);
    setAddressForm({
      street: addr.street || '',
      provinceId: addr.provinceId || '',
      provinceName: addr.provinceName || '',
      districtId: addr.districtId || '',
      districtName: addr.districtName || '',
      wardId: addr.wardId || '',
      wardName: addr.wardName || '',
    });
  };

  const updateAddress = async () => {
    if (!editingAddressId) return;
    setAddressSaving(true);
    try {
      await api.put(`/api/v1/address/update/${editingAddressId}`, addressForm);
      toast.success('Cập nhật địa chỉ thành công');
      setEditingAddressId(null);
      await fetchAddresses();
    } catch (error) {
      console.error(error);
      toast.error('Cập nhật địa chỉ thất bại');
    } finally {
      setAddressSaving(false);
    }
  };

  const addAddress = async () => {
    if (!newAddressForm.street.trim()) {
      toast.error('Vui lòng nhập tên đường / số nhà');
      return;
    }
    setAddressSaving(true);
    try {
      await accountApi.addAddress(newAddressForm);
      toast.success('Thêm địa chỉ thành công');
      setAddingAddress(false);
      setNewAddressForm({ ...EMPTY_ADDRESS });
      await fetchAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Thêm địa chỉ thất bại');
    } finally {
      setAddressSaving(false);
    }
  };

  const deleteAddress = async (addressId: number) => {
    setDeletingAddressId(addressId);
    try {
      await accountApi.deleteAddress(addressId);
      toast.success('Đã xóa địa chỉ');
      setAddresses(prev => prev.filter(a => a.addressId !== addressId));
    } catch (error: any) {
      toast.error(error.message || 'Xóa địa chỉ thất bại');
    } finally {
      setDeletingAddressId(null);
    }
  };

  const setDefaultAddress = async (addressId: number) => {
    try {
      await accountApi.setDefaultAddress(addressId);
      toast.success('Đã đặt làm địa chỉ mặc định');
      await fetchAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Không thể đặt địa chỉ mặc định');
    }
  };

  // ─── Change Password handler ─────────────────────────────
  const handleChangePassword = async () => {
    setPwError(null);
    if (!pwForm.oldPassword.trim()) { setPwError('Vui lòng nhập mật khẩu hiện tại'); return; }
    if (pwForm.newPassword.length < 6) { setPwError('Mật khẩu mới phải ít nhất 6 ký tự'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Mật khẩu xác nhận không khớp'); return; }

    setPwSaving(true);
    try {
      await accountApi.changePassword({
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setPwDialog(false);
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setPwError(error.message || 'Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setPwSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#AF140B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* PROFILE HEADER */}
        <Card className="mb-10 overflow-hidden border-none shadow-2xl bg-white ring-1 ring-black/5">
          <div className="bg-gradient-to-r from-[#AF140B] via-[#D32F2F] to-[#C62828] h-32 relative">
            <div className="absolute inset-0 bg-black/10" />
          </div>
          <CardContent className="flex items-center gap-6 -mt-12 pb-8 px-8">
            <div className="w-24 h-24 rounded-full bg-white shadow-2xl border-4 border-white flex items-center justify-center text-3xl font-bold text-[#AF140B]">
              {(user?.username || user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {profileData?.firstName
                  ? `${profileData.firstName} ${profileData.lastName}`
                  : user?.username || user?.name}
              </h2>
              <p className="text-gray-600 text-sm">{user?.email}</p>
            </div>
            <Badge className="bg-yellow-400 text-white font-semibold shadow-sm">
              👑 Gold Member
            </Badge>
          </CardContent>
        </Card>

        {/* BACK */}
        <div className="mb-8">
          <Link to="/account">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại tài khoản
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Thông tin tài khoản</h1>
              <p className="text-gray-700 text-sm">Quản lý thông tin cá nhân của bạn</p>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} className="bg-red-500 hover:bg-red-600 text-white">
                <Edit className="w-4 h-4 mr-2" />Chỉnh sửa
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── LEFT CONTENT ── */}
          <div className="md:col-span-2 space-y-6">

            {/* PERSONAL INFO */}
            <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-[#AF140B]" />Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Họ *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input id="firstName" name="firstName" value={formData.firstName}
                        onChange={handleInputChange} disabled={!isEditing} className="pl-10" placeholder="Nhập họ" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lastName">Tên *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input id="lastName" name="lastName" value={formData.lastName}
                        onChange={handleInputChange} disabled={!isEditing} className="pl-10" placeholder="Nhập tên" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input value={formData.email} disabled className="pl-10 bg-gray-100 border-gray-200" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email đăng nhập không thể thay đổi</p>
                </div>

                <div>
                  <Label>Số điện thoại</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input name="phone" value={formData.phone} onChange={handleInputChange}
                      disabled={!isEditing} className="pl-10" placeholder="Nhập số điện thoại" />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSave} className="flex-1 bg-red-500 hover:bg-red-600 text-white" disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Lưu thay đổi
                    </Button>
                    <Button onClick={handleCancel} variant="outline" className="flex-1" disabled={saving}>
                      <X className="w-4 h-4 mr-2" />Hủy
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ADDRESSES */}
            <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#AF140B]" />Địa chỉ giao hàng
                  </CardTitle>
                  <Button size="sm" onClick={() => { setAddingAddress(true); setNewAddressForm({ ...EMPTY_ADDRESS }); }}
                    className="bg-[#AF140B] hover:bg-red-700 text-white gap-1">
                    <Plus className="w-4 h-4" />Thêm địa chỉ
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">

                {/* Add address form */}
                {addingAddress && (
                  <div className="border border-dashed border-[#AF140B] rounded-lg p-4 space-y-2 bg-red-50">
                    <p className="text-sm font-semibold text-[#AF140B]">Địa chỉ mới</p>
                    <Input name="street" placeholder="Số nhà, tên đường *" value={newAddressForm.street} onChange={handleNewAddressChange} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input name="provinceName" placeholder="Tỉnh / Thành phố" value={newAddressForm.provinceName} onChange={handleNewAddressChange} />
                      <Input name="districtName" placeholder="Quận / Huyện" value={newAddressForm.districtName} onChange={handleNewAddressChange} />
                    </div>
                    <Input name="wardName" placeholder="Phường / Xã" value={newAddressForm.wardName} onChange={handleNewAddressChange} />
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={addAddress} disabled={addressSaving}
                        className="bg-[#AF140B] hover:bg-red-700 text-white">
                        {addressSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                        Lưu địa chỉ
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAddingAddress(false)}>Hủy</Button>
                    </div>
                  </div>
                )}

                {/* Address list */}
                {addresses.length === 0 && !addingAddress && (
                  <div className="text-center py-8 text-gray-400">
                    <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Chưa có địa chỉ nào</p>
                  </div>
                )}

                {addresses.map((addr) => (
                  <div key={addr.addressId}
                    className={`p-3 border rounded-lg text-sm space-y-2 ${addr.isDefault ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-gray-800">{addr.fullAddress || [addr.street, addr.wardName, addr.districtName, addr.provinceName].filter(Boolean).join(', ')}</p>
                        {addr.isDefault && (
                          <Badge className="mt-1 bg-red-100 text-red-700 text-xs border border-red-200">
                            <Star className="w-3 h-3 mr-1 fill-red-400" />Mặc định
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!addr.isDefault && (
                          <Button size="sm" variant="ghost" className="text-xs h-7 text-gray-500 hover:text-[#AF140B]"
                            onClick={() => setDefaultAddress(addr.addressId)}>
                            <Star className="w-3 h-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-xs h-7 text-gray-500 hover:text-blue-600"
                          onClick={() => startEditAddress(addr)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-7 text-gray-500 hover:text-red-600"
                          onClick={() => deleteAddress(addr.addressId)}
                          disabled={deletingAddressId === addr.addressId}>
                          {deletingAddressId === addr.addressId
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Trash2 className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Edit inline */}
                    {editingAddressId === addr.addressId && (
                      <div className="mt-2 space-y-2 bg-white p-3 rounded border border-gray-200">
                        <Input name="street" placeholder="Số nhà, tên đường" value={addressForm.street} onChange={handleAddressChange} />
                        <div className="grid grid-cols-2 gap-2">
                          <Input name="provinceName" placeholder="Tỉnh / Thành phố" value={addressForm.provinceName} onChange={handleAddressChange} />
                          <Input name="districtName" placeholder="Quận / Huyện" value={addressForm.districtName} onChange={handleAddressChange} />
                        </div>
                        <Input name="wardName" placeholder="Phường / Xã" value={addressForm.wardName} onChange={handleAddressChange} />
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" onClick={updateAddress} disabled={addressSaving}
                            className="bg-red-500 text-white hover:bg-red-600">
                            {addressSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                            Cập nhật
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingAddressId(null)}>Hủy</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SECURITY */}
            <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 text-lg font-semibold">
                  <Shield className="w-5 h-5 text-red-500" />Bảo mật tài khoản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition">
                  <div>
                    <p className="font-semibold text-gray-900">Mật khẩu</p>
                    <p className="text-sm text-gray-600">••••••••</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setPwDialog(true); setPwError(null); setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }}>
                    <KeyRound className="w-4 h-4 mr-2" />Đổi mật khẩu
                  </Button>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-100 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">Xác thực 2 bước</p>
                    <p className="text-sm text-gray-600">Tăng cường bảo mật tài khoản</p>
                  </div>
                  <Badge className="bg-gray-200 text-gray-700">Chưa kích hoạt</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="text-gray-900 font-semibold">Trạng thái tài khoản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Vai trò</span>
                  <Badge className={profileData?.role === 'ADMIN' ? 'bg-red-500' : 'bg-green-500'}>
                    {profileData?.role || 'CUSTOMER'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Trạng thái</span>
                  {profileData?.isActive
                    ? <Badge className="bg-green-500">Đang hoạt động</Badge>
                    : <Badge variant="destructive">Đã khóa</Badge>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tham gia</span>
                  <span className="text-sm font-medium">
                    {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── CHANGE PASSWORD DIALOG ── */}
      <Dialog open={pwDialog} onOpenChange={(open) => { if (!open) { setPwDialog(false); setPwError(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#AF140B]" />Đổi mật khẩu
            </DialogTitle>
            <DialogDescription>Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Mật khẩu hiện tại *</Label>
              <Input
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                value={pwForm.oldPassword}
                onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))}
              />
            </div>
            <div>
              <Label>Mật khẩu mới *</Label>
              <Input
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              />
            </div>
            <div>
              <Label>Xác nhận mật khẩu mới *</Label>
              <Input
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
              />
            </div>
            {pwError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {pwError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwDialog(false)} disabled={pwSaving}>Hủy</Button>
            <Button onClick={handleChangePassword} disabled={pwSaving}
              className="bg-[#AF140B] hover:bg-red-700 text-white">
              {pwSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
              Xác nhận đổi mật khẩu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}