import axios from 'axios';
import toast from 'react-hot-toast';
import { ApiResponse, LoginData, PageResponse, Case, TagStat, User } from '../types';

// ----------------------------------------------------------------------
// API CONFIGURATION
// ----------------------------------------------------------------------

const api = axios.create({
  baseURL: 'http://csuyulin.natapp1.cc/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login page to avoid loops
        if (!window.location.hash.includes('/login')) {
           window.location.href = '/#/login';
           toast.error('登录已过期，请重新登录');
        }
      } else if (status === 403) {
        toast.error('您没有权限执行此操作');
      } else if (status >= 500) {
        toast.error('服务器内部错误，请稍后重试');
      } else {
        toast.error(error.response.data?.message || '请求处理失败');
      }
    } else if (error.request) {
      // The request was made but no response was received
      toast.error('无法连接到服务器，请检查网络');
    } else {
      // Something happened in setting up the request that triggered an Error
      toast.error('请求配置错误');
    }
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------
// SERVICE DEFINITIONS
// ----------------------------------------------------------------------

export const authService = {
  /**
   * 用户登录
   */
  login: (data: { phone: string; password?: string }) => 
    api.post<ApiResponse<LoginData>>('/auth/login', data),
  
  /**
   * 获取当前用户信息
   */
  getCurrentUser: () => 
    api.get<ApiResponse<User>>('/auth/me'),
};

export const caseService = {
  /**
   * 获取案例列表（支持分页、搜索、筛选）
   */
  getList: (params?: { 
    page?: number; 
    size?: number; 
    keyword?: string; 
    tags?: string[]; 
    author?: string; 
    sortBy?: string; 
    sortDir?: string 
  }) => 
    api.get<ApiResponse<PageResponse<Case>>>('/cases', { params }),
    
  /**
   * 获取案例详情
   */
  getById: (id: string) => 
    api.get<ApiResponse<Case>>(`/cases/${id}`),
    
  /**
   * 创建新案例
   */
  create: (data: any) => 
    api.post<ApiResponse<Case>>('/cases', data),
    
  /**
   * 更新案例
   */
  update: (id: string, data: any) => 
    api.put<ApiResponse<Case>>(`/cases/${id}`, data),
    
  /**
   * 删除案例
   */
  delete: (id: string) => 
    api.delete<ApiResponse<void>>(`/cases/${id}`),
    
  /**
   * 获取所有标签统计
   */
  getTags: () => 
    api.get<ApiResponse<TagStat[]>>('/cases/tags'),
};

export default api;