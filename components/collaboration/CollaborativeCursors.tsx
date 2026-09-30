'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { CursorPosition } from '@/hooks/useCollaborativeSession';

interface CollaborativeCursorsProps {
  cursors: CursorPosition[];
}

/**
 * Component to display other users' cursor positions in real-time
 */
export const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = React.memo(({
  cursors,
}) => {
  if (cursors.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {cursors.map((cursor) => (
        <RemoteCursor key={cursor.userId} cursor={cursor} />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if cursors array reference changed
  // This prevents unnecessary re-renders when parent re-renders
  return prevProps.cursors === nextProps.cursors;
});

CollaborativeCursors.displayName = 'CollaborativeCursors';

interface RemoteCursorProps {
  cursor: CursorPosition;
}

const RemoteCursor: React.FC<RemoteCursorProps> = React.memo(({ cursor }) => {
  const cursorRef = useRef<HTMLDivElement>(null);

  // Direct update without interpolation for instant, fluid movement
  useEffect(() => {
    if (cursorRef.current) {
      // Use transform for hardware acceleration
      cursorRef.current.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0)`;
    }
  }, [cursor.x, cursor.y]);

  // Handle undefined names
  const firstname = cursor.firstname || '';
  const lastname = cursor.lastname || '';
  const fullName = `${firstname} ${lastname}`.trim() || 'Utilisateur';
  const initials = getInitials(fullName);

  return (
    <div
      ref={cursorRef}
      className="absolute top-0 left-0"
      style={{
        transition: 'transform 0.1s cubic-bezier(0.4, 0.0, 0.2, 1)',
        willChange: 'transform',
      }}
    >
      <div className="relative group">
        {/* Cursor pointer icon */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="drop-shadow-lg"
        >
          {/* Main pointer */}
          <path
            d="M3 3L3 16.5L7.5 12L11.5 19.5L14 18L10 10.5L16.5 10.5L3 3Z"
            fill={cursor.color || '#3B82F6'}
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>

        {/* Compact initials label - always visible */}
        <div
          className="absolute top-0 left-5 px-1.5 py-0.5 rounded text-xs font-semibold text-white shadow-lg"
          style={{ backgroundColor: cursor.color || '#3B82F6' }}
        >
          {initials}
        </div>

        {/* Full name tooltip on hover */}
        <div
          className="absolute top-7 left-5 px-2 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ backgroundColor: cursor.color || '#3B82F6' }}
        >
          {fullName}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only skip re-render if position AND name are exactly the same
  return prevProps.cursor.x === nextProps.cursor.x &&
         prevProps.cursor.y === nextProps.cursor.y &&
         prevProps.cursor.firstname === nextProps.cursor.firstname &&
         prevProps.cursor.lastname === nextProps.cursor.lastname;
});

RemoteCursor.displayName = 'RemoteCursor';

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
 * Hook to throttle cursor movement updates (v2.1.0: optimized for Cloud Run costs)
 * - Throttling: 250ms (4 events/sec instead of 10/sec) = -60% events
 * - Conditional: Only send if shouldSend=true (i.e., others on same page)
 * Returns viewport coordinates (clientX, clientY) for consistent positioning
 */
export const useThrottledCursor = (
  onCursorMove: (x: number, y: number) => void,
  options?: {
    delay?: number; // Default: 250ms (v2.1.0 requirement)
    shouldSend?: boolean; // Default: true (v2.1.0: set false if alone on page)
  }
) => {
  const delay = options?.delay ?? 250; // v2.1.0: 250ms throttling (not less!)
  const shouldSend = options?.shouldSend ?? true;

  const rafRef = useRef<number | null>(null);
  const lastEmitTimeRef = useRef<number>(0);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);
  const shouldSendRef = useRef(shouldSend);

  // Update ref without re-creating the handler
  useEffect(() => {
    shouldSendRef.current = shouldSend;
  }, [shouldSend]);

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    // Use clientX/clientY for viewport-relative coordinates
    // This ensures consistent positioning across all users
    const x = event.clientX;
    const y = event.clientY;

    // Store the latest position
    lastPositionRef.current = { x, y };

    // v2.1.0: Don't send if alone on the page (cost optimization)
    if (!shouldSendRef.current) {
      return;
    }

    // Cancel previous frame if not yet executed
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Schedule emission using requestAnimationFrame
    rafRef.current = requestAnimationFrame(() => {
      const now = Date.now();

      // Throttle: only emit if enough time has passed
      if (now - lastEmitTimeRef.current >= delay && lastPositionRef.current) {
        onCursorMove(lastPositionRef.current.x, lastPositionRef.current.y);
        lastEmitTimeRef.current = now;
      }

      rafRef.current = null;
    });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return handleMouseMove;
};
