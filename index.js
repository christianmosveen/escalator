var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var app = express();
var port = process.env.PORT || 5000;
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var StringDecoder = require('string_decoder').StringDecoder;
var sensorIp = "192.168.7.2";
var dbUrl = 'mongodb://localhost:27017/trappa';
var db;


app.use(express.static(__dirname + "/"));

var server = http.createServer(app);
server.listen(port);
var wss = new WebSocketServer({server: server});
console.log("WebSocket server created");



MongoClient.connect(dbUrl, function(err, database) {
    if(err) throw err;
    db = database;
    setTimeout(retrieveDataFromSensors, 100);
});

var sensors = {
    temp : {
        host: sensorIp,
        port: 4040,
        path: '/robots/trappa/devices/temp/commands/Read',
        method: 'GET'
    },
    dist : {
        host: sensorIp,
        port: 4040,
        path: '/robots/trappa/devices/sonar/commands/Read',
        method: 'GET'
    },
    dec : {
        host: sensorIp,
        port: 4040,
        path: '/robots/trappa/devices/noice/commands/Read',
        method: 'GET'
    }/*,
    move : {
        host: sensorIp,
        port: 4040,
        path: '/robots/trappa/devices/motion/commands/DigitalRead',
        method: 'GET'
    }*/
};
var decoder = new StringDecoder('utf8');
var readings = {temp: 0, dist: 0, dec: 0, move: 0};

function retrieveDataFromSensors(){

    Object.keys(sensors).forEach(function(key) {
        var reqGet = http.request(sensors[key], function(res){
            res.on('data', function(d) {
                readings[key] = decoder.write(d);
                var result = Number(decoder.write(d));
                if(key === 'dec') {
                    //console.log(decoder.write(d));
                }
                db.collection('readings').insert({
                    sensor: key,
                    data: Number(decoder.write(d)),
                    timestamp: new Date()
                }, function(err, result){
                    assert.equal(err, null);
                    assert.equal(1, result.result.n);
                    assert.equal(1, result.ops.length);
                });
            });
        });
        reqGet.end();
        reqGet.on('error', function(e) {
            console.error(e);
        });
    });

    setTimeout(retrieveDataFromSensors, 200);
}

function sendCurrent(){
}
wss.on("connection", function(ws) {
    var inter = setInterval(function(){
    ws.send(JSON.stringify(readings), function() {});
    }, 200);

    console.log("WebSocket connection opened");
    ws.on("close", function() {
        console.log("WebSocket connection closed");
        clearInterval(inter);
    });
});


var minRead = 0;
var maxRead = 0;





