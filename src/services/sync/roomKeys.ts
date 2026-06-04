/** 统一房间号格式，避免大小写/空格导致查找不到房间 */
export function normalizeRoomId(roomId: string): string {
  return roomId.trim().toUpperCase();
}
