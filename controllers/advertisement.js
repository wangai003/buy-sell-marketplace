const Advertisement = require('../models/Advertisement');
const cloudinary = require('../config/cloudinary');

// Get all active advertisements
exports.getActiveAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 });
    res.json(advertisements);
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all advertisements (admin)
exports.getAllAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.find({})
      .sort({ order: 1, createdAt: -1 });
    res.json(advertisements);
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create new advertisement
exports.createAdvertisement = async (req, res) => {
  try {
    const { title, link, order } = req.body;
    let image = '';

    if (req.file) {
      // Upload to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'advertisements',
        width: 1200,
        height: 400,
        crop: 'fill'
      });
      image = result.secure_url;
    }

    const advertisement = new Advertisement({
      title,
      image,
      link: link || '',
      order: order || 0
    });

    await advertisement.save();
    res.status(201).json(advertisement);
  } catch (error) {
    console.error('Error creating advertisement:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update advertisement
exports.updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, link, order, isActive } = req.body;

    const updateData = {
      title,
      link: link || '',
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true
    };

    if (req.file) {
      // Upload new image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'advertisements',
        width: 1200,
        height: 400,
        crop: 'fill'
      });
      updateData.image = result.secure_url;
    }

    const advertisement = await Advertisement.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!advertisement) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    res.json(advertisement);
  } catch (error) {
    console.error('Error updating advertisement:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete advertisement
exports.deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const advertisement = await Advertisement.findByIdAndDelete(id);

    if (!advertisement) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    res.json({ message: 'Advertisement deleted successfully' });
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Toggle advertisement status
exports.toggleAdvertisementStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const advertisement = await Advertisement.findById(id);

    if (!advertisement) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    advertisement.isActive = !advertisement.isActive;
    await advertisement.save();

    res.json(advertisement);
  } catch (error) {
    console.error('Error toggling advertisement status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};