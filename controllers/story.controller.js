import { Story } from "../models/story.model.js";
import User from "../models/user.model.js"


export const storyLinkCreate = async(req,res)=>{
    const {userId , link , title} = req.body

    try{
        if(link.trim() === "" || title.trim() === "") return res.status(400).json({success:false, message: "link and title should not be empty" });
        const user = await User.findById(userId)
        if(!user) return res.status(404).json({success:false, message: "User not found" });

        const newStory = await Story.create({
            owner : user?._id,
            link,
            title
        })

        return res.json({success:true, message: "Story created successfully", newStory });
    }catch(error){
        res.status(500).json({success:false, message: "Error creating story details", error: error.message });
    }

}

export const getStories = async(req,res)=>{
    const {userId} = req.body

    try{
        const user = await User.findById(userId)
        if(!user) return res.status(404).json({success:false, message: "User not found" });
        const stories = await Story.find({owner : userId}).sort({createdAt:-1})
        return res.json({success:true, message: "Stories found successfully", stories });
    }catch(error){
        res.status(500).json({success:false, message: "Error getting stories", error: error.message });
    }
}