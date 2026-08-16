#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
单文件版重建器 · 亿领智作台
================================
把 工作台/ (index.html + assets/*.css + assets/*.js) 内联成一个零依赖的
单 HTML 文件，写入 工作台交付物/①工作台单文件版-直接打开.html。

用途：线上自动化(早8/晚8双推等)更新 assets 里的热数据后，本工作台文件夹
仍是数据源；运行本脚本即可把最新数据"烘焙"进单文件版，供手机/离线打开。

用法：
    python3 tools/build_singlefile.py
幂等：每次都从当前 工作台/ 全量重建，保证单文件版 = 最新数据快照。
"""
import re
import os
import sys
import zipfile
import datetime
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # .../工作台
ASSETS = os.path.join(ROOT, "assets")
OUT_DIR = os.path.join(os.path.dirname(ROOT), "工作台交付物")
OUT = os.path.join(OUT_DIR, "①工作台单文件版-直接打开.html")

CSS_RE = re.compile(r'<link[^>]+href="assets/style\.css"[^>]*>', re.I)
SCRIPT_RE = re.compile(r'<script src="(assets/[A-Za-z0-9_.\-]+\.js)(\?v=[0-9]*)?"></script>')


def inline_script(m):
    rel = m.group(1).split('?')[0]          # assets/data-core.js
    path = os.path.join(ROOT, rel)
    code = open(path, encoding="utf-8").read()
    code = code.replace('</script>', '<\\/script>')  # 防止截断
    return '<script>\n' + code + '\n</script>'


def main():
    html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()

    # 1) CSS 内联
    css = open(os.path.join(ASSETS, "style.css"), encoding="utf-8").read()
    html = CSS_RE.sub('<style>\n' + css + '\n</style>', html)

    # 2) JS 内联
    scripts = SCRIPT_RE.findall(html)
    html = SCRIPT_RE.sub(inline_script, html)

    # 3) 构建戳（便于核对单文件版新鲜度）
    # ⚠️ 注意：Python str.replace 默认全局替换。文档 <head> 在第8行、app.js 字符串内也含
    # </head>，若不加 count=1 会把注释插进 app.js 的字符串里把 JS 劈断（已踩坑）。
    # 文档 <head> 是全文件第一个 </head>，故 count=1 只命中它。
    stamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    html = html.replace('</head>',
                        f'<!-- 单文件版构建于 {stamp} · 数据源 工作台/ -->\n</head>', 1)

    os.makedirs(OUT_DIR, exist_ok=True)
    data = html.encode("utf-8")
    open(OUT, "wb").write(data)

    # 自检
    ext_script = len(re.findall(r'<script src=', html))
    ext_assets = len(re.findall(r'(src|href)="assets/', html))
    pnpmap = html.count("var PNMAP")
    lock = html.count("lockOverlay")
    print(f"✅ 已写入: {OUT}")
    print(f"   构建时间: {stamp}")
    print(f"   内联 JS 数: {len(scripts)}")
    print(f"   残留外链 <script src=>: {ext_script} (应=0)")
    print(f"   残留 assets/ 引用: {ext_assets} (应=0)")
    print(f"   var PNMAP: {pnpmap} (应=1) | lockOverlay: {lock} (应=0)")
    if ext_script or ext_assets or lock or pnpmap != 1:
        print("⚠️ 自检未通过，请检查！")
        raise SystemExit(1)

    # 4) 同步进 ②工作台完整版.zip（原子替换两处单文件版条目）
    update_zip(data)

    # 5) 渲染自检闸门（拦白屏回归）
    if not verify_render(OUT):
        raise SystemExit(1)


def verify_render(path):
    """用 jsdom 真实渲染单文件版，断言 0 运行时错误。
    grep 类自检查不出 TDZ / 字符串被劈断这类只会在浏览器引擎里崩溃的 bug，
    必须真正渲染才能发现。自动化跑本脚本时，这条闸门能拦住白屏回归。"""
    node = "/Users/yanjun/.workbuddy/binaries/node/versions/22.22.2/bin/node"
    jsdom = "/Users/yanjun/.workbuddy/binaries/node/workspace/node_modules/jsdom"
    checker = os.path.join(OUT_DIR, ".render_check.js")
    src = (
        "const fs=require('fs');"
        "const {JSDOM,VirtualConsole}=require(" + repr(jsdom) + ");"
        "const html=fs.readFileSync(process.argv[2],'utf8');"
        "const errs=[];const vc=new VirtualConsole();"
        "vc.on('jsdomError',e=>{const m=e.detail?(e.detail.stack||e.detail.message):e.message;if(!/Not implemented/i.test(m))errs.push(m);});"
        "new JSDOM(html,{runScripts:'dangerously',virtualConsole:vc,pretendToBeVisual:true});"
        "setTimeout(()=>{console.log(errs.length?('ERR:'+errs.length+':'+String(errs[0]).slice(0,300)):'RENDER_OK');},900);"
    )
    with open(checker, "w") as f:
        f.write(src)
    try:
        out = subprocess.run([node, checker, path], capture_output=True, text=True, timeout=30).stdout.strip()
    finally:
        try:
            os.remove(checker)
        except OSError:
            pass
    if out == "RENDER_OK":
        print("✅ jsdom 渲染自检: 0 运行时错误（非白屏）")
        return True
    print("⚠️ jsdom 渲染自检未通过:", out or "(无输出)")
    return False


def update_zip(single_html_bytes):
    """把单文件版同步进 ②工作台完整版.zip 的两处单文件条目（原子替换，原 zip 全程不破坏）。"""
    zip_path = os.path.join(OUT_DIR, "②工作台完整版.zip")
    if not os.path.exists(zip_path):
        print("⚠️ 未找到 zip，跳过同步:", zip_path)
        return
    targets = {"工作台单文件版.html", "工作台/工作台单文件版.html"}
    tmp = zip_path + ".tmp"
    replaced = set()
    with zipfile.ZipFile(zip_path, "r") as zin, \
         zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename in targets:
                zout.writestr(item, single_html_bytes)
                replaced.add(item.filename)
            else:
                zout.writestr(item, zin.read(item.filename))
    os.replace(tmp, zip_path)
    print(f"✅ zip 内单文件版已同步: {replaced if replaced else '(目标条目未找到)'}")


if __name__ == "__main__":
    main()

