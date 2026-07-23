import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  ArrowLeft,
  Search,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Package,
  Edit3,
  Save,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { stores } from '../../data/stores';
import { products } from '../../data/products';

export default function InventoryCheck() {
  const navigate = useNavigate();
  const { adminUser } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actualQty, setActualQty] = useState<{ [key: string]: number }>({});

  // Get current store
  const currentStore = stores.find((s) => s.id === adminUser?.storeId);

  // Get inventory items for current store
  const getInventoryItems = () => {
    if (!currentStore) return [];
    
    return Object.entries(currentStore.inventory).map(([productId, systemQty]) => {
      const product = products.find((p) => p.id === productId);
      return {
        productId,
        productName: product?.name || 'Unknown',
        category: product?.category || '',
        systemQty,
        actualQty: actualQty[productId] ?? systemQty,
        difference: (actualQty[productId] ?? systemQty) - systemQty,
      };
    });
  };

  const inventoryItems = getInventoryItems();

  const filteredItems = inventoryItems.filter((item) =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (productId: string, currentQty: number) => {
    setEditingId(productId);
    if (!actualQty[productId]) {
      setActualQty({ ...actualQty, [productId]: currentQty });
    }
  };

  const handleSaveActual = (productId: string) => {
    const item = inventoryItems.find((i) => i.productId === productId);
    if (!item) return;

    const diff = item.difference;
    if (diff !== 0) {
      toast.success(
        `Đã ghi nhận: ${item.productName} - Chênh lệch ${diff > 0 ? '+' : ''}${diff}`,
        { duration: 3000 }
      );
    } else {
      toast.success('Số lượng khớp với hệ thống');
    }
    setEditingId(null);
  };

  const getDifferenceColor = (diff: number) => {
    if (diff === 0) return 'text-green-600';
    if (diff > 0) return 'text-blue-600';
    return 'text-red-600';
  };

  const getDifferenceBadge = (diff: number) => {
    if (diff === 0) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Khớp</Badge>;
    }
    if (diff > 0) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">+{diff}</Badge>;
    }
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">{diff}</Badge>;
  };

  const stats = {
    total: inventoryItems.length,
    checked: Object.keys(actualQty).length,
    discrepancies: inventoryItems.filter((i) => i.difference !== 0).length,
  };

  const handleCompleteCheck = () => {
    const unchecked = stats.total - stats.checked;
    if (unchecked > 0) {
      if (!confirm(`Còn ${unchecked} sản phẩm chưa kiểm. Bạn có chắc muốn hoàn tất?`)) {
        return;
      }
    }

    toast.success(
      `Hoàn tất kiểm kho! Đã kiểm ${stats.checked}/${stats.total} sản phẩm. ${stats.discrepancies} chênh lệch.`,
      { duration: 4000 }
    );
  };

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
                <h1 className="font-bold text-xl">Kiểm kho</h1>
                <p className="text-xs text-gray-500">{currentStore?.name}</p>
              </div>
            </div>
            <Button
              onClick={handleCompleteCheck}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Hoàn tất kiểm kho
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng sản phẩm</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Boxes className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Đã kiểm tra</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.checked}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.total > 0 ? Math.round((stats.checked / stats.total) * 100) : 0}% hoàn thành
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Chênh lệch</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.discrepancies}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Label htmlFor="search">Tìm kiếm sản phẩm</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Tên sản phẩm, danh mục..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Danh sách tồn kho
            </CardTitle>
            <CardDescription>
              Nhập số lượng thực tế khi kiểm kho định kỳ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead className="text-center">Hệ thống</TableHead>
                  <TableHead className="text-center">Thực tế</TableHead>
                  <TableHead className="text-center">Chênh lệch</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-gray-500">ID: {item.productId}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {item.systemQty}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingId === item.productId ? (
                        <Input
                          type="number"
                          value={actualQty[item.productId] ?? item.systemQty}
                          onChange={(e) =>
                            setActualQty({
                              ...actualQty,
                              [item.productId]: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 mx-auto text-center"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium">{item.actualQty}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${getDifferenceColor(item.difference)}`}>
                        {item.difference !== 0 ? (item.difference > 0 ? '+' : '') + item.difference : '-'}
                      </span>
                      {item.difference !== 0 && (
                        <div className="mt-1">{getDifferenceBadge(item.difference)}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.productId ? (
                        <Button
                          size="sm"
                          onClick={() => handleSaveActual(item.productId)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Lưu
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartEdit(item.productId, item.systemQty)}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Kiểm
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Không tìm thấy sản phẩm</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Hướng dẫn kiểm kho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <div className="flex gap-2">
              <span className="font-bold text-blue-600">1.</span>
              <p>Đếm số lượng thực tế của từng sản phẩm trong kho</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-blue-600">2.</span>
              <p>Nhấn "Kiểm" và nhập số lượng thực tế vào cột "Thực tế"</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-blue-600">3.</span>
              <p>Hệ thống tự động tính chênh lệch giữa số liệu hệ thống và thực tế</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-blue-600">4.</span>
              <p>Sau khi kiểm xong tất cả, nhấn "Hoàn tất kiểm kho" để lưu báo cáo</p>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
              <p className="font-medium text-yellow-900">Lưu ý:</p>
              <p className="mt-1">Nếu có chênh lệch lớn, hãy kiểm tra lại kỹ hoặc báo cáo với quản lý.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}