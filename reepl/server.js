// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// serve static files from public
app.use(express.static('public'));

// simple in-memory store for rooms -> last messages
const ROOM_HISTORY_LIMIT = 200;
const rooms = {}; // { roomName: [ {nick, text, time} ] }

const profanity = [
  // short list — you can add words here (lowercase). We will replace letters with *
  "badword1",
  "badword2",
  "example" // remove or replace as desired
];

function censorText(text) {
  if (!text) return text;
  const lower = text.toLowerCase();
  // replace whole-word matches
  let out = text;
  profanity.forEach(word => {
    const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'ig');
    out = out.replace(re, (m) => '*'.repeat(m.length));
  });
  return out;
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

io.on('connection', (socket) => {
  // join room
  socket.on('join', ({ nick, room }) => {
    if (!nick || !room) return;
    nick = String(nick).slice(0, 32);
    room = String(room).slice(0, 64);

    socket.data.nick = nick;
    socket.data.room = room;
    socket.join(room);

    // ensure room history exists
    if (!rooms[room]) rooms[room] = [];

    // send existing history (last 200)
    socket.emit('history', rooms[room]);

    // notify others
    const joinMsg = {
      system: true,
      text: `${nick} joined the chat`,
      time: Date.now()
    };
    rooms[room].push(joinMsg);
    if (rooms[room].length > ROOM_HISTORY_LIMIT) rooms[room].shift();
    io.to(room).emit('message', joinMsg);
  });

  // receive message
  socket.on('message', (msgText) => {
    const nick = socket.data.nick || 'anon';
    const room = socket.data.room || 'main';
    if (typeof msgText !== 'string') return;
    let text = msgText.trim();
    if (!text) return;

    // basic length limit
    if (text.length > 1000) text = text.slice(0, 1000) + '...';

    // censor
    text = censorText(text);

    const msg = {
      nick,
      text,
      time: Date.now()
    };

    // save in history
    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(msg);
    if (rooms[room].length > ROOM_HISTORY_LIMIT) rooms[room].shift();

    io.to(room).emit('message', msg);
  });

  socket.on('disconnect', () => {
    const nick = socket.data.nick;
    const room = socket.data.room;
    if (nick && room && rooms[room]) {
      const leaveMsg = {
        system: true,
        text: `${nick} left the chat`,
        time: Date.now()
      };
      rooms[room].push(leaveMsg);
      if (rooms[room].length > ROOM_HISTORY_LIMIT) rooms[room].shift();
      io.to(room).emit('message', leaveMsg);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
