const express = require("express");
const dotenv = require("dotenv");
const colors = require("colors");
const { chats } = require("./data/data");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes=require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const path=require('path');

// Load environment variables
dotenv.config();

// Connect to the database
connectDB()
  .then(() => console.log("Database connected successfully".cyan.bold))
  .catch((error) => {
    console.error(`Error connecting to database: ${error.message}`.red.bold);
    process.exit(1);
  });

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Base route to check if API is running


// User routes
app.use("/api/user", userRoutes);

// Chat routes
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);


// ---------------------------------deployment-------------------------------------

// const __dirname1=path.resolve();
// if(process.env.NODE_ENV==='production'){
//   app.use(express.static(path.join(__dirname1,"/frontend/build")));
//   app.get("*",(req,res)=>{
//     res.sendFile(path.resolve(__dirname1,"frontend","build","index.html"));
//   })
// }else{
//   app.get("/", (req, res) => {
//     res.send("API is running");
//   });
// }
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}



// ---------------------------------deployment-------------------------------------


// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;
const server= app.listen(PORT, () => {
  console.log(`Server started on PORT ${PORT}`.green.bold);
});

const io=require("socket.io")(server,{
  pingTimeout: 60000,
  cors:{
    origin:"http://localhost:3000",
  },
});

io.on("connection",(socket)=>{
  console.log("connected to socket.io");

  socket.on('setup',(userData)=>{
    socket.join(userData._id);
    socket.emit("connected");
  });
  socket.on('join chat',(room)=>{
    socket.join(room);
    console.log("User joined room: "+room);
  });

  socket.on("typing",(room)=>socket.in(room).emit("typing"));
  socket.on("stop typing",(room)=>socket.in(room).emit("stop typing"));


  socket.on('new message',(newMessageReceived)=>{
    var chat=newMessageReceived.chat;
    if(!chat.users) return console.log('chat.users not defined');

    chat.users.forEach(user=>{
      if(user._id==newMessageReceived.sender._id) return;

      socket.in(user._id).emit("message received", newMessageReceived)
    });
  });
  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});

