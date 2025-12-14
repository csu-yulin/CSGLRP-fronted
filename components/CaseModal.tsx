import React, { useEffect } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { X, Plus, Trash2, Save, FileText, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';
import { Case, CaseFormData } from '../types';

interface CaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CaseFormData) => Promise<void>;
  initialData?: Case | null;
  isSubmitting: boolean;
}

const CaseModal: React.FC<CaseModalProps> = ({ isOpen, onClose, onSubmit, initialData, isSubmitting }) => {
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<CaseFormData>({
    defaultValues: {
      title: '',
      caseRecord: '',
      riskSummary: '',
      tags: '',
      legalProvisions: [{ lawName: '', content: '' }],
      preventionMeasures: [{ value: '' }]
    }
  });

  const { fields: regFields, append: appendReg, remove: removeReg } = useFieldArray({
    control,
    name: "legalProvisions"
  });

  const { fields: measFields, append: appendMeas, remove: removeMeas } = useFieldArray({
    control,
    name: "preventionMeasures"
  });

  // Effect to handle body scroll lock and reset data
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (initialData) {
        reset({
          title: initialData.title,
          caseRecord: initialData.caseRecord,
          riskSummary: initialData.riskSummary,
          tags: initialData.tags ? initialData.tags.join(', ') : '',
          legalProvisions: initialData.legalProvisions && initialData.legalProvisions.length > 0 
            ? initialData.legalProvisions 
            : [{ lawName: '', content: '' }],
          preventionMeasures: initialData.preventionMeasures && initialData.preventionMeasures.length > 0 
            ? initialData.preventionMeasures.map(m => ({ value: m })) 
            : [{ value: '' }]
        });
      } else {
        reset({
          title: '',
          caseRecord: '',
          riskSummary: '',
          tags: '',
          legalProvisions: [{ lawName: '', content: '' }],
          preventionMeasures: [{ value: '' }]
        });
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, initialData, reset]);

  const onFormSubmit: SubmitHandler<CaseFormData> = async (data) => {
    await onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-4xl bg-white shadow-drawer flex flex-col h-full transform transition-transform animate-slide-in-right">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                {initialData ? '编辑案例' : '新增法律风险案例'}
                <span className={`text-xs font-normal px-2.5 py-0.5 rounded-full border ${initialData ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-brand-50 text-brand-700 border-brand-200'}`}>
                  {initialData ? 'Edit Mode' : 'New Entry'}
                </span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">请填写完整的案件详情、法律依据及防控措施。</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-slate-50/50">
            <form id="case-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-10 max-w-3xl mx-auto">
              
              {/* Basic Info Section */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center border-b border-slate-100 pb-4">
                   <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mr-3">
                      <FileText className="w-4 h-4" />
                   </div>
                   <h3 className="text-base font-bold text-slate-800">基本信息</h3>
                </div>
                
                <div className="grid gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">案例标题 <span className="text-red-500">*</span></label>
                    <input
                      {...register("title", { required: "请输入标题" })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder-slate-400 font-medium"
                      placeholder="例如：关于xxx窃电纠纷案"
                    />
                    {errors.title && <span className="text-red-500 text-xs mt-1">{errors.title.message}</span>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between">
                      标签 
                      <span className="text-slate-400 font-normal text-xs flex items-center"><HelpCircle className="w-3 h-3 mr-1"/> 用逗号分隔多个标签</span>
                    </label>
                    <input
                      {...register("tags")}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none placeholder-slate-400"
                      placeholder="例如：盗电, 窃电, 民事纠纷"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">案件记录 <span className="text-red-500">*</span></label>
                    <textarea
                      {...register("caseRecord", { required: "请输入案件记录" })}
                      rows={8}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none leading-relaxed resize-y min-h-[150px]"
                      placeholder="详细描述案件发生的背景、经过、处理结果..."
                    />
                    {errors.caseRecord && <span className="text-red-500 text-xs mt-1">{errors.caseRecord.message}</span>}
                  </div>
                </div>
              </div>

              {/* Regulations Section */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center">
                     <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mr-3">
                        <ShieldAlert className="w-4 h-4" />
                     </div>
                     <h3 className="text-base font-bold text-slate-800">法律规定与风险</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendReg({ lawName: '', content: '' })}
                    className="text-xs font-medium flex items-center text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3 mr-1" /> 添加法规
                  </button>
                </div>

                <div className="space-y-4">
                  {regFields.map((field, index) => (
                    <div key={field.id} className="p-5 bg-slate-50/80 border border-slate-200 rounded-lg relative group hover:bg-white hover:border-brand-200 hover:shadow-sm transition-all">
                      <button
                        type="button"
                        onClick={() => removeReg(index)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="space-y-3">
                        <div>
                          <input
                            {...register(`legalProvisions.${index}.lawName` as const, { required: true })}
                            placeholder="法规名称 (如: 《电力法》第三十三条)"
                            className="w-full bg-transparent border-b border-slate-200 focus:border-brand-500 px-0 py-1.5 text-sm font-bold text-slate-800 placeholder-slate-400 outline-none"
                          />
                        </div>
                        <div>
                          <textarea
                            {...register(`legalProvisions.${index}.content` as const, { required: true })}
                            rows={4}
                            placeholder="法规具体内容..."
                            className="w-full bg-transparent border-none px-0 py-1.5 text-sm text-slate-600 focus:ring-0 placeholder-slate-400 resize-y"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-2">
                   <label className="block text-sm font-semibold text-slate-700 mb-2">风险总结</label>
                   <div className="relative">
                      <div className="absolute top-3 left-3 text-red-500">
                         <ShieldAlert className="w-4 h-4" />
                      </div>
                      <textarea
                        {...register("riskSummary")}
                        rows={3}
                        className="w-full bg-red-50/30 border border-red-100 rounded-lg pl-10 pr-4 py-3 text-slate-700 focus:ring-2 focus:ring-red-500/10 focus:border-red-300 outline-none resize-y"
                        placeholder="对上述风险进行综合研判，重点提示..."
                      />
                   </div>
                </div>
              </div>

              {/* Measures Section */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center">
                     <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3">
                        <CheckCircle className="w-4 h-4" />
                     </div>
                     <h3 className="text-base font-bold text-slate-800">防控措施</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendMeas({ value: '' })}
                    className="text-xs font-medium flex items-center text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3 mr-1" /> 添加措施
                  </button>
                </div>

                <div className="space-y-3">
                  {measFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-3 group">
                      <div className="flex-none pt-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold border border-emerald-200">
                           {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 relative">
                        <textarea
                          {...register(`preventionMeasures.${index}.value` as const, { required: true })}
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all group-hover:bg-white resize-y"
                          placeholder="请输入具体的防控措施..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMeas(index)}
                        className="flex-none pt-2.5 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-8 py-5 flex justify-end gap-4 bg-white z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-all shadow-sm"
            >
              取消
            </button>
            <button
              type="submit"
              form="case-form"
              disabled={isSubmitting}
              className="flex items-center px-8 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-lg shadow-md hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseModal;