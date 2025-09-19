// controllers/profileController.js
   const getProfile = async (req, res) => {
  try {
    res.json({
      message: "User profile",
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        phone: req.user.phone,
        country: req.user.country,
        defaultWalletBalance: req.user.defaultWalletBalance,
        profitBalance: req.user.profitBalance,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = { getProfile };