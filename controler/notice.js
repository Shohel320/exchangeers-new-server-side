const  Notice =  require("../models/noticSchema");

// ✅ Create or update the latest notice
 const updateNotice = async (req, res) => {
  try {
    const { title, message, isActive } = req.body;

    // Update if exists else create new
    let notice = await Notice.findOne();
    if (notice) {
      notice.title = title;
      notice.message = message;
      notice.isActive = isActive;
      await notice.save();
    } else {
      notice = await Notice.create({ title, message, isActive });
    }

    res.status(200).json({ success: true, notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get active notice for users
const getActiveNotice = async (req, res) => {
  try {
    const notice = await Notice.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!notice) return res.json({ success: false, message: "No active notice" });
    res.json({ success: true, notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
module.exports = {updateNotice, getActiveNotice }
