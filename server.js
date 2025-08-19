import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv"
import userRouter from "./routes/user.route.js";
import cookieParser from "cookie-parser";
import cors from "cors"

dotenv.config({
    path: "./.env"
})
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use(cors({
    origin: "https://virtual-storyteller-frontend.vercel.app/",
    credentials: true
}))

app.use("/api/v1/users",userRouter)

const dbConnect = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL,{
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB");
    }catch(error){
        console.log(error);
        process.exit(1);
    }
}

await dbConnect().then(() => {
    app.listen(3000, () => {
        console.log("Server started on port 3000");
    });

    app.get("/", (req, res) => {
        res.send("Hello, World!");
    });

    setInterval(async() => {
        await fetch(`https://project-storyteller-backend.onrender.com/api/v1/users/health`,{method:"GET"});
    }, 14 * 60 *1000);
    
});