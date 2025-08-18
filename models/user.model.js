import mongoose from "mongoose";
import moment from "moment-timezone"

function getResetTimeIST() {
  return moment().tz("Asia/Kolkata").set({ hour: 23, minute: 33, second: 0, millisecond: 0 }).toDate();
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String }, // bcrypt hash for manual signup
  verified: { type: Boolean, default: false }, // email verified?

  verifyCode: { type: String },   // OTP / verification code
  codeExpiry: { type: Date },     // Expiry time for OTP

  totalStoryCreated : {type : Number , default : 0},

  storyLimit: {
    remaining: { type: Number, default: 6 }, // start with 6 per day
    date: { type: Date, default: getResetTimeIST  } // () => new Date().setHours(0, 0, 0, 0)
  }
});

/* Reset daily story limit automatically
userSchema.pre("save", function (next) {
  const today = new Date().setHours(0, 0, 0, 0);
  if (!this.storyLimit.date || this.storyLimit.date.getTime() !== today) {
    this.storyLimit.date = today;
    this.storyLimit.remaining = 6; // reset to 6 every new day
  }
  next();
});
*/


const User = mongoose.model("User", userSchema);

export default User;
