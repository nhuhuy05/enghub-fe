import apiClient from '@/api/apiClient';
import type { ApiResponse } from '@/types/apiTypes';
import type { MediaAsset, MediaAutoLinkResult } from '../types/adminTestTypes';

export const testMediaService = {
  getTestMedia: async (testId: number): Promise<ApiResponse<MediaAsset[]>> => {
    const response = await apiClient.get<ApiResponse<MediaAsset[]>>(`/admin/tests/${testId}/media`);
    return response.data;
  },

  autoLinkMedia: async (testId: number): Promise<ApiResponse<MediaAutoLinkResult>> => {
    const response = await apiClient.post<ApiResponse<MediaAutoLinkResult>>(`/admin/tests/${testId}/media/auto-link`);
    return response.data;
  },

  uploadMedia: async (
    testId: number,
    file: File,
    label: string,
    type: 'image' | 'audio'
  ): Promise<ApiResponse<MediaAsset>> => {
    const formData = new FormData();
    formData.append('file', file);

    const url = `/admin/tests/${testId}/media?label=${encodeURIComponent(label)}&type=${type}&mediaType=${type}`;
    const response = await apiClient.post<ApiResponse<MediaAsset>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateMedia: async (testId: number, mediaAssetId: number, file: File): Promise<ApiResponse<MediaAsset>> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.put<ApiResponse<MediaAsset>>(
      `/admin/tests/${testId}/media/${mediaAssetId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  deleteMedia: async (testId: number, mediaAssetId: number): Promise<ApiResponse<string>> => {
    const response = await apiClient.delete<ApiResponse<string>>(`/admin/tests/${testId}/media/${mediaAssetId}`);
    return response.data;
  },
};
