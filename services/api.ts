import axios from 'axios';
import toast from 'react-hot-toast';
import { ApiResponse, LoginData, PageResponse, Case, TagStat, User, Attachment } from '../types';

// ----------------------------------------------------------------------
// API CONFIGURATION
// ----------------------------------------------------------------------

const api = axios.create({
  baseURL: 'http://csuyulin.natapp1.cc/api',
  timeout: 30000, // Increased timeout for uploads
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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
      toast.error('无法连接到服务器，请检查网络');
    } else {
      toast.error('请求配置错误');
    }
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------
// SERVICE DEFINITIONS
// ----------------------------------------------------------------------

export const authService = {
  login: (data: { phone: string; password?: string }) => 
    api.post<ApiResponse<LoginData>>('/auth/login', data),
  
  getCurrentUser: () => 
    api.get<ApiResponse<User>>('/auth/me'),
};

export const caseService = {
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
    
  getById: (id: string) => 
    api.get<ApiResponse<Case>>(`/cases/${id}`),
    
  create: (data: any) => 
    api.post<ApiResponse<Case>>('/cases', data),
    
  update: (id: string, data: any) => 
    api.put<ApiResponse<Case>>(`/cases/${id}`, data),
    
  delete: (id: string) => 
    api.delete<ApiResponse<void>>(`/cases/${id}`),
    
  getTags: () => 
    api.get<ApiResponse<TagStat[]>>('/cases/tags'),
};

export const fileService = {
  /**
   * 上传单个文件
   */
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<Attachment>>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * 批量上传文件
   */
  uploadBatch: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post<ApiResponse<Attachment[]>>('/files/upload/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * 删除单个文件 (通过 query param 传递 ossKey)
   */
  delete: (ossKey: string) => 
    api.delete<ApiResponse<void>>(`/files`, { params: { ossKey } }),

  /**
   * 批量删除文件
   */
  deleteBatch: (ossKeys: string[]) => 
    api.delete<ApiResponse<void>>('/files/batch', { data: ossKeys })
};

export default api;