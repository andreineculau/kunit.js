module('a', {
    setup: function() {
        K.open('test.run.html');
    }
});

test('that everything is fine', function() {
    ok(1 == 1, 'yes it is');
});

test('that there is content', function() {
    ok(K('body *').size(), 'yes there is');
});
