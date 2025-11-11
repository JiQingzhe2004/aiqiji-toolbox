/**
 * 邮箱验证工具
 */

import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

/**
 * 严格的邮箱格式验证
 */
export function validateEmailFormat(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: '邮箱地址不能为空' };
  }

  // 基本格式检查
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicRegex.test(email)) {
    return { valid: false, message: '邮箱格式不正确' };
  }

  // 更严格的格式验证
  const strictRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
  if (!strictRegex.test(email)) {
    return { valid: false, message: '邮箱格式不符合规范' };
  }

  // 长度检查
  const [localPart, domain] = email.split('@');
  if (localPart.length > 64) {
    return { valid: false, message: '邮箱用户名部分过长' };
  }
  if (domain.length > 255) {
    return { valid: false, message: '邮箱域名部分过长' };
  }
  if (email.length > 320) {
    return { valid: false, message: '邮箱地址过长' };
  }

  // 检查常见的输入错误
  const commonTypos = [
    { wrong: '@gmial.com', correct: '@gmail.com' },
    { wrong: '@gmai.com', correct: '@gmail.com' },
    { wrong: '@163.con', correct: '@163.com' },
    { wrong: '@qq.con', correct: '@qq.com' },
    { wrong: '@126.con', correct: '@126.com' },
    { wrong: '@outlok.com', correct: '@outlook.com' },
    { wrong: '@hotmial.com', correct: '@hotmail.com' }
  ];

  for (const typo of commonTypos) {
    if (email.toLowerCase().endsWith(typo.wrong)) {
      return { 
        valid: false, 
        message: `邮箱地址可能有误，您是否想输入 ${email.replace(new RegExp(typo.wrong + '$', 'i'), typo.correct)}？` 
      };
    }
  }

  return { valid: true };
}

/**
 * 检查邮箱域名的 MX 记录（验证域名是否可以接收邮件）
 */
export async function checkEmailDomain(email) {
  try {
    const domain = email.split('@')[1];
    if (!domain) {
      return { valid: false, message: '无效的邮箱域名' };
    }

    // 检查 MX 记录
    const mxRecords = await resolveMx(domain);
    
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, message: '该邮箱域名无法接收邮件，请检查邮箱地址是否正确' };
    }

    return { valid: true, mxRecords };
  } catch (error) {
    // DNS 查询失败
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return { valid: false, message: '该邮箱域名不存在，请检查邮箱地址是否正确' };
    }
    
    // 其他错误（网络问题等）不阻止发送
    console.warn('邮箱域名检查失败:', error.message);
    return { valid: true, warning: '无法验证邮箱域名，但仍将尝试发送' };
  }
}

/**
 * 完整的邮箱验证（格式 + 域名）
 */
export async function validateEmail(email, options = {}) {
  const { checkDomain = true } = options;

  // 1. 格式验证
  const formatCheck = validateEmailFormat(email);
  if (!formatCheck.valid) {
    return formatCheck;
  }

  // 2. 域名验证（可选）
  if (checkDomain) {
    const domainCheck = await checkEmailDomain(email);
    if (!domainCheck.valid) {
      return domainCheck;
    }
    if (domainCheck.warning) {
      return { valid: true, warning: domainCheck.warning };
    }
  }

  return { valid: true };
}

/**
 * 常见邮箱服务商列表（用于提示）
 */
export const commonEmailProviders = [
  'gmail.com',
  'qq.com',
  '163.com',
  '126.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'sina.com',
  'sohu.com',
  'foxmail.com',
  '139.com',
  'yeah.net'
];

/**
 * 建议邮箱域名（当用户输入不完整时）
 */
export function suggestEmailDomain(partialEmail) {
  if (!partialEmail || !partialEmail.includes('@')) {
    return [];
  }

  const [, partialDomain] = partialEmail.split('@');
  if (!partialDomain) {
    return commonEmailProviders.map(provider => `${partialEmail}${provider}`);
  }

  return commonEmailProviders
    .filter(provider => provider.startsWith(partialDomain.toLowerCase()))
    .map(provider => partialEmail.replace(/@.*$/, `@${provider}`));
}
