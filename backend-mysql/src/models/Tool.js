import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * 工具模型
 */
const Tool = sequelize.define('Tool', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^[a-zA-Z0-9-_]+$/
    }
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 1000]
    }
  },
  
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: '工具详细说明内容，支持富文本格式'
  },
  
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Tool'
  },
  
  icon_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isValidUrl(value) {
        if (!value) return; // 允许空值
        
        // 使用JavaScript内置URL构造函数进行验证，更加准确
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
    }
  },
  
  icon_file: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '上传的图标文件名'
  },
  
  icon_theme: {
    type: DataTypes.ENUM('auto', 'auto-light', 'auto-dark', 'light', 'dark', 'none'),
    defaultValue: 'auto-dark'
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
    }
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
    }
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
    }
  },
  
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active'
  },
  
  
  rating_sum: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  rating_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  needs_vpn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否需要VPN访问'
  },
  
  // 添加网盘链接标识字段
  is_cloud_storage: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否为网盘链接'
  }
}, {
  tableName: 'tools',
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['featured']
    },
    {
      fields: ['status']
    },
    {
      fields: ['sort_order']
    },
    {
      fields: ['created_at']
    }
  ]
});

// 虚拟字段：平均评分
Tool.prototype.getAverageRating = function() {
  return this.rating_count > 0 ? (this.rating_sum / this.rating_count).toFixed(1) : 0;
};


// 实例方法：添加评分
Tool.prototype.addRating = async function(rating) {
  if (rating < 1 || rating > 5) {
    throw new Error('评分必须在1-5之间');
  }
  
  this.rating_sum += rating;
  this.rating_count += 1;
  
  return await this.save({ fields: ['rating_sum', 'rating_count'] });
};

// 类方法：搜索工具
Tool.searchTools = async function(query, options = {}) {
  const {
    category, 
    featured, 
    status, // 移除默认值，让调用方决定是否筛选状态
    limit = 20, 
    offset = 0,
    order = [['sort_order', 'DESC'], ['created_at', 'DESC']]
  } = options;
  
  const whereClause = {};
  
  // 只有当status有值时才添加状态筛选
  if (status !== undefined) {
    whereClause.status = status;
  }
  
  if (category) {
    // 支持多分类搜索：检查JSON数组中是否包含指定分类
    whereClause[sequelize.literal(`JSON_SEARCH(category, 'one', '${category}') IS NOT NULL`)] = true;
  }
  
  if (featured !== undefined) {
    whereClause.featured = featured;
  }
  
  if (query) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${query}%` } },
      { description: { [Op.like]: `%${query}%` } },
      sequelize.where(
        sequelize.fn('JSON_SEARCH', sequelize.col('tags'), 'one', `%${query}%`),
        { [Op.ne]: null }
      )
    ];
  }
  
  return await Tool.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order,
    attributes: {
      include: [
        [sequelize.literal('(rating_sum / GREATEST(rating_count, 1))'), 'average_rating']
      ]
    }
  });
};

// 类方法：获取统计信息
Tool.getStats = async function() {
  const totalTools = await Tool.count({ where: { status: 'active' } });
  const featuredTools = await Tool.count({ where: { status: 'active', featured: true } });
  
  // 由于category现在是JSON数组，需要特殊处理统计
  // 这里先返回总体统计，分类统计需要通过其他方式实现
  const categoryStats = [];
  const validCategories = ['AI', '效率', '设计', '开发', '其他'];
  
  for (const cat of validCategories) {
    const count = await Tool.count({
      where: {
        status: 'active',
        [Op.and]: [
          sequelize.literal(`JSON_SEARCH(category, 'one', '${cat}') IS NOT NULL`)
        ]
      }
    });
    
    if (count > 0) {
      categoryStats.push({
        category: cat,
        count: count,
        avgRating: 0 // 暂时设为0，后续可以优化
      });
    }
  }
  
  return {
    totalTools,
    featuredTools,
    categoryStats: categoryStats
  };
};

export default Tool;
