const WebSocket = require('ws');
const { validateToken } = require('../utils/authUtils');
const Delivery = require('../models/Delivery');
const redis = require('../config/redis');

class DeliveryService {
  constructor() {
    this.connections = new Map();
    this.deliveryUpdates = new Map();
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', async (ws, req) => {
      try {
        // Extract and validate token
        const token = req.headers['sec-websocket-protocol'];
        const decoded = await validateToken(token);
        
        if (!decoded) {
          ws.close(4001, 'Unauthorized');
          return;
        }

        const userId = decoded.userId;
        this.handleConnection(ws, userId);

        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);
            await this.handleMessage(ws, userId, data);
          } catch (error) {
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
          }
        });

        ws.on('close', () => this.handleDisconnection(userId));

      } catch (error) {
        console.error('WebSocket connection error:', error);
        ws.close(4000, 'Connection error');
      }
    });
  }

  handleConnection(ws, userId) {
    this.connections.set(userId, ws);
    console.log(`User ${userId} connected`);
  }

  handleDisconnection(userId) {
    this.connections.delete(userId);
    console.log(`User ${userId} disconnected`);
  }

  async handleMessage(ws, userId, data) {
    switch (data.type) {
      case 'SUBSCRIBE_DELIVERY':
        await this.subscribeToDelivery(userId, data.deliveryId);
        break;
      
      case 'UNSUBSCRIBE_DELIVERY':
        await this.unsubscribeFromDelivery(userId, data.deliveryId);
        break;

      case 'GET_DELIVERY_STATUS':
        await this.sendDeliveryStatus(userId, data.deliveryId);
        break;

      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  async subscribeToDelivery(userId, deliveryId) {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) return;

    if (!this.deliveryUpdates.has(deliveryId)) {
      this.deliveryUpdates.set(deliveryId, new Set());
    }
    this.deliveryUpdates.get(deliveryId).add(userId);

    // Store subscription in Redis for persistence
    await redis.sadd(`delivery:${deliveryId}:subscribers`, userId);
  }

  async unsubscribeFromDelivery(userId, deliveryId) {
    const subscribers = this.deliveryUpdates.get(deliveryId);
    if (subscribers) {
      subscribers.delete(userId);
      if (subscribers.size === 0) {
        this.deliveryUpdates.delete(deliveryId);
      }
    }

    // Remove subscription from Redis
    await redis.srem(`delivery:${deliveryId}:subscribers`, userId);
  }

  async sendDeliveryStatus(userId, deliveryId) {
    const ws = this.connections.get(userId);
    if (!ws) return;

    const delivery = await Delivery.findById(deliveryId)
      .populate('deliveryAgent.id', 'name contact')
      .select('-otp');

    if (delivery) {
      ws.send(JSON.stringify({
        type: 'DELIVERY_STATUS',
        delivery
      }));
    }
  }

  async broadcastDeliveryUpdate(delivery) {
    const subscribers = this.deliveryUpdates.get(delivery._id.toString());
    if (!subscribers) return;

    const update = {
      type: 'DELIVERY_UPDATE',
      delivery: {
        id: delivery._id,
        status: delivery.status,
        location: delivery.location,
        estimatedDeliveryTime: delivery.estimatedDeliveryTime
      }
    };

    for (const userId of subscribers) {
      const ws = this.connections.get(userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(update));
      }
    }
  }

  async initializeDelivery(deliveryId) {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) return;

    // Set initial cache
    await redis.set(`delivery:${deliveryId}:status`, delivery.status);
    
    // Start monitoring for updates
    this.monitorDelivery(deliveryId);
  }

  async monitorDelivery(deliveryId) {
    // Implement delivery monitoring logic here
    // This could include periodic status checks, location updates, etc.
  }
}

module.exports = new DeliveryService();