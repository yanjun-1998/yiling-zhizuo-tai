/* 验证：数据新鲜度哨兵（正常态 + 过期态）、🆕/↻ 标记、出稿回归 */
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = '/Users/yanjun/WorkBuddy/个人IP/工作台';
const htmlSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let pass = 0, fail = 0;
const T = (n, c, x) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  ❌ ' + n + (x ? '  → ' + x : '')); } };

function boot(mutate) {
  const errs = [];
  const dom = new JSDOM(htmlSrc, {
    runScripts: 'dangerously', url: 'http://localhost/',
    beforeParse(w) {
      const store = new Map();
      Object.defineProperty(w, 'localStorage', {
        value: {
          getItem: k => store.has(k) ? store.get(k) : null,
          setItem: (k, v) => store.set(k, String(v)),
          removeItem: k => store.delete(k), clear: () => store.clear()
        }
      });
      w.scrollTo = () => {};
      w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {} }));
    }
  });
  const w = dom.window, d = w.document;
  [...d.querySelectorAll('script[src]')].map(s => s.getAttribute('src')).forEach(src => {
    const p = path.join(ROOT, src);
    if (!fs.existsSync(p)) { errs.push('missing ' + src); return; }
    try { w.eval(fs.readFileSync(p, 'utf8')); } catch (e) { errs.push(src + ': ' + e.message); }
  });
  if (mutate) mutate(w);
  try { w.renderHome(); } catch (e) { errs.push('renderHome: ' + e.message); }
  const home = d.querySelector('#home');
  return { w, d, errs, H: home ? home.innerHTML : '' };
}

console.log('\n【场景一】数据新鲜（当前真实状态）');
{
  const { errs, H } = boot();
  T('无 JS 报错', errs.length === 0, errs.join(' | '));
  T('首页渲染出内容', H.length > 500);
  T('首页显示今日行动数据年龄', H.includes('今日行动数据：更新于'));
  T('实时时事区显示热点年龄', H.includes('热点新鲜度：更新于'));
  T('显示下次自动更新时刻', H.includes('下次自动更新'));
  T('新鲜态不出现红色告警', !H.includes('freshbar bad'));
  T('卡片出现 🆕今日新增 标记', H.includes('🆕今日新增'));
  T('卡片出现 ↻延续 标记', H.includes('↻延续'));
  const n = (H.match(/🆕今日新增/g) || []).length;
  T('🆕 标记 ' + n + ' 条（≥3）', n >= 3);
  T('质量哨兵仍在（回归）', H.includes('内容质量哨兵'));
}

console.log('\n【场景二】模拟数据过期 20 小时（自动化漏跑）');
{
  const { errs, H } = boot(w => {
    const old = '2026-08-06T07:00:00+08:00';
    if (w.HOT) w.HOT.updatedAt = old;
    if (w.TODAY_FEED) w.TODAY_FEED.updatedAt = old;
    if (w.TODAY) w.TODAY.updatedAt = old;
  });
  T('无 JS 报错', errs.length === 0, errs.join(' | '));
  T('出现红色过期告警条', H.includes('freshbar bad'));
  T('明确告知「自动化漏跑了」', H.includes('自动化漏跑了'));
  T('告知守护会自动补跑', H.includes('漏跑守护'));
  T('给出人工急救指令', H.includes('补跑今天热点'));
  T('显示精确过期时长', /更新于 <b>2\d\.\d 小时前<\/b>/.test(H));
}

console.log('\n【场景三】出稿回归（深度+方案仍在）');
{
  const { w, errs } = boot();
  T('无 JS 报错', errs.length === 0, errs.join(' | '));
  let out = '';
  try { out = w.genToday(w.TODAY_FEED.recs[0], 0) || ''; } catch (e) { out = 'ERR:' + e.message; }
  T('出稿可执行且有内容', !out.startsWith('ERR:') && out.length > 200, out.slice(0, 90));
  T('稿件含底层逻辑段', out.includes('为什么值得你今天动') || out.includes('底层逻辑'));
  T('稿件含 ①②③ 三条动作', out.includes('①') && out.includes('②') && out.includes('③'));
  const r0 = w.TODAY_FEED.recs[0];
  T('稿件含 depth 原文', out.includes(r0.depth.slice(0, 15)));
  T('稿件含 solution 原文', out.includes(r0.solution.slice(0, 15)));
}

console.log('\n========== ' + pass + '/' + (pass + fail) + ' 通过' + (fail ? '，失败 ' + fail : '') + ' ==========');
process.exit(fail ? 1 : 0);
