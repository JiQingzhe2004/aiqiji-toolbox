import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { adminUserApi, type AdminUser, type UserRole, type UserStatus } from '@/services/adminUserApi';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Plus, RefreshCw, Edit, Trash2, KeyRound, Camera } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import toast from 'react-hot-toast';

export function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | UserRole>('all');
  const [status, setStatus] = useState<'all' | UserStatus>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<{ username: string; password: string; role: UserRole; status: UserStatus; email: string; display_name: string; avatar_url: string }>({
    username: '', password: '', role: 'user', status: 'active', email: '', display_name: '', avatar_url: ''
  });
  const [saving, setSaving] = useState(false);

  const [resetOpen, setResetOpen] = useState<false | string>(false);
  const [newPassword, setNewPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = async (opts?: { silent?: boolean; toPage?: number }) => {
    try {
      if (opts?.silent) setRefreshing(true); else setLoading(true);
      const res = await adminUserApi.list({ page: opts?.toPage ?? page, limit: itemsPerPage, q: search || undefined, role: role === 'all' ? undefined : role, status, sort: 'latest' });
      if (res.success && (res as any).data) {
        const data = (res as any).data;
        setUsers(data.users);
        setPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
      } else if ((res as any).users) {
        // when apiGet returns parsed data directly
        const data = res as any;
        setUsers(data.users);
      }
    } catch (e: any) {
      toast.error(e?.message || '加载用户失败');
    } finally {
      if (opts?.silent) setRefreshing(false); else setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, role, status]);

  const openCreate = () => {
    setEditing(null);
    setForm({ username: '', password: '', role: 'user', status: 'active', email: '', display_name: '', avatar_url: '' });
    setModalOpen(true);
  };
  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setForm({ username: u.username, password: '', role: u.role, status: u.status, email: u.email || '', display_name: u.display_name || '', avatar_url: u.avatar_url || '' });
    setModalOpen(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      if (editing) {
        const res: any = await adminUserApi.update(editing.id, { username: form.username, role: form.role, status: form.status, email: form.email || null, display_name: form.display_name || null, avatar_url: form.avatar_url || null });
        if (res.success) {
          const updated = (res.data?.user) || res.data || editing;
          setUsers(prev => prev.map(x => x.id === editing.id ? { ...x, ...updated } : x));
          toast.success('用户已更新');
          setModalOpen(false);
        } else toast.error(res.message || '更新失败');
      } else {
        if (!form.username || !form.password) { toast.error('请填写用户名和密码'); return; }
        const res: any = await adminUserApi.create({ username: form.username, password: form.password, role: form.role, status: form.status, email: form.email || undefined, display_name: form.display_name || undefined, avatar_url: form.avatar_url || undefined });
        if (res.success) {
          toast.success('用户已创建');
          setModalOpen(false);
          load({ silent: true });
        } else toast.error(res.message || '创建失败');
      }
    } catch (e: any) {
      toast.error(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res: any = await adminUserApi.delete(id);
      if (res.success) {
        setUsers(prev => prev.filter(x => x.id !== id));
        toast.success('已删除');
      } else toast.error(res.message || '删除失败');
    } catch (e: any) { toast.error(e?.message || '删除失败'); }
  };

  const toggleStatus = async (u: AdminUser, next: UserStatus) => {
    try {
      const res: any = await adminUserApi.updateStatus(u.id, next);
      if (res.success) {
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: next } : x));
        toast.success('状态已更新');
      } else toast.error(res.message || '更新失败');
    } catch (e: any) { toast.error(e?.message || '更新失败'); }
  };

  const doResetPassword = async () => {
    if (!resetOpen || !newPassword || newPassword.length < 6) { toast.error('请填写至少6位的新密码'); return; }
    try {
      const res: any = await adminUserApi.resetPassword(resetOpen, newPassword);
      if (res.success) { toast.success('密码已重置'); setResetOpen(false); setNewPassword(''); }
      else toast.error(res.message || '重置失败');
    } catch (e: any) { toast.error(e?.message || '重置失败'); }
  };

  const uploadAvatarFile = async (file: File) => {
    try {
      const targetId = editing?.id;
      if (!targetId) { toast.error('请先保存用户再上传头像'); return; }
      const res: any = await adminUserApi.uploadAvatar(targetId, file);
      if (res.success) {
        const updated: AdminUser = (res.data?.user) || res.data;
        setUsers(prev => prev.map(x => x.id === targetId ? { ...x, avatar_url: updated.avatar_url, avatar_file: updated.avatar_file } : x));
        setForm(s => ({ ...s, avatar_url: updated.avatar_url || s.avatar_url }));
        toast.success('头像已上传');
      } else {
        toast.error(res.message || '上传失败');
      }
    } catch (e: any) {
      toast.error(e?.message || '上传失败');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg">用户管理</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input placeholder="搜索用户名/邮箱/昵称" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
              </div>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="w-28"><SelectValue placeholder="角色" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部角色</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="user">普通用户</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="w-28"><SelectValue placeholder="状态" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                  <SelectItem value="suspended">挂起</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => load({ silent: true })} disabled={refreshing} title="刷新">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />新增用户</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>{editing ? '编辑用户' : '新增用户'}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="flex flex-col items-center gap-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                              <Avatar className="h-20 w-20">
                                {form.avatar_url ? (
                                  <AvatarImage src={form.avatar_url} alt={form.username || 'avatar'} />
                                ) : (
                                  <AvatarFallback>{(form.display_name || form.username || '?').slice(0,1).toUpperCase()}</AvatarFallback>
                                )}
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 rounded-full bg-background border shadow p-1 opacity-80 group-hover:opacity-100">
                                <Camera className="w-4 h-4" />
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>点击上传头像</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatarFile(f); }} />
                      <div className="w-full">
                        <Label>头像链接（可选）</Label>
                        <Input placeholder="https://..." value={form.avatar_url} onChange={(e) => setForm(s => ({ ...s, avatar_url: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>用户名{editing ? '' : ' *'}</Label>
                      <Input value={form.username} onChange={(e) => setForm(s => ({ ...s, username: e.target.value }))} />
                    </div>
                    {!editing && (
                      <div className="space-y-1">
                        <Label>密码 *</Label>
                        <Input type="password" value={form.password} onChange={(e) => setForm(s => ({ ...s, password: e.target.value }))} />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label>邮箱</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm(s => ({ ...s, email: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>昵称</Label>
                      <Input value={form.display_name} onChange={(e) => setForm(s => ({ ...s, display_name: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>角色</Label>
                        <Select value={form.role} onValueChange={(v: any) => setForm(s => ({ ...s, role: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">普通用户</SelectItem>
                            <SelectItem value="admin">管理员</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>状态</Label>
                        <Select value={form.status} onValueChange={(v: any) => setForm(s => ({ ...s, status: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">正常</SelectItem>
                            <SelectItem value="inactive">停用</SelectItem>
                            <SelectItem value="suspended">挂起</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>取消</Button>
                      <Button onClick={save} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">加载中...</div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">暂无用户</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>头像/用户名</TableHead>
                    <TableHead>昵称/邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {u.avatar_url ? (
                              <AvatarImage src={u.avatar_url} alt={u.username} />
                            ) : (
                              <AvatarFallback>{(u.display_name || u.username || '?').slice(0,1).toUpperCase()}</AvatarFallback>
                            )}
                          </Avatar>
                          <span>{u.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          {u.display_name && <span>{u.display_name}</span>}
                          {u.email && <span className="text-muted-foreground">{u.email}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{u.role === 'admin' ? '管理员' : '普通用户'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={u.status} onValueChange={(v: any) => toggleStatus(u, v)}>
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">正常</SelectItem>
                            <SelectItem value="inactive">停用</SelectItem>
                            <SelectItem value="suspended">挂起</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(u)}><Edit className="w-4 h-4 mr-1" />编辑</Button>
                          <Button size="sm" variant="outline" onClick={() => setResetOpen(u.id)}><KeyRound className="w-4 h-4 mr-1" />重置密码</Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>确定要删除用户 {u.username} 吗？此操作不可撤销。</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => remove(u.id)} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="text-muted-foreground">第 {page} / {totalPages} 页</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { const p = Math.max(1, page - 1); setPage(p); load({ toPage: p }); }} disabled={page <= 1}>上一页</Button>
                <Button variant="outline" size="sm" onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); load({ toPage: p }); }} disabled={page >= totalPages}>下一页</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!resetOpen} onOpenChange={(open) => { if (!open) { setResetOpen(false); setNewPassword(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>重置密码</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>新密码（至少6位）</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setResetOpen(false); setNewPassword(''); }}>取消</Button>
              <Button onClick={doResetPassword}>提交</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
