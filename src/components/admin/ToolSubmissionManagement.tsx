import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Eye,
  Trash2,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  User,
  Link,
  Tag,
  MessageSquare,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { toolSubmissionApi, type ToolSubmission, type SubmissionStats, type DuplicateCheckResult } from '@/services/toolSubmissionApi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const STATUS_CONFIG = {
  pending: { label: '待审核', color: 'bg-yellow-500', icon: Clock },
  processing: { label: '处理中', color: 'bg-blue-500', icon: Settings },
  approved: { label: '已通过', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'bg-red-500', icon: XCircle }
};

export function ToolSubmissionManagement() {
  const [submissions, setSubmissions] = useState<ToolSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ToolSubmission | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<DuplicateCheckResult | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  
  // 筛选和搜索
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sort: 'default'
  });
  
  // 分页
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  // 批量操作
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchAction, setBatchAction] = useState<string>('');
  const [batchComment, setBatchComment] = useState('');
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // 加载数据
  const loadSubmissions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await toolSubmissionApi.getAllSubmissions({
        page,
        limit: pagination.itemsPerPage,
        status: filters.status === 'all' ? undefined : filters.status,
        sort: filters.sort
      });

      if (response.success && response.data) {
        setSubmissions(response.data.submissions || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (error: any) {
      toast.error(error.message || '加载提交列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      const response = await toolSubmissionApi.getSubmissionStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('加载统计数据失败:', error);
    }
  };

  // 选择提交并清空重复检查结果
  const selectSubmission = (submission: ToolSubmission) => {
    setSelectedSubmission(submission);
    setDuplicateCheckResult(null);
    setReviewComment('');
  };

  // 检查重复工具
  const checkDuplicates = async (submission: ToolSubmission) => {
    try {
      setIsCheckingDuplicates(true);
      const result = await toolSubmissionApi.checkDuplicateTools({
        name: submission.name,
        url: submission.url,
        excludeId: submission.id // 排除当前提交
      });
      setDuplicateCheckResult(result);
    } catch (error) {
      console.error('检查重复失败:', error);
      toast.error('检查重复失败');
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // 审核提交
  const handleReview = async (id: number, action: 'approve' | 'reject' | 'processing') => {
    try {
      setIsReviewing(true);
      await toolSubmissionApi.reviewSubmission(id, action, reviewComment || undefined);
      
      // 映射action到STATUS_CONFIG的key
      const statusKey = action === 'approve' ? 'approved' : action;
      toast.success(`工具提交已${STATUS_CONFIG[statusKey as keyof typeof STATUS_CONFIG].label}`);
      
      // 刷新列表和统计
      await Promise.all([loadSubmissions(pagination.currentPage), loadStats()]);
      
      // 关闭对话框
      setSelectedSubmission(null);
      setReviewComment('');
    } catch (error: any) {
      toast.error(error.message || '审核失败');
    } finally {
      setIsReviewing(false);
    }
  };

  // 批量审核
  const handleBatchReview = async () => {
    if (!batchAction || selectedIds.length === 0) return;

    try {
      setIsBatchProcessing(true);
      const response = await toolSubmissionApi.batchReview(
        selectedIds,
        batchAction as 'approve' | 'reject' | 'processing',
        batchComment || undefined
      );
      
      toast.success(response.message);
      
      // 清空选择
      setSelectedIds([]);
      setBatchAction('');
      setBatchComment('');
      
      // 刷新数据
      await Promise.all([loadSubmissions(pagination.currentPage), loadStats()]);
    } catch (error: any) {
      toast.error(error.message || '批量操作失败');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // 删除提交
  const handleDelete = async (id: number) => {
    try {
      await toolSubmissionApi.deleteSubmission(id);
      toast.success('提交已删除');
      await Promise.all([loadSubmissions(pagination.currentPage), loadStats()]);
      setDeleteConfirmId(null);
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  // 处理筛选变化
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // 处理批量选择
  const handleBatchSelect = (id: number, checked: boolean) => {
    setSelectedIds(prev => 
      checked 
        ? [...prev, id]
        : prev.filter(selectedId => selectedId !== id)
    );
  };

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? submissions.map(s => s.id!).filter(Boolean) : []);
  };

  // 初始加载
  useEffect(() => {
    loadSubmissions();
    loadStats();
  }, [filters, pagination.currentPage]);

  // 渲染统计卡片
  const renderStatsCards = () => {
    if (!stats) return null;

    const cards = [
      { key: 'total', label: '总提交', value: stats.total, color: 'bg-blue-500' },
      { key: 'pending', label: '待审核', value: stats.pending, color: 'bg-yellow-500' },
      { key: 'processing', label: '处理中', value: stats.processing, color: 'bg-blue-600' },
      { key: 'approved', label: '已通过', value: stats.approved, color: 'bg-green-500' },
      { key: 'rejected', label: '已拒绝', value: stats.rejected, color: 'bg-red-500' }
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {cards.map(card => (
          <Card key={card.key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // 渲染提交详情对话框
  const renderSubmissionDetail = () => {
    if (!selectedSubmission) return null;

    return (
      <Dialog open={!!selectedSubmission} onOpenChange={() => {
        setSelectedSubmission(null);
        setDuplicateCheckResult(null);
        setReviewComment('');
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              工具提交详情
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">基本信息</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>工具名称:</strong> {selectedSubmission.name}</p>
                  <p><strong>工具ID:</strong> {selectedSubmission.tool_id}</p>
                  <p><strong>链接:</strong> 
                    <a href={selectedSubmission.url} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:underline ml-1">
                      {selectedSubmission.url}
                    </a>
                  </p>
                  <div className="flex items-center gap-2">
                    <strong>状态:</strong>
                    <Badge variant="secondary">
                      {STATUS_CONFIG[selectedSubmission.status || 'pending'].label}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">提交信息</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>提交时间:</strong> {
                    selectedSubmission.created_at 
                      ? format(new Date(selectedSubmission.created_at), 'PPpp', { locale: zhCN })
                      : '-'
                  }</p>
                  {selectedSubmission.submitter_name && (
                    <p><strong>提交者:</strong> {selectedSubmission.submitter_name}</p>
                  )}
                  {selectedSubmission.submitter_email && (
                    <p><strong>邮箱:</strong> {selectedSubmission.submitter_email}</p>
                  )}
                  {selectedSubmission.submitter_contact && (
                    <p><strong>联系方式:</strong> {selectedSubmission.submitter_contact}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 描述 */}
            <div>
              <h3 className="font-semibold mb-2">工具描述</h3>
              <p className="text-sm bg-muted/30 p-3 rounded-md">
                {selectedSubmission.description}
              </p>
            </div>

            {/* 分类和标签 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">分类</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSubmission.category?.map(cat => (
                    <Badge key={cat} variant="outline">{cat}</Badge>
                  ))}
                </div>
              </div>
              
              {selectedSubmission.tags && selectedSubmission.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubmission.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 图标信息 */}
            <div>
              <h3 className="font-semibold mb-2">图标设置</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <p><strong>图标名称:</strong> {selectedSubmission.icon || 'Tool'}</p>
                <p><strong>图标主题:</strong> {selectedSubmission.icon_theme || 'auto-dark'}</p>
                {selectedSubmission.icon_url && (
                  <p><strong>图标URL:</strong> 
                    <a href={selectedSubmission.icon_url} target="_blank" rel="noopener noreferrer"
                       className="text-blue-600 hover:underline ml-1 break-all">
                      查看图标
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* 审核信息 */}
            {selectedSubmission.review_comment && (
              <div>
                <h3 className="font-semibold mb-2">审核备注</h3>
                <p className="text-sm bg-muted/30 p-3 rounded-md">
                  {selectedSubmission.review_comment}
                </p>
              </div>
            )}

            {/* 重复检查 */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">重复检查</h3>
                <Button
                  onClick={() => checkDuplicates(selectedSubmission)}
                  disabled={isCheckingDuplicates}
                  variant="outline"
                  size="sm"
                >
                  {isCheckingDuplicates ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-2" />
                  )}
                  检查重复
                </Button>
              </div>
              
              {duplicateCheckResult && (
                <div className="space-y-3">
                  {duplicateCheckResult.hasDuplicates ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-md p-3">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">发现可能的重复工具</span>
                      </div>
                      
                      {duplicateCheckResult.existingTools.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">已存在的工具:</p>
                          {duplicateCheckResult.existingTools.map((tool, index) => (
                            <div key={tool.id} className="text-xs bg-white dark:bg-gray-800/50 border border-yellow-100 dark:border-yellow-800/30 rounded p-2 mb-1">
                              <p><strong>名称:</strong> {tool.name}</p>
                              <p><strong>链接:</strong> {tool.url}</p>
                              <p><strong>描述:</strong> {tool.description.slice(0, 100)}...</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {duplicateCheckResult.pendingSubmissions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">待审核的相似提交:</p>
                          {duplicateCheckResult.pendingSubmissions.map((submission) => (
                            <div key={submission.id} className="text-xs bg-white dark:bg-gray-800/50 border border-yellow-100 dark:border-yellow-800/30 rounded p-2 mb-1">
                              <p><strong>名称:</strong> {submission.name}</p>
                              <p><strong>链接:</strong> {submission.url}</p>
                              <p><strong>状态:</strong> {STATUS_CONFIG[submission.status as keyof typeof STATUS_CONFIG]?.label}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-md p-3">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                        <span className="text-sm text-green-800 dark:text-green-200">未发现重复工具</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 审核操作 */}
            {selectedSubmission.status === 'pending' || selectedSubmission.status === 'processing' ? (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">审核操作</h3>
                <div className="space-y-4">
                  <Textarea
                    placeholder="审核备注（可选）"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleReview(selectedSubmission.id!, 'approve')}
                      disabled={isReviewing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isReviewing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      通过
                    </Button>
                    <Button
                      onClick={() => handleReview(selectedSubmission.id!, 'reject')}
                      disabled={isReviewing}
                      variant="destructive"
                    >
                      {isReviewing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                      拒绝
                    </Button>
                    <Button
                      onClick={() => handleReview(selectedSubmission.id!, 'processing')}
                      disabled={isReviewing}
                      variant="outline"
                    >
                      {isReviewing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Settings className="w-4 h-4 mr-2" />}
                      标记为处理中
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  该提交已处理完成。状态: {STATUS_CONFIG[selectedSubmission.status || 'pending'].label}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {renderStatsCards()}

      {/* 筛选和搜索 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待审核</SelectItem>
                    <SelectItem value="processing">处理中</SelectItem>
                    <SelectItem value="approved">已通过</SelectItem>
                    <SelectItem value="rejected">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <Input
                  placeholder="搜索工具名称..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-48"
                />
              </div>

              <Select value={filters.sort} onValueChange={(value) => handleFilterChange('sort', value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">默认排序</SelectItem>
                  <SelectItem value="latest">最新提交</SelectItem>
                  <SelectItem value="oldest">最早提交</SelectItem>
                  <SelectItem value="name">名称排序</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => loadSubmissions(pagination.currentPage)} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </div>

          {/* 批量操作 */}
          {selectedIds.length > 0 && (
            <div className="border-t mt-4 pt-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <p className="text-sm text-muted-foreground">
                  已选择 {selectedIds.length} 项
                </p>
                
                <div className="flex gap-2">
                  <Select value={batchAction} onValueChange={setBatchAction}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="批量操作" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">批量通过</SelectItem>
                      <SelectItem value="reject">批量拒绝</SelectItem>
                      <SelectItem value="processing">标记处理中</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    placeholder="批量操作备注"
                    value={batchComment}
                    onChange={(e) => setBatchComment(e.target.value)}
                    className="w-40"
                  />
                  
                  <Button
                    onClick={handleBatchReview}
                    disabled={!batchAction || isBatchProcessing}
                    size="sm"
                  >
                    {isBatchProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    执行
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 提交列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>工具提交列表</span>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.length === submissions.length && submissions.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-muted-foreground">全选</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              加载中...
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无工具提交</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => {
                const StatusIcon = STATUS_CONFIG[submission.status || 'pending'].icon;
                const isSelected = selectedIds.includes(submission.id!);
                
                return (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleBatchSelect(submission.id!, e.target.checked)}
                        className="mt-1 rounded"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{submission.name}</h3>
                            <p className="text-sm text-muted-foreground">ID: {submission.tool_id}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={`${STATUS_CONFIG[submission.status || 'pending'].color} text-white`}
                            >
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {STATUS_CONFIG[submission.status || 'pending'].label}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-3 line-clamp-2">
                          {submission.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Link className="w-3 h-3" />
                            <a href={submission.url} target="_blank" rel="noopener noreferrer" 
                               className="hover:text-primary truncate max-w-48">
                              {submission.url}
                            </a>
                          </span>
                          
                          {submission.submitter_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {submission.submitter_name}
                            </span>
                          )}
                          
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {submission.created_at 
                              ? format(new Date(submission.created_at), 'MM-dd HH:mm')
                              : '-'
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {submission.category?.map(cat => (
                              <Badge key={cat} variant="outline" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => selectSubmission(submission)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              查看详情
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    确定要删除工具提交 "{submission.name}" 吗？此操作不可撤销。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(submission.id!)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    删除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                共 {pagination.totalItems} 项，第 {pagination.currentPage} / {pagination.totalPages} 页
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadSubmissions(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadSubmissions(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 提交详情对话框 */}
      {renderSubmissionDetail()}
    </div>
  );
}
