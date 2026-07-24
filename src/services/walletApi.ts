import { authenticatedFetch } from './api';

const API_BASE_URL = '';

export interface Wallet {
    walletId: number;
    balance: number;
    currency: string;
    status: 'ACTIVE' | 'LOCKED' | 'CLOSED';
}

export type WalletTransactionType =
    | 'TOP_UP'
    | 'PAYMENT'
    | 'CANCELLATION_REFUND'
    | 'RETURN_REFUND'
    | 'ADJUSTMENT_CREDIT'
    | 'ADJUSTMENT_DEBIT';

export interface WalletTransaction {
    transactionId: number;
    type: WalletTransactionType;
    direction: 'CREDIT' | 'DEBIT';
    amount: number;
    balanceAfter: number;
    status: 'COMPLETED' | 'FAILED' | 'REVERSED';
    referenceType: string;
    referenceId: string;
    orderId?: number;
    returnRequestId?: number;
    description?: string;
    createdAt: string;
}

interface PagedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    first: boolean;
    last: boolean;
}

interface ApiResponse<T> {
    data: T;
    success: boolean;
    message: string;
}

export type WalletTopUpStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export interface WalletTopUp {
    topupId: number;
    topupCode: string;
    amount: number;
    currency: string;
    status: WalletTopUpStatus;
    paymentProvider: string;
    /** Chỉ có giá trị khi status = PENDING — backend không trả lại link đã dùng/hết hạn. */
    paymentUrl?: string;
    vnpTransactionNo?: string;
    vnpBankCode?: string;
    createdAt: string;
    expiredAt?: string;
    completedAt?: string;
    failedAt?: string;
}

export interface WalletTopUpConfig {
    minAmount: number;
    maxAmount: number;
    currency: string;
    expiryMinutes: number;
    quickAmounts: number[];
}

/**
 * Lỗi nghiệp vụ từ backend, giữ lại errorCode để hiển thị đúng thông báo tiếng Việt
 * thay vì đổ chung một câu "có lỗi xảy ra".
 */
export class WalletApiError extends Error {
    constructor(message: string, public readonly errorCode?: string) {
        super(message);
        this.name = 'WalletApiError';
    }
}

const TOPUP_ERROR_MESSAGES: Record<string, string> = {
    WALLET_TOPUP_AMOUNT_TOO_LOW: 'Số tiền nạp thấp hơn mức tối thiểu cho phép.',
    WALLET_TOPUP_AMOUNT_TOO_HIGH: 'Số tiền nạp vượt quá mức tối đa cho mỗi giao dịch.',
    WALLET_TOPUP_AMOUNT_INVALID: 'Số tiền nạp phải là số nguyên (đồng).',
    WALLET_TOPUP_NOT_FOUND: 'Không tìm thấy yêu cầu nạp tiền.',
    WALLET_TOPUP_EXPIRED: 'Yêu cầu nạp tiền đã hết hạn, vui lòng tạo lại.',
    WALLET_TOPUP_ALREADY_COMPLETED: 'Yêu cầu nạp tiền này đã được xử lý.',
    WALLET_TOPUP_AMOUNT_MISMATCH: 'Số tiền thanh toán không khớp với yêu cầu nạp tiền.',
    WALLET_TOPUP_TOO_MANY_PENDING: 'Bạn còn quá nhiều yêu cầu nạp tiền chưa hoàn tất. Vui lòng hoàn tất hoặc đợi hết hạn.',
    WALLET_INVALID_AMOUNT: 'Số tiền không hợp lệ.',
    WALLET_CLOSED: 'Ví đã đóng, không thể nạp tiền.',
    WALLET_NOT_ACTIVE: 'Ví không ở trạng thái nhận được tiền.',
    VNPAY_SIGNATURE_INVALID: 'Chữ ký giao dịch không hợp lệ.',
    VNPAY_TRANSACTION_FAILED: 'Giao dịch VNPay không thành công.',
};

export const topUpErrorMessage = (err: unknown): string => {
    if (err instanceof WalletApiError && err.errorCode && TOPUP_ERROR_MESSAGES[err.errorCode]) {
        return TOPUP_ERROR_MESSAGES[err.errorCode];
    }
    return err instanceof Error ? err.message : 'Không thể thực hiện yêu cầu. Vui lòng thử lại.';
};

/** Đọc body lỗi của BaseResponse để lấy message + errorCode; fallback về text thô. */
const readError = async (response: Response): Promise<never> => {
    const text = await response.text();
    try {
        const json = JSON.parse(text);
        throw new WalletApiError(
            json.message || json.error || `HTTP ${response.status}`,
            json.errorCode || json.code,
        );
    } catch (e) {
        if (e instanceof WalletApiError) throw e;
        throw new WalletApiError(text || `HTTP ${response.status}`);
    }
};

export const walletApi = {
    /** GET /api/v1/wallet/me — ví của người dùng ĐANG đăng nhập (server tự suy từ JWT). */
    getMyWallet: async (): Promise<Wallet> => {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/wallet/me`, {
            method: 'GET',
            headers: { Accept: '*/*' },
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `HTTP ${response.status}`);
        }
        const json: ApiResponse<Wallet> = await response.json();
        return json.data;
    },

    /** GET /api/v1/wallet/me/transactions?page=&size=&type= */
    getMyTransactions: async (params?: {
        page?: number;
        size?: number;
        type?: WalletTransactionType;
    }): Promise<PagedResponse<WalletTransaction>> => {
        const q = new URLSearchParams();
        q.set('page', String(params?.page ?? 0));
        q.set('size', String(params?.size ?? 20));
        if (params?.type) q.set('type', params.type);

        const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/wallet/me/transactions?${q}`, {
            method: 'GET',
            headers: { Accept: '*/*' },
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `HTTP ${response.status}`);
        }
        const json: ApiResponse<PagedResponse<WalletTransaction>> = await response.json();
        return json.data;
    },

    /** GET /api/v1/wallet/topups/config — hạn mức do backend công bố. */
    getTopUpConfig: async (): Promise<WalletTopUpConfig> => {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/wallet/topups/config`, {
            method: 'GET',
            headers: { Accept: '*/*' },
        });
        if (!response.ok) await readError(response);
        const json: ApiResponse<WalletTopUpConfig> = await response.json();
        return json.data;
    },

    /**
     * POST /api/v1/wallet/topups — tạo yêu cầu nạp, trả về paymentUrl để redirect sang VNPay.
     * Chỉ gửi amount: ví đích do backend suy từ JWT, frontend KHÔNG được phép chỉ định.
     */
    createTopUp: async (amount: number): Promise<WalletTopUp> => {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/wallet/topups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: '*/*' },
            body: JSON.stringify({ amount }),
        });
        if (!response.ok) await readError(response);
        const json: ApiResponse<WalletTopUp> = await response.json();
        return json.data;
    },

    /** GET /api/v1/wallet/topups/{topupCode} — trạng thái THẬT trong DB, không tin query VNPay. */
    getTopUp: async (topupCode: string): Promise<WalletTopUp> => {
        const response = await authenticatedFetch(
            `${API_BASE_URL}/api/v1/wallet/topups/${encodeURIComponent(topupCode)}`,
            { method: 'GET', headers: { Accept: '*/*' } },
        );
        if (!response.ok) await readError(response);
        const json: ApiResponse<WalletTopUp> = await response.json();
        return json.data;
    },

    /** GET /api/v1/wallet/topups?page=&size= — lịch sử nạp tiền, mới nhất trước. */
    getMyTopUps: async (params?: { page?: number; size?: number }): Promise<PagedResponse<WalletTopUp>> => {
        const q = new URLSearchParams();
        q.set('page', String(params?.page ?? 0));
        q.set('size', String(params?.size ?? 20));

        const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/wallet/topups?${q}`, {
            method: 'GET',
            headers: { Accept: '*/*' },
        });
        if (!response.ok) await readError(response);
        const json: ApiResponse<PagedResponse<WalletTopUp>> = await response.json();
        return json.data;
    },
};
