
fs = require 'fs'
url = require 'url'
handler = (req, res) ->
	path = (url.parse req.url).pathname
	if path is '/' then path = '/public/index.html'
	fs.readFile __dirname+path, (err, data)->
		console.log __dirname+path
		if err
			res.writeHead 500
			res.end 'page not found'
		else
			res.writeHead 200
			res.end data
app = (require 'http').createServer handler
app.listen 8000
thread = 0
names = []
name_log = (name) ->
	if name.length > 10 then return false
	for n in names
		if n is name then return false
	true
timestamp = () ->
	t = new Date()
	tm = t.getHours()+':'+t.getMinutes()+':'+t.getSeconds()
io = (require 'socket.io').listen app
logs = []
io.set 'log level', 1
io.set "transports", ["xhr-polling"]
io.set "polling duration", 10
io.sockets.on 'connection', (socket) ->
	socket.on 'set nickname', (name) ->
		if (name_log name)
			socket.set 'nickname', name, () ->
				socket.emit 'ready'
				socket.emit 'logs', logs.slice -6
				@
			thread += 1
			names.push name
			data =
				'name': name
				'id': 'id'+thread
				'time': timestamp()
			socket.broadcast.emit 'new_user', data
			socket.emit 'new_user', data
		else
			socket.emit 'unready'
		@
	socket.on 'disconnect', () ->
		socket.get 'nickname', (err, name) ->
			thread += 1
			names.splice (names.indexOf name), 1
			data =
				'name': name
				'id': 'id'+thread
				'time': timestamp()
			socket.broadcast.emit 'user_left', data
			@
	socket.on 'open', () ->
		thread += 1
		socket.get 'nickname', (err, name) ->
			if name
				data =
					'name': name
					'id': 'id'+thread
					'time': timestamp()
				socket.broadcast.emit 'open', data
				socket.emit 'open_self', data
			@
	socket.on 'close', (id_num, content) ->
		socket.broadcast.emit 'close', id_num
		socket.emit 'close', id_num
		socket.get 'nickname', (err, name) ->
			logs.push [name, content, timestamp()]
			@
		@
	socket.on 'sync', (data) ->
		socket.get 'nickname', (err, name) ->
			if err then return @
			data.time = timestamp()
			data.name = name
			data.content = data.content.slice 0, 60
			socket.broadcast.emit 'sync', data
			socket.emit 'sync', data
			@
		@
	socket.on 'who', () ->
		msg = names+'...总数'+names.length if names.length < 8
		msg = (names.slice 0, 8)+'...总数'+names.length if names.length >= 8
		socket.emit 'who', msg, timestamp()
		@
	socket.on 'history', () ->
		socket.emit 'history', logs
	@