# opencasino - Charity Casino

opencasino 是一個純前端、單機娛樂向的牌桌合集。主打桌面臨場感與玩法節奏，涵蓋梭哈、21 點、大老二、射龍門、骰寶與輪盤，並提供角色資產與戰績紀錄。

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
- **百家樂（Baccarat）**
  - 免傭規則（Banker 1:0.95）
  - **專業路單系統**：實時生成珠盤路（Bead Plate）與大路（Big Road）
  - 完整對子與例牌（Natural）判定
- **骰寶（Sic Bo）**
  - 3D 物理骰子滾動動畫
  - 經典下注盤面（大小、圍色、單點、對子等）
  - 智慧 NPC 自動下注系統
- **輪盤（Roulette）**
  - 歐式單零輪盤（European Roulette）
  - 3D 物理滾球與落點計算
  - 完整與跑道（Racetrack）下注盤面

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
  - **現代化介面**：Premium Dark Glassmorphism 設計風格
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

- `src/components`：遊戲 UI 元件（包含 `showdown`, `blackjack`, `bigTwo`, `showdownGate`, `slots`, `baccarat`, `sicBo`, `roulette`）
- `src/services`：遊戲規則、引擎與 AI
- `src/config`：NPC 設定
- `src/types.ts`：共用型別

## 備註

- 目前為純前端單機娛樂用途，不提供作弊防護。
- AI 為本地演算法（無 LLM）。
