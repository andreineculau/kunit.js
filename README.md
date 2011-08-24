# Testing JavaScript code just got [simpler, safer & more fun](http://klarna.com)

kunit.js is a simplified version of [FuncUnit](https://github.com/jupiterjs/funcunit),
which makes use of [jQuery](https://github.com/jquery/jquery),
[Syn](https://github.com/jupiterjs/syn) and [QUnit](https://github.com/jquery/qunit).

# A quick tutorial

Tests are run by indicating the QUnit test file as a query to test.html.

Eg. in order to run the included [test.js](https://github.com/andreineculau/kunit.js/blob/master/test.js),
you would launch the browser to _test.html?test=test.js_.

[test.js](https://github.com/andreineculau/kunit.js/blob/master/test.js) shows a few examples on how to use kunit.js

* K.open(_url_) opens a new window
* K.window would point to the window object of the opened window
* K(_selector_, _context_) returns a JQuery object, where context is by default K.window.document
* K.syn is a proxy for Syn, where context is by default K.window.document.body