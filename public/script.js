YUI().use('json', 'node', 'event', 'handlebars', function (Y) {
  var input  = Y.one('#input');
  var output = Y.one('#output');

  var ws = new WebSocket("ws://" + window.location.host + "/chat");

  var msgtpl = Y.Handlebars.compile(
      Y.one('#tpl-message').getHTML()
    );

  var onmessage = function (e) {
    var data = Y.JSON.parse(e.data);
    var params = {
        user_id: data.id,
        date: data.time,
        author: data.id,
    };

    var actions = {
      'join': function () {
          params.message = "joined the room.";
          params.action = "join";
      },

      'quit': function () {
          params.message = "left the room.";
          params.action = "leave";
      },

      'message': function () {
          params.message = data.text;
          params.action = "message";
      }
    };

    if (data.type in actions) {
      actions[data.type]();

      var tpl = Y.Node.create(msgtpl(params));

      output.append(tpl);

      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'output']);
      MathJax.Hub.Queue(function () {
          tpl.scrollIntoView();
      });
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
