import mongoose from "mongoose";


const storySchema = new mongoose.Schema({
    title : {
        type : String,
        required : true
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    link : {
        type : String,
        required : true
    }
},{
    timestamps : true
})

export const Story = mongoose.model("Story",storySchema)