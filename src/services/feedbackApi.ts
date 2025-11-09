/**
 * 意见反馈 API 服务
 */

import { apiPost } from '@/lib/api';

export interface FeedbackData {
  name: string;
  email: string;
  subject: string;
  content: string;
  verification_code: string;
}

export interface FeedbackResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    submitted_at: string;
  };
}

/**
 * 意见反馈 API 类
 */
export class FeedbackApi {
  private baseUrl = '/feedback';

  /**
   * 提交意见反馈
   */
  async submitFeedback(data: FeedbackData): Promise<FeedbackResponse> {
    try {
      const response = await apiPost<FeedbackResponse>(`${this.baseUrl}/submit`, data);
      return response;
    } catch (error) {
      console.error('提交意见反馈失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const feedbackApi = new FeedbackApi();

