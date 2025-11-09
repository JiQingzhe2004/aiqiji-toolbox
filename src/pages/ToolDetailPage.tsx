/**
 * 工具详情页面
 * 显示工具的详细信息，包括描述、标签、使用说明等
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  Star, 
  Calendar, 
  Shield,
  ShieldBan,
  ShieldAlert,
  Tag,
  Info,
  Loader2,
  ArrowLeft,
  Heart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';
import { QRCodeModal } from '@/components/QRCodeModal';
// import { DetailFloatingActions } from '@/components/DetailFloatingActions'; // 已整合到 FloatingSubmitButton
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import { FloatingSubmitButton } from '@/components/FloatingSubmitButton';
import { SEOImage, SEOImagePresets } from '@/components/SEOImage';
import { useSEO, SEOPresets } from '@/hooks/useSEO';
import type { ConfettiRef } from '@/components/magicui/confetti';
import { toolsApi } from '@/services/toolsApi';
import { settingsApi } from '@/services/settingsApi';
import type { Tool } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { getToolIconUrl } from '@/utils/imageUtils';
import toast from 'react-hot-toast';
import { favoritesApi } from '@/services/favoritesApi';
import { useAuth } from '@/contexts/AuthContext';

function ToolDetailPage() {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const confettiRef = useRef<ConfettiRef>(null);
  
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showVpnIndicator, setShowVpnIndicator] = useState(true);
  const { isAuthenticated } = useAuth();
  const [favorited, setFavorited] = useState(false);

  // 获取工具详情
  useEffect(() => {
    const fetchTool = async () => {
      if (!toolId) {
        setError('工具ID不存在');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [toolResponse, settingsResponse] = await Promise.all([
          toolsApi.getToolById(toolId),
          settingsApi.getPublicSettings()
        ]);

        if (toolResponse.success && toolResponse.data) {
          setTool(toolResponse.data.tool);
        } else {
          setError('工具不存在');
        }

        if (settingsResponse.success && settingsResponse.data) {
          setShowVpnIndicator(settingsResponse.data.show_vpn_indicator ?? true);
        }
      } catch (err) {
        console.error('获取工具详情失败:', err instanceof Error ? err.message : String(err));
        setError('获取工具详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchTool();
  }, [toolId]);

  // 初始化收藏状态
  useEffect(() => {
    const checkFav = async () => {
      if (!toolId || !isAuthenticated) { setFavorited(false); return; }
      try {
        const res: any = await favoritesApi.exists(toolId);
        if (res.success && res.data) setFavorited(!!res.data.favorited);
      } catch {}
    };
    checkFav();
  }, [toolId, isAuthenticated]);

  // 复制链接功能
  const copyLink = useCallback(async () => {
    if (!tool) return;
    
    try {
      await navigator.clipboard.writeText(tool.url);
    } catch (err) {
      console.error('复制失败:', err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [tool]);

  // 前往工具网站
  const goToTool = useCallback(() => {
    if (!tool) return;
    
    if (tool.status === 'inactive') {
      toast.error('该工具已停用', {
        duration: 2000,
        position: 'bottom-center'
      });
      return;
    }

    if (tool.status === 'maintenance') {
      toast('该工具正在维护，可能存在功能不稳定', {
        duration: 3000,
        position: 'bottom-center',
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--warning))',
          borderLeft: '4px solid hsl(var(--warning))'
        },
        icon: '⚠️'
      });
    }

    const iconUrl = getToolIconUrl(tool);
    const currentUrl = window.location.pathname;
    
    // 构建外部链接URL，包含返回参数
    const externalLinkUrl = new URL('/external-link', window.location.origin);
    externalLinkUrl.searchParams.set('url', tool.url);
    externalLinkUrl.searchParams.set('name', tool.name);
    externalLinkUrl.searchParams.set('return', currentUrl);
    if (iconUrl) {
      externalLinkUrl.searchParams.set('icon', iconUrl);
    }
    
    // 在当前窗口打开外部链接警告页面
    window.location.href = externalLinkUrl.toString();
  }, [tool]);

  // 返回上一页
  const goBack = () => {
    navigate(-1);
  };

  // 设置工具详情页SEO
  useSEO(tool ? SEOPresets.toolDetail(
    tool.name || '工具',
    tool.description || '工具详情',
    getToolIconUrl(tool)
  ) : SEOPresets.notFound());

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">加载工具详情中...</p>
        </div>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <Info className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">工具不存在</h1>
          <p className="text-muted-foreground">{error || '找不到指定的工具'}</p>
          <Button onClick={goBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* 文章式主要内容 */}
        <article className="max-w-4xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            {/* 工具头部信息 - 左右布局 */}
            <header className="flex flex-col md:flex-row gap-8 items-start">
              {/* 左侧：工具图标 */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-background/5 via-muted/30 to-muted/60 flex items-center justify-center shadow-2xl">
                  {getToolIconUrl(tool) ? (
                    <SEOImage
                      {...SEOImagePresets.toolIcon(
                        getToolIconUrl(tool) || '', 
                        tool.name || '工具',
                        tool.description || ''
                      )}
                      className={cn(
                        "w-20 h-20 object-contain rounded-xl",
                        // 主题适配逻辑：根据图标原始颜色类型进行适配，与首页MagicCard保持一致
                        // 优先使用 icon_theme（数据库字段），兼容 logoTheme（转换后的字段）
                        (() => {
                          const theme = tool.icon_theme || tool.logoTheme;
                          if (theme === 'auto-light' || theme === 'light') {
                            return "invert dark:invert-0"; // 浅色图标
                          }
                          if (theme === 'none') {
                            return ""; // 不添加任何样式，保持原色
                          }
                          // 默认：auto-dark, auto, dark 或未设置时，深色图标
                          return "dark:invert";
                        })()
                      )}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-muted/50 rounded-xl" />
                  )}
                </div>
              </div>

              {/* 右侧：工具信息 */}
              <div className="flex-1 space-y-4">
                {/* 工具名称 */}
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{tool.name || '工具名称'}</h1>
                </div>
                
                {/* 状态标识、标签、分类在同一行 */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* 状态标识 */}
                  {tool.featured && (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/90 backdrop-blur-sm text-yellow-50 rounded-full text-sm font-medium shadow-lg">
                      <Star className="w-4 h-4 fill-current" />
                      推荐
                    </div>
                  )}
                  {showVpnIndicator && tool.needs_vpn && (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/90 backdrop-blur-sm text-blue-50 rounded-full text-sm font-medium shadow-lg">
                      <Shield className="w-4 h-4" />
                      VPN
                    </div>
                  )}
                  {tool.status !== 'active' && (
                    <div className={cn(
                      "flex items-center gap-1 px-3 py-1.5 backdrop-blur-sm rounded-full text-sm font-medium shadow-lg",
                      tool.status === 'inactive' && "bg-red-500/90 text-red-50",
                      tool.status === 'maintenance' && "bg-yellow-600/90 text-yellow-50"
                    )}>
                      {tool.status === 'inactive' ? (
                        <>
                          <ShieldBan className="w-4 h-4" />
                          停用
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-4 h-4" />
                          维护
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* 分隔符 */}
                  {((tool.featured) || (showVpnIndicator && tool.needs_vpn) || (tool.status !== 'active')) && (
                    <div className="w-px h-4 bg-border/50"></div>
                  )}
                  
                  {/* 标签 */}
                  {tool.tags && tool.tags.length > 0 && (
                    <>
                      {tool.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </Badge>
                      ))}
                    </>
                  )}
                  
                  {/* 分隔符 */}
                  {tool.tags && tool.tags.length > 0 && tool.category && (
                    <div className="w-px h-4 bg-border/50"></div>
                  )}
                  
                  {/* 分类 */}
                  {tool.category && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>分类:</span>
                      <span className="font-medium">
                        {Array.isArray(tool.category) ? tool.category.join(', ') : tool.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* 简介 */}
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {tool.description || '暂无描述'}
                </p>

                {/* 创建时间 */}
                {(tool.created_at || tool.createdAt) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {formatDate((tool.created_at || tool.createdAt)!)}
                  </div>
                )}

                {/* VPN提示 */}
                {showVpnIndicator && tool.needs_vpn && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1 text-sm">
                          需要VPN访问
                        </h4>
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                          该工具在中国大陆地区可能需要使用VPN或代理服务才能正常访问。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 前往按钮和收藏按钮 */}
                <div className="pt-4 flex items-center gap-3">
                  <div className="flex-1">
                    <InteractiveHoverButton 
                      className={cn(
                        "text-lg px-6 py-3 rounded-full w-full",
                        tool.status === 'inactive' && "opacity-50 cursor-not-allowed"
                      )}
                      hoverText={
                        tool.status === 'active' 
                          ? `前往 ${tool.name || '工具'}` 
                          : tool.status === 'inactive' 
                            ? '工具已停用' 
                            : `前往 ${tool.name || '工具'}（维护中）`
                      }
                      onClick={goToTool}
                    >
                      {tool.status === 'active' ? '前往工具' : 
                       tool.status === 'inactive' ? '已停用' : '前往工具'}
                    </InteractiveHoverButton>
                  </div>
                  {/* 收藏按钮 - 圆形 */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      if (!isAuthenticated) { toast.error('请先登录后再收藏'); return; }
                      try {
                        if (!favorited) {
                          setFavorited(true);
                          const r: any = await favoritesApi.add(tool.id);
                          if (!r.success) { setFavorited(false); toast.error(r.message || '收藏失败'); } else toast.success('已收藏');
                        } else {
                          setFavorited(false);
                          const r: any = await favoritesApi.remove(tool.id);
                          if (!r.success) { setFavorited(true); toast.error(r.message || '取消失败'); } else toast.success('已取消收藏');
                        }
                      } catch (e: any) { toast.error(e?.message || '操作失败'); }
                    }}
                    title={favorited ? '取消收藏' : '收藏'}
                    aria-label={favorited ? '取消收藏' : '收藏'}
                    className={cn(
                      "rounded-full aspect-square w-12 h-12 transition-all duration-200",
                      favorited 
                        ? 'text-white bg-red-500 hover:bg-red-600 border-red-500' 
                        : 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500'
                    )}
                  >
                    <Heart className={cn('w-5 h-5', favorited ? 'fill-current' : '')} />
                  </Button>
                </div>
              </div>
            </header>

            {/* 分隔线 */}
            <div className="border-t border-border/50"></div>

            {/* 工具说明 - 文章内容区域 */}
              
              <div className="space-y-6">
                {tool.content && tool.content.trim() ? (
                  <RichTextDisplay content={tool.content} />
                ) : (
                  <div className="text-base leading-relaxed">
                    <p>
                      {tool.name || '此工具'} 是一个{Array.isArray(tool.category) ? tool.category.join('、') : (tool.category || '未分类')}类工具。
                      {tool.description || '暂无详细描述。'}
                    </p>
                  </div>
                )}

              </div>
          </motion.div>
        </article>

        {/* 工具详情页专用的悬浮按钮 */}
        <FloatingSubmitButton
          onGoBack={goBack}
          onCopyLink={copyLink}
          onShowQRCode={() => setShowQRModal(true)}
          toolName={tool.name}
        />

        {/* 二维码弹框 */}
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          toolName={tool.name || '工具'}
          toolUrl={tool.url || ''}
          toolDescription={tool.description || '暂无描述'}
        />
      </div>
    </>
  );
}

export default ToolDetailPage;
