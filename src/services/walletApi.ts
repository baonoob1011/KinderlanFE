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
};
