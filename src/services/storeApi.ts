// Store API Service
// Vite proxy forward /api/* → http://localhost:8080/api/*

const API_BASE_URL = "";

// --- Helper: get token ---
const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("accessToken");
    return {
        "Content-Type": "application/json",
        Accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// --- Types (khớp chính xác với BE response) ---

export interface StoreItem {
    id: number;
    name: string;
    code: string;
    address: string;
    phone: string;
    managerName: string;
    latitude: number;
    longitude: number;
    openingTime: string;
    closingTime: string;
    active: boolean;
    createdAt: string;
}

export interface StoreListResponse {
    timestamp: string;
    statusCode: number;
    apiPath: string;
    message: string;
    data: StoreItem[];
    success: boolean;
}

// Type cho nearby store (ít field hơn, có thêm distanceKm)
export interface NearbyStoreItem {
    id: number;
    name: string;
    code: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
    distanceKm: number;
}

export interface NearbyStoreResponse {
    timestamp: string;
    statusCode: number;
    apiPath: string;
    message: string;
    data: NearbyStoreItem[];
    success: boolean;
}

// --- Helper: extract city từ address ---
export const extractCityFromAddress = (address: string): string => {
    if (address.includes("TP.HCM") || address.includes("Hồ Chí Minh")) return "TP. Hồ Chí Minh";
    if (address.includes("Hà Nội")) return "Hà Nội";
    if (address.includes("Đà Nẵng")) return "Đà Nẵng";
    return "Khác";
};

// --- API ---

export const storeApi = {
    /**
     * Lấy danh sách tất cả cửa hàng
     * GET /api/v1/stores
     */
    getStores: async (): Promise<StoreItem[]> => {
        const response = await fetch(
            `${API_BASE_URL}/api/v1/stores`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const json: StoreListResponse = await response.json();
        return json.data;
    },

    /**
     * Lấy danh sách cửa hàng gần vị trí user (sắp xếp theo khoảng cách)
     * GET /api/v1/stores/nearby?lat={lat}&lng={lng}
     */
    getNearbyStores: async (lat: number, lng: number): Promise<NearbyStoreItem[]> => {
        const response = await fetch(
            `${API_BASE_URL}/api/v1/stores/nearby?lat=${lat}&lng=${lng}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const json: NearbyStoreResponse = await response.json();
        return json.data;
    },

    /**
     * Tìm kiếm cửa hàng theo từ khóa (tên, địa chỉ)
     * GET /api/v1/stores/search?keyword={keyword}
     */
    searchStores: async (keyword: string): Promise<StoreItem[]> => {
        const response = await fetch(
            `${API_BASE_URL}/api/v1/stores/search?keyword=${encodeURIComponent(keyword)}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const json: StoreListResponse = await response.json();
        return json.data;
    },

    /**
     * Lấy chi tiết một cửa hàng theo ID
     * GET /api/v1/stores/{id}
     */
    getStoreById: async (id: number | string): Promise<StoreItem> => {
        const response = await fetch(
            `${API_BASE_URL}/api/v1/stores/${id}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const json: { data: StoreItem } = await response.json();
        return json.data;
    },
};

export default storeApi;
