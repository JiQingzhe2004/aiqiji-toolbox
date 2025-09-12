import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * 工具提交模型
 */
const ToolSubmission = sequelize.define('ToolSubmission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // 工具基本信息
  tool_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^[a-zA-Z0-9-_]+$/
    },
    comment: '工具唯一标识符'
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    },
    comment: '工具名称'
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 1000]
    },
    comment: '工具描述'
  },
  
  url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true,
      isValidUrl(value) {
        if (!value) {
          throw new Error('URL不能为空');
        }
        
        try {
          // 如果没有协议，自动添加https://
          const urlToValidate = value.includes('://') ? value : `https://${value}`;
          
          // 使用URL构造函数验证
          new URL(urlToValidate);
          
          // 确保协议是http或https
          const url = new URL(urlToValidate);
          if (!['http:', 'https:'].includes(url.protocol)) {
            throw new Error('URL必须使用http或https协议');
          }
          
        } catch (error) {
          throw new Error('无效的URL格式');
        }
      }
    },
    comment: '工具链接'
  },
  
  category: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('Category must be an array');
        }
        if (value.length === 0) {
          throw new Error('At least one category is required');
        }
        // 验证每个分类都是有效的
        const validCategories = ['AI', '效率', '设计', '开发', '其他'];
        for (const cat of value) {
          if (!validCategories.includes(cat)) {
            throw new Error(`Invalid category: ${cat}`);
          }
        }
      }
    },
    comment: '工具分类'
  },
  
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
    validate: {
      isArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('Tags must be an array');
        }
      }
    },
    comment: '工具标签'
  },
  
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Tool',
    comment: '图标名称（FontAwesome或Lucide）'
  },
  
  icon_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isValidUrl(value) {
        if (!value) return; // 允许空值
        
        try {
          // 如果是相对路径，直接通过
          if (value.startsWith('/')) {
            return;
          }
          
          // 如果没有协议，自动添加https://
          const urlToValidate = value.includes('://') ? value : `https://${value}`;
          
          // 使用URL构造函数验证
          new URL(urlToValidate);
          
          // 确保协议是http或https
          const url = new URL(urlToValidate);
          if (!['http:', 'https:'].includes(url.protocol)) {
            throw new Error('URL必须使用http或https协议');
          }
          
        } catch (error) {
          throw new Error('无效的URL格式');
        }
      }
    },
    comment: '自定义图标URL'
  },
  
  icon_file: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '上传的图标文件名'
  },
  
  icon_theme: {
    type: DataTypes.ENUM('auto', 'auto-light', 'auto-dark', 'light', 'dark', 'none'),
    defaultValue: 'auto-dark',
    comment: '图标主题'
  },
  
  // 提交者信息
  submitter_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '提交者姓名'
  },
  
  submitter_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    },
    comment: '提交者邮箱'
  },
  
  submitter_contact: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '提交者联系方式'
  },
  
  // 审核状态
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'processing'),
    defaultValue: 'pending',
    comment: '审核状态：pending-待审核，processing-处理中，approved-已通过，rejected-已拒绝'
  },
  
  // 审核信息
  reviewer_id: {
    type: DataTypes.STRING(36),
    allowNull: true,
    comment: '审核员ID'
  },
  
  review_comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '审核备注'
  },
  
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审核时间'
  },
  
  // 其他字段
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '优先级，数字越大优先级越高'
  },
  
  source: {
    type: DataTypes.STRING(50),
    defaultValue: 'user_submit',
    comment: '提交来源：user_submit-用户提交，admin_add-管理员添加'
  },
  
  additional_info: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '额外信息（JSON格式）'
  }
  
}, {
  tableName: 'tool_submissions',
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['submitter_email']
    },
    {
      fields: ['reviewer_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['priority', 'created_at']
    },
    {
      unique: true,
      fields: ['tool_id']
    }
  ]
});

// 实例方法：转换为工具数据
ToolSubmission.prototype.toToolData = function() {
  return {
    id: this.tool_id,
    name: this.name,
    description: this.description,
    url: this.url,
    category: this.category,
    tags: this.tags,
    icon: this.icon,
    icon_url: this.icon_url,
    icon_file: this.icon_file,
    icon_theme: this.icon_theme,
    featured: false, // 新提交的工具默认不是精选
    status: 'active',
    sort_order: 0
  };
};

// 类方法：获取待审核的提交
ToolSubmission.getPendingSubmissions = async function(options = {}) {
  const {
    limit = 20,
    offset = 0,
    status = 'pending',
    order = [['priority', 'DESC'], ['created_at', 'ASC']]
  } = options;
  
  const whereClause = {};
  if (status && status !== 'all') {
    whereClause.status = status;
  }
  
  return await ToolSubmission.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order,
    attributes: {
      exclude: ['additional_info'] // 列表查询时排除额外信息
    }
  });
};

// 类方法：获取统计信息
ToolSubmission.getStats = async function() {
  const totalSubmissions = await ToolSubmission.count();
  const pendingSubmissions = await ToolSubmission.count({ where: { status: 'pending' } });
  const approvedSubmissions = await ToolSubmission.count({ where: { status: 'approved' } });
  const rejectedSubmissions = await ToolSubmission.count({ where: { status: 'rejected' } });
  const processingSubmissions = await ToolSubmission.count({ where: { status: 'processing' } });
  
  return {
    total: totalSubmissions,
    pending: pendingSubmissions,
    approved: approvedSubmissions,
    rejected: rejectedSubmissions,
    processing: processingSubmissions
  };
};

export default ToolSubmission;
