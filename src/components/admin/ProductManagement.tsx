import React, { useState, useEffect, useRef } from 'react';
import { imageApi } from '../../services/imageApi';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  ImageIcon,
  MoreVertical,
  Loader2,
  PackageX,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { productApi, Product as APIProduct } from '../../services/productApi';
import { brandApi, Brand } from '../../services/brandApi';
import { categoryApi, Category } from '../../services/categoryApi';
import { skuApi, SkuItem, CreateSkuPayload } from '../../services/skuApi';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';

const emptyForm = {
  name: '',
  price: '',
  categoryId: '',
  brandId: '',
  description: '',
  ageRange: '',
  gender: '',
  imageUrl: '',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (matches backend spring.servlet.multipart.max-file-size)
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ProductManagement() {
  const [productList, setProductList] = useState<APIProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');

  // ── Pagination state ──────────────────────────────────────────────────
  const PRODUCTS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<APIProduct | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  // Image file upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── SKU management state ────────────────────────────────────────────────
  const [skuProduct, setSkuProduct] = useState<APIProduct | null>(null);
  const [productSkus, setProductSkus] = useState<SkuItem[]>([]);
  const [skusLoading, setSkusLoading] = useState(false);
  const [skuSaving, setSkuSaving] = useState(false);
  const [skuDeleting, setSkuDeleting] = useState<number | null>(null);
  const emptySkuForm: CreateSkuPayload = { productId: 0, size: '', color: '', type: '', price: 0 };
  const [skuForm, setSkuForm] = useState<CreateSkuPayload>({ ...emptySkuForm });
  const [skuImageFile, setSkuImageFile] = useState<File | null>(null);
  const [skuImagePreview, setSkuImagePreview] = useState<string>('');
  const skuFileInputRef = useRef<HTMLInputElement>(null);
  const [editingSku, setEditingSku] = useState<SkuItem | null>(null);

  // ── Fetch all data on mount ──────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prods, cats, brnds] = await Promise.all([
        productApi.getAll(),
        categoryApi.getAll(),
        brandApi.getAll(),
      ]);
      // Sort by id descending so most recently added products appear first
      setProductList((prods || []).sort((a: APIProduct, b: APIProduct) => b.id - a.id));
      setCategories(cats || []);
      setBrands(brnds || []);
    } catch (error: any) {
      toast.error('Không thể tải dữ liệu: ' + (error?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Debounced server-side search ─────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!value.trim()) {
      fetchData();
      return;
    }

    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await productApi.search(value);
        setProductList(results.sort((a: APIProduct, b: APIProduct) => b.id - a.id));
      } catch {
        // fallback to client-side filter already showing
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  };

  // ── Client-side filter (category / brand) ────────────────────────────────
  const filteredProducts = productList.filter((p) => {
    const matchCat = filterCategory === 'all' || p.categoryName === filterCategory;
    const matchBrand = filterBrand === 'all' || p.brandName === filterBrand;
    return matchCat && matchBrand;
  });

  // ── Pagination logic ──────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Reset to page 1 when filters / search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterBrand, productList]);

  // ── CRUD handlers ────────────────────────────────────────────────────────

  // ── Image file helpers ────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Chỉ chấp nhận ảnh JPG, PNG, WebP, GIF');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ảnh không được vượt quá 10 MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData((f) => ({ ...f, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /** Upload the selected file to S3, return key (for DB) and url (for display) */
  const uploadImageIfNeeded = async (entityId: number): Promise<{ key: string; url: string }> => {
    if (!imageFile) return { key: formData.imageUrl, url: formData.imageUrl }; // keep existing
    setUploading(true);
    try {
      const result = await imageApi.upload(imageFile, 'PRODUCT', entityId);
      return { key: result.key, url: result.url };
    } finally {
      setUploading(false);
    }
  };

  // POST /api/v1/products
  const handleAddProduct = async () => {
    if (!formData.name || !formData.categoryId || !formData.brandId) {
      toast.error('Vui lòng điền đầy đủ Tên, Danh mục, Thương hiệu');
      return;
    }
    setSaving(true);
    try {
      // 1. Create product first (without image)
      const created = await productApi.create({
        name: formData.name,
        description: formData.description,
        ageRange: formData.ageRange,
        gender: formData.gender,
        imageUrl: '',
        categoryId: Number(formData.categoryId),
        brandId: Number(formData.brandId),
      });

      // 2. Upload image with the new product ID
      if (imageFile) {
        const img = await uploadImageIfNeeded(created.id);
        // 3. Update product with the S3 key as imageUrl
        await productApi.update(created.id, {
          name: formData.name,
          description: formData.description,
          ageRange: formData.ageRange,
          gender: formData.gender,
          imageUrl: img.key,
          categoryId: Number(formData.categoryId),
          brandId: Number(formData.brandId),
        });
      }

      toast.success('✅ Thêm sản phẩm thành công!');
      setIsAddDialogOpen(false);
      setFormData({ ...emptyForm });
      clearImage();
      fetchData();
    } catch (error: any) {
      toast.error('Thêm thất bại: ' + (error?.message || 'Lỗi không xác định'));
    } finally {
      setSaving(false);
    }
  };

  // PUT /api/v1/products/{id}
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    if (!formData.name || !formData.categoryId || !formData.brandId) {
      toast.error('Vui lòng điền đầy đủ Tên, Danh mục, Thương hiệu');
      return;
    }
    setSaving(true);
    try {
      // Upload new image if user selected one
      const img = await uploadImageIfNeeded(editingProduct.id);

      await productApi.update(editingProduct.id, {
        name: formData.name,
        description: formData.description,
        ageRange: formData.ageRange,
        gender: formData.gender,
        imageUrl: img.key,
        categoryId: Number(formData.categoryId),
        brandId: Number(formData.brandId),
      });
      toast.success('✅ Cập nhật sản phẩm thành công!');
      setEditingProduct(null);
      setFormData({ ...emptyForm });
      clearImage();
      fetchData();
    } catch (error: any) {
      toast.error('Cập nhật thất bại: ' + (error?.message || 'Lỗi không xác định'));
    } finally {
      setSaving(false);
    }
  };

  // DELETE /api/v1/products/{id}
  const handleDeleteProduct = async (product: APIProduct) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?`)) return;
    setDeleting(product.id);
    try {
      await productApi.delete(product.id);
      toast.success('🗑️ Đã xóa sản phẩm');
      fetchData();
    } catch (error: any) {
      toast.error('Xóa thất bại: ' + (error?.message || 'Lỗi không xác định'));
    } finally {
      setDeleting(null);
    }
  };

  const openEditDialog = (product: APIProduct) => {
    const cat = categories.find((c) => c.name === product.categoryName);
    const brnd = brands.find((b) => b.name === product.brandName);
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.minPrice?.toString() ?? '0',
      categoryId: cat ? cat.id.toString() : '',
      brandId: brnd ? brnd.id.toString() : '',
      description: product.description || '',
      ageRange: (product as any).ageRange || '',
      gender: (product as any).gender || '',
      imageUrl: product.imageUrl || '',
    });
    setImageFile(null);
    setImagePreview(product.imageUrl || '');
  };

  // ── SKU handlers ────────────────────────────────────────────────────────
  const openSkuDialog = async (product: APIProduct) => {
    setSkuProduct(product);
    setSkuForm({ ...emptySkuForm, productId: product.id });
    setSkusLoading(true);
    try {
      const skus = await skuApi.getByProduct(product.id);
      setProductSkus(skus);
    } catch (error: any) {
      toast.error('Không thể tải danh sách SKU: ' + (error?.message || ''));
      setProductSkus([]);
    } finally {
      setSkusLoading(false);
    }
  };

  const handleAddSku = async () => {
    if (!skuProduct) return;
    if (!skuForm.price) {
      toast.error('Vui lòng nhập giá');
      return;
    }
    setSkuSaving(true);
    try {
      const created = await skuApi.create({
        ...skuForm,
        productId: skuProduct.id,
      });

      // Upload SKU image if selected
      if (skuImageFile) {
        await imageApi.upload(skuImageFile, 'SKU', created.id);
        // Refresh to get the imageUrl from the Image entity
        const refreshed = await skuApi.getByProduct(skuProduct.id);
        setProductSkus(refreshed);
      } else {
        setProductSkus((prev) => [...prev, created]);
      }

      setSkuForm({ ...emptySkuForm, productId: skuProduct.id });
      setSkuImageFile(null);
      setSkuImagePreview('');
      if (skuFileInputRef.current) skuFileInputRef.current.value = '';
      toast.success('✅ Thêm SKU thành công!');
    } catch (error: any) {
      toast.error('Thêm SKU thất bại: ' + (error?.message || ''));
    } finally {
      setSkuSaving(false);
    }
  };

  const handleDeleteSku = async (skuId: number) => {
    if (!confirm('Bạn có chắc muốn xóa SKU này?')) return;
    setSkuDeleting(skuId);
    try {
      await skuApi.delete(skuId);
      setProductSkus((prev) => prev.filter((s) => s.id !== skuId));
      toast.success('🗑️ Đã xóa SKU');
    } catch (error: any) {
      toast.error('Xóa SKU thất bại: ' + (error?.message || ''));
    } finally {
      setSkuDeleting(null);
    }
  };

  const handleEditSku = (sku: SkuItem) => {
    setEditingSku(sku);
    setSkuForm({
      productId: sku.productId,
      size: sku.size || '',
      color: sku.color || '',
      type: sku.type || '',
      price: sku.price,
    });
    setSkuImageFile(null);
    setSkuImagePreview(sku.imageUrl || '');
    if (skuFileInputRef.current) skuFileInputRef.current.value = '';
  };

  const handleCancelEditSku = () => {
    setEditingSku(null);
    if (skuProduct) {
      setSkuForm({ ...emptySkuForm, productId: skuProduct.id });
    }
    setSkuImageFile(null);
    setSkuImagePreview('');
    if (skuFileInputRef.current) skuFileInputRef.current.value = '';
  };

  const handleUpdateSku = async () => {
    if (!editingSku || !skuProduct) return;
    if (!skuForm.price) {
      toast.error('Vui lòng nhập giá');
      return;
    }
    setSkuSaving(true);
    try {
      await skuApi.updateSku(editingSku.id, {
        skuCode: editingSku.skuCode,
        size: skuForm.size,
        color: skuForm.color,
        type: skuForm.type,
        price: skuForm.price,
      });

      // Upload new image if selected
      if (skuImageFile) {
        await imageApi.upload(skuImageFile, 'SKU', editingSku.id);
      }

      // Refresh SKU list
      const refreshed = await skuApi.getByProduct(skuProduct.id);
      setProductSkus(refreshed);

      setEditingSku(null);
      setSkuForm({ ...emptySkuForm, productId: skuProduct.id });
      setSkuImageFile(null);
      setSkuImagePreview('');
      if (skuFileInputRef.current) skuFileInputRef.current.value = '';
      toast.success('✅ Cập nhật SKU thành công!');
    } catch (error: any) {
      toast.error('Cập nhật SKU thất bại: ' + (error?.message || ''));
    } finally {
      setSkuSaving(false);
    }
  };

  const formatPrice = (price?: number) =>
    price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price) : '—';

  // ── Shared form fields ───────────────────────────────────────────────────
  const productFormJSX = (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div className="col-span-2">
          <Label htmlFor="f-name">Tên sản phẩm *</Label>
          <Input
            id="f-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VD: LEGO City Police Station"
          />
        </div>

        {/* Category */}
        <div>
          <Label>Danh mục *</Label>
          <Select value={formData.categoryId} onValueChange={(v: string) => setFormData({ ...formData, categoryId: v })}>
            <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brand */}
        <div>
          <Label>Thương hiệu *</Label>
          <Select value={formData.brandId} onValueChange={(v: string) => setFormData({ ...formData, brandId: v })}>
            <SelectTrigger><SelectValue placeholder="Chọn thương hiệu" /></SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Image Upload */}
        <div className="col-span-2">
          <Label htmlFor="f-img">Hình ảnh sản phẩm</Label>
          <div className="mt-1.5">
            <input
              ref={fileInputRef}
              id="f-img"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="preview" className="h-32 object-cover rounded border" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer"
              >
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Nhấn để chọn ảnh</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, GIF · Tối đa 10 MB</p>
              </button>
            )}
            {imagePreview && !imageFile && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs text-indigo-600 hover:underline"
              >
                Đổi ảnh khác
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="col-span-2">
          <Label htmlFor="f-desc">Mô tả</Label>
          <Textarea
            id="f-desc"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Mô tả chi tiết sản phẩm..."
            rows={4}
          />
        </div>

        {/* Age Range */}
        <div>
          <Label>Độ tuổi</Label>
          <Select value={formData.ageRange} onValueChange={(v: string) => setFormData({ ...formData, ageRange: v })}>
            <SelectTrigger><SelectValue placeholder="Chọn độ tuổi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0-12 tháng">0–12 tháng</SelectItem>
              <SelectItem value="1-3 tuổi">1–3 tuổi</SelectItem>
              <SelectItem value="3-6 tuổi">3–6 tuổi</SelectItem>
              <SelectItem value="6-12 tuổi">6–12 tuổi</SelectItem>
              <SelectItem value="12 tuổi trở lên">12 tuổi trở lên</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Gender */}
        <div>
          <Label>Giới tính</Label>
          <Select value={formData.gender} onValueChange={(v: string) => setFormData({ ...formData, gender: v })}>
            <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Boy">Boy</SelectItem>
              <SelectItem value="Girl">Girl</SelectItem>
              <SelectItem value="Unisex">Unisex</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="font-bold text-xl">Quản lý sản phẩm</h1>
              <p className="text-xs text-gray-500">{filteredProducts.length} sản phẩm</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              {/* Add Dialog */}
              <Dialog open={isAddDialogOpen} onOpenChange={(open: boolean) => { setIsAddDialogOpen(open); if (!open) { setFormData({ ...emptyForm }); clearImage(); } }}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm sản phẩm
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Thêm sản phẩm mới</DialogTitle>
                    <DialogDescription>POST /api/v1/products</DialogDescription>
                  </DialogHeader>
                  {productFormJSX}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button>
                    <Button onClick={handleAddProduct} className="bg-indigo-600 hover:bg-indigo-700" disabled={saving || uploading}>
                      {saving || uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      {uploading ? 'Đang tải ảnh...' : 'Thêm sản phẩm'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6 bg-white border border-gray-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search — GET /api/v1/products/search */}
              <div className="md:col-span-2">
                <Label htmlFor="search">Tìm kiếm (server-side)</Label>
                <div className="relative">
                  {searchLoading
                    ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
                    : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
                  <Input
                    id="search"
                    placeholder="Tìm theo tên sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter category */}
              <div>
                <Label>Danh mục</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter brand */}
              <div>
                <Label>Thương hiệu</Label>
                <Select value={filterBrand} onValueChange={setFilterBrand}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle>Danh sách sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Hình</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Thương hiệu</TableHead>
                  <TableHead className="text-center">Khuyến mãi</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2 text-indigo-500" />
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-gray-400">
                      <PackageX className="w-10 h-10 mx-auto mb-2" />
                      Không tìm thấy sản phẩm nào
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      {/* Image */}
                      <TableCell>
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden border">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <p className="font-medium line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-400">ID: {product.id}</p>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <Badge variant="outline">{product.categoryName || '—'}</Badge>
                      </TableCell>

                      {/* Brand */}
                      <TableCell className="text-sm">{product.brandName || '—'}</TableCell>



                      {/* Promotion */}
                      <TableCell className="text-center">
                        {product.promotion?.discountPercent ? (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            -{product.promotion.discountPercent}%
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(product)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openSkuDialog(product)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Quản lý SKU
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteProduct(product)}
                              className="text-red-600"
                              disabled={deleting === product.id}
                            >
                              {deleting === product.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                              )}
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {filteredProducts.length > PRODUCTS_PER_PAGE && (
              <div className="flex items-center justify-between border-t pt-4 mt-4 px-2">
                <p className="text-sm text-gray-500">
                  Hiển thị {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} / {filteredProducts.length} sản phẩm
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[80px] text-center">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog — PUT /api/v1/products/{id} */}
      <Dialog open={!!editingProduct} onOpenChange={(open: boolean) => { if (!open) { setEditingProduct(null); setFormData({ ...emptyForm }); clearImage(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
            <DialogDescription>PUT /api/v1/products/{editingProduct?.id}</DialogDescription>
          </DialogHeader>
          {productFormJSX}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingProduct(null); setFormData({ ...emptyForm }); clearImage(); }}>Hủy</Button>
            <Button onClick={handleUpdateProduct} className="bg-indigo-600 hover:bg-indigo-700" disabled={saving || uploading}>
              {saving || uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Edit className="w-4 h-4 mr-2" />}
              {uploading ? 'Đang tải ảnh...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SKU Management Dialog */}
      <Dialog open={!!skuProduct} onOpenChange={(open: boolean) => { if (!open) { setSkuProduct(null); setProductSkus([]); setSkuForm({ ...emptySkuForm }); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quản lý SKU — {skuProduct?.name}</DialogTitle>
            <DialogDescription>Thêm, xem và xóa các biến thể (SKU) cho sản phẩm này</DialogDescription>
          </DialogHeader>

          {/* Add SKU Form */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 border">
            <p className="text-sm font-semibold text-gray-700">Thêm SKU mới</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sku-price">Giá (VNĐ) *</Label>
                <Input
                  id="sku-price"
                  type="number"
                  value={skuForm.price || ''}
                  onChange={(e) => setSkuForm({ ...skuForm, price: Number(e.target.value) })}
                  placeholder="500000"
                />
              </div>
              <div>
                <Label htmlFor="sku-color">Màu sắc</Label>
                <Input
                  id="sku-color"
                  value={skuForm.color}
                  onChange={(e) => setSkuForm({ ...skuForm, color: e.target.value })}
                  placeholder="VD: Đỏ, Xanh, Trắng"
                />
              </div>
              <div>
                <Label htmlFor="sku-size">Kích cỡ</Label>
                <Input
                  id="sku-size"
                  value={skuForm.size}
                  onChange={(e) => setSkuForm({ ...skuForm, size: e.target.value })}
                  placeholder="VD: S, M, L, XL"
                />
              </div>
              <div>
                <Label htmlFor="sku-type">Loại</Label>
                <Input
                  id="sku-type"
                  value={skuForm.type}
                  onChange={(e) => setSkuForm({ ...skuForm, type: e.target.value })}
                  placeholder="VD: Sunflower, Rose"
                />
              </div>
              <div className="col-span-2">
                <Label>Ảnh SKU (tùy chọn)</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    ref={skuFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!ACCEPTED_TYPES.includes(file.type)) { toast.error('Chỉ chấp nhận ảnh JPG, PNG, WebP, GIF'); return; }
                      if (file.size > MAX_FILE_SIZE) { toast.error('Ảnh không được vượt quá 10 MB'); return; }
                      setSkuImageFile(file);
                      setSkuImagePreview(URL.createObjectURL(file));
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => skuFileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" />{skuImageFile ? 'Đổi ảnh' : 'Chọn ảnh'}
                  </Button>
                  {skuImagePreview && (
                    <div className="relative">
                      <img src={skuImagePreview} alt="SKU preview" className="w-12 h-12 object-cover rounded border" />
                      <button type="button" className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs" onClick={() => { setSkuImageFile(null); setSkuImagePreview(''); if (skuFileInputRef.current) skuFileInputRef.current.value = ''; }}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {!skuImagePreview && <span className="text-xs text-gray-400">Để trống nếu dùng ảnh sản phẩm</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {editingSku ? (
                <>
                  <Button onClick={handleUpdateSku} disabled={skuSaving} className="bg-green-600 hover:bg-green-700">
                    {skuSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Edit className="w-4 h-4 mr-2" />}
                    Cập nhật SKU
                  </Button>
                  <Button variant="outline" onClick={handleCancelEditSku} disabled={skuSaving}>
                    Hủy
                  </Button>
                </>
              ) : (
                <Button onClick={handleAddSku} disabled={skuSaving} className="bg-indigo-600 hover:bg-indigo-700">
                  {skuSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Thêm SKU
                </Button>
              )}
            </div>
          </div>

          {/* SKU List */}
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Danh sách SKU ({productSkus.length})</p>
            {skusLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : productSkus.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <PackageX className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Chưa có SKU nào. Thêm SKU đầu tiên ở trên.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã SKU</TableHead>
                    <TableHead>Màu sắc</TableHead>
                    <TableHead>Kích cỡ</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                    <TableHead>Ảnh</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productSkus.map((sku) => (
                    <TableRow key={sku.id}>
                      <TableCell className="font-mono text-sm">{sku.skuCode}</TableCell>
                      <TableCell>
                        {sku.color ? (
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: sku.color.toLowerCase() }} />
                            {sku.color}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{sku.size || '—'}</TableCell>
                      <TableCell>{sku.type || '—'}</TableCell>
                      <TableCell className="text-right font-medium text-indigo-700">{formatPrice(sku.price)}</TableCell>
                      <TableCell>
                        {sku.imageUrl ? (
                          <img src={sku.imageUrl} alt="SKU" className="w-8 h-8 rounded object-cover border" />
                        ) : (
                          <span className="text-gray-300"><ImageIcon className="w-4 h-4" /></span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditSku(sku)}
                            className="text-indigo-500 hover:text-indigo-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSku(sku.id)}
                            disabled={skuDeleting === sku.id}
                            className="text-red-500 hover:text-red-700"
                          >
                            {skuDeleting === sku.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSkuProduct(null); setProductSkus([]); }}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}