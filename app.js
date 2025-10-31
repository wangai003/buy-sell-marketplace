const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const http = require('http');
require('dotenv').config();
const {
  addUser,
  removeUser,
  findConnectedUser,
} = require('./controllers/chatRoom');
const {
  loadMessages,
  sendMsg,
  deleteMsg,
} = require('./controllers/chatMessages');

// app
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Export io for use in controllers
app.set('io', io);

//socket.io
io.on('connection', (socket) => {
  socket.on('join', async ({ userId }) => {
    const users = await addUser(userId, socket.id);
    console.log(users);

    setInterval(() => {
      socket.emit('connectedUsers', {
        users: users.filter((user) => user.userId !== userId),
      });
    }, 10000);
  });

  socket.on('loadMessages', async ({ userId, messagesWith }) => {
    const { chat, error } = await loadMessages(userId, messagesWith);

    !error
      ? socket.emit('messagesLoaded', { chat })
      : socket.emit('noChatFound');
  });

  socket.on('sendNewMsg', async ({ userId, msgSendToUserId, msg }) => {
    const { newMsg, error } = await sendMsg(userId, msgSendToUserId, msg);

    const receiverSocket = findConnectedUser(msgSendToUserId);

    if (receiverSocket) {
      // SEND MESSAGE TO A PARTICULAR SOCKET
      io.to(receiverSocket.socketId).emit('newMsgReceived', { newMsg });
    } else {
      socket.emit('setMsgToUnread', { msgSendToUserId });
    }

    !error && socket.emit('msgSent', { newMsg });
  });

  socket.on('deleteMsg', async ({ userId, messagesWith, messageId }) => {
    const { success } = await deleteMsg(userId, messagesWith, messageId);

    if (success) socket.emit('msgDeleted');
  });

  socket.on('disconnectUser', () => removeUser(socket.id));

  // Order status updates
  socket.on('orderStatusUpdate', (data) => {
    // Broadcast to all connected users for real-time updates
    io.emit('orderStatusChanged', data);
  });
});

//image directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// db
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
  })
  .then(() => console.log('Database Connected'))
  .catch((err) => console.log(err));

//middlewares
app.use(cors({
  origin: true, // Allow all origins in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json());

//route middleware
fs.readdirSync('./routes').map((routes) =>
  app.use('/api', require(`./routes/${routes}`))
);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, './client/build')));
}

const port = process.env.PORT || 8000;

// HTTPS configuration for production
if (process.env.NODE_ENV === 'production') {
  const httpsPort = process.env.HTTPS_PORT || 443;
  const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH || '/path/to/ssl/key.pem'),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/path/to/ssl/cert.pem'),
  };

  const httpsServer = https.createServer(sslOptions, app);
  httpsServer.listen(httpsPort, () => {
    console.log(`HTTPS Server is running on port ${httpsPort}`);
  });

  // Redirect HTTP to HTTPS
  const httpApp = express();
  httpApp.use((req, res) => {
    res.redirect(`https://${req.headers.host}${req.url}`);
  });
  httpApp.listen(80, () => {
    console.log('HTTP Server redirecting to HTTPS');
  });
} else {
  server.listen(port, () => {
    console.log(`HTTP Server is running on port ${port}`);
  });
}
