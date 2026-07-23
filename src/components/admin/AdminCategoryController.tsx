import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
    ArrowLeft,
    Plus,
    Search,
    Edit,
    Trash2,
    FolderTree,
    MoreVertical,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { categoryApi, Category, CategoryPayload } from '../../services/categoryApi';

export default function AdminCategoryController() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form state
    const [formData, setFormData] = useState<CategoryPayload>({
        name: '',
        parentId: null,
    });

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await categoryApi.getAll();
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            toast.error('Không thể tải danh sách danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const getHierarchicalCategories = () => {
        const parents = categories.filter(c => !c.parentId);
        const result: Category[] = [];

        parents.forEach(parent => {
            const parentMatches = parent.name.toLowerCase().includes(searchQuery.toLowerCase());
            const children = categories.filter(c => c.parentId === parent.id);
            const matchedChildren = children.filter(c =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

            // If parent matches or any child matches, include parent and those children
            if (parentMatches || matchedChildren.length > 0) {
                result.push(parent);
                // If sorting by search, maybe we only want matched children, 
                // but user usually wants to see the context. Let's show all children if parent matches, or just matched children.
                const childrenToShow = searchQuery ? matchedChildren : children;
                result.push(...childrenToShow);
            }
        });

        // Also include children whose parents might have been filtered out if any (shouldn't happen with logic above)
        // but handle orphaned categories just in case
        const handledIds = new Set(result.map(c => c.id));
        categories.forEach(c => {
            if (!handledIds.has(c.id) && c.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                result.push(c);
            }
        });

        return result;
    };

    const displayedCategories = searchQuery ? getHierarchicalCategories() : (() => {
        const parents = categories.filter(c => !c.parentId);
        const result: Category[] = [];
        parents.forEach(parent => {
            result.push(parent);
            result.push(...categories.filter(c => c.parentId === parent.id));
        });
        return result;
    })();

    const handleAddCategory = async () => {
        if (!formData.name) {
            toast.error('Vui lòng nhập tên danh mục');
            return;
        }

        try {
            await categoryApi.create(formData);
            toast.success('Thêm danh mục thành công!');
            setIsAddDialogOpen(false);
            resetForm();
            fetchCategories();
        } catch (error) {
            toast.error('Thêm danh mục thất bại');
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory) return;
        if (!formData.name) {
            toast.error('Vui lòng nhập tên danh mục');
            return;
        }

        try {
            await categoryApi.update(editingCategory.id, { name: formData.name });
            toast.success('Cập nhật danh mục thành công!');
            setEditingCategory(null);
            resetForm();
            fetchCategories();
        } catch (error) {
            toast.error('Cập nhật danh mục thất bại');
        }
    };

    const handleDeleteCategory = async (category: Category) => {
        if (window.confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"?`)) {
            try {
                await categoryApi.delete(category.id);
                toast.success('Đã xóa danh mục');
                fetchCategories();
            } catch (error) {
                toast.error('Xóa danh mục thất bại');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            parentId: null,
        });
    };

    const openEditDialog = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            parentId: category.parentId,
        });
    };

    return (
        <div className="min-h-full bg-white">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="font-bold text-xl">Quản lý danh mục</h1>
                                <p className="text-xs text-gray-500">{categories.length} danh mục</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={fetchCategories} disabled={loading}>
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Dialog open={isAddDialogOpen} onOpenChange={(open: boolean) => {
                                setIsAddDialogOpen(open);
                                if (!open) resetForm();
                            }}>
                                <DialogTrigger asChild>
                                    <Button className="bg-[#AF140B] hover:bg-[#8e1009] text-white">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Thêm danh mục
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Thêm danh mục mới</DialogTitle>
                                        <DialogDescription>
                                            Tạo danh mục sản phẩm mới trong hệ thống
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Tên danh mục *</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="VD: Đồ chơi lắp ráp"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="parentId">Danh mục cha</Label>
                                            <Select
                                                value={formData.parentId?.toString() || "none"}
                                                onValueChange={(value: string) => setFormData({ ...formData, parentId: value === "none" ? null : Number(value) })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn danh mục cha (không bắt buộc)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Không có (Danh mục gốc)</SelectItem>
                                                    {categories
                                                        .filter(c => !c.parentId) // Only allow top-level categories as parents for simplicity if needed, or all
                                                        .map((cat) => (
                                                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                            Hủy
                                        </Button>
                                        <Button onClick={handleAddCategory} className="bg-[#AF140B] hover:bg-[#8e1009] text-white">
                                            Lưu danh mục
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm danh mục..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Categories Table */}
                <Card className="bg-white border border-gray-200">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px] pl-6">ID</TableHead>
                                    <TableHead>Tên danh mục</TableHead>
                                    <TableHead className="w-[100px] pr-6 text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-32 text-center text-gray-500">
                                            Đang tải dữ liệu...
                                        </TableCell>
                                    </TableRow>
                                ) : displayedCategories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-32 text-center text-gray-500">
                                            Không tìm thấy danh mục nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    displayedCategories.map((category) => (
                                        <TableRow key={category.id} className={!category.parentId ? "bg-gray-50/50" : ""}>
                                            <TableCell className="pl-6 font-mono text-xs text-gray-400">
                                                #{category.id}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className={category.parentId ? "ml-8 text-gray-600 border-l-2 border-gray-100 pl-4 py-1" : "font-bold text-gray-900 flex items-center gap-2"}>
                                                        {!category.parentId && <FolderTree className="w-4 h-4 text-[#AF140B]" />}
                                                        {category.name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-6 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditDialog(category)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Chỉnh sửa
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteCategory(category)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
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
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog open={!!editingCategory} onOpenChange={(open: boolean) => !open && setEditingCategory(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Chỉnh sửa danh mục</DialogTitle>
                            <DialogDescription>
                                Cập nhật thông tin cho danh mục #{editingCategory?.id}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Tên danh mục *</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 opacity-50 cursor-not-allowed">
                                <Label htmlFor="edit-parent">Danh mục cha</Label>
                                <Input
                                    id="edit-parent"
                                    value={editingCategory?.parentName || "Không có (Danh mục gốc)"}
                                    disabled
                                />
                                <p className="text-[10px] text-amber-600">Lưu ý: Backend hiện chưa hỗ trợ thay đổi danh mục cha sau khi tạo.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingCategory(null)}>
                                Hủy
                            </Button>
                            <Button onClick={handleUpdateCategory} className="bg-[#AF140B] hover:bg-[#8e1009] text-white">
                                Lưu thay đổi
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
