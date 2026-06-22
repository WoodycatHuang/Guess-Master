export type SortCardIndex = 1 | 2;

export function makeSortSlot(userId: string, cardIndex: SortCardIndex): string {
  return `${userId}#${cardIndex}`;
}

export function parseSortSlot(token: string): { userId: string; cardIndex: SortCardIndex } {
  const hash = token.lastIndexOf('#');
  if (hash <= 0) {
    return { userId: token, cardIndex: 1 };
  }
  const userId = token.slice(0, hash);
  const cardIndex = token.slice(hash + 1) === '2' ? 2 : 1;
  return { userId, cardIndex };
}

export function sortSlotBorderColor(cardIndex: SortCardIndex): string {
  return cardIndex === 1 ? '#39FF14' : '#00D4FF';
}
