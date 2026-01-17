# opencasino - Charity Casino

opencasino 是一個純前端、單機娛樂向的牌桌合集。主打桌面臨場感與玩法節奏，涵蓋 **10 款經典遊戲**，並提供角色資產與戰績紀錄。

## 遊戲內容

### 撲克類
- **德州撲克（Texas Hold'em）** 🆕
  - No-Limit 無限注模式
  - 完整公牌發放（翻牌、轉牌、河牌）
  - 燒牌規則與最佳 5 張牌組合計算
  - **積極 AI 策略**：NPC 會 bluff、半詐唬、價值下注
- **梭哈（Five-Card Stud）**
  - 固定籌碼 / 自由籌碼
  - **惡夢模式**：NPC 聯合行動
  - 帶 AI 個性與語錄
- **大老二（Big Two）**
  - 自訂底注
  - **惡夢模式**：NPC 聯合行動
  - 名次結算與對局節奏
- **接龍（Sevens）** 🆕
  - 經典撲克接龍規則
  - 罰分計算與結算
  - 多樣 AI 策略（保守、激進、誘餌、欺騙）
- **射龍門（Showdown Gate）**
  - 經典撞柱與賠率計算
  - 快速節奏賭運氣

### 賭場類
- **21 點（Blackjack）**
  - 自訂牌靴副數（4/6/8 副）
  - 自訂切牌深度
  - 座位與手牌視覺化
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
  - 個性化語錄系統
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

- `src/components`：遊戲 UI 元件
  - `showdown`, `blackjack`, `bigTwo`, `showdownGate`, `slots`
  - `baccarat`, `sicBo`, `roulette`, `sevens`, `texas`
- `src/services`：遊戲規則、引擎與 AI
- `src/config`：NPC 設定與遊戲配置
- `src/types.ts`：共用型別

## 備註

- 目前為純前端單機娛樂用途，不提供作弊防護。
- AI 為本地演算法（無 LLM）。
- 版本：2026 年 1 月
