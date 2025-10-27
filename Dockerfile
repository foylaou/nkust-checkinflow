FROM python:3.11-slim

# 設定架構變數
ARG TARGETPLATFORM
ARG BUILDPLATFORM

# 安裝基本工具
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 安裝 Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# 安裝 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 複製依賴檔案
COPY backend/requirements.txt backend/
COPY fontend/package.json fontend/pnpm-lock.yaml fontend/

# 安裝後端依賴
RUN pip install --no-cache-dir -r backend/requirements.txt

# 安裝前端依賴
WORKDIR /app/fontend
ENV CI=true
# 刪除舊的 lock file 重新安裝 (避免架構衝突)
RUN rm -f pnpm-lock.yaml && \
    pnpm install --no-frozen-lockfile

# 複製其餘程式碼
WORKDIR /app
COPY . .

# 暴露端口
EXPOSE 8000 5173

# 啟動腳本
CMD ["python", "main.py"]
