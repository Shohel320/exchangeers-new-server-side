const  bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin =  require("../models/adminSchema.js");


// 🧠 একবারই signup করার অনুমতি থাকবে
const adminSignUp = async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne();

    if (existingAdmin) {
      return res.status(403).json({ message: "❌ Admin already exists!" });
    }

    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "Username & password required" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      username,
      password: hashedPassword,
    });

    await newAdmin.save();
    res.status(201).json({ message: "✅ Admin account created successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



  const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { adminSignUp, adminLogin};
