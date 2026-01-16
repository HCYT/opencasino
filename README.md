# opencasino - Charity Casino

opencasino 是一個純前端、單機娛樂向的牌桌合集。主打桌面臨場感與玩法節奏，涵蓋梭哈、21 點、大老二與射龍門，並提供角色資產與戰績紀錄。

## 遊戲內容

- **梭哈（Five-Card Stud）**
  - 固定籌碼 / 自由籌碼
  - **惡夢模式**：NPC 聯合行動
  - 帶 AI 個性與語錄
- **21 點（Blackjack）**
  - 自訂牌靴副數（4/6/8 副）
  - 自訂切牌深度
  - 座位與手牌視覺化
- **大老二（Big Two）**
  - 自訂底注
  - **惡夢模式**：NPC 聯合行動
  - 名次結算與對局節奏
- **射龍門（Showdown Gate）**
  - 經典撞柱與賠率計算
  - 快速節奏賭運氣
- **角子老虎機（Slot Machine）**
  - 3×3 經典老虎機，5 條勝線
  - 94% RTP（業界標準回報率）
  - WILD 百搭、SCATTER 免費旋轉
  - 累進式 Grand Jackpot

## 特色

- **完整資產系統**：
  - 本機角色資產與戰績紀錄（LocalStorage）
  - 貸款與還款機制
  - 破產重置
- **NPC 系統**：
  - 多遊戲共用角色設定與 NPC 配置
  - 戰績排行榜
- **遊戲體驗**：
  - 沉浸式桌面 UI
  - 音效與音量控制

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

- `src/components`：遊戲 UI 元件（包含 `showdown`, `blackjack`, `bigTwo`, `showdownGate`, `slots`）
- `src/services`：遊戲規則、引擎與 AI
- `src/config`：NPC 設定
- `src/types.ts`：共用型別

## 備註

- 目前為純前端單機娛樂用途，不提供作弊防護。
- AI 為本地演算法（無 LLM）。
