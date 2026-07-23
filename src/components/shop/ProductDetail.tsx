import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { inventoryApi, StoreAvailability } from '../../services/inventoryApi';

// Sub-components
import SkuSelector from './SkuSelector';
import ProductActions from './ProductActions';
import StoreAvailabilitySection from './StoreAvailabilitySection';
import StoreAvailabilityModal from './StoreAvailabilityModal';
import ReviewSection from './ReviewSection';
import YouMayAlsoLike from './YouMayAlsoLike';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── Core state ──────────────────────────
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // ── SKU state ───────────────────────────
  const [skus, setSkus] = useState<any[]>([]);
  const [selectedSku, setSelectedSku] = useState<any>(null);

  // ── Store availability ──────────────────
  const [storeAvailability, setStoreAvailability] = useState<StoreAvailability[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // ── Fetch product ───────────────────────
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/api/v1/products/view-detail/${id}`);
        const data = response.data;
        const discountPercent = data.promotion?.discountPercent || 0;
        const originalPrice = data.minPrice;
        const finalPrice = discountPercent > 0
          ? originalPrice - (originalPrice * discountPercent) / 100
          : originalPrice;

        setProduct({
          id: data.id,
          name: data.name,
          description: data.description,
          image: data.imageUrl,
          category: data.categoryName,
          brand: data.brandName,
          brandOrigin: data.brandOrigin,
          ageRange: data.ageRange,
          gender: data.gender,
          price: finalPrice,
          originalPrice: discountPercent > 0 ? originalPrice : null,
          discount: discountPercent,
          stock: 100,
        });
      } catch (error) {
        console.error("Lỗi lấy product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // ── Fetch SKUs ──────────────────────────
  useEffect(() => {
    if (!product) return;
    const fetchSkus = async () => {
      try {
        const res = await api.get("/api/v1/sku");
        const productSkus = res.data.filter((sku: any) => sku.productId === product.id);
        setSkus(productSkus);
        if (productSkus.length > 0) setSelectedSku(productSkus[0]);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSkus();
  }, [product]);

  // ── Fetch store availability ────────────
  useEffect(() => {
    if (!selectedSku) { setStoreAvailability([]); return; }
    const fetchAvailability = async () => {
      setAvailabilityLoading(true);
      try {
        const res = await inventoryApi.getStoreAvailability(selectedSku.id);
        setStoreAvailability(res.data || []);
      } catch (error) {
        console.error("Lỗi lấy store availability:", error);
        setStoreAvailability([]);
      } finally {
        setAvailabilityLoading(false);
      }
    };
    fetchAvailability();
  }, [selectedSku]);

  // ── Derived: stores with stock ──────────
  const storesWithStock = storeAvailability.filter((store) => {
    if (store.quantity != null && store.quantity > 0) return true;
    if (store.availabilityStatus === 'Có sẵn' || store.availabilityStatus === 'Còn ít' || store.availabilityStatus === 'Còn hàng') return true;
    return false;
  });

  const totalSkuStock = storeAvailability.reduce((sum, store) => sum + (store.quantity || 0), 0);
  const currentStock = selectedSku
    ? (totalSkuStock > 0 ? totalSkuStock : storesWithStock.length)
    : (product ? product.stock : 0);

  // ── Clamp quantity to stock ─────────────
  useEffect(() => {
    if (currentStock > 0) {
      if (quantity === 0) setQuantity(1);
      else if (quantity > currentStock) setQuantity(currentStock);
    } else {
      setQuantity(0);
    }
  }, [currentStock, quantity]);

  // ── Price helpers ───────────────────────
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  // ── Loading / Not found ─────────────────
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-[#AF140B]" />
        <p className="mt-4">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm</p>
      </div>
    );
  }

  // ── Price display ───────────────────────
  const discountPercent = product.discount || 0;
  const currentOriginalPrice = selectedSku ? selectedSku.price : (product.originalPrice || product.price);
  const currentFinalPrice = discountPercent > 0
    ? currentOriginalPrice - (currentOriginalPrice * discountPercent) / 100
    : currentOriginalPrice;

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#AF140B] hover:text-[#8D0F08] mb-6 font-semibold"
      >
        <ArrowLeft className="size-5" />
        Quay lại
      </button>

      {/* ── Product Hero (Image + Info) ──── */}
      <div className="grid md:grid-cols-[1fr_340px] gap-6">
        {/* Image gallery – vertical thumbnails left + main image right */}
        <div className="flex gap-4">
          {/* Vertical thumbnail strip */}
          {(() => {
            const allImages: { url: string; label: string }[] = [
              { url: product.image, label: 'Sản phẩm' },
              ...skus
                .filter((s: any) => s.imageUrl)
                .map((s: any) => ({ url: s.imageUrl, label: s.color || s.type || s.skuCode })),
            ];
            if (allImages.length <= 1) return null;
            const displayedImage = selectedImage || product.image;
            return (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img.url)}
                    className={`flex-shrink-0 w-[72px] h-[72px] rounded-lg border-2 overflow-hidden transition-all ${
                      displayedImage === img.url
                        ? 'border-[#AF140B] shadow-md'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-full object-contain bg-white" />
                  </button>
                ))}
              </div>
            );
          })()}

          {/* Main image container – fixed height, image always fully visible */}
          <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center h-[500px] p-6">
            <img
              src={selectedImage || product.image}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>

        {/* Product Info + Actions */}
        <div className="pt-2">
          {/* Category */}
          <div className="mb-3">
            <span className="text-xs bg-[#FFE5E3] text-[#AF140B] px-3 py-1.5 rounded-full font-semibold">
              {product.category}
            </span>
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>

          {/* Brand */}
          <div className="mb-3">
            <span className="text-xs text-gray-500">
              Thương hiệu: <span className="font-bold text-[#AF140B]">{product.brand}</span>
            </span>
          </div>



          {/* Price */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-[#AF140B]">{formatPrice(currentFinalPrice)}</span>
              {discountPercent > 0 && (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full font-bold text-xs">
                  Giảm {discountPercent}%
                </span>
              )}
            </div>
            {discountPercent > 0 && (
              <div className="text-sm text-gray-400 line-through">
                Giá gốc: {formatPrice(currentOriginalPrice)}
              </div>
            )}
            {selectedSku && (selectedSku.color || selectedSku.size || selectedSku.type) && (
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {selectedSku.color && (
                  <span className="inline-flex items-center gap-1 text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium">
                    <span className="w-3 h-3 rounded-full border border-gray-400" style={{ backgroundColor: selectedSku.color.toLowerCase() }} />
                    {selectedSku.color}
                  </span>
                )}
                {selectedSku.type && (
                  <span className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium">
                    {selectedSku.type}
                  </span>
                )}
                {selectedSku.size && (
                  <span className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium">
                    Size {selectedSku.size}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* SKU Selector */}
          <SkuSelector skus={skus} selectedSku={selectedSku} onSelectSku={(sku) => {
            setSelectedSku(sku);
            setSelectedImage(sku?.imageUrl || product.image);
          }} />

          {/* Actions: Quantity, Cart, Wishlist, Store, Policy */}
          <ProductActions
            product={product}
            selectedSku={selectedSku}
            quantity={quantity}
            currentStock={currentStock}
            availabilityLoading={availabilityLoading}
            storesWithStock={storesWithStock}
            onQuantityChange={setQuantity}
            onShowStoreModal={() => setShowStoreModal(true)}
          />
        </div>
      </div>

      {/* ── Store Availability ──────────── */}
      <StoreAvailabilitySection
        storeAvailability={storeAvailability}
        storesWithStock={storesWithStock}
        availabilityLoading={availabilityLoading}
        selectedSku={selectedSku}
        onShowStoreModal={() => setShowStoreModal(true)}
      />

      {/* ── Product Info + Policy side by side ── */}
      <div className="grid md:grid-cols-[2fr_1fr] gap-6 mb-6">
        {/* Product Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex border-b border-gray-200 mb-4">
            <button className="px-6 py-3 text-sm font-bold text-[#AF140B] border-b-2 border-[#AF140B]">
              Thông tin sản phẩm
            </button>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {product.category && (
                <tr>
                  <td className="py-3 pr-8 text-gray-500 font-medium w-1/3">Danh mục</td>
                  <td className="py-3 text-gray-900">{product.category}</td>
                </tr>
              )}
              {product.brand && (
                <tr>
                  <td className="py-3 pr-8 text-gray-500 font-medium">Thương hiệu</td>
                  <td className="py-3 text-gray-900">{product.brand}</td>
                </tr>
              )}
              {product.brandOrigin && (
                <tr>
                  <td className="py-3 pr-8 text-gray-500 font-medium">Xuất xứ thương hiệu</td>
                  <td className="py-3 text-gray-900">{product.brandOrigin}</td>
                </tr>
              )}
              {product.ageRange && (
                <tr>
                  <td className="py-3 pr-8 text-gray-500 font-medium">Tuổi</td>
                  <td className="py-3 text-gray-900">{product.ageRange}</td>
                </tr>
              )}
              {product.gender && (
                <tr>
                  <td className="py-3 pr-8 text-gray-500 font-medium">Giới tính</td>
                  <td className="py-3 text-gray-900">{product.gender}</td>
                </tr>
              )}
            </tbody>
          </table>
          {product.description && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-bold text-gray-800 mb-2">Mô tả sản phẩm</h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>

        {/* Policy */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 h-fit">
          <h3 className="font-bold text-gray-800 mb-4 text-base">🎯 Chính sách</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-[#AF140B] font-bold mt-0.5">✓</span>
              <span>Miễn phí vận chuyển đơn từ 500.000đ</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-[#AF140B] font-bold mt-0.5">✓</span>
              <span>Đổi trả trong 7 ngày</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-[#AF140B] font-bold mt-0.5">✓</span>
              <span>Bảo hành chính hãng</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-[#AF140B] font-bold mt-0.5">✓</span>
              <span>Hỗ trợ 24/7</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ── Store Modal ────────────────── */}
      <StoreAvailabilityModal
        isOpen={showStoreModal}
        onClose={() => setShowStoreModal(false)}
        product={product}
        selectedSku={selectedSku}
      />

      {/* ── Reviews ────────────────────── */}
      <ReviewSection productId={Number(id)} selectedSku={selectedSku} />

      {/* ── You May Also Like ────────────── */}
      <YouMayAlsoLike currentProductId={product.id} />
    </div>
  );
}