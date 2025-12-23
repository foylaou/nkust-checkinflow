# Google Maps API 設定指南

## 錯誤：「這個網頁無法正確載入 Google 地圖」

這個錯誤通常是因為 API Key 的限制設定有問題。請按照以下步驟修復：

## 解決步驟

### 1. 前往 Google Cloud Console
訪問：https://console.cloud.google.com/

### 2. 選擇您的專案
或創建新專案

### 3. 啟用必要的 API
前往「API 和服務」→「程式庫」，搜尋並啟用：
- ✅ **Maps JavaScript API**
- ✅ **Places API (Legacy)** - 重要！搜尋「Places API」並確認啟用舊版
- ✅ **Geocoding API**（建議）

**注意**：如果看到 "LegacyApiNotActivatedMapError" 錯誤，表示需要啟用舊版 Places API：
1. 在 API 程式庫中搜尋 "Places API"
2. 確認啟用的是 "Places API"（不是 "Places API (New)"）
3. 點擊「啟用」

### 4. 設定 API Key 限制
前往「API 和服務」→「憑證」→ 點擊您的 API Key

#### 選項 A：開發階段（建議）
**應用程式限制**：
- 選擇「無」（開發測試用）

**API 限制**：
- 選擇「限制金鑰」
- 勾選：
  - Maps JavaScript API
  - Places API（確認是舊版，不是 New）
  - Geocoding API

#### 選項 B：正式環境
**應用程式限制**：
- 選擇「HTTP 參照網址 (網站)」
- 添加以下網址：
  ```
  http://localhost:5173/*
  http://localhost:3000/*
  https://您的網域.com/*
  ```

**API 限制**：
- 選擇「限制金鑰」
- 勾選：
  - Maps JavaScript API
  - Places API（確認是舊版，不是 New）
  - Geocoding API

### 5. 確認 API 已啟用
回到「API 和服務」→「已啟用的 API 和服務」，確認看到：
- ✅ Maps JavaScript API - 已啟用
- ✅ Places API - 已啟用（不是 New 版本）
- ✅ Geocoding API - 已啟用（選用）

### 6. 啟用計費（必要）
Google Maps Platform 需要啟用計費帳戶，但提供每月免費額度：
- 前往「計費」→「啟用計費帳戶」
- Google 提供每月 $200 美元免費額度
- 對於一般使用量，不會產生費用

### 7. 儲存並等待
- 點擊「儲存」
- 等待 3-5 分鐘讓設定生效
- 重新整理網頁測試

## 測試 API Key

完成設定後，在瀏覽器開啟：
```
https://maps.googleapis.com/maps/api/js?key=您的API_KEY&libraries=places
```

如果看到 JavaScript 代碼而不是錯誤訊息，表示 API Key 可以正常使用。

## 常見問題

### Q: 我沒有信用卡可以使用嗎？
A: 不行，Google Maps Platform 必須綁定信用卡才能啟用，但不會自動扣款。

### Q: 會產生費用嗎？
A: 每月有 $200 美元免費額度，一般開發測試不會超過。可以設定配額限制避免意外費用。

### Q: 看到 "LegacyApiNotActivatedMapError" 錯誤？
A: 這表示需要啟用舊版 Places API：
1. 前往 Google Cloud Console
2. 搜尋「Places API」（不是 Places API (New)）
3. 點擊啟用
4. 等待 2-3 分鐘

### Q: API Key 還是不能用怎麼辦？
A:
1. 確認已啟用計費
2. 確認已啟用 **Places API（舊版）**，不是 Places API (New)
3. 確認已啟用 Maps JavaScript API
4. 檢查 API Key 限制設定
5. 等待 5 分鐘讓設定生效
6. 清除瀏覽器快取並重新整理

## 環境變數設定

確認 `fontend/.env.development` 檔案中有：
```bash
VITE_GOOGLE_MAPS_API_KEY=您的實際_API_KEY
```

設定完成後重新啟動開發伺服器：
```bash
cd frontend
pnpm dev
```
