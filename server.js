var express = require('express');
var app = express();                               // create our app w/ express
// log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var routes = require('./routes');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({'extended': 'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({type: 'application/vnd.api+json'})); // parse application/vnd.api+json as json
app.use(methodOverride());


app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With,Content-Type,Content-Range, Content-Disposition,Authorization,Accept');
  res.header('Access-Control-Allow-Methods', 'OPTIONS, HEAD,GET,PUT,POST,DELETE');
  next();
});

// Main App Page
//app.get('/', routes.index);

// MongoDB API Routes
app.get('/polls/polls', routes.list);
app.get('/polls/:id', routes.poll);
app.post('/polls', routes.create);
app.post('/vote', routes.vote);

var http = require('http').createServer(app);
var io = require('socket.io').listen(http);
//var onlineUsers = 0;
io.sockets.on('connection', routes.vote);
/*io.sockets.on('connection', function (socket) {
  onlineUsers++;
  var ip = socket.handshake.address;
  console.log(socket.handshake);
  io.sockets.emit('onlineUsers', { onlineUsers: onlineUsers, socketInfo: socket.handshake });

  socket.on('disconnect', function () {
    onlineUsers--;
    io.sockets.emit('onlineUsers', { onlineUsers: onlineUsers });
  });
});*/

app.set('port', process.env.PORT || 8080);


http.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});