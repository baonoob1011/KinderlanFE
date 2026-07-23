import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAdmin } from "../../context/AdminContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { Textarea } from "../ui/textarea";
import { Calendar } from "../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  ArrowLeft,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Calendar as CalendarIcon,

  Tag,
  Percent,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "../ui/utils";
import { products } from "../../data/products";
import {
  promotionApi,
  Promotion as ApiPromotion,
  CreatePromotionPayload,
} from "../../services/promotionApi";

type PromotionStatus =
  | "active"
  | "inactive"
  | "scheduled"
  | "expired";

interface Promotion {
  id: string;
  name: string;
  code?: string;
  discountPercent: number;
  startDate: Date;
  endDate: Date;
  status: PromotionStatus;
  description?: string;
  createdBy: string;
  createdAt: Date;
  modifiedAt?: Date;
}

// Map BE → local UI type
function fromApi(p: ApiPromotion): Promotion {
  const now = new Date();
  const start = new Date(p.startDate);
  const end = new Date(p.endDate);
  let status: PromotionStatus = "inactive";
  if (end < now) status = "expired";
  else if (start > now) status = "scheduled";
  else status = "active";
  return {
    id: String(p.promotionId),
    name: p.title,
    code: p.code,
    discountPercent: p.discountPercent,
    startDate: start,
    endDate: end,
    status,
    description: p.description,
    createdBy: "",
    createdAt: now,
  };
}

export default function PromotionManagement() {
  const navigate = useNavigate();
  const { adminUser } = useAdmin();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [, setLoading] = useState(false);
  const [, setApiError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | PromotionStatus>("all");
  const [showAuditLog, setShowAuditLog] = useState(false);

  // View Detail State
  const [viewingPromotion, setViewingPromotion] = useState<Promotion | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchPromotions = async (keyword?: string) => {
    setLoading(true); setApiError(null);
    try {
      const paged = await promotionApi.getPromotions({ keyword, size: 50 });
      setPromotions((paged.content ?? []).map(fromApi));
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Không thể tải danh sách.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPromotions(); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchPromotions(searchTerm || undefined), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Assign products state
  const [assignTarget, setAssignTarget] = useState<Promotion | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [assignSearch, setAssignSearch] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const openAssignDialog = (promo: Promotion) => {
    setAssignTarget(promo);
    setSelectedProductIds(new Set());
    setAssignSearch("");
    setAssignError(null);
  };

  const handleAssignProducts = async () => {
    if (!assignTarget || selectedProductIds.size === 0) return;
    setAssigning(true); setAssignError(null);
    try {
      await promotionApi.assignProducts(Number(assignTarget.id), Array.from(selectedProductIds));
      toast.success(`Đã gán ${selectedProductIds.size} sản phẩm vào “${assignTarget.name}”`);
      setAssignTarget(null);
      await fetchPromotions();
    } catch (err: unknown) {
      setAssignError(err instanceof Error ? err.message : "Gán thất bại.");
    } finally { setAssigning(false); }
  };

  const toggleProduct = (id: number) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };


  // Form state
  const [formData, setFormData] = useState<Partial<Promotion>>({
    name: "",
    code: "",
    discountPercent: 0,
    startDate: new Date(),
    endDate: new Date(),
    status: "inactive",
    description: "",
  });

  const handleBack = () => {
    if (adminUser?.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/manager/dashboard");
    }
  };

  const handleCreateNew = () => {
    setEditingPromotion(null);
    setFormData({
      name: "",
      code: "",
      discountPercent: 0,
      startDate: new Date(),
      endDate: new Date(),
      status: "inactive",
      description: "",
    });
    setShowCreateForm(true);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData(promotion);
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa khuyến mãi này?")) return;
    try {
      await promotionApi.deletePromotion(Number(id));
      toast.success("Đã xóa thành công");
      await fetchPromotions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại.");
    }
  };

  const handleViewDetail = async (promotion: Promotion) => {
    setViewingPromotion(promotion);
    setLoadingDetail(true);
    setDetailError(null);
    try {
      // The getPromotionById API is expected to return the Promotion with an array of assigned PromotionProduct
      const detailedPromotion = await promotionApi.getPromotionById(promotion.promotionId || Number(promotion.id));
      setViewingPromotion({
        ...promotion, // spread the basic promo info first to ensure we don't lose the local id/name if they differ (they shouldn't normally but safe fallback)
        ...detailedPromotion,
        id: String(detailedPromotion.promotionId || promotion.id)
      });
    } catch (error) {
      console.error("Error fetching promotion details:", error);
      setDetailError("Không thể tải chi tiết chương trình khuyến mãi. Vui lòng thử lại sau.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDuplicate = (promotion: Promotion) => {
    // Keeping function structure in case it's needed later, but removing button.
    console.log("Duplicate unused:", promotion.name);
  };

  const validateForm = (): boolean => {
    // BR-51: Check discount limit
    if (
      formData.discountPercent! > 50 &&
      adminUser?.role !== "admin"
    ) {
      toast.error(
        "Giảm giá không được vượt quá 50%. Chỉ Super Admin mới có thể vượt qua giới hạn này.",
      );
      return false;
    }

    // Check end date
    if (formData.endDate! < new Date()) {
      toast.error("Ngày kết thúc không được ở quá khứ");
      return false;
    }

    // Check required fields
    if (!formData.name) {
      toast.error("Vui lòng nhập tên khuyến mãi");
      return false;
    }

    if (!formData.code) {
      toast.error("Vui lòng nhập mã giảm giá");
      return false;
    }

    if (
      !formData.discountPercent ||
      formData.discountPercent <= 0
    ) {
      toast.error("Vui lòng nhập giá trị giảm giá hợp lệ");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    const payload: CreatePromotionPayload = {
      title: formData.name ?? "",
      description: formData.description ?? "",
      code: formData.code ?? "",
      discountPercent: formData.discountPercent ?? 0,
      startDate: (formData.startDate ?? new Date()).toISOString(),
      endDate: (formData.endDate ?? new Date()).toISOString(),
    };
    try {
      if (editingPromotion) {
        await promotionApi.updatePromotion(Number(editingPromotion.id), payload);
        toast.success("Cập nhật thành công");
      } else {
        await promotionApi.createPromotion(payload);
        toast.success("Tạo khuyến mãi thành công");
      }
      setShowCreateForm(false); setEditingPromotion(null);
      await fetchPromotions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lưu thất bại.");
    }
  };

  const filteredPromotions = promotions.filter((promo) => {
    const matchesSearch =
      promo.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      promo.code
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || promo.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: PromotionStatus) => {
    const variants = {
      active: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: CheckCircle2,
      },
      inactive: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        icon: XCircle,
      },
      scheduled: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: Clock,
      },
      expired: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: XCircle,
      },
    };
    const variant = variants[status];
    const Icon = variant.icon;
    return (
      <Badge
        className={`${variant.bg} ${variant.text} border-0`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status === "active"
          ? "Đang chạy"
          : status === "inactive"
            ? "Tạm dừng"
            : status === "scheduled"
              ? "Đã lên lịch"
              : "Đã hết hạn"}
      </Badge>
    );
  };

  const getTypeIcon = () => Tag;
  const getTypeLabel = () => "Mã giảm giá";

  if (showCreateForm) {
    return (
      <div className="min-h-full bg-white">
        {/* Header */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateForm(false)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-[#2C2C2C]">
                    {editingPromotion
                      ? "Chỉnh sửa khuyến mãi"
                      : "Tạo khuyến mãi mới"}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Manage Promotions
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSave}
                className="bg-[#AF140B] hover:bg-[#8D0F08]"
              >
                <Save className="w-4 h-4 mr-2" />
                Lưu khuyến mãi
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Step 1: Basic Information */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#AF140B] text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  Thông tin cơ bản
                </CardTitle>
                <CardDescription>
                  Tên và loại chương trình khuyến mãi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tên khuyến mãi *</Label>
                    <Input
                      placeholder="VD: Giảm giá 20% cho LEGO"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mã giảm giá *</Label>
                    <Input
                      placeholder="VD: LEGO20"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500">
                      Khách hàng phải nhập mã này khi thanh toán
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    placeholder="Mô tả chi tiết về chương trình khuyến mãi"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Discount Configuration */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#AF140B] text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  Cấu hình giảm giá
                </CardTitle>
                <CardDescription>
                  Thiết lập giá trị và điều kiện giảm giá
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Loại giảm giá *</Label>
                    <Select value="percentage" disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4" />
                            Phần trăm (%)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Giá trị giảm (%) *</Label>
                    <Input
                      type="number"
                      placeholder="20"
                      value={formData.discountPercent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountPercent: Number(
                            e.target.value,
                          ),
                        })
                      }
                    />
                    {formData.discountPercent! > 50 && (
                      <div className="flex items-start gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">
                            BR-51: Giới hạn giảm giá
                          </p>
                          <p>
                            Giảm giá vượt 50%. Chỉ Super
                            Admin mới được phép.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#AF140B] text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  Lịch chạy chương trình
                </CardTitle>
                <CardDescription>
                  Thiết lập thời gian bắt đầu và kết thúc
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ngày bắt đầu *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.startDate &&
                            "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? (
                            format(
                              formData.startDate,
                              "dd/MM/yyyy HH:mm",
                            )
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date: Date | undefined) =>
                            setFormData({
                              ...formData,
                              startDate: date || new Date(),
                            })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Ngày kết thúc *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.endDate &&
                            "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? (
                            format(
                              formData.endDate,
                              "dd/MM/yyyy HH:mm",
                            )
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date: Date | undefined) =>
                            setFormData({
                              ...formData,
                              endDate: date || new Date(),
                            })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#2C2C2C]">
                  Quản lý Khuyến mãi
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateNew}
                className="bg-[#AF140B] hover:bg-[#8D0F08]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tạo khuyến mãi mới
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Đang chạy
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {
                      promotions.filter(
                        (p) => p.status === "active",
                      ).length
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Đã lên lịch
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {
                      promotions.filter(
                        (p) => p.status === "scheduled",
                      ).length
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Tạm dừng
                  </p>
                  <p className="text-3xl font-bold text-gray-600">
                    {
                      promotions.filter(
                        (p) => p.status === "inactive",
                      ).length
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Đã hết hạn
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {
                      promotions.filter(
                        (p) => p.status === "expired",
                      ).length
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm theo tên hoặc mã khuyến mãi..."
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={filterStatus}
                onValueChange={(value: any) =>
                  setFilterStatus(value)
                }
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Tất cả trạng thái
                  </SelectItem>
                  <SelectItem value="active">
                    Đang chạy
                  </SelectItem>
                  <SelectItem value="scheduled">
                    Đã lên lịch
                  </SelectItem>
                  <SelectItem value="inactive">
                    Tạm dừng
                  </SelectItem>
                  <SelectItem value="expired">
                    Đã hết hạn
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Promotions List */}
        <div className="space-y-4">
          {filteredPromotions.map((promo) => {
            const TypeIcon = getTypeIcon();

            return (
              <Card
                key={promo.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-[#AF140B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="w-6 h-6 text-[#AF140B]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-[#2C2C2C]">
                            {promo.name}
                          </h3>
                          {getStatusBadge(promo.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {promo.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Tag className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {getTypeLabel()}
                            </span>
                          </div>
                          {promo.code && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">
                                Mã:
                              </span>
                              <code className="px-2 py-0.5 bg-gray-100 rounded font-mono text-[#AF140B] font-medium">
                                {promo.code}
                              </code>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Percent className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-[#AF140B]">
                              {`${promo.discountPercent}%`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {format(
                                promo.startDate,
                                "dd/MM/yyyy",
                              )}{" "}
                              -{" "}
                              {format(
                                promo.endDate,
                                "dd/MM/yyyy",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="icon"
                        title="Gán sản phẩm"
                        onClick={() => openAssignDialog(promo)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Package className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(promo)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xem chi tiết"
                        onClick={() => handleViewDetail(promo)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Sao chép"
                        onClick={() => handleDuplicate(promo)}
                        className="hidden" // Hiding the copy button as per user request
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(promo.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredPromotions.length === 0 && (
            <Card className="bg-white border border-gray-200">
              <CardContent className="py-12 text-center">
                <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Không tìm thấy khuyến mãi nào
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Thử thay đổi bộ lọc hoặc tạo khuyến mãi mới
                </p>
                <Button
                  onClick={handleCreateNew}
                  className="bg-[#AF140B] hover:bg-[#8D0F08]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo khuyến mãi mới
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

      </div>

      {/* Assign Products Modal */}
      {
        assignTarget && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between p-5 border-b">
                <div>
                  <h2 className="text-lg font-bold text-[#2C2C2C] flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Gán sản phẩm vào khuyến mãi
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {assignTarget.name} · đã chọn {selectedProductIds.size} sản phẩm
                  </p>
                </div>
                <button onClick={() => setAssignTarget(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none">
                  ×
                </button>
              </div>
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="w-full pl-9 pr-3 h-9 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tìm sản phẩm theo tên..."
                    value={assignSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {products
                  .filter((p) => p.name.toLowerCase().includes(assignSearch.toLowerCase()))
                  .map((p, idx) => {
                    const pid = idx + 1;
                    const checked = selectedProductIds.has(pid);
                    return (
                      <label key={p.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-200"
                          }`}>
                        <input type="checkbox" checked={checked}
                          onChange={() => toggleProduct(pid)}
                          className="w-4 h-4 accent-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2C2C2C] truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.price?.toLocaleString("vi-VN")}₫</p>
                        </div>
                      </label>
                    );
                  })}
              </div>
              {assignError && (
                <div className="mx-4 mb-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />{assignError}
                </div>
              )}
              <div className="flex items-center justify-end gap-3 p-4 border-t">
                <Button variant="outline" onClick={() => setAssignTarget(null)} disabled={assigning}>
                  Hủy
                </Button>
                <Button onClick={() => handleAssignProducts()}
                  disabled={selectedProductIds.size === 0 || assigning}
                  className="bg-blue-600 hover:bg-blue-700 text-white">
                  {assigning
                    ? "Đang gán..."
                    : `Gán${selectedProductIds.size > 0 ? ` ${selectedProductIds.size}` : ""} sản phẩm`}
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* View Detail Modal */}
      {viewingPromotion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-xl font-bold text-[#2C2C2C] flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#AF140B]" />
                  Chi tiết khuyến mãi
                </h2>
              </div>
              <button onClick={() => setViewingPromotion(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none">
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Thông tin chung</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tên chương trình:</p>
                      <p className="font-medium text-gray-900">{viewingPromotion.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Trạng thái:</p>
                      <div>{getStatusBadge(viewingPromotion.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Mã giảm giá:</p>
                      <p className="font-medium text-gray-900">
                        {viewingPromotion.code ? (
                          <code className="px-2 py-0.5 bg-gray-100 rounded font-mono text-[#AF140B] font-medium">
                            {viewingPromotion.code}
                          </code>
                        ) : "Không có"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Mức giảm:</p>
                      <p className="font-semibold text-[#AF140B]">{viewingPromotion.discountPercent}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Thời gian diễn ra:</p>
                      <p className="font-medium text-gray-900">
                        {format(viewingPromotion.startDate, "dd/MM/yyyy HH:mm")} - {format(viewingPromotion.endDate, "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Mô tả</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {viewingPromotion.description || "Chưa có mô tả."}
                  </p>
                </div>

                {/* Applied Products */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Sản phẩm áp dụng</h3>

                  {loadingDetail ? (
                    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-[#AF140B] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500">Đang tải danh sách sản phẩm...</p>
                      </div>
                    </div>
                  ) : detailError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                      <p className="text-sm text-red-700">{detailError}</p>
                    </div>
                  ) : viewingPromotion.products && viewingPromotion.products.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <ul className="divide-y divide-gray-200">
                        {viewingPromotion.products.map(product => (
                          <li key={product.id} className="p-4 hover:bg-gray-50 flex items-center gap-4 transition-colors">
                            <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate" title={product.name}>
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Danh mục: {product.categoryName || "-"} | Thương hiệu: {product.brandName || "-"}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-medium text-gray-900">
                                {product.minPrice ? product.minPrice.toLocaleString("vi-VN") + "₫" : "Đang cập nhật"}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border rounded-lg p-8 text-center">
                      <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-600 font-medium mb-1">Chưa có sản phẩm nào</p>
                      <p className="text-sm text-gray-500">
                        Khuyến mãi này chưa được áp dụng cho sản phẩm nào. Sử dụng nút "Gán sản phẩm" trên danh sách để thêm.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 border-t bg-gray-50 flex justify-end rounded-b-2xl">
              <Button onClick={() => setViewingPromotion(null)} variant="outline">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}