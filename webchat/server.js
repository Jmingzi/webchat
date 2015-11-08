var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	    io = require('socket.io').listen(server);

app.use('/', express.static(__dirname + '/www'));
server.listen(80);
console.log('server started');
//socket部分
io.on('connection', function(socket) {
    //接收并处理客户端发送的foo事件
    socket.on('foo', function(data) {
        //将消息输出到控制台
        console.log(data);
    })
});