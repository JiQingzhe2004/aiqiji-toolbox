/**
 * 验证码服务
 * 处理验证码的生成、存储、验证等功能
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { VerificationCode } from '../models/VerificationCode.js';
import { Op } from 'sequelize';

export class VerificationCodeService {
  constructor() {
    this.codeLength = 6;
    this.expiryMinutes = 5;
    this.sendIntervalSeconds = 60;
  }

  /**
   * 生成验证码
   * 包含数字和大写字母的6位随机码
   */
  generateRandomCode() {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    
    for (let i = 0; i < this.codeLength; i++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      code += characters[randomIndex];
    }
    
    return code;
  }

  /**
   * 加密验证码
   * 使用bcrypt进行单向hash加密
   */
  async hashCode(code) {
    const saltRounds = 10; // 使用较低的轮数以提高性能，验证码有时效性
    return await bcrypt.hash(code, saltRounds);
  }

  /**
   * 验证加密的验证码
   */
  async compareCode(plainCode, hashedCode) {
    return await bcrypt.compare(plainCode, hashedCode);
  }

  /**
   * 生成并存储验证码
   */
  async generateCode(email, type) {
    try {
      // 清理过期的验证码
      await this.cleanExpiredCodes();

      // 使现有未使用的验证码失效
      await VerificationCode.update(
        { is_used: true },
        {
          where: {
            email: email.toLowerCase(),
            code_type: type,
            is_used: false,
            expires_at: {
              [Op.gt]: new Date()
            }
          }
        }
      );

      // 生成新验证码
      const code = this.generateRandomCode();
      const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

      // 加密验证码
      const hashedCode = await this.hashCode(code);

      // 存储加密后的验证码
      await VerificationCode.create({
        email: email.toLowerCase(),
        code: hashedCode, // 存储加密后的验证码
        code_type: type,
        expires_at: expiresAt,
        is_used: false,
        send_count: 1,
        created_at: new Date(),
        last_send_at: new Date()
      });

      console.log(`验证码生成成功: ${email} - ${type} - [已加密]`);
      return code; // 返回原始验证码用于发送邮件
    } catch (error) {
      console.error('生成验证码失败:', error);
      throw new Error('生成验证码失败');
    }
  }

  /**
   * 验证验证码
   */
  async verifyCode(email, code, type) {
    try {
      // 获取该邮箱未使用且未过期的验证码记录
      const verificationRecords = await VerificationCode.findAll({
        where: {
          email: email.toLowerCase(),
          code_type: type,
          is_used: false,
          expires_at: {
            [Op.gt]: new Date()
          }
        },
        order: [['created_at', 'DESC']] // 按创建时间倒序，优先验证最新的
      });

      // 逐个验证加密的验证码
      for (const record of verificationRecords) {
        const isMatch = await this.compareCode(code, record.code);
        if (isMatch) {
          console.log(`验证码验证成功: ${email} - ${type} - [已加密]`);
          // 将匹配的记录ID存储起来，供后续标记使用
          this.lastVerifiedRecordId = record.id;
          return true;
        }
      }

      console.log(`验证码验证失败: ${email} - ${type} - [已加密]`);
      return false;
    } catch (error) {
      console.error('验证验证码失败:', error);
      throw new Error('验证验证码失败');
    }
  }

  /**
   * 标记验证码为已使用
   */
  async markCodeAsUsed(email, code, type) {
    try {
      // 优先使用刚刚验证成功的记录ID
      if (this.lastVerifiedRecordId) {
        await VerificationCode.update(
          { 
            is_used: true,
            used_at: new Date()
          },
          {
            where: {
              id: this.lastVerifiedRecordId,
              email: email.toLowerCase(),
              code_type: type,
              is_used: false
            }
          }
        );
        
        // 清除临时记录ID
        this.lastVerifiedRecordId = null;
        console.log(`验证码标记为已使用: ${email} - ${type} - [已加密]`);
        return;
      }

      // 如果没有临时记录ID，则需要重新查找匹配的记录
      const verificationRecords = await VerificationCode.findAll({
        where: {
          email: email.toLowerCase(),
          code_type: type,
          is_used: false,
          expires_at: {
            [Op.gt]: new Date()
          }
        },
        order: [['created_at', 'DESC']]
      });

      // 找到匹配的记录并标记为已使用
      for (const record of verificationRecords) {
        const isMatch = await this.compareCode(code, record.code);
        if (isMatch) {
          await record.update({
            is_used: true,
            used_at: new Date()
          });
          console.log(`验证码标记为已使用: ${email} - ${type} - [已加密]`);
          return;
        }
      }

      console.log(`未找到匹配的验证码记录: ${email} - ${type}`);
    } catch (error) {
      console.error('标记验证码为已使用失败:', error);
      throw new Error('标记验证码为已使用失败');
    }
  }

  /**
   * 获取最后发送时间
   */
  async getLastSendTime(email, type) {
    try {
      const lastRecord = await VerificationCode.findOne({
        where: {
          email: email.toLowerCase(),
          code_type: type
        },
        order: [['last_send_at', 'DESC']]
      });

      return lastRecord ? new Date(lastRecord.last_send_at).getTime() : null;
    } catch (error) {
      console.error('获取最后发送时间失败:', error);
      return null;
    }
  }

  /**
   * 记录发送时间
   */
  async recordSendTime(email, type) {
    try {
      // 更新最新记录的发送时间
      const latestRecord = await VerificationCode.findOne({
        where: {
          email: email.toLowerCase(),
          code_type: type,
          is_used: false
        },
        order: [['created_at', 'DESC']]
      });

      if (latestRecord) {
        await latestRecord.update({
          last_send_at: new Date(),
          send_count: (latestRecord.send_count || 1) + 1
        });
      }
    } catch (error) {
      console.error('记录发送时间失败:', error);
    }
  }

  /**
   * 检查发送频率限制
   */
  async checkSendLimit(email, type) {
    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - this.sendIntervalSeconds * 1000);

      const recentRecord = await VerificationCode.findOne({
        where: {
          email: email.toLowerCase(),
          code_type: type,
          last_send_at: {
            [Op.gt]: oneMinuteAgo
          }
        }
      });

      if (recentRecord) {
        const remainingTime = Math.ceil((this.sendIntervalSeconds * 1000 - (now.getTime() - new Date(recentRecord.last_send_at).getTime())) / 1000);
        return {
          allowed: false,
          remainingTime
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('检查发送频率限制失败:', error);
      return { allowed: true }; // 出错时允许发送
    }
  }

  /**
   * 清理过期的验证码
   */
  async cleanExpiredCodes() {
    try {
      const deletedCount = await VerificationCode.destroy({
        where: {
          [Op.or]: [
            {
              expires_at: {
                [Op.lt]: new Date()
              }
            },
            {
              created_at: {
                [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时前
              }
            }
          ]
        }
      });

      if (deletedCount > 0) {
        console.log(`清理过期验证码: ${deletedCount} 条`);
      }
    } catch (error) {
      console.error('清理过期验证码失败:', error);
    }
  }

  /**
   * 获取验证码统计信息
   */
  async getStats(email = null, type = null) {
    try {
      const where = {};
      if (email) where.email = email.toLowerCase();
      if (type) where.code_type = type;

      const stats = await VerificationCode.findAll({
        where,
        attributes: [
          'code_type',
          [VerificationCode.sequelize.fn('COUNT', '*'), 'total'],
          [VerificationCode.sequelize.fn('COUNT', VerificationCode.sequelize.where(VerificationCode.sequelize.col('is_used'), true)), 'used'],
          [VerificationCode.sequelize.fn('COUNT', VerificationCode.sequelize.where(VerificationCode.sequelize.col('expires_at'), '>', new Date())), 'valid']
        ],
        group: ['code_type'],
        raw: true
      });

      return stats;
    } catch (error) {
      console.error('获取验证码统计失败:', error);
      return [];
    }
  }
}
