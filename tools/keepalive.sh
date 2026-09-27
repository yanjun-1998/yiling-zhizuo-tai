#!/bin/bash
# 老闫物理工作台 · 本地保活心跳（零额度，对标教务系统 heartbeat.js）
# 作用：周期性只读访问线上链接，让云端沙箱保持活跃，尽量防止免费托管回收发布版本。
# 说明：纯读取、不写文件、不建日志、不上传任何数据（零副作用）。
URL="https://1e82f75555f54f10877a320bdd75aba9.gz2.agentos-app.net"
curl -s -o /dev/null -m 20 "$URL" || true
exit 0
