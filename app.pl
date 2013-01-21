#!/usr/bin/env perl
use Mojolicious::Lite;
use Mojo::IOLoop;
use Mojo::JSON;

my %clients;

# super secret
app->secret('askdjjh5taiu3kh5ai32wu5ha92745yhwreuijkht');

# ROUTES
get  '/' => sub { shift->render_static('index.html'); };
post '/' => sub {
    my $self = shift;

    my $nick = $self->param('nick');

    if (not(defined $nick) or exists $clients{$nick}) {
        $self->stash(nick => $nick);
        $self->render('login-failed');
    } else {
        $self->session->{nickname} = $nick;
        $self->render_static('chat.html');
    }
};

# CLIENT HANDLING
sub broadcast ($$%) {
    my ($nick, $type, %frame) = @_;

    $frame{id}   = $nick;
    $frame{type} = $type;
    $frame{time} = localtime;

    my $frame = Mojo::JSON->new->encode(\%frame);

    for (values %clients) {
        $_->send($frame);
    }
}

# CHAT SOCKET
websocket '/chat' => sub {
    my $self = shift;

    Mojo::IOLoop->stream($self->tx->connection)->timeout(300);

    my $tx = $self->tx;

    die 'oh god no' unless exists $self->session->{nickname};
    my $nick = $self->session->{nickname};

    app->log->debug("Client connected: <$nick>");
    $clients{$nick} = $tx;

    broadcast $nick, 'join';

    $self->on(message => sub {
        my ($self, $msg) = @_;

        broadcast $nick, message => (
            text => $msg,
        );
    });

    $self->on(finish => sub {
        app->log->debug("Client <$nick> disconnected");
        delete $clients{$nick};

        broadcast $nick, 'quit';
    });
};

app->start;
