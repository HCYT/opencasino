import { BaccaratHistoryItem } from './types';

// 珠盤路 (Bead Plate) 格子數據
export interface BeadPlateItem extends BaccaratHistoryItem {
    row: number;
    col: number;
}

// 大路 (Big Road) 格子數據
export interface BigRoadItem {
    result: 'BANKER_WIN' | 'PLAYER_WIN';
    tieCount: number;
    isTieStart: boolean; // 是否是起手和
    bankerPair: boolean; // 該節點是否包含莊對
    playerPair: boolean; // 該節點是否包含閒對
    row: number;
    col: number;
}

// 矩陣大小
const ROWS = 6;

export const generateBeadPlate = (history: BaccaratHistoryItem[]): BeadPlateItem[] => {
    return history.map((item, index) => ({
        ...item,
        row: index % ROWS,
        col: Math.floor(index / ROWS),
    }));
};

export const generateBigRoad = (history: BaccaratHistoryItem[]): BigRoadItem[] => {
    const matrix: (BigRoadItem | null)[][] = []; // [col][row]
    const items: BigRoadItem[] = [];

    let col = 0;
    let row = 0;
    let prevResult: 'BANKER_WIN' | 'PLAYER_WIN' | null = null;
    let currentItem: BigRoadItem | null = null;

    // 輔助檢查位置是否被佔用
    const isOccupied = (c: number, r: number) => {
        if (!matrix[c]) return false;
        return !!matrix[c][r];
    };

    // 設置矩陣值
    const setMatrix = (c: number, r: number, item: BigRoadItem) => {
        if (!matrix[c]) matrix[c] = [];
        matrix[c][r] = item;
    };

    // 處理每一手歷史
    history.forEach((hand) => {
        if (hand.result === 'TIE') {
            if (currentItem) {
                // 如果已經有路，增加和局計數
                currentItem.tieCount += 1;
            } else {
                // 開局就是和，或者是換列後的第一個和
                // 在這裡我們需要創建一個臨時項目或者標記
                // 在大路中，起手和局通常掛在第一個出現的莊/閒上
                // 但如果還沒有莊/閒出現，該怎麼辦？
                // 簡化策略：我們暫時存起來，等第一個非和局出現時掛上去
                // 或者：大路不顯示純和局，除非它是第一手。
                // 為了邏輯簡單，我們把起手和局作為一個特殊的 Pending 狀態，
                // 但為了 MVP，我們可以先忽略起手和，或者把它們視為 "前綴" 附加到第一個節點。
            }
            // 對子標記邏輯：和局的對子也要顯示嗎？通常大路的對子只標記在最近的莊/閒圈上。
            // 我們暫時把所有對子都累積到當前 Item
            if (currentItem) {
                if (hand.bankerPair) currentItem.bankerPair = true;
                if (hand.playerPair) currentItem.playerPair = true;
            }
            return;
        }

        const result = hand.result as 'BANKER_WIN' | 'PLAYER_WIN';

        if (prevResult === null) {
            // 第一個非和局結果
            // 如果之前有和局（我們這裡簡化了，沒處理起手和的 tieCount），可以在這裡補上
            // 為了 MVP，我們先不追溯起手和
            currentItem = {
                result,
                tieCount: 0,
                isTieStart: false,
                bankerPair: hand.bankerPair,
                playerPair: hand.playerPair,
                row: 0,
                col: 0
            };
            setMatrix(0, 0, currentItem);
            items.push(currentItem);
            prevResult = result;
            col = 0;
            row = 0;
        } else if (result === prevResult) {
            // 同結果：向下（或向右）
            let nextRow = row + 1;
            let nextCol = col;

            // 轉彎邏輯 (Dragon Tail)：到底了，或者下面被佔用了
            if (nextRow >= ROWS || isOccupied(nextCol, nextRow)) {
                nextRow = row; // 保持同一行
                nextCol = col + 1; // 向右
            }

            currentItem = {
                result,
                tieCount: 0,
                isTieStart: false,
                bankerPair: hand.bankerPair,
                playerPair: hand.playerPair,
                row: nextRow,
                col: nextCol
            };

            // 如果是轉彎，這個 col 也許還沒初始化
            setMatrix(nextCol, nextRow, currentItem);
            items.push(currentItem);

            row = nextRow;
            col = nextCol;

        } else {
            // 結果改變：換新列
            // 尋找下一個空列的第一行
            // 大路規則：新的一列總是從 row 0 開始，對齊前一列的第一個空位
            // 其實就是 col + 1, row 0，除非 col + 1 已經因為長龍被佔用了？
            // 不，標準大路換列總是另起一列。
            // 這裡我們簡單計算：找到 matrix 裡完全空的一列

            // 實際上，換列是相對於 "上一個趨勢" 的。
            // 如果上一列是長龍轉彎到了 col=5, row=5。
            // 新結果應該出現在 col + 1 (嗎?)
            // 不，大路的定義是：每一列代表一個趨勢。
            // 實際操作上，我們只要找到第一個空的 "主列" (row 0 為空)。

            let searchCol = 0;
            while (matrix[searchCol] && matrix[searchCol][0]) {
                searchCol++;
            }
            // 但這樣不行，因為長龍可能會佔用後面的列。
            // 正確邏輯：prevResult 的起始列 + 1 ? 
            // 讓我們用簡化邏輯：
            // 總是使用 `last occupied col` 之後的空位嗎？
            // 實際上大路繪製時，如果 col 已經被長龍佔用，應該跳過。


            // 回溯找到這一串的起始 col
            // 其實不用回溯，我們只需要一個變量 `lastMainCol`
            // 但是我們可以用簡單的方法：從 0 開始找空位？不，那樣會填補前面的空洞。
            // 正確邏輯：新的一串必須在所有舊數據的右邊？不一定。

            // 讓我們採用 "FindFirstEmptyColumnAfterCurrentTrend"
            // 假設當前趨勢結束在 col。
            // 我們需要知道當前趨勢 "佔用" 了哪些列。
            // 最簡單做法：
            // 每次換趨勢，我們就往右找一個 row=0 是空的位置。

            let newCol = col + 1;
            while (isOccupied(newCol, 0)) {
                newCol++;
            }

            currentItem = {
                result,
                tieCount: 0,
                isTieStart: false,
                bankerPair: hand.bankerPair,
                playerPair: hand.playerPair,
                row: 0,
                col: newCol
            };

            setMatrix(newCol, 0, currentItem);
            items.push(currentItem);

            col = newCol;
            row = 0;
            prevResult = result;
        }
    });

    return items;
};
