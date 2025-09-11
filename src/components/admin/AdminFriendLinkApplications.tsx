import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Eye,
  Check,
  X,
  Trash2,
  ExternalLink,
  Mail,
  User,
  Globe,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import toast from 'react-hot-toast';

interface FriendLinkApplication {
  id: string;
  site_name: string;
  site_url: string;
  site_description: string;
  site_icon?: string;
  admin_email: string;
  admin_qq?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  admin_note?: string;
  processed_by?: string;
  processed_at?: string;
  ip_address?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  recent_week: number;
  recent_month: number;
}

const statusConfig = {
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: '已通过', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800', icon: XCircle },
  expired: { label: '已过期', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
};

export function AdminFriendLinkApplications() {
  const [applications, setApplications] = useState<FriendLinkApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  // 对话框状态
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<FriendLinkApplication | null>(null);
  const [processType, setProcessType] = useState<'approve' | 'reject'>('approve');
  const [processNote, setProcessNote] = useState('');
  const [addToFriendLinks, setAddToFriendLinks] = useState(true);

  // 获取申请列表
  const fetchApplications = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page: page.toString(),
        limit: '20',
        status: filters.status,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      const result = await apiGet('/friend-links/applications', params);
      
      if (result.success) {
        setApplications(result.data.applications);
        setCurrentPage(result.data.pagination.current_page);
        setTotalPages(result.data.pagination.total_pages);
      } else {
        toast.error(result.message || '获取申请列表失败');
      }
    } catch (error) {
      console.error('获取申请列表失败:', error);
      toast.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const result = await apiGet('/friend-links/applications/stats');
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 处理申请
  const handleProcessApplication = async (id: string, action: 'approve' | 'reject', note?: string, addToLinks = false) => {
    try {
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      const result = await apiPost(`/friend-links/applications/${id}/${endpoint}`, {
        note,
        ...(action === 'approve' && { addToFriendLinks: addToLinks })
      });

      if (result.success) {
        toast.success(`申请已${action === 'approve' ? '批准' : '拒绝'}`);
        fetchApplications(currentPage);
        fetchStats();
        return true;
      } else {
        toast.error(result.message || '操作失败');
        return false;
      }
    } catch (error) {
      console.error('处理申请失败:', error);
      toast.error('网络错误，请稍后重试');
      return false;
    }
  };

  // 批量处理申请
  const handleBatchProcess = async (action: 'approve' | 'reject') => {
    if (selectedApplications.length === 0) {
      toast.error('请选择要处理的申请');
      return;
    }

    try {
      const result = await apiPost('/friend-links/applications/batch', {
        ids: selectedApplications,
        action,
        note: processNote
      });

      if (result.success) {
        toast.success(`批量${action === 'approve' ? '批准' : '拒绝'}处理完成`);
        setSelectedApplications([]);
        fetchApplications(currentPage);
        fetchStats();
      } else {
        toast.error(result.message || '批量处理失败');
      }
    } catch (error) {
      console.error('批量处理失败:', error);
      toast.error('网络错误，请稍后重试');
    }
  };

  // 删除申请
  const handleDeleteApplication = async (id: string) => {
    try {
      const result = await apiDelete(`/friend-links/applications/${id}`);

      if (result.success) {
        toast.success('申请已删除');
        fetchApplications(currentPage);
        fetchStats();
      } else {
        toast.error(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除申请失败:', error);
      toast.error('网络错误，请稍后重试');
    }
  };

  // 清理过期申请
  const handleCleanupExpired = async () => {
    try {
      const result = await apiPost('/friend-links/cleanup-expired');

      if (result.success) {
        toast.success(`已清理 ${result.data.expired_count} 个过期申请`);
        fetchApplications(currentPage);
        fetchStats();
      } else {
        toast.error(result.message || '清理失败');
      }
    } catch (error) {
      console.error('清理过期申请失败:', error);
      toast.error('网络错误，请稍后重试');
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, []);

  // 监听筛选条件变化
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchApplications(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(applications.map(app => app.id));
    } else {
      setSelectedApplications([]);
    }
  };

  // 处理单选
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApplications(prev => [...prev, id]);
    } else {
      setSelectedApplications(prev => prev.filter(appId => appId !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <p className="text-xs text-muted-foreground">总申请数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">待审核</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">已通过</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">已拒绝</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
              <p className="text-xs text-muted-foreground">已过期</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.recent_week}</div>
              <p className="text-xs text-muted-foreground">本周新增</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-indigo-600">{stats.recent_month}</div>
              <p className="text-xs text-muted-foreground">本月新增</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 操作栏 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>友链申请管理</CardTitle>
              <CardDescription>管理和审核友情链接申请</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchApplications(currentPage)}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanupExpired}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                清理过期
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 筛选和搜索 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索网站名称、邮箱等..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="approved">已通过</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 批量操作 */}
          {selectedApplications.length > 0 && (
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <span className="text-sm">
                已选择 {selectedApplications.length} 个申请
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleBatchProcess('approve')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-1" />
                  批量通过
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBatchProcess('reject')}
                >
                  <X className="w-4 h-4 mr-1" />
                  批量拒绝
                </Button>
              </div>
            </div>
          )}

          {/* 申请列表 */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">加载中...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">暂无申请记录</p>
              </div>
            ) : (
              <>
                {/* 表头 */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg text-sm font-medium">
                  <Checkbox
                    checked={selectedApplications.length === applications.length}
                    onCheckedChange={(checked) => handleSelectAll(checked === true)}
                  />
                  <div className="flex-1 grid grid-cols-12 gap-4">
                    <div className="col-span-3">网站信息</div>
                    <div className="col-span-2">申请人</div>
                    <div className="col-span-2">状态</div>
                    <div className="col-span-2">申请时间</div>
                    <div className="col-span-2">过期时间</div>
                    <div className="col-span-1">操作</div>
                  </div>
                </div>

                {/* 申请项 */}
                {applications.map((application) => (
                  <motion.div
                    key={application.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 bg-card border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <Checkbox
                      checked={selectedApplications.includes(application.id)}
                      onCheckedChange={(checked) => handleSelectOne(application.id, checked as boolean)}
                    />
                    
                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                      {/* 网站信息 */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          {application.site_icon ? (
                            <img
                              src={application.site_icon}
                              alt={application.site_name}
                              className="w-8 h-8 object-contain rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                              <Globe className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{application.site_name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {new URL(application.site_url).hostname}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 申请人 */}
                      <div className="col-span-2">
                        <div className="text-sm">{application.admin_email}</div>
                        <div className="text-xs text-muted-foreground">{application.admin_email}</div>
                      </div>

                      {/* 状态 */}
                      <div className="col-span-2">
                        <Badge className={statusConfig[application.status].color}>
                          {statusConfig[application.status].label}
                        </Badge>
                      </div>

                      {/* 申请时间 */}
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {formatDate(application.created_at)}
                      </div>

                      {/* 过期时间 */}
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {application.expires_at ? formatDate(application.expires_at) : '-'}
                      </div>

                      {/* 操作 */}
                      <div className="col-span-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedApplication(application);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              查看详情
                            </DropdownMenuItem>
                            {application.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedApplication(application);
                                    setProcessType('approve');
                                    setProcessNote('');
                                    setAddToFriendLinks(true);
                                    setProcessDialogOpen(true);
                                  }}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  批准申请
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedApplication(application);
                                    setProcessType('reject');
                                    setProcessNote('');
                                    setProcessDialogOpen(true);
                                  }}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  拒绝申请
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm('确定要删除这个申请记录吗？')) {
                                  handleDeleteApplication(application.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              删除记录
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => fetchApplications(currentPage - 1)}
              >
                上一页
              </Button>
              <span className="flex items-center px-3 text-sm">
                第 {currentPage} 页，共 {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => fetchApplications(currentPage + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 查看详情对话框 */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>申请详情</DialogTitle>
            <DialogDescription>
              查看友链申请的详细信息
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* 网站信息 */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">网站信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>网站名称</Label>
                    <p className="text-sm mt-1">{selectedApplication.site_name}</p>
                  </div>
                  <div>
                    <Label>网站地址</Label>
                    <p className="text-sm mt-1">
                      <a
                        href={selectedApplication.site_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {selectedApplication.site_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>
                <div>
                  <Label>网站描述</Label>
                  <p className="text-sm mt-1">{selectedApplication.site_description}</p>
                </div>
                {selectedApplication.site_icon && (
                  <div>
                    <Label>网站图标</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <img
                        src={selectedApplication.site_icon}
                        alt="网站图标"
                        className="w-8 h-8 object-contain rounded"
                      />
                      <a
                        href={selectedApplication.site_icon}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        查看图标
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* 联系人信息 */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">联系人信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>邮箱地址</Label>
                    <p className="text-sm mt-1">
                      <a
                        href={`mailto:${selectedApplication.admin_email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedApplication.admin_email}
                      </a>
                    </p>
                  </div>
                </div>
                {selectedApplication.admin_qq && (
                  <div>
                    <Label>QQ号码</Label>
                    <p className="text-sm mt-1">{selectedApplication.admin_qq}</p>
                  </div>
                )}
              </div>


              {/* 申请状态 */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">申请状态</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>当前状态</Label>
                    <div className="mt-1">
                      <Badge className={statusConfig[selectedApplication.status].color}>
                        {statusConfig[selectedApplication.status].label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>申请时间</Label>
                    <p className="text-sm mt-1">{formatDate(selectedApplication.created_at)}</p>
                  </div>
                </div>
                {selectedApplication.expires_at && (
                  <div>
                    <Label>过期时间</Label>
                    <p className="text-sm mt-1">{formatDate(selectedApplication.expires_at)}</p>
                  </div>
                )}
                {selectedApplication.processed_at && (
                  <div>
                    <Label>处理时间</Label>
                    <p className="text-sm mt-1">{formatDate(selectedApplication.processed_at)}</p>
                  </div>
                )}
                {selectedApplication.admin_note && (
                  <div>
                    <Label>管理员备注</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedApplication.admin_note}</p>
                  </div>
                )}
              </div>

              {/* 技术信息 */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">技术信息</h4>
                {selectedApplication.ip_address && (
                  <div>
                    <Label>申请IP</Label>
                    <p className="text-sm mt-1 font-mono">{selectedApplication.ip_address}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 处理申请对话框 */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processType === 'approve' ? '批准申请' : '拒绝申请'}
            </DialogTitle>
            <DialogDescription>
              {processType === 'approve' 
                ? '批准后该友链将显示为已通过状态' 
                : '拒绝后该申请将无法再次处理'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {processType === 'approve' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="addToFriendLinks"
                  checked={addToFriendLinks}
                  onCheckedChange={(checked) => setAddToFriendLinks(checked === true)}
                />
                <Label htmlFor="addToFriendLinks" className="text-sm">
                  同时添加到友链列表
                </Label>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="processNote">备注（可选）</Label>
              <Textarea
                id="processNote"
                value={processNote}
                onChange={(e) => setProcessNote(e.target.value)}
                placeholder={`请输入${processType === 'approve' ? '批准' : '拒绝'}理由...`}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setProcessDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={async () => {
                if (selectedApplication) {
                  const success = await handleProcessApplication(
                    selectedApplication.id,
                    processType,
                    processNote,
                    addToFriendLinks
                  );
                  if (success) {
                    setProcessDialogOpen(false);
                    setProcessNote('');
                  }
                }
              }}
              className={processType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={processType === 'reject' ? 'destructive' : 'default'}
            >
              {processType === 'approve' ? '批准' : '拒绝'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminFriendLinkApplications;
