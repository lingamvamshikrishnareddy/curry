const Review = require('../models/Review');
const MenuItem = require('../models/menuItem');

exports.createReview = async (req, res) => {
  try {
    const { rating, comment, menuItem } = req.body;
    const newReview = new Review({
      user: req.user.id,
      menuItem,
      rating,
      comment
    });
    const review = await newReview.save();

    // Update menu item's average rating
    const menuItemDoc = await MenuItem.findById(menuItem);
    const reviews = await Review.find({ menuItem });
    const averageRating = reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length;
    menuItemDoc.rating = averageRating;
    await menuItemDoc.save();

    res.status(201).json(review);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ menuItem: req.params.menuItemId })
      .populate('user', ['name'])
      .sort({ date: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    let review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    // Update menu item's average rating
    const menuItemDoc = await MenuItem.findById(review.menuItem);
    const reviews = await Review.find({ menuItem: review.menuItem });
    const averageRating = reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length;
    menuItemDoc.rating = averageRating;
    await menuItemDoc.save();

    res.json(review);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(500).send('Server error');
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await review.remove();

    // Update menu item's average rating
    const menuItemDoc = await MenuItem.findById(review.menuItem);
    const reviews = await Review.find({ menuItem: review.menuItem });
    const averageRating = reviews.length > 0 
      ? reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length
      : 0;
    menuItemDoc.rating = averageRating;
    await menuItemDoc.save();

    res.json({ message: 'Review removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(500).send('Server error');
  }
};