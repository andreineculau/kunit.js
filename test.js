module('a', {
    'setup': function() {
        K.open('url.com');
    }
});

test('that everything is fine', function() {
    ok(1 == 1, 'yes it is');
});
