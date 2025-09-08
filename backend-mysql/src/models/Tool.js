import { DataTypes } from 'sequelize';
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
  
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Tool'
  },
  
  icon_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  
  icon_file: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '上传的图标文件名'
  },
  
  icon_theme: {
    type: DataTypes.ENUM('auto', 'light', 'dark', 'none'),
    defaultValue: 'auto'
  },
  
  category: {
    type: DataTypes.ENUM('AI', '效率', '设计', '开发', '其他'),
    allowNull: false
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
      isUrl: true
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
  
  view_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  click_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    validate: {
      min: 0
    }
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
      fields: ['view_count']
    },
    {
      fields: ['click_count']
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

// 实例方法：增加浏览量
Tool.prototype.incrementView = async function() {
  this.view_count += 1;
  return await this.save({ fields: ['view_count'] });
};

// 实例方法：增加点击量
Tool.prototype.incrementClick = async function() {
  this.click_count += 1;
  return await this.save({ fields: ['click_count'] });
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
    status = 'active',
    limit = 20, 
    offset = 0,
    order = [['sort_order', 'DESC'], ['created_at', 'DESC']]
  } = options;
  
  const whereClause = { status };
  
  if (category) {
    whereClause.category = category;
  }
  
  if (featured !== undefined) {
    whereClause.featured = featured;
  }
  
  if (query) {
    const { Op } = await import('sequelize');
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
  
  const categoryStats = await Tool.findAll({
    attributes: [
      'category',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('view_count')), 'total_views'],
      [sequelize.fn('SUM', sequelize.col('click_count')), 'total_clicks'],
      [sequelize.fn('AVG', sequelize.literal('rating_sum / GREATEST(rating_count, 1)')), 'avg_rating']
    ],
    where: { status: 'active' },
    group: ['category'],
    order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
  });
  
  return {
    totalTools,
    featuredTools,
    categoryStats: categoryStats.map(stat => ({
      category: stat.category,
      count: parseInt(stat.dataValues.count),
      totalViews: parseInt(stat.dataValues.total_views) || 0,
      totalClicks: parseInt(stat.dataValues.total_clicks) || 0,
      avgRating: parseFloat(stat.dataValues.avg_rating) || 0
    }))
  };
};

export default Tool;
