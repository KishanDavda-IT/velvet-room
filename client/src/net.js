import { io } from 'socket.io-client';

let socket = null;

export const net = {
  connect() {
    if (socket) {
      if (!socket.connected) {
        socket.connect();
      }
      return socket;
    }

    socket = io({
      path: import.meta.env.PROD ? '/api/realtime' : '/realtime',
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  },

  getSocket() {
    return socket;
  },

  on(event, fn) {
    const s = this.connect();
    s.on(event, fn);
    return () => s.off(event, fn);
  },

  off(event, fn) {
    if (socket) {
      socket.off(event, fn);
    }
  },

  emit(event, payload = {}, ack) {
    const s = this.connect();
    if (typeof ack === 'function') {
      s.emit(event, payload, ack);
      return;
    }
    if (event.startsWith('rtc:')) {
      s.emit(event, payload);
      return;
    }
    return new Promise((resolve) => {
      let settled = false;
      const finish = (response) => {
        if (settled) return;
        settled = true;
        resolve(response || { ok: false, code: 'INTERNAL', error: 'No response' });
      };
      const timer = setTimeout(() => {
        finish({ ok: false, code: 'NETWORK', error: 'The room connection timed out.' });
      }, 10000);
      s.emit(event, payload, (response) => {
        clearTimeout(timer);
        finish(response);
      });
    });
  },

  send(event, payload = {}) {
    this.connect().emit(event, payload);
  },
};

export default net;
