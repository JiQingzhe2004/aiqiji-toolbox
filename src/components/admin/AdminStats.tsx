/**
 * 管理页面统计数据组件
 */

import React from 'react';
import { Star, Database, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface AdminStatsProps {
  stats: any;
}

export function AdminStats({ stats }: AdminStatsProps) {
  if (!stats) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted animate-pulse rounded w-20" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2" />
              <div className="h-3 bg-muted animate-pulse rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: '总工具数',
      value: stats.totalTools || 0,
      icon: Database,
      description: '全部工具',
    },
    {
      title: '精选工具',
      value: stats.featuredTools || 0,
      icon: Star,
      description: '推荐工具',
    },
  ];

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* 概览卡片 */}
      <div className="grid gap-6 md:grid-cols-2">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 分类统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            分类统计
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.categoryStats?.map((category: any, index: number) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{category.category}</span>
                <span className="text-sm text-muted-foreground">
                  {category.count} ({Math.round((category.count / stats.totalTools) * 100)}%)
                </span>
              </div>
              <Progress 
                value={(category.count / stats.totalTools) * 100} 
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 最近添加的工具 */}
      <Card>
        <CardHeader>
          <CardTitle>最近添加的工具</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentTools?.slice(0, 5).map((tool: any, index: number) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs">{tool.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{tool.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {tool.description}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(tool.created_at).toLocaleDateString()}
                </div>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-4">
                暂无最近添加的工具
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
