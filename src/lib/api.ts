/**
 * API配置和工具函数
 */

// API基础配置
export const API_CONFIG = {
  // 直接从环境变量读取API地址，若未配置则使用后端默认本地地址作为回退
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  
  // 请求超时时间
  TIMEOUT: 10000,
  
  // 请求重试次数
  RETRY_COUNT: 3,
} as const;

/**
 * API响应基础接口
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

/**
 * API错误类
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 获取认证头
 */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * 创建带有默认配置的fetch请求
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(), // 自动添加身份验证头
      ...options.headers,
    },
    // 添加超时控制
    signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);
    
    // 检查HTTP状态
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new ApiError(response.status, errorMessage, response);
    }

    // 解析响应
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      // 如果是 ApiError，直接抛出，但先确保有错误信息
      console.error('API错误:', error.status, error.message);
      throw error;
    }
    
    // 处理网络错误、超时等
    if (error instanceof Error) {
      console.error('请求错误:', error.name, error.message);
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new ApiError(408, '请求超时，请检查网络连接');
      }
      throw new ApiError(0, `网络错误: ${error.message}`);
    }
    
    console.error('未知错误:', error);
    throw new ApiError(0, '未知错误');
  }
}

/**
 * GET请求封装
 */
export async function apiGet<T = any>(
  endpoint: string,
  params?: Record<string, any>
): Promise<ApiResponse<T>> {
  let url = endpoint;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return apiFetch<T>(url, { method: 'GET' });
}

/**
 * POST请求封装
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any
): Promise<ApiResponse<T>> {
  const options: RequestInit = {
    method: 'POST',
  };

  if (data) {
    if (data instanceof FormData) {
      // FormData不需要设置Content-Type，浏览器会自动设置
      options.body = data;
      // 保留身份验证头，但清除Content-Type
      options.headers = {
        ...getAuthHeaders(),
      };
    } else {
      options.body = JSON.stringify(data);
    }
  }

  return apiFetch<T>(endpoint, options);
}

/**
 * PUT请求封装
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any
): Promise<ApiResponse<T>> {
  const options: RequestInit = {
    method: 'PUT',
  };

  if (data) {
    if (data instanceof FormData) {
      options.body = data;
      options.headers = {};
    } else {
      options.body = JSON.stringify(data);
    }
  }

  return apiFetch<T>(endpoint, options);
}

/**
 * DELETE请求封装
 */
export async function apiDelete<T = any>(
  endpoint: string
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { method: 'DELETE' });
}

/**
 * 带重试机制的请求
 */
export async function apiWithRetry<T = any>(
  requestFn: () => Promise<ApiResponse<T>>,
  retryCount: number = API_CONFIG.RETRY_COUNT
): Promise<ApiResponse<T>> {
  let lastError: Error;
  
  for (let i = 0; i <= retryCount; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      
      // 如果是客户端错误（4xx），不重试
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // 最后一次尝试，抛出错误
      if (i === retryCount) {
        break;
      }
      
      // 等待一段时间后重试（指数退避）
      const delay = Math.min(1000 * Math.pow(2, i), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
