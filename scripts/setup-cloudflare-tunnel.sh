#!/usr/bin/env bash
# Cloudflare Tunnel Runner for macOS/Linux
cd "$(dirname "$0")/.."

echo "================================================================="
echo "   CLOUDFLARE TUNNEL - TẠO LINK PUBLIC HTTPS CHO SMART QUEUE"
echo "================================================================="

if command -v cloudflared &> /dev/null; then
    echo "Khởi động Cloudflare Tunnel..."
    cloudflared tunnel --url http://localhost:3000
else
    echo "cloudflared chưa được cài đặt."
    echo "Trên macOS: brew install cloudflared"
    echo "Trên Ubuntu/Debian: sudo apt install cloudflared"
    echo "Sau đó chạy lại script này."
fi
