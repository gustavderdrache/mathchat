YUI().use('json', 'node', 'event' 'handlebars', function (Y) {
  var input  = Y.one('#input');
  var output = Y.one('#output');

  var ws = new WebSocket("ws://" + window.location.host + "/chat");

  var onmessage = function (e) {
    var node = Y.Node.create('<p></p>');
    var data = Y.JSON.parse(e.data);

    var actions = {
      'join': function () {
        var msg = '*** ' + data.id + ' has joined the room.';
        Y.Node.create('<span></span>').set('text', msg).appendTo(node);
      },

      'quit': function () {
        var msg = '*** ' + data.id + ' has left the room.';
        Y.Node.create('<span></span>').set('text', msg).appendTo(node);
      },

      'message': function () {
        Y.Node.create('<span></span>').set('text', data.id + ':').appendTo(node);
        Y.Node.create('<span></span>').set('text', data.text).appendTo(node);

      }
    };

    if (data.type in actions) {
      Y.Node.create('<span></span>').set('text', data.time).appendTo(node);

      actions[data.type]();

      node.appendTo(output);
      node.scrollIntoView();

      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'output']);
    } else {
      Y.log("ERROR: Unknown type " + data.type);
      Y.log("Full message follows: " + e.data);
    }
  };

  ws.onopen = function (e) {
    Y.log('connected');
  };

  ws.onclose = function (e) {
    Y.log('disconnected');
  };

  ws.onmessage = onmessage;
  ws.onerror   = function (e) {
    Y.log("error: " + Y.JSON.stringify(e));
  };

  input.on('keypress', function (e) {
    if (e.keyCode != 13 || e.shiftKey)
      return;

    e.preventDefault();

    var text = input.get('value');
    input.set('value', '');

    ws.send(text);

    return false;
  });
});
