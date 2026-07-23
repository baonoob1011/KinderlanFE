import { useState, useEffect, useRef } from "react";
import { storeApi, StoreItem, NearbyStoreItem, extractCityFromAddress } from "../../services/storeApi";
import {
  MapPin,
  Phone,
  Clock,
  Search,
  ChevronDown,
  Loader2,
  User,
  Navigation,
} from "lucide-react";

export default function StoreFinderPage() {
  const [storeList, setStoreList] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStoreId, setExpandedStoreId] = useState<number | null>(null);
  const [nearbyStores, setNearbyStores] = useState<NearbyStoreItem[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  useEffect(() => {
    storeApi.getStores()
      .then((data) => {
        setStoreList(data);
        if (data.length > 0) {
          const firstCity = extractCityFromAddress(data[0].address);
          setSelectedCity(firstCity);
          setSelectedStore(data[0]);
        }
      })
      .catch((err) => setError(err.message || "Không thể tải danh sách cửa hàng"))
      .finally(() => setLoading(false));
  }, []);

  // Lấy danh sách thành phố duy nhất từ BE data
  const cities = [...new Set(storeList.map((s) => extractCityFromAddress(s.address)))];

  // Geolocation handler
  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      setNearbyError("Trình duyệt không hỗ trợ định vị");
      return;
    }
    setNearbyLoading(true);
    setNearbyError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        storeApi.getNearbyStores(latitude, longitude)
          .then(setNearbyStores)
          .catch((err) => setNearbyError(err.message || "Không thể tìm cửa hàng gần bạn"))
          .finally(() => setNearbyLoading(false));
      },
      () => {
        setNearbyError("Không thể lấy vị trí. Vui lòng cho phép truy cập vị trí.");
        setNearbyLoading(false);
      }
    );
  };

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<StoreItem[] | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced server-side search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!value.trim()) {
      setSearchResults(null); // rỗng → hiển thị danh sách gốc
      return;
    }

    searchTimerRef.current = setTimeout(() => {
      setSearchLoading(true);
      storeApi.searchStores(value)
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 500);
  };

  // Danh sách hiển thị: kết quả search hoặc lọc theo thành phố
  const baseList = searchResults !== null ? searchResults : storeList;
  const filteredStores = baseList.filter((store) => {
    const city = extractCityFromAddress(store.address);
    return searchResults !== null || selectedCity === "" || city === selectedCity;
  });

  const formatHours = (open: string, close: string) => `${open} - ${close}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-3 text-gray-500">
        <Loader2 className="size-6 animate-spin" />
        <span>Đang tải danh sách cửa hàng...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 font-semibold text-lg mb-4">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#AF140B] text-white rounded-xl font-semibold"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#AF140B] via-[#D91810] to-[#AF140B] text-white py-5">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full mb-2 backdrop-blur-sm">
            <MapPin className="size-4" />
            <span className="font-bold text-sm">HỆ THỐNG CỬA HÀNG</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">
            Tìm Cửa Hàng Kinderland
          </h1>
          <p className="text-sm text-white/90">
            {storeList.length} cửa hàng trên toàn quốc
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left Sidebar - Store List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-4">

              {/* City Selector */}
              <div className="mb-3">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Chọn thành phố:
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#AF140B]/20 focus:border-[#AF140B] font-medium text-gray-700"
                >
                  <option value="">Tất cả</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nearby Button */}
              <div className="mb-3">
                <button
                  onClick={handleFindNearby}
                  disabled={nearbyLoading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#AF140B] text-white rounded-lg text-sm font-semibold hover:bg-[#8D0F08] transition-all disabled:opacity-60"
                >
                  {nearbyLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Navigation className="size-4" />
                  )}
                  Tìm cửa hàng gần tôi
                </button>
                {nearbyError && (
                  <p className="text-red-500 text-xs mt-2">{nearbyError}</p>
                )}
              </div>

              {/* Nearby Results */}
              {nearbyStores.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-bold text-blue-800 mb-3">📍 Cửa hàng gần bạn nhất:</p>
                  <div className="space-y-2">
                    {nearbyStores.slice(0, 3).map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-100 cursor-pointer hover:border-[#AF140B] transition-all"
                        onClick={() => {
                          const found = storeList.find((st) => st.id === s.id);
                          if (found) { setSelectedStore(found); setSelectedCity(""); }
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                            {s.name.replace("Kinderland ", "")}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1">{s.address}</p>
                        </div>
                        <span className="text-xs font-bold text-[#AF140B] ml-2 whitespace-nowrap">
                          {s.distanceKm === 0 ? "Ngay đây" : `${s.distanceKm.toFixed(1)} km`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  {searchLoading ? (
                    <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-[#AF140B] animate-spin" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                  )}
                  <input
                    type="text"
                    placeholder="Tìm cửa hàng..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#AF140B]/20 focus:border-[#AF140B]"
                  />
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-500 font-medium">
                  <strong>{filteredStores.length}</strong> cửa hàng
                  {selectedCity ? ` tại ${selectedCity}` : " trên toàn quốc"}
                </p>
              </div>

              {/* Store List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredStores.map((store) => {
                  const isExpanded = expandedStoreId === store.id;
                  return (
                    <div
                      key={store.id}
                      className={`border rounded-lg overflow-hidden transition-all ${selectedStore?.id === store.id
                        ? "border-[#AF140B] bg-[#FFE5E3]/50"
                        : "border-gray-200 hover:border-[#AF140B]/50"
                        }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedStore(store);
                          setExpandedStoreId(isExpanded ? null : store.id);
                        }}
                        className="w-full p-3 text-left flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-800 line-clamp-1">
                            {store.name.replace("Kinderland ", "")}
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {store.address}
                          </p>
                        </div>
                        <ChevronDown
                          className={`size-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""
                            }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t-2 border-gray-100 space-y-2 bg-white">
                          <div className="flex items-start gap-2">
                            <MapPin className="size-4 text-[#AF140B] mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{store.address}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="size-4 text-[#AF140B] flex-shrink-0" />
                            <p className="text-sm text-gray-700">{store.phone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="size-4 text-[#AF140B] flex-shrink-0" />
                            <p className="text-sm text-gray-700">
                              {formatHours(store.openingTime, store.closingTime)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="size-4 text-[#AF140B] flex-shrink-0" />
                            <p className="text-sm text-gray-700">
                              Quản lý: {store.managerName}
                            </p>
                          </div>
                          {store.active && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-green-600 font-semibold">
                                ● Đang hoạt động
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredStores.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Không tìm thấy cửa hàng</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Content - Map & Store Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Map */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="aspect-video relative">
                {selectedStore ? (
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://maps.google.com/maps?q=${selectedStore.latitude},${selectedStore.longitude}&hl=vi&z=16&output=embed`}
                    title={selectedStore.name}
                  />
                ) : (
                  <div className="w-full h-full bg-[#FFE5E3] flex items-center justify-center">
                    <p className="text-gray-500">Chọn cửa hàng để xem bản đồ</p>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-xl shadow-lg">
                  <p className="text-sm font-bold text-gray-800">
                    📍 {filteredStores.length} cửa hàng
                  </p>
                </div>
              </div>
            </div>

            {/* Store Details Card */}
            {selectedStore && (
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedStore.name}
                  </h2>
                  {selectedStore.active && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      ● Hoạt động
                    </span>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="size-4 text-[#AF140B] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-gray-600 mb-0.5">Địa chỉ</p>
                        <p className="text-sm text-gray-700">{selectedStore.address}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="size-4 text-[#AF140B] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-gray-600 mb-0.5">SĐT</p>
                        <a
                          href={`tel:${selectedStore.phone}`}
                          className="text-sm text-[#AF140B] hover:underline"
                        >
                          {selectedStore.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="size-4 text-[#AF140B] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-gray-600 mb-0.5">Giờ mở cửa</p>
                        <p className="text-sm text-gray-700">
                          {formatHours(selectedStore.openingTime, selectedStore.closingTime)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className="size-4 text-[#AF140B] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-gray-600 mb-0.5">Quản lý</p>
                        <p className="text-sm text-gray-700">{selectedStore.managerName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="bg-gradient-to-br from-[#FFE5E3] to-white rounded-lg p-4 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🏪</div>
                      <h3 className="font-bold text-sm text-gray-800 mb-1">
                        Chào mừng đến Kinderland
                      </h3>
                      <p className="text-xs text-gray-500">
                        Hơn 1000+ đồ chơi chất lượng
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Mã: {selectedStore.code}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Features */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h3 className="font-bold text-sm text-gray-800 mb-3">Dịch vụ tại cửa hàng</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { icon: "🎁", label: "Gói quà miễn phí" },
                      { icon: "✅", label: "Đổi trả 30 ngày" },
                      { icon: "🎮", label: "Khu vui chơi" },
                      { icon: "🅿️", label: "Bãi đỗ xe" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="text-center p-2.5 bg-[#FFE5E3]/50 rounded-lg"
                      >
                        <div className="text-xl mb-1">{item.icon}</div>
                        <p className="text-xs font-medium text-gray-600">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}