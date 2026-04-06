'use strict';
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { createGame, playCard, skipTurn, currentPlayer, getPlayableCards } = require('./src/gameEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

// rooms: { [roomCode]: { players: [{id, name, ready}], game, host } }
const rooms = {};

function makeCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function broadcastRoom(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  const safeRoom = {
    code: roomCode,
    host: room.host,
    players: room.players.map(p => ({ id: p.id, name: p.name, ready: p.ready })),
    gameStarted: !!room.game,
  };
  io.to(roomCode).emit('room_update', safeRoom);
}

function sendGameState(roomCode, game) {
  const room = rooms[roomCode];
  if (!room) return;
  room.players.forEach(p => {
    const playableCards = game ? getPlayableCards(game, p.id) : [];
    const handSizes = {};
    room.players.forEach(pl => {
      handSizes[pl.id] = game ? game.hands[pl.id].length : 0;
    });
    io.to(p.id).emit('game_state', {
      hand: game ? game.hands[p.id] : [],
      handSizes,
      tableCard: game ? game.tableCard : null,
      currentTurn: game ? currentPlayer(game) : null,
      winners: game ? game.winners : [],
      phase: game ? game.phase : 'lobby',
      pendingFreePlay: game ? game.pendingFreePlay : false,
      playableCards,
      playerOrder: game ? game.order : [],
    });
  });
}

io.on('connection', (socket) => {
  console.log('connected', socket.id);

  socket.on('create_room', ({ name }) => {
    const code = makeCode();
    rooms[code] = {
      host: socket.id,
      players: [{ id: socket.id, name, ready: false }],
      game: null,
    };
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.name = name;
    socket.emit('room_created', { code });
    broadcastRoom(code);
  });

  socket.on('join_room', ({ code, name }) => {
    const room = rooms[code];
    if (!room) return socket.emit('error', 'Room tidak ditemukan.');
    if (room.game) return socket.emit('error', 'Game sudah berjalan.');
    if (room.players.length >= 4) return socket.emit('error', 'Room penuh (maks 4 pemain).');
    if (room.players.find(p => p.id === socket.id)) return socket.emit('error', 'Sudah join.');

    room.players.push({ id: socket.id, name, ready: false });
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.name = name;
    socket.emit('room_joined', { code });
    broadcastRoom(code);
  });

  socket.on('set_ready', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) player.ready = !player.ready;
    broadcastRoom(code);
  });

  socket.on('start_game', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;
    if (room.host !== socket.id) return socket.emit('error', 'Hanya host yang bisa start.');
    if (room.players.length < 2) return socket.emit('error', 'Minimal 2 pemain.');

    const playerIds = room.players.map(p => p.id);
    room.game = createGame(playerIds);

    io.to(code).emit('game_started');
    sendGameState(code, room.game);

    // Notify who goes first
    const first = currentPlayer(room.game);
    const firstName = room.players.find(p => p.id === first)?.name;
    io.to(code).emit('game_event', { type: 'game_start_info', message: `${firstName} mulai duluan (punya Thief ⭐1)` });
  });

  socket.on('play_card', ({ cardId }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || !room.game) return;

    const result = playCard(room.game, socket.id, cardId);
    if (!result.ok) return socket.emit('error', result.error);

    sendGameState(code, room.game);

    // Broadcast events with player names
    result.events.forEach(ev => {
      const enriched = { ...ev };
      if (ev.playerId) enriched.playerName = room.players.find(p => p.id === ev.playerId)?.name;
      io.to(code).emit('game_event', enriched);
    });
  });

  socket.on('skip_turn', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || !room.game) return;

    const result = skipTurn(room.game, socket.id);
    if (!result.ok) return socket.emit('error', result.error);

    sendGameState(code, room.game);
    result.events.forEach(ev => {
      const enriched = { ...ev };
      if (ev.playerId) enriched.playerName = room.players.find(p => p.id === ev.playerId)?.name;
      io.to(code).emit('game_event', enriched);
    });
  });

  socket.on('play_again', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || room.host !== socket.id) return;
    room.game = null;
    room.players.forEach(p => p.ready = false);
    io.to(code).emit('back_to_lobby');
    broadcastRoom(code);
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    if (!code || !rooms[code]) return;
    const room = rooms[code];
    room.players = room.players.filter(p => p.id !== socket.id);
    if (room.players.length === 0) {
      delete rooms[code];
      return;
    }
    if (room.host === socket.id) room.host = room.players[0].id;
    if (room.game && !room.game.winners.includes(socket.id)) {
      io.to(code).emit('player_left', { name: socket.data.name });
    }
    broadcastRoom(code);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
