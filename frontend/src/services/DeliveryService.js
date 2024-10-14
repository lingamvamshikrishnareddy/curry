import { EventEmitter } from 'events';

class DeliveryService extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  async connect(orderId) {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      // Use orderId in the WebSocket URL
      this.socket = new WebSocket(`${process.env.REACT_APP_WS_URL}/track/${orderId}`);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected');
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleDeliveryUpdate(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.connectionPromise = null;
        this.emit('disconnected');
        this.attemptReconnect(orderId);
      };
    });

    return this.connectionPromise;
  }

  // ... (rest of the DeliveryService code)

  attemptReconnect(orderId) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect(orderId).catch((error) => {
        console.error('Reconnection attempt failed:', error);
        this.attemptReconnect(orderId);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }
}

export default new DeliveryService();