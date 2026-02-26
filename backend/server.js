require("dotenv").config();
constexpress = require(require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log("MongoDB Connected"))
  .catch(err=>console.log(err));

// ================= USER SCHEMA =================
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  inviteCode: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// ================= SONG SCHEMA =================
const songSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  title: String,
  mood: String,
  playCount: {type:Number, default:0},
  totalPlayTime: {type:Number, default:0} // seconds
});

const Song = mongoose.model("Song", songSchema);

// ================= REGISTER =================
app.post("/register", async (req,res)=>{
  try {
    const {username,email,password,inviteCode} = req.body;
    if(inviteCode!==process.env.INVITE_CODE) return res.status(400).json({msg:"Invalid invite code"});
    const hashed = await bcrypt.hash(password,10);
    const newUser = new User({username,email,password:hashed,inviteCode});
    await newUser.save();
    res.json({msg:"User registered successfully"});
  }catch(err){ console.log(err); res.status(500).json({msg:"Server error"});}
});

// ================= LOGIN =================
app.post("/login", async (req,res)=>{
  try{
    const {usernameOrEmail,password} = req.body;
    const user = await User.findOne({$or:[{username:usernameOrEmail},{email:usernameOrEmail}]});
    if(!user) return res.status(400).json({msg:"User not found"});
    const match = await bcrypt.compare(password,user.password);
    if(!match) return res.status(400).json({msg:"Incorrect password"});
    const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"7d"});
    res.json({token,username:user.username});
  }catch(err){ console.log(err); res.status(500).json({msg:"Server error"});}
});

// ================= PROTECTED ROUTE =================
app.get("/me", async(req,res)=>{
  const token = req.headers["authorization"];
  if(!token) return res.status(401).json({msg:"No token"});
  try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    res.json({username:user.username,email:user.email});
  }catch(err){ res.status(401).json({msg:"Invalid token"});}
});

// ================= SAVE PLAY =================
app.post("/playSong", async(req,res)=>{
  const {token,songTitle,mood,duration} = req.body;
  try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    let song = await Song.findOne({userId:decoded.id,title:songTitle});
    if(!song){
      song = new Song({userId:decoded.id,title:songTitle,mood,playCount:1,totalPlayTime:duration});
    }else{
      song.playCount+=1;
      song.totalPlayTime+=duration;
      song.mood=mood;
    }
    await song.save();
    res.json({msg:"Saved"});
  }catch(err){ res.status(401).json({msg:"Invalid token"});}
});

// ================= START SERVER =================
app.listen(5000,()=>console.log("Server running on port 5000"));
