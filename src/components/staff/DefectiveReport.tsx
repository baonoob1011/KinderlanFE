import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  ArrowLeft,
  AlertCircle,
  Plus,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { products } from '../../data/products';

interface DefectiveItem {
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
}

interface DefectiveReport {
  id: string;
  date: string;
  items: DefectiveItem[];
  totalItems: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  note: string;
}

// Mock reports
const mockReports: DefectiveReport[] = [
  {
    id: 'DEF-001',
    date: '2025-01-13 15:00',
    items: [
      { productId: '5', productName: 'Xe đạp trẻ em Frozen', quantity: 2, reason: 'Hỏng bánh xe' },
    ],
    totalItems: 2,
    status: 'approved',
    note: 'Đã phê duyệt thanh lý',
  },
];

export default function DefectiveReport() {
  const navigate = useNavigate();
  const { adminUser } = useAdmin();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [reports, setReports] = useState<DefectiveReport[]>(mockReports);
  const [currentDraft, setCurrentDraft] = useState<DefectiveItem[]>([]);
  const [draftNote, setDraftNote] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    reason: '',
  });

  const handleAddItem = () => {
    if (!formData.productId || !formData.quantity || !formData.reason) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const product = products.find((p) => p.id === formData.productId);
    if (!product) return;

    const newItem: DefectiveItem = {
      productId: formData.productId,
      productName: product.name,
      quantity: parseInt(formData.quantity),
      reason: formData.reason,
    };

    setCurrentDraft([...currentDraft, newItem]);
    setFormData({ productId: '', quantity: '', reason: '' });
    toast.success('Đã thêm sản phẩm vào báo cáo');
  };

  const handleRemoveItem = (index: number) => {
    setCurrentDraft(currentDraft.filter((_, i) => i !== index));
  };

  const handleSubmitReport = () => {
    if (currentDraft.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 sản phẩm vào báo cáo');
      return;
    }

    const newReport: DefectiveReport = {
      id: `DEF-${String(reports.length + 1).padStart(3, '0')}`,
      date: new Date().toLocaleString('vi-VN'),
      items: currentDraft,
      totalItems: currentDraft.reduce((sum, item) => sum + item.quantity, 0),
      status: 'submitted',
      note: draftNote,
    };

    setReports([newReport, ...reports]);
    setCurrentDraft([]);
    setDraftNote('');
    setIsAddDialogOpen(false);
    toast.success('Đã gửi báo cáo hàng lỗi. Chờ quản lý phê duyệt.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Bản nháp';
      case 'submitted':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const defectReasons = [
    'Hư hỏng do vận chuyển',
    'Lỗi sản xuất',
    'Hết hạn sử dụng',
    'Hỏng trong quá trình trưng bày',
    'Bao bì rách, hỏng',
    'Thiếu phụ kiện',
    'Khác',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/staff/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-bold text-xl">Báo cáo hàng lỗi</h1>
                <p className="text-xs text-gray-500">Lập danh sách sản phẩm cần thanh lý</p>
              </div>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo báo cáo mới
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Chờ duyệt</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {reports.filter((r) => r.status === 'submitted').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Đã duyệt</p>
                  <p className="text-2xl font-bold text-green-600">
                    {reports.filter((r) => r.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng sản phẩm lỗi</p>
                  <p className="text-2xl font-bold text-red-600">
                    {reports.reduce((sum, r) => sum + r.totalItems, 0)}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Danh sách báo cáo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã BC</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Số sản phẩm</TableHead>
                  <TableHead>Tổng SL lỗi</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <p className="font-medium font-mono">{report.id}</p>
                    </TableCell>
                    <TableCell className="text-sm">{report.date}</TableCell>
                    <TableCell>{report.items.length}</TableCell>
                    <TableCell className="font-medium">{report.totalItems}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{report.note || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={getStatusColor(report.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(report.status)}
                          {getStatusText(report.status)}
                        </span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {reports.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Chưa có báo cáo nào</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Report Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo báo cáo hàng lỗi</DialogTitle>
              <DialogDescription>
                Lập danh sách sản phẩm hư hỏng, hết hạn cần thanh lý
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Add Item Form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Thêm sản phẩm lỗi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-5">
                      <Label htmlFor="product">Sản phẩm</Label>
                      <Select
                        value={formData.productId}
                        onValueChange={(value) => setFormData({ ...formData, productId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn sản phẩm" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.slice(0, 30).map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="quantity">Số lượng</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      />
                    </div>
                    <div className="col-span-4">
                      <Label htmlFor="reason">Lý do</Label>
                      <Select
                        value={formData.reason}
                        onValueChange={(value) => setFormData({ ...formData, reason: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn lý do" />
                        </SelectTrigger>
                        <SelectContent>
                          {defectReasons.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button onClick={handleAddItem} className="w-full">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Draft Items */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Danh sách sản phẩm ({currentDraft.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentDraft.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Chưa có sản phẩm nào. Thêm sản phẩm lỗi ở trên.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead className="text-center">Số lượng</TableHead>
                          <TableHead>Lý do</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentDraft.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-sm">{item.reason}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {currentDraft.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <p className="font-medium">Tổng cộng:</p>
                      <p className="text-lg font-bold text-red-600">
                        {currentDraft.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Note */}
              <div>
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea
                  id="note"
                  placeholder="Ghi chú thêm về báo cáo này..."
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm font-medium text-orange-900 mb-2">⚠️ Lưu ý:</p>
                <ul className="text-xs text-orange-800 space-y-1">
                  <li>• Báo cáo sẽ được gửi đến quản lý để phê duyệt</li>
                  <li>• Sau khi được duyệt, số lượng sẽ được trừ khỏi tồn kho</li>
                  <li>• Hàng lỗi sẽ được thu hồi và xử lý theo quy định</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmitReport} className="bg-red-600 hover:bg-red-700">
                <FileText className="w-4 h-4 mr-2" />
                Gửi báo cáo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}