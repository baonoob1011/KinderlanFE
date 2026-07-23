import { useState, useMemo, useEffect } from 'react';
import { X, MapPin, Search, ChevronDown, CheckCircle, AlertCircle, XCircle, Package, Loader2 } from 'lucide-react';
import { inventoryApi, StoreAvailability } from '../../services/inventoryApi';

interface StoreAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  selectedSku?: any;
}

export default function StoreAvailabilityModal({ isOpen, onClose, product, selectedSku }: StoreAvailabilityModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [onlyShowInStock, setOnlyShowInStock] = useState(false);
  const [showAvailable, setShowAvailable] = useState(true);
  const [showLowStock, setShowLowStock] = useState(true);
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [expandedStoreId, setExpandedStoreId] = useState<number | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreAvailability | null>(null);

  // API state
  const [storeList, setStoreList] = useState<StoreAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hàm extract thành phố từ địa chỉ BE
  const extractCity = (address: string): string => {
    if (address.includes('TP.HCM') || address.includes('Hồ Chí Minh')) return 'TP. Hồ Chí Minh';
    if (address.includes('Hà Nội')) return 'Hà Nội';
    if (address.includes('Đà Nẵng')) return 'Đà Nẵng';
    return 'Khác';
  };

  // Gọi API khi modal mở
  useEffect(() => {
    if (!isOpen) return;

    const id = selectedSku?.id ?? Number(product.id);
    if (!id || isNaN(id)) return;

    setLoading(true);
    setError(null);

    inventoryApi.getStoreAvailability(id)
      .then((res) => {
        setStoreList(res.data);
        if (res.data.length > 0) {
          setSelectedStore(res.data[0]);
          // Tự động chọn thành phố đầu tiên nếu chưa chọn
          if (!selectedCity) {
            const cityList = [...new Set(res.data.map((s) => extractCity(s.address)))];
            setSelectedCity(cityList[0] ?? '');
          }
        }
      })
      .catch((err) => {
        setError(err.message || 'Không thể tải dữ liệu cửa hàng');
      })
      .finally(() => setLoading(false));
  }, [isOpen, selectedSku, product.id]);

  const cities = [...new Set(storeList.map((s) => extractCity(s.address)))];

  const getStockStatus = (availabilityStatus: string) => {
    switch (availabilityStatus) {
      case 'Còn hàng':
      case 'Có sẵn':
        return { status: 'available', text: 'Có sẵn', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' };
      case 'Còn ít':
      case 'Sắp hết hàng':
        return { status: 'low', text: 'Còn ít', icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-50' };
      case 'Hết hàng':
        return { status: 'out', text: 'Hết hàng', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' };
      default:
        return { status: 'unavailable', text: availabilityStatus, icon: Package, color: 'text-gray-400', bgColor: 'bg-gray-100' };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  const filteredStores = useMemo(() => {
    return storeList.filter((store) => {
      const stockInfo = getStockStatus(store.availabilityStatus);
      const city = extractCity(store.address);
      const matchesCity = !selectedCity || city === selectedCity;
      const matchesSearch =
        store.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase());

      const hasStock = stockInfo.status !== 'unavailable' && stockInfo.status !== 'out';
      const matchesStockFilter = !onlyShowInStock || hasStock;

      const matchesStatusFilter =
        (showAvailable && stockInfo.status === 'available') ||
        (showLowStock && stockInfo.status === 'low') ||
        (showOutOfStock && (stockInfo.status === 'out' || stockInfo.status === 'unavailable'));

      return matchesCity && matchesSearch && matchesStockFilter && matchesStatusFilter;
    });
  }, [storeList, selectedCity, searchQuery, onlyShowInStock, showAvailable, showLowStock, showOutOfStock]);

  const storesInStock = storeList.filter(
    (s) => s.availabilityStatus !== 'Hết hàng'
  ).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">Tìm tại cửa hàng</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid lg:grid-cols-2 gap-6 p-6">
            {/* Left Side - Filters & List */}
            <div className="space-y-6">
              {/* Product Info */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                <img
                  src={product.image || product.imageUrl || "/placeholder.png"}
                  alt={product.name}
                  className="size-24 object-cover rounded-lg border border-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 line-clamp-2">{product.name}</h3>
                  <div className="mt-1">
                    {(() => {
                      const discountPercent = product.discount || 0;
                      const currentOriginalPrice = selectedSku ? selectedSku.price : (product.originalPrice || product.price);
                      const currentFinalPrice = discountPercent > 0
                        ? currentOriginalPrice - (currentOriginalPrice * discountPercent) / 100
                        : currentOriginalPrice;

                      return (
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-extrabold text-[#AF140B] whitespace-nowrap">
                            {formatPrice(currentFinalPrice)}
                          </p>
                          {discountPercent > 0 && (
                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                              -{discountPercent}%
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  {selectedSku && (
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      Loại: <span className="text-gray-700">{selectedSku.skuCode}</span>
                      {selectedSku.size && ` | Size: ${selectedSku.size}`}
                      {selectedSku.color && ` | Color: ${selectedSku.color}`}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider font-bold">{product.brand}</p>
                </div>
              </div>

              {/* City Selector */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Thành phố:
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                >
                  <option value="">Tất cả</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 size-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo thành phố, địa chỉ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Stock Filter */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <input
                  type="checkbox"
                  id="onlyInStock"
                  checked={onlyShowInStock}
                  onChange={(e) => setOnlyShowInStock(e.target.checked)}
                  className="size-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="onlyInStock" className="font-semibold text-gray-800 cursor-pointer">
                  Chỉ hiển thị các cửa hàng còn sản phẩm
                </label>
              </div>

              {/* Loading / Error */}
              {loading && (
                <div className="flex items-center justify-center py-6 gap-2 text-gray-500">
                  <Loader2 className="size-5 animate-spin" />
                  <span>Đang tải dữ liệu...</span>
                </div>
              )}
              {error && (
                <div className="text-red-500 text-sm px-2 py-3 bg-red-50 rounded-xl">
                  ⚠️ {error}
                </div>
              )}

              <div className="text-sm text-gray-600">
                <strong>{storesInStock}</strong> trên tổng <strong>{storeList.length}</strong> cửa hàng có sản phẩm này
              </div>

              {/* Status Filters */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showAvailable"
                    checked={showAvailable}
                    onChange={(e) => setShowAvailable(e.target.checked)}
                    className="size-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <CheckCircle className="size-5 text-green-600" />
                  <label htmlFor="showAvailable" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    Có sẵn
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showLowStock"
                    checked={showLowStock}
                    onChange={(e) => setShowLowStock(e.target.checked)}
                    className="size-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <AlertCircle className="size-5 text-orange-600" />
                  <label htmlFor="showLowStock" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    Còn ít
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showOutOfStock"
                    checked={showOutOfStock}
                    onChange={(e) => setShowOutOfStock(e.target.checked)}
                    className="size-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <XCircle className="size-5 text-red-600" />
                  <label htmlFor="showOutOfStock" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    Hết hàng
                  </label>
                </div>
              </div>

              {/* Store List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredStores.map((store) => {
                  const stockInfo = getStockStatus(store.availabilityStatus);
                  const Icon = stockInfo.icon;
                  const isExpanded = expandedStoreId === store.storeId;

                  return (
                    <div
                      key={store.storeId}
                      className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-all"
                    >
                      <button
                        onClick={() => {
                          setSelectedStore(store);
                          setExpandedStoreId(isExpanded ? null : store.storeId);
                        }}
                        className="w-full p-4 text-left flex items-start justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 mb-1">
                            {store.storeName.replace('Kinderland ', '')}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-1">{store.address}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${stockInfo.bgColor}`}>
                            <Icon className={`size-4 ${stockInfo.color}`} />
                            <span className={`text-sm font-bold ${stockInfo.color}`}>
                              {stockInfo.text}
                            </span>
                          </div>
                          <ChevronDown className={`size-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t-2 border-gray-100 space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{store.address}</p>
                          </div>
                          <p className="text-sm text-gray-700">📞 {store.phone}</p>
                          <p className="text-sm text-gray-700">🕐 {store.openingTime} - {store.closingTime}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!loading && filteredStores.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Không tìm thấy cửa hàng phù hợp</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Map */}
            <div className="lg:sticky lg:top-0">
              <div className="bg-gray-100 rounded-xl overflow-hidden shadow-lg h-[600px]">
                {selectedStore ? (
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://maps.google.com/maps?q=${selectedStore.latitude},${selectedStore.longitude}&hl=vi&z=14&output=embed`}
                    title={selectedStore.storeName}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Chọn cửa hàng để xem bản đồ</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
