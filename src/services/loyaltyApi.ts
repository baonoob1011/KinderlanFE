// Loyalty API Service
const API_BASE_URL = "";

// --- Types ---
export interface LoyaltyPoints {
    totalPoints: number;
    lifetimePoints: number;
}

export interface LoyaltyResponse {
    timestamp: string;
    statusCode: number;
    apiPath: string;
    message: string;
    data: LoyaltyPoints;
    success: boolean;
}

// --- Helper ---
const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("accessToken");
    return {
        "Content-Type": "application/json",
        Accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// --- Loyalty API ---
export const loyaltyApi = {
    /**
     * Lấy điểm tích lũy của khách hàng hiện tại
     * GET /api/v1/loyalty/my-points
     */
    getMyPoints: async (): Promise<LoyaltyPoints> => {
        const response = await fetch(`${API_BASE_URL}/api/v1/loyalty/my-points`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const json: LoyaltyResponse = await response.json();
        return json.data;
    },
};

export default loyaltyApi;
