// @ts-nocheck
export function generateRoomId(chatId: string): string {
  return `echat-${chatId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`;
}

export function getJitsiUrl(roomId: string): string {
  return `https://meet.jit.si/${roomId}`;
}
