export interface GameTopic {
  title: string;
  lowLabel: string;
  highLabel: string;
}

/** 固定题库 — 开局时随机抽取 */
export const TOPIC_POOL: GameTopic[] = [
  {
    title: '世界上最美的人',
    lowLabel: '0-最丑',
    highLabel: '100-最美',
  },
  {
    title: '你认为最帅的男人',
    lowLabel: '0-最不符合',
    highLabel: '100-最符合',
  },
  {
    title: '谁最有可能成为百万富翁',
    lowLabel: '0-最不可能',
    highLabel: '100-最可能',
  },
  {
    title: '谁的唱歌最好听',
    lowLabel: '0-最难听',
    highLabel: '100-最好听',
  },
  {
    title: '谁最会讲冷笑话',
    lowLabel: '0-完全不会',
    highLabel: '100-冷笑话之王',
  },
  {
    title: '谁最有可能迟到',
    lowLabel: '0-从不迟到',
    highLabel: '100-一定迟到',
  },
  {
    title: '谁最适合当卧底',
    lowLabel: '0-一眼被识破',
    highLabel: '100-完美卧底',
  },
  {
    title: '谁最会照顾人',
    lowLabel: '0-最不擅长',
    highLabel: '100-最擅长',
  },
  {
    title: '谁最可能单身到最后',
    lowLabel: '0-不可能',
    highLabel: '100-一定',
  },
  {
    title: '谁的运动细胞最好',
    lowLabel: '0-最差',
    highLabel: '100-最强',
  },
];

export function pickRandomTopic(): GameTopic {
  return TOPIC_POOL[Math.floor(Math.random() * TOPIC_POOL.length)];
}
