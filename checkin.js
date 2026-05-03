/**
 * 自动打卡脚本 - Sign In CST (学生日常打卡系统)
 *
 * 用法:   node checkin.js
 * 定时:   运行 setup-scheduler.ps1 创建 Windows 定时任务
 * 日志:   输出到 checkin.log
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_HOST = 'sincst.cn';
const BASE_PATH = '/api';
const LOG_FILE = path.join(__dirname, 'checkin.log');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// ====== 日志 ======
function log(msg) {
  const ts = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

// ====== 配置 ======
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    log('[错误] config.json 不存在');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

const config = loadConfig();

// ====== HTTP 请求 ======
function request(method, urlPath, params, data, token, signKey) {
  return new Promise((resolve, reject) => {
    let queryString = '';
    if (params && Object.keys(params).length > 0) {
      queryString = '?' + Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
    }

    const fullPath = BASE_PATH + urlPath + queryString;
    const timestamp = Date.now().toString();
    const nonce = Math.random().toString(36).slice(2);

    const sortedParams = params
      ? Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&')
      : '';
    const signStr = [
      method.toUpperCase(),
      BASE_PATH + (urlPath.split('?')[0]),
      sortedParams,
      timestamp,
      nonce,
    ].join('\n');
    const sign = signKey
      ? crypto.createHmac('sha256', signKey).update(signStr).digest('hex')
      : null;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (sign) {
      headers['X-Timestamp'] = timestamp;
      headers['X-Nonce'] = nonce;
      headers['X-Sign'] = sign;
    }

    let bodyStr = '';
    if (data) {
      bodyStr = JSON.stringify(data);
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const options = {
      hostname: BASE_HOST, port: 443, path: fullPath,
      method: method.toUpperCase(), headers,
      rejectUnauthorized: false, timeout: 15000,
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const rawBody = Buffer.concat(chunks).toString();
        try {
          const json = JSON.parse(rawBody);
          resolve({
            code: res.statusCode,
            headers: res.headers,
            data: json,
            newToken: res.headers['x-new-token'],
          });
        } catch {
          resolve({ code: res.statusCode, headers: res.headers, data: rawBody });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ====== 模拟人类滑块轨迹 ======
function generateTrajectories() {
  const points = [];
  let x = 0, t = Date.now();
  const distance = 200 + Math.random() * 40;
  const steps = 50 + Math.floor(Math.random() * 30);

  for (let i = 0; i < steps; i++) {
    const p = i / steps;
    const ease = p < 0.1
      ? p * p * 50
      : p > 0.8
        ? 1 - Math.pow(1 - p, 3)
        : p;
    x = Math.round(ease * distance + (Math.random() - 0.5) * 3);
    t += Math.round(5 + Math.random() * 15);
    points.push({ x, t });
  }
  return points;
}

// ====== 主流程 ======
async function main() {
  log('========== 自动打卡开始 ==========');

  try {
    // 1. 检查角色
    const roleRes = await request('POST', '/auth/check-role', null, { student_no: config.student_no });
    if (roleRes.data.code !== 200) {
      throw new Error(`检查角色失败: ${roleRes.data.message}`);
    }

    // 2. 登录
    const loginPayload = config.password
      ? { student_no: config.student_no, password: config.password }
      : { student_no: config.student_no, name: config.name };

    const loginRes = await request('POST', '/auth/login', null, loginPayload);
    if (loginRes.data.code !== 200) {
      throw new Error(`登录失败: ${loginRes.data.message}`);
    }

    const loginInfo = loginRes.data.data;
    log(`登录成功: ${loginInfo.name} (${loginInfo.role})`);

    // 3. 查询今日状态
    const statusRes = await request('GET', '/attendance/today-status', null, null,
      loginInfo.token, loginInfo.sign_key);

    // today-status 返回 null 表示未打卡，返回打卡记录表示已打卡
    if (statusRes.data.code === 200 && statusRes.data.data) {
      log(`今日已打卡 (${statusRes.data.data.attendance_time})，跳过`);
      return;
    }

    // 4. 滑块验证码
    const chalRes = await request('POST', '/attendance/slider-challenge', null, {},
      loginInfo.token, loginInfo.sign_key);

    if (chalRes.data.code === 200 && chalRes.data.data && chalRes.data.data.nonce) {
      const traj = generateTrajectories();
      await request('POST', '/attendance/slider-verify', null, {
        trajectories: traj,
        nonce: chalRes.data.data.nonce,
      }, loginInfo.token, loginInfo.sign_key);
    }

    // 5. 打卡
    const checkRes = await request('POST', '/attendance/check-in', null,
      { status: '在校' }, loginInfo.token, loginInfo.sign_key);

    if (checkRes.data.code === 200) {
      log(`打卡成功: ${checkRes.data.data.attendance_time}`);
    } else {
      log(`打卡返回: ${checkRes.data.message || JSON.stringify(checkRes.data)}`);
    }
  } catch (err) {
    log(`失败: ${err.message}`);
    process.exit(1);
  }
}

main();
