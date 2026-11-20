import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const socketEndpoint = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
      : window.location.origin;

    const socketInstance = io(socketEndpoint, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && user) {
      socket.emit('join_user_room', user.id || user._id);
      if (user.role === 'admin') {
        socket.emit('join_admin_channel');
      }
      if (user.staffDetails?.assignedCounter) {
        socket.emit('join_counter_room', user.staffDetails.assignedCounter);
      }
    }
  }, [socket, user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};

