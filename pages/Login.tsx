import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { Shield, Loader2, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Use centralized auth service
      const res = await authService.login({
        phone: data.phone,
        password: data.password
      });

      if (res.data.code === 200) {
        // Success
        const { token, userInfo } = res.data.data;
        login(token, userInfo);
        navigate('/');
      } else {
        toast.error(res.data.message || '登录失败，请检查账号密码');
      }
    } catch (error) {
      console.error("Login error", error);
      toast.error('登录服务连接失败，请联系管理员');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-slate-200 overflow-hidden">
         {/* Abstract geometric shapes for corporate feel */}
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-700/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-300/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative z-10 border border-slate-200">
        
        {/* Header */}
        <div className="bg-brand-700 px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-800 opacity-90"></div>
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 mb-4 shadow-lg">
               <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide">南网法险通</h2>
            <p className="text-brand-100 text-sm mt-2 font-light">南方电网法律风险案例管理系统</p>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 py-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            <div className="space-y-1">
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 ml-1">
                账号 / 手机号
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="phone"
                  type="text"
                  {...register('phone', { 
                    required: '请输入手机号',
                    pattern: { value: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号' } 
                  })}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'}`}
                  placeholder="请输入手机号"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs ml-1 mt-1">{errors.phone.message as string}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 ml-1">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  {...register('password', { required: '请输入密码' })}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'}`}
                  placeholder="请输入密码"
                />
              </div>
               {errors.password && <p className="text-red-500 text-xs ml-1 mt-1">{errors.password.message as string}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-8"
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" /> 登录中...
                </span>
              ) : '登 录'}
            </button>
          </form>

          <div className="mt-6 text-center">
             <p className="text-xs text-slate-400">内部系统 · 请妥善保管账号密码</p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 text-center w-full">
        <p className="text-xs text-slate-400 font-light">&copy; {new Date().getFullYear()} 南方电网有限责任公司 版权所有</p>
      </div>
    </div>
  );
};

export default Login;