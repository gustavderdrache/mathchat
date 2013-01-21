#!/usr/bin/env perl
use Mojolicious::Lite;
use Mojo::IOLoop;
use Mojo::JSON;

use Scalar::Util 'refaddr';

my %clients;

sub broadcast ($$%) {
    my ($id, $type, %frame) = @_;

    $frame{id}   = $id;
    $frame{type} = $type;
    $frame{time} = localtime;

    my $frame = Mojo::JSON->new->encode(\%frame);

    for (values %clients) {
        $_->send($frame);
    }
}

get '/' => sub { shift->render_static('index.html'); };

websocket '/chat' => sub {
    my $self = shift;

    Mojo::IOLoop->stream($self->tx->connection)->timeout(300);

    my $tx = $self->tx;

    my $id = sprintf '%X', refaddr $tx;
    app->log->debug("Client connected: $id");
    $clients{$id} = $tx;

    broadcast $id, 'join';

    $self->on(message => sub {
        my ($self, $msg) = @_;

        broadcast $id, message => (
            text => $msg,
        );
    });

    $self->on(finish => sub {
        app->log->debug("Client $id disconnected");
        delete $clients{$id};

        broadcast $id, 'quit';
    });
};

app->start;
