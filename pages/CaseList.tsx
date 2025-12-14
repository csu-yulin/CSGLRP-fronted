import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { caseService } from '../services/api';
import { Case, CaseFormData, TagStat } from '../types';
import CaseModal from '../components/CaseModal';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Plus, Search, Filter, ChevronLeft, ChevronRight, 
  FileText, Trash2, Edit2, Download, SlidersHorizontal, 
  Clock, Tag as TagIcon, Eye, ArrowUpDown, RotateCcw
} from 'lucide-react';

const CaseList: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  
  // Real Statistics State
  const [statsData, setStatsData] = useState({
    totalCount: 0,
    topTagName: '...',
    uniqueTagsCount: 0,
    recentCount: 0
  });

  // Filters
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [availableTags, setAvailableTags] = useState<TagStat[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Tags and Calculate Stats
  useEffect(() => {
    caseService.getTags().then(res => {
      if (res.data.code === 200) {
        const tags = res.data.data;
        setAvailableTags(tags);
        
        // Calculate Tag Stats
        const topTag = tags.length > 0 
          ? tags.reduce((prev, current) => (prev.count > current.count) ? prev : current)
          : { tag: '暂无', count: 0 };
        
        setStatsData(prev => ({
          ...prev,
          topTagName: topTag.tag,
          uniqueTagsCount: tags.length
        }));
      }
    });
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: page, 
        size: 10,
        sortDir: sortDir,
        sortBy: 'createDate'
      };
      if (keyword) params.keyword = keyword;
      if (selectedTag) params.tags = [selectedTag]; 

      // Use caseService
      const res = await caseService.getList(params);
      
      if (res.data.code === 200) {
        setCases(res.data.data.content);
        setTotalPages(res.data.data.totalPages);
        setTotalElements(res.data.data.totalElements);
        
        // Update stats based on real response
        setStatsData(prev => ({
          ...prev,
          totalCount: res.data.data.totalElements,
          // Since we are sorting by date desc, the count of this page represents "recent" roughly
          recentCount: res.data.data.content.length 
        }));
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('获取案例列表失败');
    } finally {
      setLoading(false);
    }
  };

  // Sync filters to URL
  useEffect(() => {
    const params: any = {};
    if (keyword) params.keyword = keyword;
    if (selectedTag) params.tag = selectedTag;
    setSearchParams(params);
  }, [keyword, selectedTag, setSearchParams]);

  // Fetch when page or filters change
  useEffect(() => {
    fetchCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, keyword, selectedTag, sortDir]);

  const handleCreateOrUpdate = async (data: CaseFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: data.title,
        caseRecord: data.caseRecord,
        riskSummary: data.riskSummary,
        legalProvisions: data.legalProvisions,
        preventionMeasures: data.preventionMeasures.map(m => m.value).filter(Boolean),
        tags: data.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
        attachments: data.attachments // Added attachments here
      };

      if (editingCase) {
        await caseService.update(editingCase.id, payload);
        toast.success('案例更新成功');
      } else {
        await caseService.create(payload);
        toast.success('案例创建成功');
      }
      setIsModalOpen(false);
      setEditingCase(null);
      fetchCases();
      // Refresh tags
      caseService.getTags().then(res => res.data.code === 200 && setAvailableTags(res.data.data));
    } catch (error) {
      console.error(error);
      toast.error('操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch full details before editing
  const handleEditClick = async (id: string) => {
    const loadingToast = toast.loading('正在加载详情...');
    try {
      const res = await caseService.getById(id);
      if (res.data.code === 200) {
        setEditingCase(res.data.data);
        setIsModalOpen(true);
      } else {
        toast.error('加载案例详情失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('网络请求失败');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个案例吗？此操作无法撤销。')) return;
    try {
      await caseService.delete(id);
      toast.success('删除成功');
      fetchCases();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handlePageChange = (newPage: number) => {
     if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
     }
  };

  // Toggle Filters or Sort
  const handleFilterOrSort = () => {
    if (keyword || selectedTag) {
      // Reset Mode
      setKeyword('');
      setSelectedTag('');
      setPage(1);
      toast.success('筛选条件已重置');
    } else {
      // Sort Toggle Mode
      const newDir = sortDir === 'desc' ? 'asc' : 'desc';
      setSortDir(newDir);
      toast.success(newDir === 'desc' ? '已按时间倒序排列 (最新在前)' : '已按时间正序排列 (最早在前)');
    }
  };

  // Dynamic Stats configuration
  const stats = [
    { label: '总案例数', value: statsData.totalCount, icon: FileText, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: '当前展示', value: statsData.recentCount, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '高频标签', value: statsData.topTagName, icon: TagIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '标签总数', value: statsData.uniqueTagsCount, icon: Filter, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header & Stats */}
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">案例管理库</h1>
              <p className="text-slate-500 text-xs md:text-sm mt-1">集中管理法律风险案例，支持多维检索与分析</p>
           </div>
           {user?.isAdmin && (
             <div className="hidden md:block">
                <button
                  onClick={() => { setEditingCase(null); setIsModalOpen(true); }}
                  className="flex items-center px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-lg shadow-brand-500/30 transition-all font-medium"
                >
                  <Plus className="w-5 h-5 mr-2" /> 新增案例
                </button>
             </div>
           )}
        </div>

        {/* Stats Cards - Now using real data */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
           {stats.map((stat, idx) => (
             <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 md:p-4 shadow-sm flex items-center justify-between">
                <div className="min-w-0">
                   <p className="text-[10px] md:text-xs text-slate-500 font-medium mb-1 truncate">{stat.label}</p>
                   <p className="text-lg md:text-xl font-bold text-slate-800 truncate" title={String(stat.value)}>{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bg} flex-shrink-0 ml-2`}>
                   <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
        
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="搜索案例标题、风险摘要、作者..."
               className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-sm"
               value={keyword}
               onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
             />
           </div>
           <div className="flex gap-3">
              <div className="relative flex-1 md:flex-none md:min-w-[160px]">
                 <select 
                    className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none appearance-none cursor-pointer shadow-sm"
                    value={selectedTag}
                    onChange={(e) => { setSelectedTag(e.target.value); setPage(1); }}
                 >
                    <option value="">所有标签</option>
                    {availableTags.map(t => (
                       <option key={t.tag} value={t.tag}>{t.tag} ({t.count})</option>
                    ))}
                 </select>
                 <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              
              {/* Dynamic Filter/Sort/Reset Button */}
              <button 
                onClick={handleFilterOrSort}
                className={`px-4 py-2.5 border rounded-lg transition-colors shadow-sm flex items-center text-sm font-medium whitespace-nowrap ${
                  (keyword || selectedTag) 
                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' // Reset Mode
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900' // Sort Mode
                }`}
                title={keyword || selectedTag ? "重置所有筛选" : "切换时间排序"}
              >
                 {(keyword || selectedTag) ? (
                    <>
                      <RotateCcw className="w-4 h-4 mr-0 md:mr-2" /> <span className="hidden md:inline">重置</span>
                    </>
                 ) : (
                    <>
                      <ArrowUpDown className="w-4 h-4 mr-0 md:mr-2" /> <span className="hidden md:inline">{sortDir === 'desc' ? '最新' : '最早'}</span>
                    </>
                 )}
              </button>
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 md:px-6 md:py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">案例信息</th>
                <th className="hidden md:table-cell px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-64">标签</th>
                <th className="hidden lg:table-cell px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">作者</th>
                <th className="hidden sm:table-cell px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">创建日期</th>
                <th className="px-3 py-3 md:px-6 md:py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right w-20 md:w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse bg-white">
                    <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded w-64 mb-2"></div><div className="h-3 bg-slate-50 rounded w-48"></div></td>
                    <td className="hidden md:table-cell px-6 py-4"><div className="h-6 bg-slate-100 rounded w-20"></div></td>
                    <td className="hidden lg:table-cell px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                    <td className="hidden sm:table-cell px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : cases.length > 0 ? (
                cases.map((c, index) => (
                  <tr key={c.id} className={`group hover:bg-brand-50/30 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className="px-3 py-3 md:px-6 md:py-4">
                       <Link to={`/cases/${c.id}`} className="block">
                          <p className="text-sm md:text-base font-semibold text-brand-700 hover:text-brand-600 hover:underline truncate max-w-[200px] md:max-w-md" title={c.title}>
                             {c.title}
                          </p>
                          {/* Mobile only info */}
                          <div className="flex md:hidden items-center mt-1 text-xs text-slate-500 space-x-2">
                             <span>{c.author || '匿名'}</span>
                             <span>•</span>
                             <span>{c.createDate ? new Date(c.createDate).toISOString().split('T')[0] : '-'}</span>
                          </div>
                          <div className="flex md:hidden flex-wrap gap-1 mt-1.5">
                             {c.tags && c.tags.slice(0, 2).map(t => (
                               <span key={t} className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] border border-slate-200">
                                 {t}
                               </span>
                             ))}
                          </div>
                       </Link>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {c.tags && c.tags.slice(0, 3).map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-700 transition-colors">
                            {t}
                          </span>
                        ))}
                        {c.tags && c.tags.length > 3 && (
                           <span className="text-xs text-slate-400 font-medium px-1">+{c.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4">
                       <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center mr-2 font-bold">
                             {c.author?.charAt(0)}
                          </div>
                          <span className="text-sm text-slate-600">{c.author}</span>
                       </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 text-sm text-slate-500 font-mono">
                       {c.createDate ? new Date(c.createDate).toISOString().split('T')[0] : '-'}
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 text-right">
                       <div className="flex items-center justify-end gap-1 md:gap-2">
                          <Link 
                             to={`/cases/${c.id}`} 
                             className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-all"
                             title="查看详情"
                          >
                             <Eye className="w-4 h-4 md:w-5 md:h-5" />
                          </Link>
                          {user?.isAdmin && (
                            <>
                               <button 
                                 onClick={() => handleEditClick(c.id)}
                                 className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all"
                                 title="编辑"
                               >
                                  <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
                               </button>
                               <button 
                                 onClick={() => handleDelete(c.id)}
                                 className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                 title="删除"
                               >
                                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                               </button>
                            </>
                          )}
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <Search className="w-8 h-8 text-slate-300" />
                       </div>
                       <h3 className="text-slate-800 font-medium mb-1">未找到相关案例</h3>
                       <p className="text-slate-500 text-sm max-w-xs">请尝试调整搜索关键词或筛选条件，或者新增一个案例。</p>
                       {user?.isAdmin && (
                          <button 
                             onClick={() => { setEditingCase(null); setIsModalOpen(true); }}
                             className="mt-4 text-brand-600 hover:text-brand-700 font-medium text-sm hover:underline"
                          >
                             立即新增案例
                          </button>
                       )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
           <div className="px-4 py-3 md:px-6 md:py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs md:text-sm text-slate-500 font-medium">
                 <span className="hidden md:inline">显示第 {page} 页，共 {totalPages} 页 <span className="text-slate-400 mx-1">|</span></span> 总计 {totalElements} 条
              </span>
              <div className="flex gap-2">
                 <button 
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="p-1.5 md:p-2 border border-slate-200 bg-white rounded-lg text-slate-500 hover:text-brand-600 hover:border-brand-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                 >
                    <ChevronLeft className="w-4 h-4" />
                 </button>
                 <span className="flex items-center px-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm min-w-[32px] justify-center">
                    {page}
                 </span>
                 <button 
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="p-1.5 md:p-2 border border-slate-200 bg-white rounded-lg text-slate-500 hover:text-brand-600 hover:border-brand-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                 >
                    <ChevronRight className="w-4 h-4" />
                 </button>
              </div>
           </div>
        )}
      </div>

      {/* Floating Action Button for Mobile & Desktop */}
      {user?.isAdmin && (
         <button 
            onClick={() => { setEditingCase(null); setIsModalOpen(true); }}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-12 h-12 md:w-14 md:h-14 bg-brand-600 hover:bg-brand-500 text-white rounded-full shadow-xl shadow-brand-600/40 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40 group"
         >
            <Plus className="w-6 h-6 md:w-7 md:h-7" />
            <span className="absolute right-full mr-4 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
               新增案例
            </span>
         </button>
      )}

      {/* Drawer Modal */}
      <CaseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateOrUpdate}
        initialData={editingCase}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default CaseList;