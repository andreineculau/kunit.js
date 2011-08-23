module('a', {
    setup: function() {
        K.open('test.run.html');
    }
});

// test('that everything is fine', function() {
//     ok(1 == 1, 'yes it is');
// });

// test('that there is content', function() {
//     ok(K('#qunit-header').size(), 'yes there is');
// });

test('that h1 can be clicked', function() {
    K.syn.click({clientX: 120, clientY: 30});

    K(K.window.document).click();
});
