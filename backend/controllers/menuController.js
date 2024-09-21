const MenuItem = require('../models/menuItem');

// Get all menu items with caching
exports.getAllMenuItems = async (req, res) => {
  try {
    const { search } = req.query;
    const cacheKey = `menuItems:${search || 'all'}`;

    // Try to get data from cache
    const cachedData = await req.redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    let query = {};
    if (search) {
      query = { 
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const menuItems = await MenuItem.find(query).lean();

    // Cache the result
    await req.redisClient.set(cacheKey, JSON.stringify(menuItems), {
      EX: 60 * 5 // Expire after 5 minutes
    });

    res.json(menuItems);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Clear menu cache when items are modified
exports.clearMenuCache = async (req) => {
  const keys = await req.redisClient.keys('menuItems:*');
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
};

// Get menu item by ID
exports.getMenuItemById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.status(500).send('Server error');
  }
};

// Create a new menu item and clear cache
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const newMenuItem = new MenuItem({ name, description, price, category });
    const menuItem = await newMenuItem.save();
    
    // Clear the cache after creating a new menu item
    await exports.clearMenuCache(req);
    res.json(menuItem);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update a menu item and clear cache
exports.updateMenuItem = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    let menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    menuItem.name = name;
    menuItem.description = description;
    menuItem.price = price;
    menuItem.category = category;

    await menuItem.save();
    
    // Clear the cache after updating a menu item
    await exports.clearMenuCache(req);
    res.json(menuItem);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.status(500).send('Server error');
  }
};

// Delete a menu item and clear cache
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await menuItem.remove();
    
    // Clear the cache after deleting a menu item
    await exports.clearMenuCache(req);
    res.json({ message: 'Menu item removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.status(500).send('Server error');
  }
};
