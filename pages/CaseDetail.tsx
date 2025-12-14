import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caseService } from '../services/api';
import { Case, CaseFormData } from '../types';
import { useAuth } from '../context/AuthContext';
import CaseModal from '../components/CaseModal';
import { ArrowLeft, Calendar, User, Tag, AlertTriangle, Shield, CheckCircle, FileText, Edit, Trash, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

const CaseDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchCase = async () => {
    setLoading(true);
    try {
      // Use caseService.getById
      const res = await caseService.getById(id!);
      if (res.data.code === 200) {
        setData(res.data.data);
      } else {
        toast.error(res.data.message);
        navigate('/cases');
      }
    } catch (error) {
       console.error(error);
       toast.error("加载案例详情失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    if(!window.confirm("确定删除此案例?")) return;
    try {
      // Use caseService.delete
      await caseService.delete(id!);
      toast.success("已删除");
      navigate('/cases');
    } catch(e) {
      toast.error("删除失败");
    }
  };

  const handleUpdate = async (formData: CaseFormData) => {
    const payload = {
        title: formData.title,
        caseRecord: formData.caseRecord,
        riskSummary: formData.riskSummary,
        legalProvisions: formData.legalProvisions,
        preventionMeasures: formData.preventionMeasures.map(m => m.value).filter(Boolean),
        tags: formData.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
    };
    try {
      // Use caseService.update
      await caseService.update(id!, payload);
      toast.success("更新成功");
      setIsEditModalOpen(false);
      fetchCase();
    } catch (e) {
      console.error(e);
      toast.error("更新失败");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div>
    </div>
  );
  
  if (!data) return <div className="p-10 text-center text-slate-500">未找到案例</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/cases')} className="flex items-center text-slate-500 hover:text-brand-600 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> 返回列表
        </button>
        <button className="text-slate-400 hover:text-slate-600" title="打印/导出">
           <Printer className="w-5 h-5" />
        </button>
      </div>

      {/* Main Document Card */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden">
        
        {/* Document Header */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-8 md:p-10 relative">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start relative z-10">
             <div className="space-y-4 flex-1">
                <div className="flex flex-wrap gap-2">
                  {data.tags && data.tags.map(tag => (
                    <span key={tag} className="flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-white text-brand-600 border border-brand-100 shadow-sm">
                      <Tag className="w-3 h-3 mr-1.5" /> {tag}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                  {data.title}
                </h1>
                <div className="flex items-center gap-6 text-sm text-slate-500 pt-2">
                  <div className="flex items-center bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                    <User className="w-4 h-4 mr-2 text-slate-400" /> <span className="font-medium text-slate-700">{data.author || '匿名'}</span>
                  </div>
                  <div className="flex items-center bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" /> {data.createDate ? new Date(data.createDate).toLocaleDateString() : '未知日期'}
                  </div>
                </div>
             </div>

             {/* Admin Actions */}
             {user?.isAdmin && (
               <div className="flex gap-3 flex-shrink-0">
                 <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-all shadow-sm font-medium"
                 >
                   <Edit className="w-4 h-4 mr-2" /> 编辑
                 </button>
                 <button 
                    onClick={handleDelete}
                    className="flex items-center px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-100 rounded-lg transition-all shadow-sm font-medium"
                 >
                   <Trash className="w-4 h-4 mr-2" /> 删除
                 </button>
               </div>
             )}
          </div>
          
          {/* Watermark/Decoration */}
          <Shield className="absolute top-8 right-8 w-64 h-64 text-slate-100/50 -rotate-12 pointer-events-none" />
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:divide-x divide-slate-100">
          
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-8 p-8 md:p-10 space-y-10">
             
             {/* Section 1 */}
             <section>
               <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                 <span className="w-1.5 h-6 bg-brand-600 mr-3 rounded-full"></span>
                 一、案件记录
               </h2>
               <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-justify bg-slate-50 p-6 rounded-xl border border-slate-100">
                 {data.caseRecord}
               </div>
             </section>

             {/* Section 2 */}
             <section>
               <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                 <span className="w-1.5 h-6 bg-amber-500 mr-3 rounded-full"></span>
                 二、法律规定与风险
               </h2>
               <div className="space-y-6">
                 {data.legalProvisions && data.legalProvisions.map((reg, idx) => (
                   <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                     <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 flex items-start gap-3">
                        <FileText className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        {reg.lawName}
                     </div>
                     <div className="p-5 text-slate-600 text-sm leading-relaxed">
                       {reg.content}
                     </div>
                   </div>
                 ))}
                 
                 {/* Risk Summary */}
                 {data.riskSummary && (
                   <div className="bg-red-50 border border-red-100 rounded-xl p-6 mt-4 relative">
                     <div className="flex gap-4">
                        <div className="p-2 bg-red-100 rounded-lg h-fit text-red-600">
                           <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="text-red-800 font-bold mb-2">风险总结</h3>
                           <p className="text-red-700/80 leading-relaxed text-sm">{data.riskSummary}</p>
                        </div>
                     </div>
                   </div>
                 )}
               </div>
             </section>
          </div>

          {/* Right Column (Measures) */}
          <div className="lg:col-span-4 bg-slate-50/30 p-8 md:p-10">
             <div className="sticky top-8">
               <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                 <span className="w-1.5 h-6 bg-emerald-500 mr-3 rounded-full"></span>
                 三、防控措施
               </h2>
               <div className="bg-white border border-emerald-100 rounded-xl p-6 shadow-soft relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                  <ul className="space-y-6 relative z-10">
                    {data.preventionMeasures && data.preventionMeasures.map((m, idx) => (
                      <li key={idx} className="flex gap-4 group">
                        <div className="flex-none pt-0.5">
                           <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold border border-emerald-200 shadow-sm group-hover:scale-110 transition-transform">
                              {idx + 1}
                           </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed pt-0.5 font-medium">{m}</p>
                      </li>
                    ))}
                  </ul>
               </div>
               
               {/* Quick Info Box */}
               <div className="mt-8 bg-slate-100 rounded-xl p-5 border border-slate-200">
                  <h4 className="font-bold text-slate-700 mb-3 text-sm">系统提示</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                     本文档由系统自动生成，法律条款更新具有时效性，请在实际应用中核对最新法规。
                  </p>
               </div>
             </div>
          </div>

        </div>
      </div>

      <CaseModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdate}
        initialData={data}
        isSubmitting={false}
      />
    </div>
  );
};

export default CaseDetail;