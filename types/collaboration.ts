export interface Session {
  id: number;
  blueprintId: number;
  pageId: number;
  pageName?: string;
  createdAt: string;
  expiresAt: string;
}

export interface SessionParticipant {
  userId: number;
  userName: string;
  userEmail?: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  joinedAt: string;
}

export interface InviteLink {
  link: string;
  token: string;
  expiresAt: string;
}

export interface CursorPosition {
  userId: number;
  userName: string;
  x: number;
  y: number;
  color?: string;
}

export interface MetrageLock {
  metrageId: number;
  lockedBy: number;
  lockedByName?: string;
  lockedAt: string;
}

// WebSocket event payloads

export interface JoinSessionPayload {
  sessionId: number;
}

export interface LeaveSessionPayload {
  sessionId: number;
}

export interface CursorMovePayload {
  sessionId: number;
  x: number;
  y: number;
}

export interface HeartbeatPayload {
  sessionId: number;
}

export interface MetrageLockPayload {
  sessionId: number;
  metrageId: number;
}

export interface MetrageUnlockPayload {
  sessionId: number;
  metrageId: number;
}

export interface MetrageCreatedPayload {
  sessionId: number;
  metrage: any; // Will use the Measurement type
}

export interface MetrageUpdatedPayload {
  sessionId: number;
  metrageId: number;
  changes: any;
}

export interface MetrageDeletedPayload {
  sessionId: number;
  metrageId: number;
}

// Server to client events

export interface SessionJoinedEvent {
  sessionId: number;
  participants: SessionParticipant[];
}

export interface UserJoinedEvent {
  userId: number;
  sessionId: number;
}

export interface UserLeftEvent {
  userId: number;
  sessionId: number;
}

export interface CursorUpdatedEvent {
  userId: number;
  userName: string;
  x: number;
  y: number;
}

export interface MetrageLockedEvent {
  metrageId: number;
  lockedBy: number;
  lockedByName?: string;
}

export interface MetrageUnlockedEvent {
  metrageId: number;
}

export interface MetrageCreatedEvent {
  metrage: any;
  createdBy: number;
}

export interface MetrageUpdatedEvent {
  metrageId: number;
  changes: any;
  updatedBy: number;
}

export interface MetrageDeletedEvent {
  metrageId: number;
  deletedBy: number;
}
