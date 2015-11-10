// var express = require('express'),
// 	app = express(),
// 	server = require('http').createServer(app),
// 	    io = require('socket.io').listen(server),

// 	    users = []; //保存所有在线的人
// 	    samePeople = 0; //同一个人打开多个窗口

// app.use('/', express.static(__dirname + '/www'));
// server.listen(80);
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users = [];
//specify the html we will use
app.use('/', express.static(__dirname + '/www'));
//bind the server to the 80 port
//server.listen(3000);//for local test
server.listen(process.env.PORT || 3000);//publish to heroku
console.log('server started');

//socket部分
io.on('connection', function(socket) {
    //接收并处理客户端发送的事件
    socket.on('login', function(data) {
        //将消息输出到控制台
        var name = "[" + data.address + "] " + data.name;
        //在线人数
        socket.userNowIndex = users.length;
        socket.name = name;
        //遍历数组，如果该名字不存在则push
        for(var i = 0; i < users.length; i++){
			if( users[i] == name )
				samePeople++;        	
        }
        if( samePeople == 0 ){
	    	users.push(name);
        	io.sockets.emit('system', socket.name, users, 'login');
        }else{
        // 打开多个窗口直接改变用户名
        	name = name + '[' + samePeople + ']';
        	socket.name = name;
	    	users.push(name);
        	io.sockets.emit('system', name, users, 'login');
        }
    });

    //断开连接
    socket.on('disconnect', function(){
    	// 删除用户
    	users.splice(socket.userNowIndex, 1);
    	socket.broadcast.emit('system', socket.name, users, 'logout');
    });

    //接受新消息
    socket.on('postMsg', function(name, msg, avatar, time){
    	socket.broadcast.emit('newMsg', name, avatar, msg, time);
    });
});