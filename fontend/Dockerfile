FROM node:20-alpine as builder

WORKDIR /app

# 安裝 pnpm
RUN npm install -g pnpm

# 安裝依賴
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# 複製代碼並構建
COPY . .
RUN pnpm build

# 生產環境
FROM nginx:alpine

# 複製構建產物
COPY --from=builder /app/dist /usr/share/nginx/html

# 複製 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
