export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    // console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join user-specific notification room
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        // console.log(`User ${userId} joined room user:${userId}`);
      }
    });

    // Join counter room for live queue updates
    socket.on('join_counter_room', (counterId) => {
      if (counterId) {
        socket.join(`counter:${counterId}`);
        // console.log(`Socket joined counter:${counterId}`);
      }
    });

    // Join CAD department channel
    socket.on('join_cad_channel', () => {
      socket.join('cad_channel');
    });

    // Join Admin broadcast channel
    socket.on('join_admin_channel', () => {
      socket.join('admin_channel');
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
};

