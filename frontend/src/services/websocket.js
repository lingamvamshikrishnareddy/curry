import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: false
});

export const initializeSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }

  socket.on('connect', () => {
    console.log('Connected to WebSocket');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket');
  });

  return () => {
    socket.off('connect');
    socket.off('disconnect');
    if (socket.connected) {
      socket.disconnect();
    }
  };
};
