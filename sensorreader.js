var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var StringDecoder = require('string_decoder').StringDecoder;
var http = require("http");


var sensorIp = "192.168.7.2";
var dbUrl = 'mongodb://localhost:27017/trappa';
var db;

MongoClient.connect(dbUrl, function(err, database) {
    if(err) throw err;
    db = database;
    setTimeout(retrieveDataFromSensors, 100);
});

var sensors = {
    temperature : {
        host: sensorIp,
        port: 4040,
        path: 'http://192.168.7.2:4040/robots/trappa/devices/temp/commands/Read',
        method: 'GET'
    },
    sonar : {
        host: sensorIp,
        port: 4040,
        path: 'http://192.168.7.2:4040/robots/trappa/devices/sonar/commands/Read',
        method: 'GET'
    },
    sound : {
        host: sensorIp,
        port: 4040,
        path: 'http://192.168.7.2:4040/robots/trappa/devices/sound/commands/Read',
        method: 'GET'
    }
};
var decoder = new StringDecoder('utf8');

function retrieveDataFromSensors(){
    var readings = [];
    Object.keys(sensors).forEach(function(key) {
        var reqGet = http.request(sensors[key], function(res){
            res.on('data', function(d) {
                db.collection('readings').insert({
                    sensor: key,
                    data: decoder.write(d),
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
    setTimeout(retrieveDataFromSensors, 100);
}