// const roomID = require('nanoid').nanoid(8)
const app = require('express')();
const favicon = require('serve-favicon');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

function roomLookup(socketID, conf) {
  for (roomID in conf) {
    listOfSockets = conf[roomID]
    // console.log(listOfSockets)
    for (i in listOfSockets) {
      // console.log(socketID + " " + listOfSockets[i])
      if (listOfSockets[i] === socketID)
        return roomID
    }
  }
}

let baseURL = "http://localhost:3000/"
let conf = {}
let roomDB = {}

app.use(favicon(__dirname + '/favicon.ico'));

app.get('/', (req, res) => {
  roomPath = req.url
  roomID = Math.random().toString(36).slice(5)
  console.log("[LOG]: 1. Started here. Generated roomID and now redirecting to " + `${baseURL}` +  `${roomID}`)
  res.redirect(`${baseURL}` +  `${roomID}`)
});

app.get('/*', (req, res) => {
  roomPath = req.url
  roomID = roomPath
  console.log("[LOG]: 2. In /*. Found roomPath: " + roomPath + " and extracted new roomID:" + roomID)
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {

  console.log("[LOG]: 3. In IO interactions Now. SocketID: " + socket.id + " has joined roomID: " + roomID)
  socket.join(roomID)
    
  if (conf.hasOwnProperty(roomID)){
    conf[roomID].push(socket.id.toString())
  }else{
    conf[roomID] = [socket.id.toString()]
  }
  
  socket.on("connected", msg => {
    console.log("[LOG]: 4. New socket just got connected in roomID: " + msg)
    if (roomDB.hasOwnProperty(roomID)) {
      let msgs = roomDB[roomID]
      for (i in msgs){
        io.to(socket.id).emit('room history', msgs[i]);
      }
    }
  })

  socket.on('chat message', msg => {
    roomID = roomLookup(socket.id, conf)
    console.log("[LOG]: 5. Found that socketID " + socket.id + " belongs to roomID: " + roomID)
    console.log("[LOG]: 6. Emitting message " + msg + " in " + roomID + " from socketID: " + socket.id)
    io.to(roomID).emit('chat message', msg);
        
    if (roomDB.hasOwnProperty(roomID)){
      roomDB[roomID].push(msg)
    }else{
      roomDB[roomID] = [msg]
    }

    console.log("[LOG]: 7. RoomDB: ") 
    console.log(roomDB)

  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});