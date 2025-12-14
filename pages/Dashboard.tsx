import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Activity, AlertTriangle, CheckCircle, ArrowRight, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { caseService } from '../services/api';
import { Case } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState({
    totalCases: 0,
    topTag: { tag: '暂无', count: 0 },
    recentCases: [] as Case[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Get Total Cases (fetch page 1 size 5 just to get totalElements and recent list)
        // Use caseService.getList
        const casesRes = await caseService.getList({
          page: 1, 
          size: 5, 
          sortDir: 'desc', 
          sortBy: 'createDate' 
        });
        
        // 2. Get Tags to find top risk type
        // Use caseService.getTags
        const tagsRes = await caseService.getTags();
        
        if (casesRes.data.code === 200 && tagsRes.data.code === 200) {
           const tags = tagsRes.data.data;
           const topTag = tags.length > 0 
             ? tags.reduce((prev, current) => (prev.count > current.count) ? prev : current)
             : { tag: '暂无', count: 0 };

           setStatsData({
             totalCases: casesRes.data.data.totalElements,
             topTag: topTag,
             recentCases: casesRes.data.data.content
           });
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { 
      label: '总案例归档', 
      value: loading ? '-' : statsData.totalCases, 
      icon: FileText, 
      color: 'text-brand-600', 
      bg: 'bg-brand-50', 
      border: 'border-brand-100' 
    },
    { 
      label: '主要风险类型', 
      value: loading ? '-' : statsData.topTag.tag, 
      subValue: loading ? '' : `${statsData.topTag.count} 起`,
      icon: AlertTriangle, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50', 
      border: 'border-amber-100' 
    },
    { 
      label: '近期更新', 
      value: loading ? '-' : statsData.recentCases.length, 
      icon: Clock, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      border: 'border-emerald-100' 
    },
    { 
      label: '系统状态', 
      value: '运行正常', 
      icon: Activity, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50', 
      border: 'border-indigo-100' 
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-700 to-brand-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <Shield className="w-64 h-64 -translate-y-1/2 translate-x-1/4" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-bold mb-3">
            下午好，{user?.name}
          </h1>
          <p className="text-brand-100 mb-6 text-lg font-light">
            欢迎回到南网法险通。系统目前共收录 <span className="font-bold text-white">{loading ? '...' : statsData.totalCases}</span> 条法律风险案例。
          </p>
          <Link to="/cases" className="inline-flex items-center px-5 py-2.5 bg-white text-brand-700 rounded-lg font-medium text-sm hover:bg-brand-50 transition-colors shadow-sm">
            进入案例库 <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`bg-white p-6 rounded-xl border ${stat.border} shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">实时</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-slate-800 tracking-tight">{stat.value}</p>
                {stat.subValue && <span className="text-sm text-slate-400 font-medium">{stat.subValue}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Recent Cases List */}
         <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
               <h3 className="font-bold text-slate-800 text-lg flex items-center">
                 <Clock className="w-5 h-5 mr-2 text-brand-600" /> 最新入库案例
               </h3>
               <Link to="/cases" className="text-sm text-brand-600 hover:text-brand-700 font-medium">查看全部</Link>
            </div>
            
            {loading ? (
              <div className="p-6 text-center text-slate-400">加载中...</div>
            ) : statsData.recentCases.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {statsData.recentCases.map((c) => (
                  <Link to={`/cases/${c.id}`} key={c.id} className="block p-4 hover:bg-slate-50 transition-colors group">
                     <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                           <h4 className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-700">{c.title}</h4>
                           <div className="flex items-center mt-1 text-xs text-slate-500">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 mr-2">{c.author || '匿名'}</span>
                              <span>{c.createDate ? new Date(c.createDate).toLocaleDateString() : ''}</span>
                           </div>
                        </div>
                        <div className="flex gap-1">
                           {c.tags?.slice(0, 2).map(tag => (
                             <span key={tag} className="px-2 py-0.5 text-xs bg-brand-50 text-brand-600 rounded-full border border-brand-100 whitespace-nowrap">
                               {tag}
                             </span>
                           ))}
                        </div>
                     </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">暂无数据</div>
            )}
         </div>
         
         {/* Shortcuts */}
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">快捷操作</h3>
            <div className="space-y-3">
               <Link to="/cases" className="w-full text-left p-4 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-brand-50 transition-colors flex items-center group">
                  <span className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mr-4 group-hover:bg-brand-200 group-hover:text-brand-700 shadow-sm">
                     <FileText className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="block text-sm font-bold text-slate-700 group-hover:text-brand-800">新增风险案例</span>
                    <span className="text-xs text-slate-500">录入新的法律纠纷或风险事件</span>
                  </div>
               </Link>
               
               <Link to="/tags" className="w-full text-left p-4 rounded-lg border border-slate-100 hover:border-amber-200 hover:bg-amber-50 transition-colors flex items-center group">
                  <span className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-4 group-hover:bg-amber-200 group-hover:text-amber-700 shadow-sm">
                     <AlertTriangle className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="block text-sm font-bold text-slate-700 group-hover:text-amber-800">风险分布统计</span>
                    <span className="text-xs text-slate-500">查看各类风险占比与趋势</span>
                  </div>
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;