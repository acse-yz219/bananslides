import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FileText, FileEdit, ImagePlus, Paperclip, Palette, Lightbulb, Search, History as HistoryIcon, Zap } from 'lucide-react';
import { Button, Textarea, Card, useToast, MaterialGeneratorModal, ReferenceFileList, ReferenceFileSelector, FilePreviewModal, UserMenu } from '@/components/shared';
import { TemplateSelector, getTemplateFile } from '@/components/shared/TemplateSelector';
import { listUserTemplates, type UserTemplate, uploadReferenceFile, type ReferenceFile, associateFileToProject, triggerFileParse } from '@/api/endpoints';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuthStore } from '@/store/useAuthStore';

type CreationType = 'idea' | 'outline' | 'description';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { initializeProject, isGlobalLoading } = useProjectStore();
  const { show, ToastContainer } = useToast();
  const { currentUser, fetchMe } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<CreationType>('idea');
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<File | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPresetTemplateId, setSelectedPresetTemplateId] = useState<string | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isFileSelectorOpen, setIsFileSelectorOpen] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 检查是否有当前项目 & 加载用户模板
  useEffect(() => {
    const storageKey = currentUser?.user_id ? `currentProjectId:${currentUser.user_id}` : null;
    const projectId = storageKey ? localStorage.getItem(storageKey) : null;
    setCurrentProjectId(projectId);
    
    const loadTemplates = async () => {
      try {
        if (!currentUser) return;
        const response = await listUserTemplates();
        if (response.data?.templates) {
          setUserTemplates(response.data.templates);
        }
      } catch (error) {
        console.error('加载用户模板失败:', error);
      }
    };
    loadTemplates();
  }, [currentUser]);

  // 拉取用户信息
  useEffect(() => {
    fetchMe().catch(() => {});
  }, [fetchMe]);

  const handleOpenMaterialModal = () => {
    // 在主页始终生成全局素材，不关联任何项目
    setIsMaterialModalOpen(true);
  };

  // 检测粘贴事件，自动上传文件
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    console.log('Paste event triggered');
    const items = e.clipboardData?.items;
    if (!items) {
      console.log('No clipboard items');
      return;
    }

    console.log('Clipboard items:', items.length);
    
    // 检查是否有文件
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`Item ${i}:`, { kind: item.kind, type: item.type });
      
      if (item.kind === 'file') {
        const file = item.getAsFile();
        console.log('Got file:', file);
        
        if (file) {
          console.log('File details:', { name: file.name, type: file.type, size: file.size });
          
          // 检查文件类型
          const allowedExtensions = ['pdf', 'docx', 'pptx', 'doc', 'ppt', 'xlsx', 'xls', 'csv', 'txt', 'md'];
          const fileExt = file.name.split('.').pop()?.toLowerCase();
          
          console.log('File extension:', fileExt);
          
          if (fileExt && allowedExtensions.includes(fileExt)) {
            console.log('File type allowed, uploading...');
            e.preventDefault(); // 阻止默认粘贴行为
            await handleFileUpload(file);
          } else {
            console.log('File type not allowed');
            show({ message: `不支持的文件类型: ${fileExt}`, type: 'info' });
          }
        }
      }
    }
  };

  // 上传文件
  // 在 Home 页面，文件始终上传为全局文件（不关联项目），因为此时还没有项目
  const handleFileUpload = async (file: File) => {
    if (isUploadingFile) return;

    // 检查是否是PPT文件，提示建议使用PDF
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt === 'ppt' || fileExt === 'pptx') 
      show({  message: '💡 提示：建议将PPT转换为PDF格式上传，可获得更好的解析效果',    type: 'info' });
    
    setIsUploadingFile(true);
    try {
      // 在 Home 页面，始终上传为全局文件
      const response = await uploadReferenceFile(file, null);
      if (response?.data?.file) {
        const uploadedFile = response.data.file;
        setReferenceFiles(prev => [...prev, uploadedFile]);
        show({ message: '文件上传成功', type: 'success' });
        
        // 如果文件状态为 pending，自动触发解析
        if (uploadedFile.parse_status === 'pending') {
          try {
            const parseResponse = await triggerFileParse(uploadedFile.id);
            // 使用解析接口返回的文件对象更新状态
            if (parseResponse?.data?.file) {
              const parsedFile = parseResponse.data.file;
              setReferenceFiles(prev => 
                prev.map(f => f.id === uploadedFile.id ? parsedFile : f)
              );
            } else {
              // 如果没有返回文件对象，手动更新状态为 parsing（异步线程会稍后更新）
              setReferenceFiles(prev => 
                prev.map(f => f.id === uploadedFile.id ? { ...f, parse_status: 'parsing' as const } : f)
              );
            }
          } catch (parseError: any) {
            console.error('触发文件解析失败:', parseError);
            // 解析触发失败不影响上传成功提示
          }
        }
      } else {
        show({ message: '文件上传失败：未返回文件信息', type: 'error' });
      }
    } catch (error: any) {
      console.error('文件上传失败:', error);
      show({ 
        message: `文件上传失败: ${error?.response?.data?.error?.message || error.message || '未知错误'}`, 
        type: 'error' 
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  // 从当前项目移除文件引用（不删除文件本身）
  const handleFileRemove = (fileId: string) => {
    setReferenceFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // 文件状态变化回调
  const handleFileStatusChange = (updatedFile: ReferenceFile) => {
    setReferenceFiles(prev => 
      prev.map(f => f.id === updatedFile.id ? updatedFile : f)
    );
  };

  // 点击回形针按钮 - 打开文件选择器
  const handlePaperclipClick = () => {
    setIsFileSelectorOpen(true);
  };

  // 从选择器选择文件后的回调
  const handleFilesSelected = (selectedFiles: ReferenceFile[]) => {
    // 合并新选择的文件到列表（去重）
    setReferenceFiles(prev => {
      const existingIds = new Set(prev.map(f => f.id));
      const newFiles = selectedFiles.filter(f => !existingIds.has(f.id));
      // 合并时，如果文件已存在，更新其状态（可能解析状态已改变）
      const updated = prev.map(f => {
        const updatedFile = selectedFiles.find(sf => sf.id === f.id);
        return updatedFile || f;
      });
      return [...updated, ...newFiles];
    });
    show({ message: `已添加 ${selectedFiles.length} 个参考文件`, type: 'success' });
  };

  // 获取当前已选择的文件ID列表，传递给选择器（使用 useMemo 避免每次渲染都重新计算）
  const selectedFileIds = useMemo(() => {
    return referenceFiles.map(f => f.id);
  }, [referenceFiles]);

  // 文件选择变化
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      await handleFileUpload(files[i]);
    }

    // 清空 input，允许重复选择同一文件
    e.target.value = '';
  };

  const tabConfig = {
    idea: {
      icon: <Sparkles size={18} />,
      label: '一句话生成',
      placeholder: '例如：生成一份关于 AI 发展史的演讲 PPT',
      description: '输入你的想法，AI 将为你生成完整的 PPT',
    },
    outline: {
      icon: <FileText size={18} />,
      label: '从大纲生成',
      placeholder: '粘贴你的 PPT 大纲...\n\n例如：\n第一部分：AI 的起源\n- 1950 年代的开端\n- 达特茅斯会议\n\n第二部分：发展历程\n...',
      description: '已有大纲？直接粘贴即可快速生成，AI 将自动切分为结构化大纲',
    },
    description: {
      icon: <FileEdit size={18} />,
      label: '从描述生成',
      placeholder: '粘贴你的完整页面描述...\n\n例如：\n第 1 页\n标题：人工智能的诞生\n内容：1950 年，图灵提出"图灵测试"...\n\n第 2 页\n标题：AI 的发展历程\n内容：1950年代：符号主义...\n...',
      description: '已有完整描述？AI 将自动解析出大纲并切分为每页描述，直接生成图片',
    },
  };

  const handleTemplateSelect = async (templateFile: File | null, templateId?: string) => {
    // 总是设置文件（如果提供）
    if (templateFile) {
      setSelectedTemplate(templateFile);
    }
    
    // 处理模板 ID
    if (templateId) {
      // 判断是用户模板还是预设模板
      // 预设模板 ID 通常是 '1', '2', '3' 等短字符串
      // 用户模板 ID 通常较长（UUID 格式）
      if (templateId.length <= 3 && /^\d+$/.test(templateId)) {
        // 预设模板
        setSelectedPresetTemplateId(templateId);
        setSelectedTemplateId(null);
      } else {
        // 用户模板
        setSelectedTemplateId(templateId);
        setSelectedPresetTemplateId(null);
      }
    } else {
      // 如果没有 templateId，可能是直接上传的文件
      // 清空所有选择状态
      setSelectedTemplateId(null);
      setSelectedPresetTemplateId(null);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      show({ message: '请输入内容', type: 'error' });
      return;
    }

    // 检查是否有正在解析的文件
    const parsingFiles = referenceFiles.filter(f => 
      f.parse_status === 'pending' || f.parse_status === 'parsing'
    );
    if (parsingFiles.length > 0) {
      show({ 
        message: `还有 ${parsingFiles.length} 个参考文件正在解析中，请等待解析完成`, 
        type: 'info' 
      });
      return;
    }

    try {
      // 如果有模板ID但没有File，按需加载
      let templateFile = selectedTemplate;
      if (!templateFile && (selectedTemplateId || selectedPresetTemplateId)) {
        const templateId = selectedTemplateId || selectedPresetTemplateId;
        if (templateId) {
          templateFile = await getTemplateFile(templateId, userTemplates);
        }
      }
      
      await initializeProject(activeTab, content, templateFile || undefined);
      
      const storageKey = currentUser?.user_id ? `currentProjectId:${currentUser.user_id}` : null;
      const projectId = storageKey ? localStorage.getItem(storageKey) : null;
      if (!projectId) {
        show({ message: '项目创建失败', type: 'error' });
        return;
      }
      
      // 关联参考文件到项目
      if (referenceFiles.length > 0) {
        console.log(`Associating ${referenceFiles.length} reference files to project ${projectId}:`, referenceFiles);
        try {
          // 批量更新文件的 project_id
          const results = await Promise.all(
            referenceFiles.map(async file => {
              const response = await associateFileToProject(file.id, projectId);
              console.log(`Associated file ${file.id}:`, response);
              return response;
            })
          );
          console.log('Reference files associated successfully:', results);
        } catch (error) {
          console.error('Failed to associate reference files:', error);
          // 不影响主流程，继续执行
        }
      } else {
        console.log('No reference files to associate');
      }
      
      if (activeTab === 'idea' || activeTab === 'outline') {
        navigate(`/project/${projectId}/outline`);
      } else if (activeTab === 'description') {
        navigate(`/project/${projectId}/detail`);
      }
    } catch (error: any) {
      console.error('创建项目失败:', error);
      // 错误已经在 store 中处理并显示
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:bg-[#050505] dark:from-inherit dark:via-inherit dark:to-inherit text-gray-900 dark:text-white relative overflow-hidden font-sans transition-colors duration-300">
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 深色模式：顶部中间的紫色光晕 */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-900/20 rounded-[100%] blur-[120px] opacity-0 dark:opacity-60 transition-opacity duration-500"></div>
        {/* 深色模式：底部渐变 */}
        <div className="absolute bottom-0 left-0 w-full h-[400px] bg-gradient-to-t from-purple-900/10 to-transparent opacity-0 dark:opacity-100 transition-opacity duration-500"></div>
        
        {/* 浅色模式：装饰圆 */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl opacity-100 dark:opacity-0 transition-opacity duration-500"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl opacity-100 dark:opacity-0 transition-opacity duration-500"></div>
      </div>

      {/* 导航栏 */}
      <nav className="relative h-18 md:h-20 flex items-center justify-between px-6 md:px-12 z-50">
        <div className="flex items-center gap-3">
           <img src="/logo.png" alt="Magic AiPPT" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
           <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-white dark:to-white tracking-tight">
             Magic AiPPT
           </span>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
           <button 
              onClick={() => navigate('/history')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-white transition-colors text-sm font-medium"
           >
              <HistoryIcon size={18} />
              <span className="hidden sm:inline">历史记录</span>
           </button>
           
           {currentUser ? (
             <UserMenu />
           ) : (
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/login')} 
                className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/10"
             >
               登录
             </Button>
           )}
        </div>
      </nav>

      {/* 主内容 */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-8 md:pt-16 pb-20 flex flex-col items-center text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 backdrop-blur-md mb-8 hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-default shadow-sm dark:shadow-none">
           <Zap size={14} className="text-purple-600 dark:text-[#a78bfa]" fill="currentColor" />
           <span className="text-sm text-purple-700 dark:text-[#e9d5ff] font-medium tracking-wide">Gemini 3 pro+Nano Banana Pro加持</span>
        </div>

        {/* Hero Title */}
        <h1 className="flex flex-col items-center text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8 tracking-tight">
           <span className="bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-white/70 mb-2">
             输入一句话 AI生成
           </span>
           <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-[#ddd6fe] dark:via-white dark:to-[#a78bfa]">
             极具设计感的可编辑PPT
           </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
           打破创作瓶颈，将您的想法瞬间转化为专业演示文稿。
        </p>

        {/* 输入卡片区域 */}
        <div className="w-full max-w-4xl relative animate-in fade-in slide-in-from-bottom-8 duration-700">
           {/* 背景光效 */}
           <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
           
           <div className="relative p-1 rounded-2xl bg-white dark:bg-[#121212] border border-gray-100 dark:border-white/10 shadow-xl dark:shadow-2xl">
              <div className="bg-white dark:bg-[#0a0a0a] rounded-xl overflow-hidden">
                {/* 选项卡 */}
                <div className="flex border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#121212]/50">
                  {(Object.keys(tabConfig) as CreationType[]).map((type) => {
                    const config = tabConfig[type];
                    const isActive = activeTab === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setActiveTab(type)}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all ${
                          isActive
                            ? 'text-purple-600 dark:text-white bg-white dark:bg-white/5 border-b-2 border-purple-500 shadow-sm dark:shadow-none'
                            : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className={isActive ? 'text-purple-600 dark:text-purple-400' : ''}>{config.icon}</span>
                        {config.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-6 md:p-8">
                   {/* 描述提示 */}
                   <div className="flex items-start gap-3 mb-4 text-left">
                      <Lightbulb size={18} className="text-purple-500 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">{tabConfig[activeTab].description}</p>
                   </div>

                   {/* 输入框容器 */}
                   <div className="relative group">
                      <Textarea
                        placeholder={tabConfig[activeTab].placeholder}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onPaste={handlePaste}
                        rows={activeTab === 'idea' ? 5 : 8}
                        className="bg-gray-50 dark:bg-[#121212] border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-lg rounded-xl pr-4 pb-14 resize-none transition-colors"
                      />
                      
                      {/* 底部工具栏 */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <button
                               type="button"
                               onClick={handlePaperclipClick}
                               className="p-2 text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                               title="选择参考文件"
                            >
                               <Paperclip size={20} />
                            </button>
                            <span className="text-xs text-gray-400 dark:text-gray-600">支持 PDF, Word, Markdown...</span>
                         </div>
                         
                         <Button
                            onClick={handleSubmit}
                            loading={isGlobalLoading}
                            disabled={!content.trim() || referenceFiles.some(f => f.parse_status === 'pending' || f.parse_status === 'parsing')}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-none rounded-full px-6 py-2 font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                         >
                            {referenceFiles.some(f => f.parse_status === 'pending' || f.parse_status === 'parsing')
                              ? '解析中...'
                              : '开始生成'}
                         </Button>
                      </div>
                   </div>

                   {/* 参考文件列表 */}
                   {referenceFiles.length > 0 && (
                     <div className="mt-4">
                       <ReferenceFileList
                          files={referenceFiles}
                          onFileClick={setPreviewFileId}
                          onFileDelete={handleFileRemove}
                          onFileStatusChange={handleFileStatusChange}
                          deleteMode="remove"
                          className="bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-white/5 rounded-lg"
                       />
                     </div>
                   )}

                   {/* 模板选择 - 简化版 */}
                   <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-2 mb-4">
                         <Palette size={16} className="text-purple-600 dark:text-purple-400" />
                         <span className="text-sm font-medium text-gray-700 dark:text-gray-300">风格模板</span>
                      </div>
                      <TemplateSelector
                         onSelect={handleTemplateSelect}
                         selectedTemplateId={selectedTemplateId}
                         selectedPresetTemplateId={selectedPresetTemplateId}
                         showUpload={true}
                         projectId={currentProjectId}
                      />
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md"
          onChange={handleFileSelect}
          className="hidden"
        />

      </main>
      
      <ToastContainer />
      
      {/* 模态框 */}
      <MaterialGeneratorModal
        projectId={null}
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
      />
      
      <ReferenceFileSelector
        projectId={null}
        isOpen={isFileSelectorOpen}
        onClose={() => setIsFileSelectorOpen(false)}
        onSelect={handleFilesSelected}
        multiple={true}
        initialSelectedIds={selectedFileIds}
      />
      
      <FilePreviewModal fileId={previewFileId} onClose={() => setPreviewFileId(null)} />
    </div>
  );
};
