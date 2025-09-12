import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ToolSubmissionForm } from '@/components/ToolSubmissionForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ToolSubmissionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </Button>
            <h1 className="text-xl font-bold">推荐工具</h1>
            <div className="w-20" /> {/* Spacer for center alignment */}
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <ToolSubmissionForm
          onSuccess={() => navigate('/')}
          onCancel={() => navigate('/')}
        />
      </main>
    </div>
  );
}

export default ToolSubmissionPage;
