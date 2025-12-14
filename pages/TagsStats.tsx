import React, { useEffect, useState } from 'react';
import { caseService } from '../services/api';
import { TagStat } from '../types';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Hash, ArrowRight, BarChart3 } from 'lucide-react';

const TagsStats: React.FC = () => {
  const [tags, setTags] = useState<TagStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        // Use caseService.getTags
        const res = await caseService.getTags();
        if (res.data.code === 200) {
           setTags(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch tags", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  const COLORS = ['#005bac', '#3b82f6', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">标签统计分析</h1>
        <p className="text-slate-500 mt-1 text-sm md:text-base">全维度法律风险类型分布视图</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 min-h-[300px] md:min-h-[400px] shadow-card">
          <div className="flex items-center justify-between mb-4 md:mb-6">
             <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 mr-2 text-brand-600" /> 占比分析
             </h3>
          </div>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tags as any[]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="tag"
                >
                  {tags.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#334155' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* List */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card flex flex-col">
          <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-base md:text-lg font-bold text-slate-800">详细列表</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] md:max-h-[400px] custom-scrollbar">
            {tags.sort((a,b) => b.count - a.count).map((tagData, idx) => (
              <Link 
                to={`/cases?tag=${tagData.tag}`} 
                key={tagData.tag}
                className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group"
              >
                <div className="flex items-center">
                  <span className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full text-[10px] md:text-xs font-bold mr-3 md:mr-4 ${idx < 3 ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-slate-700 text-sm md:text-base font-medium group-hover:text-brand-700 transition-colors">{tagData.tag}</span>
                </div>
                <div className="flex items-center text-slate-400 group-hover:text-brand-500 transition-colors">
                  <span className="mr-2 md:mr-3 text-xs md:text-sm font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-100 group-hover:border-brand-100 group-hover:bg-brand-50">{tagData.count} 案例</span>
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* Cloud Visual */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-8 shadow-card">
         <h3 className="text-base md:text-lg font-bold text-slate-800 mb-4 md:mb-6 flex items-center">
            <Hash className="w-4 h-4 md:w-5 md:h-5 mr-2 text-brand-600" /> 词云概览
         </h3>
         <div className="flex flex-wrap gap-2 md:gap-3">
            {tags.map((tagData) => {
               // Calculate relative size
               const max = Math.max(...tags.map(t => t.count));
               const isPopular = tagData.count > max * 0.7;
               const isMedium = tagData.count > max * 0.4;
               
               const sizeClass = isPopular ? 'text-base md:text-lg px-3 py-1.5 md:px-5 md:py-2.5 font-bold' : 
                                 isMedium ? 'text-sm md:text-base px-2.5 py-1 md:px-4 md:py-2 font-medium' : 
                                 'text-xs md:text-sm px-2 py-1 md:px-3 md:py-1.5';
                                 
               const colorClass = isPopular ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 hover:bg-brand-700' : 
                                  isMedium ? 'bg-brand-50 text-brand-700 border border-brand-100 hover:bg-brand-100' :
                                  'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-600';
                                  
               return (
                  <Link 
                    key={tagData.tag}
                    to={`/cases?tag=${tagData.tag}`}
                    className={`rounded-full transition-all transform hover:scale-105 ${sizeClass} ${colorClass}`}
                  >
                     {tagData.tag}
                  </Link>
               )
            })}
         </div>
      </div>
    </div>
  );
};

export default TagsStats;