/**
 * Node.js 16 兼容性 polyfills
 * 必须在应用启动前加载
 */

import fetch, { Headers, Request, Response } from 'node-fetch';

// 设置全局fetch API
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}

// 兼容性：同时设置到global对象
if (!global.fetch) {
  global.fetch = fetch;
  global.Headers = Headers;
  global.Request = Request;
  global.Response = Response;
}

console.log('✅ Node.js 16 polyfills loaded successfully');
