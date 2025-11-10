import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select as ShadSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { adminUserApi, type AdminUser } from '@/services/adminUserApi';
import { emailApi } from '@/services/emailApi';
import toast from 'react-hot-toast';
import { Loader2, Mail, Search, UploadCloud, Paperclip, X } from 'lucide-react';
import { AIStreamDialog } from './AIStreamDialog';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AdminEmailSender() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [manualInput, setManualInput] = useState('');
  const [subject, setSubject] = useState('');
  const [contentMode, setContentMode] = useState<'html' | 'text'>('html');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none');
  const [aiDraft, setAiDraft] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [streamDialogOpen, setStreamDialogOpen] = useState(false);

  const maxCount = 5;
  const maxSize = 10 * 1024 * 1024; // 10MB
  const acceptTypes = '.pdf,.zip,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.webp';

  const formatSize = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleAddFiles = (files: File[]) => {
    if (!files?.length) return;
    const incoming = Array.from(files);
    // 校验大小
    for (const f of incoming) {
      if (f.size > maxSize) {
        toast.error(`附件 “${f.name}” 大小超过 ${formatSize(maxSize)}`);
        return;
      }
    }
    setAttachments(prev => {
      const merged = [...prev, ...incoming];
      if (merged.length > maxCount) {
        toast.error(`最多只能选择 ${maxCount} 个附件`);
      }
      return merged.slice(0, maxCount);
    });
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res: any = await adminUserApi.list({ page: 1, limit: 500, status: 'all' });
      let list: AdminUser[] = [];
      if (res.success && res.data?.users) list = res.data.users;
      else if (res.users) list = res.users;
      setUsers(list);
    } catch (e: any) {
      toast.error(e?.message || '加载用户失败');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { (async () => { try { const res: any = await emailApi.getTemplates({ page: 1, limit: 100, active: true }); if (res?.success && res.data?.items) setTemplates(res.data.items); } catch {} })(); }, []);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.display_name && u.display_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  }, [users, search]);

  const toggleAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(filtered.filter(u => !!u.email).map(u => u.id)));
    else setSelectedIds(new Set());
  };

  const selectedEmailsFromUsers = useMemo(() => {
    const m = new Map<string, true>();
    users.forEach(u => {
      if (selectedIds.has(u.id) && u.email) m.set(u.email, true);
    });
    return Array.from(m.keys());
  }, [users, selectedIds]);

  const manualEmails = useMemo(() => {
    return manualInput
      .split(/[\s,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
  }, [manualInput]);

  const allRecipients = useMemo(() => {
    const set = new Set<string>();
    selectedEmailsFromUsers.forEach(e => set.add(e));
    manualEmails.forEach(e => set.add(e));
    return Array.from(set);
  }, [selectedEmailsFromUsers, manualEmails]);

  const invalidEmails = useMemo(() => allRecipients.filter(e => !isValidEmail(e)), [allRecipients]);

  const sendEmails = async () => {
    if (allRecipients.length === 0) { toast.error('请先选择或输入至少一个收件人'); return; }
    if (!subject.trim()) { toast.error('请填写邮件主题'); return; }
    if (!body.trim()) { toast.error('请填写邮件内容'); return; }
    if (invalidEmails.length > 0) {
      toast.error(`存在无效邮箱：${invalidEmails.slice(0,3).join(', ')}${invalidEmails.length>3?' 等':''}`);
      return;
    }

    try {
      setSending(true);
      toast.loading('正在发送邮件...', { id: 'send-mails' });
      const res: any = await emailApi.sendEmail({
        recipients: allRecipients,
        subject,
        ...(contentMode === 'html' ? { html: body } : { text: body }),
        template_id: selectedTemplateId !== 'none' ? selectedTemplateId : undefined,
        attachments
      });
      if (res?.success) {
        const ok = res.data?.success_count ?? 0;
        const fail = res.data?.fail_count ?? 0;
        if (fail === 0) toast.success(`已发送 ${ok} 封邮件`, { id: 'send-mails' });
        else if (ok > 0) toast.error(`部分成功：成功 ${ok}，失败 ${fail}`, { id: 'send-mails' });
        else toast.error('发送失败', { id: 'send-mails' });
      } else {
        toast.error(res?.message || '发送失败', { id: 'send-mails' });
      }
    } catch (e: any) {
      toast.error(e?.message || '发送失败', { id: 'send-mails' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">收件人</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索用户名/昵称/邮箱" className="pl-9 w-full sm:w-64" />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground truncate">共 {filtered.length} 个用户，可选 {filtered.filter(u=>!!u.email).length} 个有邮箱的用户</div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="selectAll" checked={selectedIds.size>0 && filtered.filter(u=>!!u.email).every(u=>selectedIds.has(u.id))} onCheckedChange={(c:any)=>toggleAll(!!c)} />
                  <Label htmlFor="selectAll" className="text-sm">全选</Label>
                </div>
                <Button variant="outline" size="sm" onClick={()=>setSelectedIds(new Set())}>清空</Button>
              </div>
            </div>
            <div className="w-full">
              <ShadSelect value={selectedTemplateId} onValueChange={(id)=>{
                setSelectedTemplateId(id);
                if (id === 'none') return;
                const tpl = templates.find((t:any)=>t.id===id);
                if (tpl) {
                  if (!subject) setSubject(tpl.subject || '');
                  if (contentMode === 'html' && !body && tpl.html) setBody(tpl.html);
                  if (contentMode === 'text' && !body && tpl.text) setBody(tpl.text);
                }
              }}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="选择模板（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不使用模板</SelectItem>
                  {templates.map((t:any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </ShadSelect>
            </div>
          </div>
          
          {/* 移动端卡片布局 */}
          <div className="block md:hidden space-y-3 max-h-72 overflow-y-auto">
            {loadingUsers ? (
              <div className="text-center text-muted-foreground py-8">加载中...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">暂无数据</div>
            ) : filtered.map(u => (
              <div key={u.id} className="border rounded-lg p-3 flex items-center gap-3">
                <Checkbox disabled={!u.email} checked={selectedIds.has(u.id)} onCheckedChange={(c:any)=>{
                  setSelectedIds(prev => { const s = new Set(prev); if (c) s.add(u.id); else s.delete(u.id); return s; });
                }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{u.display_name || u.username}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {u.email ? u.email : <span className="text-muted-foreground">无邮箱</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 桌面端表格布局 */}
          <div className="hidden md:block max-h-72 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>邮箱</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">加载中...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">暂无数据</TableCell></TableRow>
                ) : filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Checkbox disabled={!u.email} checked={selectedIds.has(u.id)} onCheckedChange={(c:any)=>{
                        setSelectedIds(prev => { const s = new Set(prev); if (c) s.add(u.id); else s.delete(u.id); return s; });
                      }} />
                    </TableCell>
                    <TableCell className="font-medium">{u.display_name || u.username}</TableCell>
                    <TableCell>{u.email ? <span>{u.email}</span> : <span className="text-muted-foreground">无邮箱</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* AI 文案 -> HTML 生成 */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base break-words">AI 文案（输入要表达的内容，点击生成将转为带样式的HTML）</Label>
            <Textarea rows={4} value={aiDraft} onChange={(e)=>setAiDraft(e.target.value)} placeholder="请输入要发送的主要内容/要点，AI 将自动包装为美观的邮件HTML..." className="text-sm sm:text-base" />
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={()=>{
                if (!aiDraft.trim() && !body.trim()) { 
                  toast.error('请填写 AI 文案或邮件内容'); 
                  return; 
                }
                setStreamDialogOpen(true);
              }} className="w-full sm:w-auto">用AI生成HTML</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm sm:text-base break-words">手动添加收件人（多个用逗号、分号或换行分隔）</Label>
            <Textarea rows={3} value={manualInput} onChange={e=>setManualInput(e.target.value)} placeholder="a@example.com; b@example.com" className="text-sm sm:text-base" />
            {allRecipients.length > 0 && (
              <div className="text-xs sm:text-sm text-muted-foreground">
                将发送至 {allRecipients.length} 个收件人
                {invalidEmails.length > 0 && (
                  <span className="text-red-600 ml-2">（含 {invalidEmails.length} 个无效邮箱）</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg">邮件内容</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">主题</Label>
            <Input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="请输入邮件主题" className="text-sm sm:text-base" />
          </div>

          <div className="space-y-2">
            <Tabs value={contentMode} onValueChange={(v:any)=>setContentMode(v)}>
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="html" className="flex-1 sm:flex-none">HTML</TabsTrigger>
                <TabsTrigger value="text" className="flex-1 sm:flex-none">纯文本</TabsTrigger>
              </TabsList>
              <TabsContent value="html">
                <Textarea rows={10} value={body} onChange={e=>setBody(e.target.value)} placeholder="支持HTML，例如 <b>加粗</b>、<a href='https://...'>链接</a> 等" className="text-sm sm:text-base" />
              </TabsContent>
              <TabsContent value="text">
                <Textarea rows={10} value={body} onChange={e=>setBody(e.target.value)} placeholder="请输入纯文本内容" className="text-sm sm:text-base" />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm sm:text-base break-words">附件（可选，最多{maxCount}个，每个 ≤ {formatSize(maxSize)})</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptTypes}
                className="hidden"
                onChange={(e) => handleAddFiles(Array.from(e.target.files || []))}
              />
              <div
                className="border border-dashed rounded-md p-3 sm:p-4 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/30 transition cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); handleAddFiles(Array.from(e.dataTransfer.files || [])); }}
                role="button"
                aria-label="上传附件"
              >
                <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5 mb-1" />
                <div className="text-xs sm:text-sm">拖拽文件到此处，或点击选择</div>
                <div className="text-xs mt-1 text-center px-2 break-all">支持：{acceptTypes}</div>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted text-xs max-w-full min-w-0">
                        <Paperclip className="w-3 h-3 flex-shrink-0" />
                        <span className="max-w-[120px] sm:max-w-[200px] truncate" title={f.name}>{f.name}</span>
                        <span className="opacity-70 flex-shrink-0">({formatSize(f.size)})</span>
                        <button
                          type="button"
                          className="ml-1 p-0.5 hover:text-red-600 flex-shrink-0"
                          onClick={() => removeAttachment(idx)}
                          aria-label="移除附件"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    共 {attachments.length} 个，合计 {formatSize(attachments.reduce((s, f) => s + f.size, 0))}
                    <Button variant="link" className="px-1" onClick={() => setAttachments([])}>清空</Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={sendEmails} disabled={sending} className="gap-2 w-full sm:w-auto">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {sending ? '发送中...' : '发送邮件'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI 流式生成对话框 */}
      <AIStreamDialog
        open={streamDialogOpen}
        onOpenChange={setStreamDialogOpen}
        subject={subject}
        text={aiDraft || body}
        onComplete={(html) => {
          setContentMode('html');
          setBody(html);
        }}
      />
    </div>
  );
}

export default AdminEmailSender;
