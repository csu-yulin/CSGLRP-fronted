import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caseService, fileService } from '../services/api';
import { Case, CaseFormData, Attachment } from '../types';
import { useAuth } from '../context/AuthContext';
import CaseModal from '../components/CaseModal';
import { 
  ArrowLeft, Calendar, User, Tag, AlertTriangle, Shield, CheckCircle, 
  FileText, Edit, Trash, Printer, ChevronDown, ChevronUp, Download, 
  Image as ImageIcon, File as FileIcon, Eye, Paperclip, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const CaseDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Attachment State
  const [isAttachmentsExpanded, setIsAttachmentsExpanded] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<Attachment | null>(null);

  const fetchCase = async () => {
    setLoading(true);
    try {
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
        tags: formData.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
        attachments: formData.attachments
    };
    try {
      await caseService.update(id!, payload);
      toast.success("更新成功");
      setIsEditModalOpen(false);
      fetchCase();
    } catch (e) {
      console.error(e);
      toast.error("更新失败");
    }
  };

  const handlePrint = () => {
     window.print();
  };

  // Attachment Logic
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('officedocument')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileText className="w-5 h-5 text-green-500" />;
    return <FileIcon className="w-5 h-5 text-slate-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleAttachmentSelection = (ossKey: string) => {
    const newSet = new Set(selectedAttachments);
    if (newSet.has(ossKey)) {
      newSet.delete(ossKey);
    } else {
      newSet.add(ossKey);
    }
    setSelectedAttachments(newSet);
  };

  const handleBatchDelete = async () => {
    if (selectedAttachments.size === 0) return;
    if (!window.confirm(`确定删除选中的 ${selectedAttachments.size} 个文件吗？`)) return;

    try {
      await fileService.deleteBatch(Array.from(selectedAttachments));
      // Refresh local data optimistically or fetch
      if (data) {
        const remaining = data.attachments?.filter(a => !selectedAttachments.has(a.ossKey)) || [];
        setData({ ...data, attachments: remaining });
        // Also update backend case object to remove reference if needed? 
        // Usually backend handles this relation, but we should update case attachments array via update API if strict consistency needed.
        // Assuming file service delete handles cleanup or we just update display.
        // To be safe, we should also update the case itself to remove references.
        await caseService.update(data.id, { ...data, attachments: remaining });
      }
      setSelectedAttachments(new Set());
      toast.success("批量删除成功");
    } catch (error) {
      toast.error("批量删除失败");
    }
  };

  const handleSingleDelete = async (attachment: Attachment) => {
    if (!window.confirm(`确定删除 ${attachment.fileName} 吗？`)) return;
    try {
      await fileService.delete(attachment.ossKey);
      if (data) {
        const remaining = data.attachments?.filter(a => a.ossKey !== attachment.ossKey) || [];
        setData({ ...data, attachments: remaining });
        await caseService.update(data.id, { ...data, attachments: remaining });
      }
      toast.success("删除成功");
    } catch (e) {
      toast.error("删除失败");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div>
    </div>
  );
  
  if (!data) return <div className="p-10 text-center text-slate-500">未找到案例</div>;

  const hasAttachments = data.attachments && data.attachments.length > 0;
  const showCollapse = hasAttachments && data.attachments!.length > 3;
  // If not expanded and we should collapse, show only 3. Otherwise show all.
  const displayedAttachments = (showCollapse && !isAttachmentsExpanded) 
    ? data.attachments!.slice(0, 3) 
    : (data.attachments || []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 print:pb-0 print:max-w-none">
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300">
             <X className="w-8 h-8" />
          </button>
          <img 
            src={previewImage.url} 
            alt={previewImage.fileName} 
            className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl rounded-lg"
            onClick={(e) => e.stopPropagation()} 
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
             {previewImage.fileName}
          </div>
        </div>
      )}

      {/* Top Nav - Hidden on Print */}
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate('/cases')} className="flex items-center text-slate-500 hover:text-brand-600 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> 返回列表
        </button>
        <button 
          onClick={handlePrint}
          className="text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg flex items-center shadow-sm transition-all" 
          title="打印/导出PDF"
        >
           <Printer className="w-4 h-4 mr-2" /> 打印 / 导出PDF
        </button>
      </div>

      {/* Main Document Card */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        
        {/* Document Header */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-8 md:p-10 relative print:bg-white print:border-b-2 print:border-slate-800 print:p-0 print:pb-6 print:mb-6">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start relative z-10">
             <div className="space-y-4 flex-1">
                <div className="flex flex-wrap gap-2 print:hidden">
                  {data.tags && data.tags.map(tag => (
                    <span key={tag} className="flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-white text-brand-600 border border-brand-100 shadow-sm">
                      <Tag className="w-3 h-3 mr-1.5" /> {tag}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight print:text-2xl">
                  {data.title}
                </h1>
                <div className="flex items-center gap-6 text-sm text-slate-500 pt-2 print:text-xs">
                  <div className="flex items-center bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm print:border-none print:px-0 print:shadow-none">
                    <User className="w-4 h-4 mr-2 text-slate-400" /> <span className="font-medium text-slate-700">{data.author || '匿名'}</span>
                  </div>
                  <div className="flex items-center bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm print:border-none print:px-0 print:shadow-none">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" /> {data.createDate ? new Date(data.createDate).toLocaleDateString() : '未知日期'}
                  </div>
                </div>
             </div>

             {/* Admin Actions - Hidden on Print */}
             {user?.isAdmin && (
               <div className="flex gap-3 flex-shrink-0 print:hidden">
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
          <Shield className="absolute top-8 right-8 w-64 h-64 text-slate-100/50 -rotate-12 pointer-events-none print:hidden" />
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:divide-x divide-slate-100 print:block print:divide-none">
          
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-8 p-8 md:p-10 space-y-10 print:p-0 print:col-span-12">
             
             {/* Section 1 */}
             <section className="print:mb-6">
               <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center print:mb-2 print:text-lg">
                 <span className="w-1.5 h-6 bg-brand-600 mr-3 rounded-full print:hidden"></span>
                 一、案件记录
               </h2>
               <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-justify bg-slate-50 p-6 rounded-xl border border-slate-100 print:bg-white print:p-0 print:border-none print:text-black">
                 {data.caseRecord}
               </div>
             </section>

             {/* Section 2 */}
             <section className="print:mb-6">
               <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center print:mb-2 print:text-lg">
                 <span className="w-1.5 h-6 bg-amber-500 mr-3 rounded-full print:hidden"></span>
                 二、法律规定与风险
               </h2>
               <div className="space-y-6 print:space-y-4">
                 {data.legalProvisions && data.legalProvisions.map((reg, idx) => (
                   <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow print:border print:shadow-none print:break-inside-avoid">
                     <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 flex items-start gap-3 print:bg-slate-100">
                        <FileText className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0 print:text-black" />
                        {reg.lawName}
                     </div>
                     <div className="p-5 text-slate-600 text-sm leading-relaxed print:text-black">
                       {reg.content}
                     </div>
                   </div>
                 ))}
                 
                 {/* Risk Summary */}
                 {data.riskSummary && (
                   <div className="bg-red-50 border border-red-100 rounded-xl p-6 mt-4 relative print:bg-white print:border-slate-300 print:break-inside-avoid">
                     <div className="flex gap-4">
                        <div className="p-2 bg-red-100 rounded-lg h-fit text-red-600 print:hidden">
                           <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="text-red-800 font-bold mb-2 print:text-black">风险总结</h3>
                           <p className="text-red-700/80 leading-relaxed text-sm print:text-black">{data.riskSummary}</p>
                        </div>
                     </div>
                   </div>
                 )}
               </div>
             </section>

             {/* Attachments Section */}
             <section className="print:mb-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center print:text-lg">
                    <span className="w-1.5 h-6 bg-indigo-500 mr-3 rounded-full print:hidden"></span>
                    附件资料
                  </h2>
                  {user?.isAdmin && selectedAttachments.size > 0 && (
                     <button 
                       onClick={handleBatchDelete}
                       className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md flex items-center transition-colors print:hidden"
                     >
                        <Trash className="w-4 h-4 mr-1.5" /> 批量删除 ({selectedAttachments.size})
                     </button>
                  )}
                </div>

                {!hasAttachments ? (
                   <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 text-center text-slate-400 text-sm print:hidden">
                      暂无附件
                   </div>
                ) : (
                  <div className="space-y-3">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:grid-cols-2">
                        {displayedAttachments.map((file) => (
                           <div key={file.ossKey} className={`relative flex items-center p-3 rounded-lg border bg-white transition-all group ${
                              selectedAttachments.has(file.ossKey) ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-200 hover:shadow-sm'
                           } print:border-slate-300`}>
                              
                              {/* Checkbox for Admin - Moved to left side to prevent overlap */}
                              {user?.isAdmin && (
                                 <div className="flex-shrink-0 mr-3">
                                    <input 
                                       type="checkbox" 
                                       className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer opacity-0 group-hover:opacity-100 checked:opacity-100 transition-opacity block"
                                       checked={selectedAttachments.has(file.ossKey)}
                                       onChange={() => toggleAttachmentSelection(file.ossKey)}
                                    />
                                 </div>
                              )}

                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mr-3 text-slate-500 flex-shrink-0 print:bg-white print:border print:border-slate-200">
                                 {getFileIcon(file.fileType)}
                              </div>
                              <div className="flex-1 min-w-0 mr-3">
                                 <p className="text-sm font-medium text-slate-700 truncate mb-0.5" title={file.fileName}>{file.fileName}</p>
                                 <div className="flex items-center text-xs text-slate-400">
                                    <span className="mr-2">{formatSize(file.fileSize)}</span>
                                    <span>{file.uploadDate?.split('T')[0]}</span>
                                 </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-1 print:hidden">
                                 {file.fileType.startsWith('image/') ? (
                                    <button 
                                      onClick={() => setPreviewImage(file)}
                                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded" 
                                      title="预览"
                                    >
                                       <Eye className="w-4 h-4" />
                                    </button>
                                 ) : (
                                    <a 
                                      href={file.url} 
                                      download={file.fileName}
                                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" 
                                      title="下载"
                                    >
                                       <Download className="w-4 h-4" />
                                    </a>
                                 )}
                                 {user?.isAdmin && (
                                    <button 
                                      onClick={() => handleSingleDelete(file)}
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity" 
                                      title="删除"
                                    >
                                       <Trash className="w-4 h-4" />
                                    </button>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                     
                     {/* Show More / Less */}
                     {showCollapse && (
                        <button 
                           onClick={() => setIsAttachmentsExpanded(!isAttachmentsExpanded)}
                           className="w-full py-2 flex items-center justify-center text-sm text-slate-500 hover:text-brand-600 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all print:hidden"
                        >
                           {isAttachmentsExpanded ? (
                              <>收起附件 <ChevronUp className="w-4 h-4 ml-1" /></>
                           ) : (
                              <>查看全部 {data.attachments!.length} 个附件 <ChevronDown className="w-4 h-4 ml-1" /></>
                           )}
                        </button>
                     )}
                  </div>
                )}
             </section>
          </div>

          {/* Right Column (Measures) */}
          <div className="lg:col-span-4 bg-slate-50/30 p-8 md:p-10 print:p-0 print:bg-white print:mt-6">
             <div className="sticky top-8 print:static">
               <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center print:mb-2 print:text-lg">
                 <span className="w-1.5 h-6 bg-emerald-500 mr-3 rounded-full print:hidden"></span>
                 三、防控措施
               </h2>
               <div className="bg-white border border-emerald-100 rounded-xl p-6 shadow-soft relative overflow-hidden print:border print:border-slate-300 print:shadow-none print:p-4">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 z-0 print:hidden"></div>
                  <ul className="space-y-6 relative z-10 print:space-y-2">
                    {data.preventionMeasures && data.preventionMeasures.map((m, idx) => (
                      <li key={idx} className="flex gap-4 group print:gap-2">
                        <div className="flex-none pt-0.5">
                           <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold border border-emerald-200 shadow-sm print:border-slate-400 print:text-black print:bg-white">
                              {idx + 1}
                           </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed pt-0.5 font-medium print:text-black">{m}</p>
                      </li>
                    ))}
                  </ul>
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