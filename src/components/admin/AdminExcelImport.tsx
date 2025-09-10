/**
 * 管理页面Excel导入组件
 */

import React, { useState, useRef } from 'react';
import { API_CONFIG } from '@/lib/api';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    id: string;
    errors: string[];
  }>;
}

interface AdminExcelImportProps {
  onImportComplete?: () => void;
}

export function AdminExcelImport({ onImportComplete }: AdminExcelImportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 下载Excel模板
  const handleDownloadTemplate = async () => {
    try {
      const apiBaseUrl = API_CONFIG.BASE_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiBaseUrl}/import/template`);
      
      if (!response.ok) {
        throw new Error('下载模板失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'tools-import-template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载模板失败:', error);
      alert('下载模板失败，请稍后重试');
    }
  };

  // 导出当前数据
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      const apiBaseUrl = API_CONFIG.BASE_URL || 'http://localhost:3001/api/v1';
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiBaseUrl}/import/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('导出数据失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 生成带时间戳的文件名
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `tools-export-${timestamp}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出数据失败:', error);
      alert('导出数据失败，请稍后重试');
    } finally {
      setIsExporting(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // 处理文件上传和导入
  const handleFileUpload = async (file: File) => {
    try {
      setIsImporting(true);
      setUploadProgress(0);
      setImportResult(null);

      // 验证文件类型
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('请选择Excel文件 (.xls 或 .xlsx)');
      }

      // 验证文件大小 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('文件大小不能超过10MB');
      }

      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('auth_token');
      
      // 创建XMLHttpRequest以支持进度跟踪
      const xhr = new XMLHttpRequest();
      
      return new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              if (result.success) {
                setImportResult(result.data);
                setShowResult(true);
                if (onImportComplete) {
                  onImportComplete();
                }
                resolve();
              } else {
                reject(new Error(result.message || '导入失败'));
              }
            } catch (error) {
              reject(new Error('解析响应失败'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || '导入失败'));
            } catch {
              reject(new Error(`导入失败 (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('网络错误'));
        });

        const apiBaseUrl = API_CONFIG.BASE_URL || 'http://localhost:3001/api/v1';
        xhr.open('POST', `${apiBaseUrl}/import/excel`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

    } catch (error) {
      console.error('导入失败:', error);
      alert(error instanceof Error ? error.message : '导入失败');
    } finally {
      setIsImporting(false);
      setUploadProgress(0);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 处理拖拽上传
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Excel批量导入
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 操作按钮区域 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              下载Excel模板
            </Button>
            
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              导出当前数据
            </Button>
          </div>

          {/* 文件上传区域 */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isImporting}
            />
            
            {isImporting ? (
              <div className="space-y-4">
                <RefreshCw className="w-12 h-12 mx-auto text-primary animate-spin" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">正在导入Excel文件...</p>
                  {uploadProgress > 0 && (
                    <div className="max-w-xs mx-auto">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">上传Excel文件</p>
                  <p className="text-sm text-muted-foreground">
                    拖拽文件到此处，或者 
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary hover:underline ml-1"
                    >
                      点击选择文件
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    支持 .xls 和 .xlsx 格式，最大10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 使用说明 */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>使用说明：</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>点击"下载Excel模板"获取标准格式的模板文件</li>
                <li>在模板中填写工具信息，<span className="font-medium text-primary">图标主题、分类、是否精选等字段的可选值请查看"选项参考"工作表</span></li>
                <li>注意必填字段和格式要求，查看"导入说明"工作表了解详细要求</li>
                <li>上传填写完成的Excel文件进行批量导入</li>
                <li>系统会自动验证数据并显示导入结果</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 导入结果对话框 */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {importResult && importResult.failed === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              导入结果
            </DialogTitle>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4">
              {/* 统计信息 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{importResult.total}</div>
                  <div className="text-sm text-muted-foreground">总计</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                  <div className="text-sm text-muted-foreground">成功</div>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-sm text-muted-foreground">失败</div>
                </div>
              </div>

              {/* 错误详情 */}
              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">失败详情：</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive">第{error.row}行</Badge>
                          <span className="text-sm font-medium">ID: {error.id}</span>
                        </div>
                        <ul className="text-sm text-red-600 space-y-1">
                          {error.errors.map((err, errIndex) => (
                            <li key={errIndex}>• {err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowResult(false)}
                >
                  关闭
                </Button>
                {importResult.failed > 0 && (
                  <Button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    重新下载模板
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
