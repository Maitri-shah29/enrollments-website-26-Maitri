export interface RoomInfo {
  id: string;
  userCount: number;
}

export interface GetRoomsResponse {
  rooms: RoomInfo[];
}

export interface RedirectData {
  userId: string;
  newRoomId: string;
}

export interface WaitingClient {
  userId: string; // "name#sessionId"
  displayName: string;
  socketId: string;
  timestamp: number;
}
