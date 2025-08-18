import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import nodemailer from "nodemailer";
import moment from "moment-timezone"

// Register (manual signup) with verification code provide
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing && existing.verified) return res.status(400).json({success:false, message: "Email already registered and verified" });

    const hashed = await bcrypt.hash(password, 10);

    // generate 6-digit OTP
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 60 * 60 * 1000); // 60 mins
    console.log(verifyCode)
    if(!existing){
    const user = await User.create({
      name,
      email,
      password: hashed,
      verifyCode,
      codeExpiry,
      verified: false
    });
    }

    // TODO: Send verifyCode via email (use nodemailer)
    try{
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        })
        console.log("email : ",verifyCode)
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Mystery Storysphere | Verification Code',
            text: `dear ${name}, your otp is ${verifyCode}`
        }
        await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending verification email : ",error)
                return {success:false , message:"failed to send verification email"}
            }
        })
        
    res.status(201).json({success:true, message: "User registered. Please verify email.", verifyCode });
    }
    catch(error){
        console.error("Error sending verification email : ",error)
        return {success:false , message:"failed to send verification email"}
    }

  } catch (err) {
    res.status(500).json({success:false, message: "Error registering user", error: err.message });
  }
};

// Verify email
export const verifyUser = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({success:false, message: "User not found" });

    if (user.verified) return res.json({success:false, message: "Already verified" });

    if (user.verifyCode !== code || user.codeExpiry < Date.now()) {
      return res.status(400).json({success:false, message: "Invalid or expired code" });
    }

    user.verified = true;
    user.verifyCode = null;
    user.codeExpiry = null;
    await user.save();

    res.json({success:true, message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({success:false, message: "Error verifying user", error: err.message });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({success:false, message: "User not found" });

    if (!user.verified) return res.status(403).json({success:false, message: "Please verify email first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({success:false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15d" });

    res.cookie("token", token, { httpOnly: true ,secure: true , maxAge : 15 * 24 * 60 * 60 * 1000  }).json({success:true, message: "Login successful",token });
  } catch (err) {
    res.status(500).json({success:false, message: "Error logging in", error: err.message });
  }
};

// Reduce story limit
export const reduceStoryLimit = async (req, res) => {
  try {
    const {token} = req.body;
    if (!token) return res.status(401).json({success:false, message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({success:false, message: "User not found" });

    const nowIST = moment().tz("Asia/Kolkata");
    const resetTime = moment(user.storyLimit.date).tz("Asia/Kolkata");

    // reset if passed reset time (11:15 PM IST)
    if (!user.storyLimit.date || nowIST.isSameOrAfter(resetTime)) {
      user.storyLimit.remaining = 6;
      let nextReset = moment().tz("Asia/Kolkata").set({ hour: 23, minute: 33, second: 0, millisecond: 0 });
      if (nowIST.isAfter(nextReset)) nextReset.add(1, "day");
      user.storyLimit.date = nextReset.toDate();
    }

    if (user.storyLimit.remaining <= 0) {
      return res.status(429).json({success:false, message: "Daily story limit reached" });
    }

    // decrement after reset check
    user.storyLimit.remaining -= 1;
    user.totalStoryCreated += 1;
    await user.save();

    res.json({success:true, message: "Story created successfully", remaining: user.storyLimit.remaining });
  } catch (err) {
    res.status(500).json({success:false, message: "Error creating story", error: err.message });
  }
};

export const getCurrentUser = async(req,res)=>{
  
  const {token} = req.body;
  try{
    if (!token) return res.status(401).json({success:false, message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({success:false, message: "User not found" });

    res.json({success:true, message: "User found", user });
  }catch(err){
    res.status(500).json({success:false, message: "Error getting user", error: err.message });
  }
}

export const logoutUser = (req, res) => {
  try {
    // Clear cookie (assuming it's named "token")
    res.clearCookie("token", {
      httpOnly: true,
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging out",
    });
  }
};

export const healthChecker = (req, res) => {
  try{
    console.log("health OK")
    return res.status(200).json({
      success: true,
      message: "Health OK",
    })
  }catch(error){
    console.error("Health error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while checking health",
    });
  }
};