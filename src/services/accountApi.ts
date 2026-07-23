import { api } from './api';

export interface UserResponse {
    id: number;
    username: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

export interface ProfileUpdateRequest {
    firstName: string;
    lastName: string;
    phone: string;
}

export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

export interface AddressRequest {
    street: string;
    provinceId: string;
    provinceName: string;
    districtId: string;
    districtName: string;
    wardId: string;
    wardName: string;
}

export const accountApi = {
    getProfile: async (): Promise<{ data: UserResponse }> => {
        return await api.get('/api/v1/account/me');
    },

    updateProfile: async (data: ProfileUpdateRequest): Promise<any> => {
        return await api.post('/api/v1/account/update-profile', data);
    },

    changePassword: async (data: ChangePasswordRequest): Promise<any> => {
        return await api.post('/api/v1/account/change-password', data);
    },

    addAddress: async (data: AddressRequest): Promise<any> => {
        return await api.post('/api/v1/address/create', data);
    },

    deleteAddress: async (addressId: number): Promise<any> => {
        return await api.delete(`/api/v1/address/delete/${addressId}`);
    },

    setDefaultAddress: async (addressId: number): Promise<any> => {
        return await api.put(`/api/v1/address/set-default/${addressId}`, {});
    },
};
