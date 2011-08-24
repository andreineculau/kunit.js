kunit = function(selector, context){
    if(selector && selector.kunit === true){
        return selector;
    }
    var self = kunit;

    // Extend with selector methods
    context = context?context:self.window.document;
    return jQuery.extend({
        'kunit': true
    }, jQuery(selector, context));
};

// Constructor
jQuery.extend(kunit, (function() {
    var self = kunit;

    var _queue = [];
    var _queuePos = 0;
    var _next;
    var _incallback = false;

    var _add = function(handler) {
        if (_incallback) {
            _queue.splice(_queuePos, 0, handler);
            _queuePos++;
        } else {
            _queue.push(handler);
        }

        if (_queue.length == 1 && !_incallback) {
            setTimeout(_done, 0);
        }
    };

    var _successCallback = function() {
        _incallback = true;
        clearTimeout(_next.nextTimer);

        if (_next.successCallback) {
            _next.successCallback.apply(_next.callbackScope || null, arguments);
        }
        _incallback = false;
        _done();
    };

    var _timeoutCallback = function() {
        _incallback = true;
        clearTimeout(_next.nextTimer);
        ok(false, 'Page ' + _next.src + ' did not load in time!');

        if (_next.timeoutCallback) {
            _next.timeoutCallback.apply(_next.callbackScope || null, arguments);
        }

        _incallback = false;
        _done();
    };

    var _done = function() {
        if (_queue.length) {
            _next = _queue.shift();
            _queuePos = 0;

            setTimeout(function() {
                _next.nextTimer = setTimeout(_timeoutCallback, _next.timeout + self.timeBetweenOpen);

               _open(_next.src,
                     _successCallback);
            }, self.timeBetweenOpen);
        } else {
            setTimeout(start, 0);
        }
    };

    var _open = function(src, successCallback) {
        var readyStateInterval;

        var onload = function(e) {
            clearInterval(readyStateInterval);
            self.window.document.documentElement.tabIndex = 0;
            setTimeout(function() {
                self.window.focus();
            }, 0);
            jQuery(self.window).unbind({
                'load': onload
            });
            _successCallback();
        };

        var onunload = function(e) {
            jQuery(self.window).unbind({
                'load': onload,
                'unload': onunload
            });
        };

        var checkreadystate = function() {
            if ((self.window.document.readyState == 'complete' ||
                 self.window.document.readyState == 'loaded') &&
                self.window.location.href != 'about:blank') {
                onload();
            }
        };

        if (self.window) {
            self.window.location = src;
        } else {
            self.window = window.open(src, 'kunit');
        }

        jQuery(self.window).bind({
            'unload': onunload
        });
        if ('readyState' in self.window.document) {
            if ('onreadystatechange' in self.window.document) {
                self.window.document.onreadystatechange = checkreadystate;
            } else {
                readyStateInterval = setInterval(function() {
                    if (!self.window.document) {
                        return;
                    }

                    checkreadystate();
                }, 200);
            }
        } else {
            jQuery(self.window).bind({
                'load': onload
            });
        }
    };

    return {
        '$': jQuery.noConflict(),

        /**
         * Wrapper for Syn, with predefined context = self.window.document.body
         * {@link Syn} is a synthetic event generator
         * @see http://jupiterjs.com/news/syn-a-standalone-synthetic-event-library
         */
        'syn': (function() {
            var result = {};
            jQuery.each(Syn, function(methodName, method) {
                if (typeof method === 'function') {
                    result[methodName] = function() {
                        var args = [];
                        jQuery.each(arguments, function() {
                            args.push(this);
                        });
                        args[0] = args[0]?args[0]:{};
                        args[1] = self.window.document.body;
                        method.apply(Syn, args);
                    };
                }
            });
            return result;
        })(),

        'timeBetweenOpen': 200,

        'open': function(src, callback, timeout) {
            stop();
            if (typeof callback !== 'function') {
                timeout = callback;
                callback = undefined;
            }
            _add({
                'src': src,
                //'callbackScope': null,
                'successCallback': callback,
                'timeout': timeout || 30000
                //'timeoutCallback': function() {}
            });
        }
    };
})());

(function() {
    var unserialize = function(str){
        var chunks = str.split("&");
        var obj = {};
        kunit.$.each(chunks, function(key, value) {
            var spl = value.split("=");
            obj[spl[0]] = spl[1];
        });
        return obj;
    };

    var hash = unserialize(window.location.search.slice(1));
    var script = document.createElement('SCRIPT');
    script.setAttribute('src', hash.test);
    window.document.getElementsByTagName('head')[0].appendChild(script);
})();
