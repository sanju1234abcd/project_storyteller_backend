import express from "express";
import {
  registerUser,
  verifyUser,
  loginUser,
  reduceStoryLimit,
  getCurrentUser,
  logoutUser,
  healthChecker,
} from "../controllers/user.controller.js";
import { getStories, storyLinkCreate } from "../controllers/story.controller.js";

const userRouter = express.Router();

// Manual Auth
userRouter.post("/register", registerUser);
userRouter.post("/verify", verifyUser);
userRouter.post("/login", loginUser);
userRouter.post("/current", getCurrentUser);
userRouter.post("/logout", logoutUser);

// Story limit decrement
userRouter.post("/story", reduceStoryLimit);

// Story Link create and save 
userRouter.post("/storyLinkSave", storyLinkCreate);
userRouter.post("/getStories", getStories);

userRouter.get("/health",healthChecker)

export default userRouter;
