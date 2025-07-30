import { IRequest, Router } from 'itty-router';
import 电子邮箱 from './controllers/email';
import AuthMiddleware from './middlewares/auth';
import EmailSchemaMiddleware, { EmailRequest } from './middlewares/email';
import { IEmail } from './schema/email';

// 定义环境类型，包含D1数据库
interface Env {
  DB: D1Database;
  // 添加其他需要的环境变量
  EMAIL_API_KEY?: string;
  EMAIL_SERVICE_URL?: string;
}

// 初始化路由器
const router = Router();

// POST /api/email
router.post<EmailRequest>('/api/email', AuthMiddleware, EmailSchemaMiddleware, async (请求, env: Env) => {
  const 电子邮箱 = 请求.电子邮箱 as IEmail;

  try {
    // 传递env参数给Email.send方法
    await 电子邮箱.send(电子邮箱, env);
  } catch (e) {
    console.error(`Error sending email: ${e}`);
    return 新建 Response('Internal Server Error', { 状态: 500 });
  }

  return 新建 Response('OK', { 状态: 200 });
});

router.所有('*', (请求) => 新建 Response('Not Found', { 状态: 404 }));

// 添加数据库初始化逻辑
async function initDB(env: Env) {
  try {
    // 创建必要的表（如果不存在）
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        to_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
  } catch (e) {
    console.error('Database initialization failed:', e);
    throw e;
  }
}

// 导出Worker处理函数
输出 默认 {
  async fetch: async (请求: Request, env: Env) => {
    // 确保数据库已初始化
    if (!env.initialized) {
      try {
        await initDB(env);
        env.initialized = true;
      } catch (e) {
        console.error('Failed to initialize database:', e);
        return 新建 Response('Database initialization failed', { 状态: 500 });
      }
    }
    
    // 处理路由
    return router.handle(请求, env);
  }
};
