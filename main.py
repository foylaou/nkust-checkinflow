#!/usr/bin/env python3
"""
開發環境啟動腳本 - 統一管理前後端 log
"""
import subprocess
import signal
import sys
import time
import os
from datetime import datetime
from pathlib import Path
import threading


# 顏色定義
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'


processes = []
log_dir = Path('logs')


def setup_logging():
    """建立 log 目錄"""
    log_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    backend_log = log_dir / f'backend_{timestamp}.log'
    frontend_log = log_dir / f'frontend_{timestamp}.log'
    combined_log = log_dir / f'combined_{timestamp}.log'

    return backend_log, frontend_log, combined_log


def log_output(process, prefix, color, log_file, combined_file):
    """讀取並記錄進程輸出"""
    try:
        for line in iter(process.stdout.readline, b''):
            if line:
                decoded_line = line.decode('utf-8', errors='ignore').rstrip()
                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

                # 終端機輸出 (帶顏色)
                print(f"{color}[{prefix}] {timestamp}{Colors.END} {decoded_line}")

                # 寫入個別 log 檔
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"[{timestamp}] {decoded_line}\n")

                # 寫入合併 log 檔
                with open(combined_file, 'a', encoding='utf-8') as f:
                    f.write(f"[{prefix}] [{timestamp}] {decoded_line}\n")
    except Exception as e:
        print(f"{Colors.RED}Log 錯誤 ({prefix}): {e}{Colors.END}")


def signal_handler(sig, frame):
    """處理中斷信號"""
    print(f'\n{Colors.YELLOW}🛑 停止所有服務...{Colors.END}')
    for p in processes:
        try:
            p.terminate()
            p.wait(timeout=5)
        except subprocess.TimeoutExpired:
            p.kill()
        except Exception as e:
            print(f"{Colors.RED}停止服務時發生錯誤: {e}{Colors.END}")

    print(f'{Colors.GREEN}✅ 所有服務已停止{Colors.END}')
    print(f'{Colors.CYAN}📝 Log 檔案位於: {log_dir}{Colors.END}')
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print(f'{Colors.HEADER}{Colors.BOLD}🚀 啟動開發環境...{Colors.END}')

    # 設定 logging
    backend_log, frontend_log, combined_log = setup_logging()
    print(f'{Colors.CYAN}📝 Log 檔案:{Colors.END}')
    print(f'   後端: {backend_log}')
    print(f'   前端: {frontend_log}')
    print(f'   合併: {combined_log}')
    print()

    # 檢查後端目錄
    if not os.path.exists('backend'):
        print(f'{Colors.RED}❌ 找不到 backend 目錄{Colors.END}')
        sys.exit(1)

    # 檢查前端目錄
    if not os.path.exists('fontend'):
        print(f'{Colors.RED}❌ 找不到 fontend 目錄{Colors.END}')
        sys.exit(1)

    try:
        # 啟動後端


        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        print('🚀 啟動全端應用...\n')

        # 設定 PYTHONPATH 讓 backend 模組可以正確導入
        backend_path = os.path.abspath('backend')
        env = os.environ.copy()
        env['PYTHONPATH'] = backend_path
        print(f'{Colors.BLUE}🔧 啟動後端服務 (Port 8000)...{Colors.END}')
        backend = subprocess.Popen(
            ['uvicorn', 'main:app', '--reload', '--host', '0.0.0.0', '--port', '8000'],
            cwd='backend',
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=0,
            env=env
        )
        processes.append(backend)

        # 啟動後端 log 線程
        backend_thread = threading.Thread(
            target=log_output,
            args=(backend, '後端', Colors.BLUE, backend_log, combined_log),
            daemon=True
        )
        backend_thread.start()

        time.sleep(2)  # 等待後端啟動

        # 啟動前端
        print(f'{Colors.CYAN}⚛️  啟動前端服務 (Port 5173)...{Colors.END}')
        frontend = subprocess.Popen(
            ['pnpm', 'dev'],
            cwd='fontend',
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=0
        )
        processes.append(frontend)

        # 啟動前端 log 線程
        frontend_thread = threading.Thread(
            target=log_output,
            args=(frontend, '前端', Colors.CYAN, frontend_log, combined_log),
            daemon=True
        )
        frontend_thread.start()

        print()
        print(f'{Colors.GREEN}✅ 開發環境已啟動!{Colors.END}')
        print(f'{Colors.BOLD}後端:{Colors.END} http://localhost:8000')
        print(f'{Colors.BOLD}前端:{Colors.END} http://localhost:5173')
        print(f'{Colors.BOLD}API 文件:{Colors.END} http://localhost:8000/docs')
        print()
        print(f'{Colors.YELLOW}按 Ctrl+C 停止所有服務...{Colors.END}')
        print()

        # 保持腳本運行
        while True:
            time.sleep(1)
            # 檢查進程是否還在運行
            for p in processes:
                if p.poll() is not None:
                    print(f'{Colors.RED}❌ 服務異常退出 (退出碼: {p.returncode}){Colors.END}')
                    signal_handler(None, None)

    except FileNotFoundError as e:
        print(f'{Colors.RED}❌ 找不到執行檔: {e}{Colors.END}')
        print(f'{Colors.YELLOW}請確認已安裝:{Colors.END}')
        print('  - uvicorn (pip install uvicorn)')
        print('  - pnpm (npm install -g pnpm)')
        sys.exit(1)
    except Exception as e:
        print(f'{Colors.RED}❌ 啟動失敗: {e}{Colors.END}')
        sys.exit(1)


if __name__ == '__main__':
    main()
