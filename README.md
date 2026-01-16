# opencasino - Charity Casino

opencasino 是一個純前端、單機娛樂向的牌桌合集。主打桌面臨場感與玩法節奏，涵蓋梭哈、21 點與大老二，並提供角色資產與戰績紀錄。

## 遊戲內容

- **梭哈（Five-Card Stud）**
  - 固定籌碼 / 自由籌碼
  - 帶 AI 個性與語錄
- **21 點（Blackjack）**
  - 牌靴 / 切牌 / 擲骰決定插牌
  - 座位與手牌視覺化
- **大老二（Big Two）**
  - 名次結算與對局節奏

## 特色

- 本機角色資產與戰績紀錄（LocalStorage）
- 多遊戲共用角色設定與 NPC 配置
- UI 已拆分為可維護元件與引擎層

## 本機執行

**需求：** Node.js

1. 安裝依賴：
   ```bash
   npm install
   ```
2. 啟動：
   ```bash
   npm run dev
   ```

## 專案結構（重點）

- `src/components`：遊戲 UI 元件
- `src/services`：遊戲規則、引擎與 AI
- `src/config`：NPC 設定
- `src/types.ts`：共用型別

## 備註

- 目前為純前端單機娛樂用途，不提供作弊防護。
- AI 為本地演算法（無 LLM）。
