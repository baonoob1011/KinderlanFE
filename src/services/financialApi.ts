// Financial API Service
import { api } from './api';

// --- Types ---

export interface FinancialOverviewData {
    totalRevenue: number;
    todayRevenue: number;
    thisMonthRevenue: number;
    totalRefunds?: number;
    todayRefunds?: number;
    thisMonthRefunds?: number;
    netRevenue?: number;
    todayNetRevenue?: number;
    thisMonthNetRevenue?: number;
}

export interface FinancialOverviewResponse {
    timestamp: string;
    statusCode: number;
    apiPath: string;
    message: string;
    data: FinancialOverviewData;
    success: boolean;
}

// --- API ---

export const financialApi = {
    /**
     * Lấy tổng quan tài chính (doanh thu tổng, hôm nay, tháng này)
     * GET /api/v1/financial/overview
     */
    getFinancialOverview: async (): Promise<FinancialOverviewData> => {
        const response: FinancialOverviewResponse = await api.get('/api/v1/financial/overview');
        return response.data;
    },

    /**
     * Lấy danh thu theo khoảng ngày
     * GET /api/v1/financial/revenue?start={start}&end={end}
     */
    getRevenueByDateRange: async (start: string, end: string): Promise<number> => {
        const response = await api.get(`/api/v1/financial/revenue?start=${start}&end=${end}`);
        return response.data;
    }
};

export default financialApi;
