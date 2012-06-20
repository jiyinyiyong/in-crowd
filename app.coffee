 
ll = console.log
fs = require 'fs'

app = (require 'http').createServer (req, res) ->
  res.end 'world?'

io = (require 'socket.io').listen app, {origins: '*:*'}
io.set 'log level', 1
# io.set "transports", ["xhr-polling"]
# io.set "polling duration", 10
app.listen 8000

time = -> (String (new Date().getTime()))[-10..]
format2 = (num) -> if num<10 then '0'+(String num) else (String num)
date = ->
  now    = new Date()
  month  = format2 (now.getMonth() + 1)
  date   = format2 now.getDate()
  hour   = format2 now.getHours()
  minute = format2 now.getMinutes()
  {
    date: "#{month}/#{date}"
    time: "#{hour}:#{minute}"
  }

url = 'mongodb://nodejs:nodepass@localhost:27017/zhongli'
(require 'mongodb').connect url, (err, db) ->
  throw err if err?
  db.collection 'posts', (err, posts) ->
    throw err if err?
    db.collection 'topics', (err, topics) ->
      throw err if err?
      chat = io.of('/chat').on 'connection', (socket) ->
        ll 'ok'
        # setInterval (->
        #   socket.emit 'has-error', {info: 'xxx'}
        #   ll 'xxx'), 2000

        name = undefined
        socket.on 'set-name', (data) ->
          ll data
          if data.name.length is 0 then socket.emit 'has-error', {info: 'too short'}
          else if data.name.length > 15 then socket.emit 'has-error', {info: 'too long'}
          else name = data.name
          ll 'name:', name