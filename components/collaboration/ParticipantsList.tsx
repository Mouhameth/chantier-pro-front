'use client';

import React from 'react';
import type { Participant } from '@/hooks/useCollaborativeSession';

interface ParticipantsListProps {
  participants: Participant[];
  currentUserId?: number;
  className?: string;
}

/**
 * Component to display online participants in a collaborative session
 */
export const ParticipantsList: React.FC<ParticipantsListProps> = React.memo(({
  participants,
  currentUserId,
  className = '',
}) => {
  console.log('🖼️ [ParticipantsList] RENDERING!');
  console.log('🖼️ Participants received in props:', participants);
  console.log('🖼️ Participants length:', participants.length);
  console.log('🖼️ Current user ID:', currentUserId);


  return (
    <div className={`flex items-center -space-x-2 ${className}`}>
      {participants.map((participant) => (
        <ParticipantAvatar
          key={participant.userId}
          participant={participant}
          isCurrentUser={participant.userId === currentUserId}
        />
      ))}
    </div>
  );
});

ParticipantsList.displayName = 'ParticipantsList';

interface ParticipantAvatarProps {
  participant: Participant;
  isCurrentUser: boolean;
}

const ParticipantAvatar: React.FC<ParticipantAvatarProps> = React.memo(({ participant, isCurrentUser }) => {
  const fullName = `${participant.firstname} ${participant.lastname}`;
  const initials = getInitials(fullName);
  const bgColor = generateColorFromName(fullName);

  return (
    <div className="relative group">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm cursor-pointer transition-transform hover:scale-110 ${
          isCurrentUser ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </div>

      {/* Online badge - green if online, gray if offline */}
      <div className="absolute -bottom-0.5 -right-0.5 text-[10px]">
        {participant.isOnline ? '🟢' : '⚪️'}
      </div>

      {/* Enhanced tooltip with page info (v2.1.0) */}
      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
        <div className="font-semibold">
          {participant.firstname} {participant.lastname}
          {isCurrentUser && <span className="text-blue-300 ml-1">(Vous)</span>}
        </div>
        {/* v2.1.0: Show current page if online */}
        {participant.isOnline && participant.currentPageId !== null && (
          <div className="text-gray-300 text-[10px] mt-0.5">
            Page {participant.currentPageId}
          </div>
        )}
        {!participant.isOnline && (
          <div className="text-gray-400 text-[10px] mt-0.5">
            Hors ligne
          </div>
        )}
      </div>
    </div>
  );
});

ParticipantAvatar.displayName = 'ParticipantAvatar';

/**
 * Get user initials from name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Generate a consistent color from a name
 */
function generateColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
  ];

  return colors[Math.abs(hash) % colors.length];
}
