import express from "express";
import * as path from "path";

const app = express();
app.set("port", process.env.PORT || 9001);

let http = require("http").Server(app);
let io = require("socket.io")(http);
let players: { x: number; y: number; id: any }[] = [];

app.use(express.static(path.join(__dirname, "../build")));

app.get("/", (req: any, res: any) => {
  res.sendFile(path.resolve("./build/index.html"));
});

io.on("connection", function (socket: any) {
  players.push({ x: 100, y: 400, id: socket.id });
  console.log("Client connected!");
  socket.on("updatePlayers", function (data: any) {
    players.forEach((player) => {
      if (player.id === socket.id) {
        player.x = data.x;
        player.y = data.y;
      }
    });
    socket.emit("updatePlayers", players);
  });
});

http.listen(9001, function () {
  console.log("listening on localhost:9001");
});
