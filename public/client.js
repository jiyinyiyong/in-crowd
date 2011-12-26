var get_name, id_num, last_name, render, try_scroll;

last_name = '';

id_num = '';

render = function(name, id, content, cls, time) {
  var c;
  if (name === last_name) {
    name = '';
  } else {
    last_name = name;
  }
  c = '<div><nav class="name">';
  c += name;
  c += '&nbsp;</nav><nav class="';
  c += cls;
  c += '" id="';
  c += id;
  c += '">';
  c += content + '<span class="time">' + time;
  c += ' </span>';
  c += '</nav></div>';
  ($('#box')).append(c);
  try_scroll();
  return this;
};

try_scroll = function() {
  if (($('#box')).scrollTop() + ($('#box')).height() + 200 > ($('#box'))[0].scrollHeight) {
    ($('#box')).scrollTop(($('#box'))[0].scrollHeight);
  }
  return this;
};

get_name = function(strns) {
  var a;
  a = '';
  while (!(a.length > 0 && a.length < 10)) {
    a = prompt(strns);
  }
  document.cookie = 'zhongli_name=' + (encodeURI(a));
  return a;
};

window.onload = function() {
  var arr, socket, text_hide;
  ($('#text')).hide();
  socket = io.connect(window.location.hostname);
  arr = document.cookie.match(/zhongli_name=([^;]*)(;|$)/);
  if (arr) {
    socket.emit('set nickname', decodeURI(arr[1]));
  } else {
    socket.emit('set nickname', get_name('输入一个长度合适的名字'));
  }
  socket.emit('who');
  socket.on('unready', function() {
    socket.emit('set nickname', get_name('看来需要换个名字'));
    return this;
  });
  text_hide = true;
  document.onkeypress = function(e) {
    var cmd, content;
    if (e.keyCode === 13) {
      if (text_hide) {
        ($('#text')).slideDown(200).focus().val('');
        text_hide = false;
        socket.emit('open', '');
      } else {
        if (($('#text')).val()[0] === '/') {
          cmd = ($('#text')).val();
          switch (cmd) {
            case '/who':
              socket.emit('who');
              break;
            case '/clear':
              ($('#box')).empty();
              last_name = '';
              break;
            case '/forget':
              document.cookie = 'zhongli_name=tolongtoberemmembered!!!';
              break;
            case '/history':
              socket.emit('history', '');
          }
        }
        if (($('#text')).val().length > 1) {
          content = ($('#text')).val();
          ($('#text')).slideUp(200).focus();
          text_hide = true;
          socket.emit('close', id_num, content);
          id_num = '';
        } else {
          ($('#text')).val('');
        }
      }
    }
    return this;
  };
  ($('#text')).bind('input', function(e) {
    var t, text_content;
    t = $('#text');
    if (t.val()[0] === '\n') t.val(t.val().slice(1));
    text_content = t.val().slice(0, 60);
    socket.emit('sync', {
      'id': id_num,
      'content': text_content
    });
    return this;
  });
  ($('#text')).bind('paste', function() {
    alert('coped this string of code, do not paste');
    return this;
  });
  socket.on('new_user', function(data) {
    render(data.name, data.id, '/joined/', 'sys', data.time);
    return this;
  });
  socket.on('user_left', function(data) {
    render(data.name, data.id, '/left/', 'sys', data.time);
    return this;
  });
  socket.on('open_self', function(data) {
    id_num = data.id;
    render(data.name, data.id, '', 'raw', data.time);
    ($('#text')).val('');
    return this;
  });
  socket.on('open', function(data) {
    render(data.name, data.id, '', 'raw', data.time);
    return this;
  });
  socket.on('close', function(id_num) {
    ($('#' + id_num)).attr('class', 'done');
    return this;
  });
  socket.on('sync', function(data) {
    var tmp;
    if ($('#' + data.id)) {
      tmp = '<span class="time">&nbsp;' + data.time + '</span>';
      ($('#' + data.id)).text(data.content);
      ($('#' + data.id)).append(tmp);
    } else {
      render(data.name, data.id, data.content, 'raw', data.time);
    }
    return this;
  });
  socket.on('logs', function(logs) {
    var item, _i, _len;
    for (_i = 0, _len = logs.length; _i < _len; _i++) {
      item = logs[_i];
      render(item[0], 'raw', item[1], 'raw', item[2]);
    }
    return this;
  });
  socket.on('who', function(msg, time) {
    render('/who', 'raw', msg, 'raw', time);
    return this;
  });
  socket.on('history', function(logs) {
    var item, _i, _len;
    for (_i = 0, _len = logs.length; _i < _len; _i++) {
      item = logs[_i];
      render(item[0], 'raw', item[1], 'raw', item[2]);
    }
    return this;
  });
  return this;
};