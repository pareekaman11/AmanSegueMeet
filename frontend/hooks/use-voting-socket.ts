import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

export function useVotingSocket(entityType: 'decision' | 'resolution', entityId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!entityId) return;

    // Use environment variable or default to backend URL
    const socketUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
      : 'http://localhost:3001';

    const socket = io(socketUrl);

    const roomName = `${entityType}_${entityId}`;

    socket.on('connect', () => {
      socket.emit('join_room', roomName);
    });

    socket.on('vote_updated', (data) => {
      // Invalidate the query for this entity so the UI refreshes
      queryClient.invalidateQueries({ queryKey: [entityType, entityId] });
    });

    return () => {
      socket.emit('leave_room', roomName);
      socket.disconnect();
    };
  }, [entityType, entityId, queryClient]);
}
