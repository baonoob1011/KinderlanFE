// API Service utility for making HTTP requests with automatic JWT refresh
// Local dev: Vite proxy forwards /api/* → localhost:8080
// Production: vercel.json rewrites forward /api/* → EC2 backend
const API_BASE_URL = "";

// Track refresh token requests to avoid multiple concurrent refreshes
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

// Process queued requests after token refresh
const processQueue = (error?: any, token?: string) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Refresh JWT access token using refresh token
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data?.data?.accessToken) {
      throw new Error('Invalid refresh token response');
    }

    const { accessToken, refreshToken: newRefreshToken } = data.data;

    // Update tokens in localStorage
    localStorage.setItem('accessToken', accessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }

    return accessToken;
  } catch (error) {
    // Clear tokens on refresh failure
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Redirect to login page
    window.location.href = '/login';
    throw error;
  }
};

// Enhanced fetch with automatic token refresh
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Endpoints that NEVER need auth (regardless of method)
  const alwaysPublicEndpoints = [
    '/api/v1/auth/login',
    '/api/v1/auth/login/google',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
  ];

  // Endpoints that are public only for GET requests
  const getOnlyPublicEndpoints = [
    '/api/v1/reviews/sku/',
    '/api/v1/reviews/product/',
  ];

  const method = (options.method || 'GET').toUpperCase();
  const isAlwaysPublic = alwaysPublicEndpoints.some(endpoint => url.includes(endpoint));
  const isGetPublic = method === 'GET' && getOnlyPublicEndpoints.some(endpoint => url.includes(endpoint));
  const isPublicEndpoint = isAlwaysPublic || isGetPublic;

  // Only add auth headers for protected endpoints
  if (!isPublicEndpoint) {
    const accessToken = localStorage.getItem('accessToken');

    // Add Authorization header if token exists
    if (accessToken) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      };
    }
    console.log('[AUTH DEBUG]', options.method || 'GET', url, 'token?', !!accessToken, 'token prefix:', accessToken?.substring(0, 20));
  }

  let response = await fetch(url, options);

  // Handle token expiration (only for protected endpoints)
  if (response.status === 401 && !isPublicEndpoint) {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
          };
          return fetch(url, options);
        });
      }

      // Start refresh process
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);

        // Retry original request with new token
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        };
        response = await fetch(url, options);
      } catch (refreshError) {
        processQueue(refreshError);
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }
  }

  return response;
};

export const api = {
  /**
   * Login with email & password
   */
  loginWithEmail: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Login failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Login API error:", error);
      throw error;
    }
  },

  /**
   * Login with Google
   * @param credential - Google OAuth credential token
   */
  loginWithGoogle: async (credential: string) => {
    try {
      console.log('Sending to backend:', {
        url: `${API_BASE_URL}/auth/login/google`,
        tokenLength: credential?.length || 0
      });

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: credential }),
      });

      console.log('Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Backend error response:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend success response:', data);
      return data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  addWishlist: async (productId: number) => {
    try {
      console.log('Sending to wishlist productId:', productId);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Vui lòng đăng nhập để sử dụng tính năng này");
      }

      console.log('Request body:', JSON.stringify({ productId: productId }));

      const response = await fetch(`${API_BASE_URL}/api/v1/wishlist/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: productId,
        }),
      });

      if (!response.ok) {
        let errorData = `HTTP error! status: ${response.status}`;
        try {
          const resText = await response.text();
          if (resText) errorData = resText;
        } catch (e) { }
        throw new Error(errorData);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  removeWishlist: async (id: number) => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Vui lòng đăng nhập để sử dụng tính năng này");
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/wishlist/items/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Wishlist API delete error:", error);
      throw error;
    }
  },

  // --- CART APIs ---
  getCart: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/cart`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log("GET /api/v1/cart response:", data);
      return data;
    } catch (error) {
      console.error("Cart API GET error:", error);
      throw error;
    }
  },

  addToCart: async (skuId: number, quantity: number, storeId: number) => {
    try {
      console.log("POST /api/v1/cart/add", { skuId, quantity, storeId });

      const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skuId, quantity, storeId }),
      });

      if (!response.ok) {
        let errorData = `HTTP error! status: ${response.status}`;
        try {
          const resText = await response.text();
          if (resText) errorData = resText;
        } catch (e) { }
        throw new Error(errorData);
      }

      const data = await response.json();
      console.log("POST /api/v1/cart/add response:", data);
      return data;
    } catch (error) {
      throw error;
    }
  },

  updateCartItem: async (cartItemId: number, quantity: number) => {
    try {
      console.log(`PUT /api/v1/cart/${cartItemId}`, { quantity });

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/v1/cart/${cartItemId}?quantity=${quantity}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        }
      );

      if (!response.ok) {
        let errorData = `HTTP error! status: ${response.status}`;
        try {
          const resText = await response.text();
          if (resText) errorData = resText;
        } catch (e) { }
        throw new Error(errorData);
      }

      const data = await response.json();
      console.log("PUT /api/v1/cart response:", data);
      return data;
    } catch (error) {
      console.error("Cart update error:", error);
      throw error;
    }
  },

  removeCartItem: async (cartItemId: number) => {
    try {
      console.log(`DELETE /api/v1/cart/${cartItemId}`);

      const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/cart/${cartItemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log("DELETE /api/v1/cart response:", data);
      return data;
    } catch (error) {
      console.error("Cart remove error:", error);
      throw error;
    }
  },


  /**
   * Register new user
   * @param userData - User registration data
   */
  register: async (userData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Registration failed");
      }

      return await response.json();
    } catch (error) {
      console.error('Registration API error:', error);
      throw error;
    }
  },

  /**
   * Refresh access token manually (if needed)
   */
  refreshToken: async () => {
    return await refreshAccessToken();
  },

  /**
   * Generic GET request with automatic token refresh
   * @param endpoint - API endpoint (without base URL)
   */
  get: async (endpoint: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API GET error:', error);
      throw error;
    }
  },

  /**
   * Generic POST request with automatic token refresh
   * @param endpoint - API endpoint (without base URL)
   * @param data - Request body data
   */
  post: async (endpoint: string, data: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API POST ${endpoint} failed:`, response.status, errorBody);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API POST error:', error);
      throw error;
    }
  },

  /**
   * Generic PUT request with automatic token refresh
   * @param endpoint - API endpoint (without base URL)
   * @param data - Request body data
   */
  put: async (endpoint: string, data: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API PUT error:', error);
      throw error;
    }
  },

  /**
   * Generic DELETE request with automatic token refresh
   * @param endpoint - API endpoint (without base URL)
   */
  delete: async (endpoint: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API DELETE error:', error);
      throw error;
    }
  },

  /**
   * Generic PATCH request with automatic token refresh
   * @param endpoint - API endpoint (without base URL)
   * @param data - Request body data
   */
  patch: async (endpoint: string, data: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errBody = await response.json();
          errorMsg = errBody?.message || errBody?.error || errorMsg;
        } catch { /* ignore parse error */ }
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (error) {
      console.error('API PATCH error:', error);
      throw error;
    }
  },

  /**
   * Get inventory availability for a product or specific SKU
   */
  getInventoryAvailability: async (skuId?: number, productId?: number) => {
    try {
      let url = `${API_BASE_URL}/api/v1/inventory/availability`;
      const params = new URLSearchParams();
      if (skuId) params.append('skuId', skuId.toString());
      if (productId) params.append('productId', productId.toString());

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Inventory Availability API error:", error);
      throw error;
    }
  },

  /**
   * Get user's addresses
   */
  getMyAddresses: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Vui lòng đăng nhập");

      const response = await fetch(`${API_BASE_URL}/api/v1/address/my-addresses`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Get addresses API error:", error);
      throw error;
    }
  },

  /**
   * Create a new order
   */
  createOrder: async (addressId: number, storeId: number, items: any[]) => {
    try {
      const endpoint = `/api/v1/orders/create?addressId=${addressId}&storeId=${storeId}`;
      console.log("Creating order through api.post:", endpoint, items);
      return await api.post(endpoint, items);
    } catch (error) {
      console.error("Create order API error:", error);
      throw error;
    }
  },

  /**
   * Initiate checkout for an order
   */
  checkoutOrder: async (orderId: number, paymentMethod: string = "VNPAY", pointsToUse: number = 0) => {
    try {
      const endpoint = `/api/v1/orders/${orderId}/checkout`;
      const body: any = { paymentMethod };
      if (pointsToUse > 0) body.pointsToUse = pointsToUse;
      console.log("Initiating checkout through api.post:", endpoint, body);
      return await api.post(endpoint, body);
    } catch (error) {
      console.error("Checkout order API error:", error);
      throw error;
    }
  },

  /**
   * Get current user's orders
   */
  getMyOrders: async () => {
    try {
      return await api.get('/api/v1/orders/my-orders');
    } catch (error) {
      console.error("Get my orders API error:", error);
      throw error;
    }
  },

  /**
   * Cancel an order (customer)
   * Backend endpoint: PUT /api/v1/orders/{orderId}/cancel
   */
  cancelOrder: async (orderId: number | string) => {
    try {
      const endpoint = `/api/v1/orders/${orderId}/cancel`;
      return await api.put(endpoint, {});
    } catch (error) {
      console.error("Cancel order API error:", error);
      throw error;
    }
  },

  /**
   * Update order status (manager)
   * Backend endpoint: PATCH /api/v1/orders/{id} with body { orderStatus }
   */
  updateOrderStatus: async (orderId: number | string, status: string) => {
    try {
      const endpoint = `/api/v1/orders/${orderId}`;
      return await api.patch(endpoint, { orderStatus: status });
    } catch (error) {
      console.error("Update order status API error:", error);
      throw error;
    }
  },

  /**
   * Get nearby stores based on coordinates
   */
  getNearbyStores: async (lat: number, lng: number, radius: number = 20) => {
    try {
      const endpoint = `/api/v1/stores/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
      return await api.get(endpoint);
    } catch (error) {
      console.error("Get nearby stores API error:", error);
      throw error;
    }
  },
};

/**
 * Utility functions for token management
 */
export const authUtils = {
  /**
   * Check if access token is expired
   */
  isTokenExpired: (): boolean => {
    const token = localStorage.getItem('accessToken');
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  },

  /**
   * Check if user is logged in (has valid tokens)
   */
  isLoggedIn: (): boolean => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return !!(accessToken && refreshToken);
  },

  /**
   * Get current user role from token
   */
  getUserRole: (): string | null => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || payload.authorities?.[0] || null;
    } catch (error) {
      console.error('Error parsing token for role:', error);
      return null;
    }
  },

  /**
   * Get current user email from token
   */
  getUserEmail: (): string | null => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.email || null;
    } catch (error) {
      console.error('Error parsing token for email:', error);
      return null;
    }
  },

  /**
   * Clear all tokens and logout
   */
  logout: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Clear any other user-related data if needed
    localStorage.removeItem('user');

    // Redirect to login page
    window.location.href = '/login';
  },

  /**
   * Get token info for debugging
   */
  getTokenInfo: (): any => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        payload,
        isExpired: authUtils.isTokenExpired(),
        expiresAt: new Date(payload.exp * 1000),
        timeUntilExpiry: payload.exp * 1000 - Date.now(),
      };
    } catch (error) {
      console.error('Error parsing token info:', error);
      return null;
    }
  }
};

export default api;
