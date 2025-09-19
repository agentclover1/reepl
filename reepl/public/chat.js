// public/chat.js
(() => {
  const socket = io();

  const joinScreen = document.getElementById('join-screen');
  const chatScreen = document.getElementById('chat-screen');
  const nickInput = document.getElementById('nick');
  const roomInput = document.getElementById('room');
  const joinBtn = document.getElementById('join');
  const randomBtn = document.getElementById('random');
  const leaveBtn = document.getElementById('leave');
  const roomNameEl = document.getElementById('room-name');
  const youNickEl = document.getElementById('you-nick');
  const messagesEl = document.getElementById('messages');
  const msgForm = document.getElementById('msg-form');
  const msgInput = document.getElementById('msg-input');
  const sendBtn = document.getElementById('send');

  // helper: get ?room= query param
  const urlParams = new URLSearchParams(window.location.search);
  const defaultRoom = urlParams.get('room') || '';

  if (defaultRoom) roomInput.value = defaultRoom;

  function showChat(nick, room) {
    joinScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    roomNameEl.textContent = room;
    youNickEl.textContent = ` — you: ${nick}`;
    msgInput.focus();
  }

  function showJoin() {
    joinScreen.classList.remove('hidden');
    chatScreen.classList.add('hidden');
  }

  function renderMessage(msg) {
    const el = document.createElement('div');
    el.className = 'message';
    const time = new Date(msg.time);
    const timeStr = time.toLocaleTimeString();

    if (msg.system) {
      el.classList.add('system');
      el.textContent = `[${timeStr}] ${msg.text}`;
    } else {
      const nickSpan = document.createElement('span');
      nickSpan.className = 'nick';
      nickSpan.textContent = msg.nick;
      const textSpan = document.createElement('span');
      textSpan.className = 'text';
      textSpan.textContent = msg.text;
      const meta = document.createElement('span');
      meta.className = 'meta';
      meta.textContent = timeStr;
      el.appendChild(nickSpan);
      el.appendChild(textSpan);
      el.appendChild(meta);
    }
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  joinBtn.addEventListener('click', () => {
    let nick = nickInput.value.trim();
    const room = (roomInput.value.trim() || 'main').toLowerCase();
    if (!nick) {
      nick = randomNick();
    }
    socket.emit('join', { nick, room });
    showChat(nick, room);
  });

  randomBtn.addEventListener('click', () => {
    nickInput.value = randomNick();
  });

  leaveBtn.addEventListener('click', () => {
    // simple page reload to leave
    window.location = '/';
  });

  msgForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = msgInput.value;
    if (!text || !text.trim()) return;
    socket.emit('message', text);
    msgInput.value = '';
    msgInput.focus();
  });

  sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    msgForm.dispatchEvent(new Event('submit'));
  });

  socket.on('history', (arr) => {
    messagesEl.innerHTML = '';
    arr.forEach(renderMessage);
  });

  socket.on('message', (msg) => {
    renderMessage(msg);
  });

  function randomNick() {
    const adjectives = ['chill','quiet','speedy','brave','kind','sneaky','lucky','grey','small','big'];
    const animals = ['fox','owl','cat','panda','otter','hawk','wolf','sparrow','finch','ferret'];
    return adjectives[Math.floor(Math.random()*adjectives.length)]
      + '_' + animals[Math.floor(Math.random()*animals.length)]
      + Math.floor(Math.random()*90 + 10);
  }
})();
