const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const axios = require("axios");

const router = express.Router();

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
});

const generateUniqueUsername = async (baseName) => {
  let username;
  let exists = true;

  baseName = baseName.toLowerCase().replace(/\s+/g, "");

  while (exists) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    username = `${baseName}${randomSuffix}`;
    exists = await User.findOne({ username });
  }

  return username;
};

router.post("/signup", async (req, res) => {
  try {
    const { email, fullName, password } = req.body;

    // Validate input
    if (!email || !fullName || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Generate username from email
    let username = await generateUniqueUsername(email.split("@")[0]);

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      fullName,
      username,
      password: hashedPassword,
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "90d" },
    );

    // Send cookie
    res.cookie("triptogethertoken", token, getCookieOptions());

    // Response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Username and password are required",
      });
    }

    // Find user by email OR username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Compare password
    const isMatch = bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "90d" },
    );

    // Send cookie
    res.cookie("triptogethertoken", token, getCookieOptions());

    // Response
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/google-sign-in", async (req, res) => {
  const { googleToken } = req.body;

  try {
    const googleRes = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${googleToken}`,
        },
      },
    );

    const { email, name, picture } = googleRes.data;

    let user = await User.findOne({ email });

    if (!user) {
      const username = await generateUniqueUsername(name);
      user = new User({ username, email, fullName: name, profilePic: picture });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "90d" },
    );

    res.cookie("triptogethertoken", token, getCookieOptions());

    res.status(200).send({
      success: true,
      message: "Logged in successfully",
      user: {
        username: user.username,
        _id: user._id,
      },
    });
  } catch (err) {
    console.error("Error fetching Google user info:", err.message);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("triptogethertoken", getCookieOptions());
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;
