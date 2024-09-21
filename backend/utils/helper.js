exports.formatDate = (date) => {
    return new Date(date).toLocaleString();
  };
  
  exports.calculateEstimatedDeliveryTime = (orderTime, distance) => {
    const preparationTime = 20 * 60 * 1000; // 20 minutes in milliseconds
    const averageSpeed = 30; // km/h
    const travelTime = (distance / averageSpeed) * 60 * 60 * 1000; // Convert to milliseconds
    return new Date(orderTime.getTime() + preparationTime + travelTime);
  };