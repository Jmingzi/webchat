var express = require('express'),
	app = express(),
	server = require('http').createServer(app);

app.use('/', express.static(__dirname + '/html'));
server.listen(80);