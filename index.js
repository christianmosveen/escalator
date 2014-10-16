var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");

var app = express();
var port = process.env.PORT || 5000;

app.use(express.static(__dirname + "/"));

var server = http.createServer(app);
server.listen(port);

console.log("HTTP Server listening on %d", port);

var wss = new WebSocketServer({server: server});
console.log("WebSocket server created");

var temp;
var dist;
var dec;
var move;

function randomize() {
	temp = Math.round((Math.random() * (26 - 18) + 18) * 10) / 10;
	dist = Math.floor(Math.random() * (700 - 50) + 50);
	dec = Math.floor(Math.random() * (100 - 20) + 20);
	move = Math.floor(Math.random() + 0.5);
}

wss.on("connection", function(ws) {
	var id = setInterval(function() {
		randomize();
		ws.send(JSON.stringify({temp: temp, dist: dist, dec: dec, move: move}), function() {})
	}, 1000);

	console.log("WebSocket connection opened");

	ws.on("close", function() {
		console.log("WebSocket connection closed");
		clearInterval(id);
	});
});