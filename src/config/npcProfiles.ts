import { NPCProfile } from '../types';

export const NPC_PROFILES: NPCProfile[] = [
  {
    name: '高進',
    avatar: '/image/高進.png',
    quotes: {
      WIN: ['我不喜歡跟死人要錢。', '這才叫賭神！', '年輕人終究是年輕人。'],
      LOSE: ['還好，只是個小數目。', '運氣也是實力的一種。'],
      FOLD: ['不跟了，這局送你。', '小心駛得萬年船。'],
      CHECK: ['過。', '請。'],
      CALL: ['我跟。', '看看你的底牌。'],
      RAISE: ['大概，多你一塊錢。', '想偷雞？我加注！'],
      ALL_IN: ['梭哈！', '這一把，我賭上身家性命。', '跟我比大？梭了！'],
      WAITING: ['變張3給我看看？', '吃巧克力補補腦。']
    },
    tacticWeights: { CONSERVATIVE: 0.45, DECEPTIVE: 0.25, BAIT: 0.2, AGGRESSIVE: 0.1 },
    tacticQuotes: {
      CONSERVATIVE: ['小心駛得萬年船。', '年輕人終究是年輕人。'],
      DECEPTIVE: ['看看你的底牌。', '運氣也是實力的一種。'],
      BAIT: ['請。', '我跟。'],
      AGGRESSIVE: ['這才叫賭神！', '大概，多你一塊錢。']
    }
  },
  {
    name: '陳金城',
    avatar: '/image/陳金城.png',
    quotes: {
      WIN: ['年輕人，你還太嫩了！', '老夫縱橫賭壇幾十年，豈會輸給你？'],
      LOSE: ['這...這不可能！', '我的牌怎麽會輸？'],
      FOLD: ['留得青山在。', '不跟。'],
      CHECK: ['過。', '看看再說。'],
      CALL: ['跟了。', '我倒要看看你有什麽花樣。'],
      RAISE: ['加注！', '老夫跟你玩到底！'],
      ALL_IN: ['梭哈！', '你敢跟老夫賭？'],
      WAITING: ['這副牌有問題嗎？', '別浪費時間。']
    },
    tacticWeights: { DECEPTIVE: 0.6, CONSERVATIVE: 0.2, BAIT: 0.1, AGGRESSIVE: 0.1 },
    tacticQuotes: {
      CONSERVATIVE: ['留得青山在。', '不跟。'],
      DECEPTIVE: ['我倒要看看你有什麽花樣。', '年輕人，你還太嫩了！'],
      BAIT: ['過。', '看看再說。'],
      AGGRESSIVE: ['梭哈！', '老夫跟你玩到底！']
    }
  },
  {
    name: '陳小刀',
    avatar: '/image/陳小刀.png',
    quotes: {
      WIN: ['師父教的這招果然有用！', '二十塊贏兩千萬！'],
      LOSE: ['師父，我給您丟人了...', '這把不算，重來！'],
      FOLD: ['好漢不吃眼前虧。', '這牌沒法打。'],
      CHECK: ['過牌。', '你看我像有牌嗎？'],
      CALL: ['跟了！拚一把！', '同花打不打得過 Full House？'],
      RAISE: ['加注！嚇死你！', '這把我贏定了！'],
      ALL_IN: ['全押了！下輩子看這把！', '賭個天長地久！'],
      WAITING: ['你看我的髮型亂了嗎？', '有沒有巧克力？']
    },
    tacticWeights: { AGGRESSIVE: 0.4, BAIT: 0.3, DECEPTIVE: 0.2, CONSERVATIVE: 0.1 },
    tacticQuotes: {
      CONSERVATIVE: ['好漢不吃眼前虧。', '這牌沒法打。'],
      DECEPTIVE: ['你看我像有牌嗎？', '這把不算，重來！'],
      BAIT: ['跟了！拚一把！', '過牌。'],
      AGGRESSIVE: ['加注！嚇死你！', '這把我贏定了！']
    }
  },
  {
    name: '周星祖',
    avatar: '/image/周星祖.png',
    quotes: {
      WIN: ['各位觀眾！五隻煙！', '哈哈哈哈！我贏啦！'],
      LOSE: ['我看不到...我看不到...', '哎呀，特異功能失靈了。'],
      FOLD: ['糟糕，沒功力了。', '先閃為妙。'],
      CHECK: ['發功... 過！', '慢慢來，別急。'],
      CALL: ['以小博大，跟！', '雖然牌爛，但我有特異功能。'],
      RAISE: ['這張牌我要變變變！加注！', '讓你見識一下我的厲害！'],
      ALL_IN: ['全梭了！我要買新西裝！', '不如大家一起死！梭哈！'],
      WAITING: ['你看不見我...你看不見我...', '肚子餓了，有沒有麵吃？']
    },
    tacticWeights: { DECEPTIVE: 0.4, BAIT: 0.3, AGGRESSIVE: 0.2, CONSERVATIVE: 0.1 },
    tacticQuotes: {
      CONSERVATIVE: ['慢慢來，別急。', '先閃為妙。'],
      DECEPTIVE: ['你看不見我...你看不見我...', '雖然牌爛，但我有特異功能。'],
      BAIT: ['發功... 過！', '以小博大，跟！'],
      AGGRESSIVE: ['這張牌我要變變變！加注！', '各位觀眾！五隻煙！']
    }
  },
  {
    name: '龍五',
    avatar: '/image/龍五.png',
    quotes: {
      WIN: ['... (點頭)', '贏了。'],
      LOSE: ['...', '下次討回來。'],
      FOLD: ['不跟。', '...'],
      CHECK: ['...', '過。'],
      CALL: ['跟。', '...'],
      RAISE: ['加。', '...'],
      ALL_IN: ['全下。', '...'],
      WAITING: ['...', '有殺氣。']
    },
    tacticWeights: { CONSERVATIVE: 0.5, BAIT: 0.25, DECEPTIVE: 0.15, AGGRESSIVE: 0.1 },
    tacticQuotes: {
      CONSERVATIVE: ['...', '不跟。'],
      DECEPTIVE: ['有殺氣。', '...'],
      BAIT: ['過。', '跟。'],
      AGGRESSIVE: ['全下。', '贏了。']
    }
  },
  {
    name: '海珊',
    avatar: '/image/海珊.png',
    quotes: {
      WIN: ['所有人都可以投降，除了你。', '想跟我鬥？你還嫩了點！'],
      LOSE: ['不可能！你出千！', '這不科學！'],
      FOLD: ['算你走運。', '暫避鋒芒。'],
      CHECK: ['我看你怎麽演。', '過。'],
      CALL: ['我倒要看看你有什麽牌。', '這裡我話事！'],
      RAISE: ['趕盡殺絕！', '讓你沒褲子穿！'],
      ALL_IN: ['要賭就賭大的！梭哈！', '你的命我也要了！'],
      WAITING: ['公海到了沒？', '誰敢不給我面子？']
    },
    tacticWeights: { AGGRESSIVE: 0.55, DECEPTIVE: 0.2, BAIT: 0.15, CONSERVATIVE: 0.1 },
    tacticQuotes: {
      CONSERVATIVE: ['暫避鋒芒。', '算你走運。'],
      DECEPTIVE: ['我看你怎麽演。', '我倒要看看你有什麽牌。'],
      BAIT: ['過。', '這裡我話事！'],
      AGGRESSIVE: ['趕盡殺絕！', '要賭就賭大的！梭哈！']
    }
  },
  {
    name: '海棠',
    avatar: '/image/海棠.png',
    quotes: {
      WIN: ['這局我收下。', '漂亮。'],
      LOSE: ['輸了也要優雅。', '下把再來。'],
      FOLD: ['不急，先收。', '這手不漂亮。'],
      CHECK: ['過。', '你先。'],
      CALL: ['跟。', '陪你玩玩。'],
      RAISE: ['加注。', '我不讓。'],
      ALL_IN: ['梭哈。', '賭上全部。'],
      WAITING: ['慢慢來。', '別心急。']
    },
    tacticWeights: { CONSERVATIVE: 0.4, DECEPTIVE: 0.3, BAIT: 0.2, AGGRESSIVE: 0.1 },
    tacticQuotes: {
      CONSERVATIVE: ['不急，先收。', '慢慢來。'],
      DECEPTIVE: ['陪你玩玩。', '你先。'],
      BAIT: ['過。', '跟。'],
      AGGRESSIVE: ['我不讓。', '這局我收下。']
    }
  },
  {
    name: '仇笑癡',
    avatar: '/image/仇笑癡.png',
    quotes: {
      WIN: ['哈哈，這才是賭局！', '你們都不夠看！'],
      LOSE: ['不可能！', '再來！'],
      FOLD: ['算你走運。', '這把先讓。'],
      CHECK: ['過。', '看你表演。'],
      CALL: ['跟到底！', '我倒要看看。'],
      RAISE: ['加注！', '我來教你玩。'],
      ALL_IN: ['梭哈！', '敢不敢跟？'],
      WAITING: ['別磨蹭。', '時間就是金錢。']
    },
    tacticWeights: { AGGRESSIVE: 0.5, BAIT: 0.2, DECEPTIVE: 0.2, CONSERVATIVE: 0.1 },
    tacticQuotes: {
      CONSERVATIVE: ['這把先讓。', '算你走運。'],
      DECEPTIVE: ['看你表演。', '我倒要看看。'],
      BAIT: ['過。', '跟到底！'],
      AGGRESSIVE: ['梭哈！', '我來教你玩。']
    }
  },
  {
    name: '大軍',
    avatar: '/image/大軍.png',
    quotes: {
      WIN: ['我的特異功能比你強！', '獨眼龍大軍在此！'],
      LOSE: ['我的眼睛！我的眼睛！', '可惡，被破功了！'],
      FOLD: ['君子報仇，十年不晚。', '暫且撤退。'],
      CHECK: ['哼，過。', '看你怎麽死。'],
      CALL: ['我就陪你玩玩。', '跟！'],
      RAISE: ['讓你見識我的功力！', '變走你的底牌！'],
      ALL_IN: ['跟你拚了！', '同歸於盡吧！'],
      WAITING: ['別擋著我發功！', '哼！']
    },
    tacticWeights: { AGGRESSIVE: 0.35, BAIT: 0.3, DECEPTIVE: 0.2, CONSERVATIVE: 0.15 },
    tacticQuotes: {
      CONSERVATIVE: ['暫且撤退。', '君子報仇，十年不晚。'],
      DECEPTIVE: ['變走你的底牌！', '看你怎麽死。'],
      BAIT: ['哼，過。', '跟！'],
      AGGRESSIVE: ['讓你見識我的功力！', '跟你拚了！']
    }
  }
];
