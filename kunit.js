K = function(selector, context){
    if(selector && selector.kunit === true){
        return selector;
    }

    // Extend with selector methods
    context = context?context:K.window.document;
    return jQuery.extend({
        'kunit': true
    }, jQuery(selector, context));
};

// Constructor
jQuery.extend(K, (function() {
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
                _next.nextTimer = setTimeout(_timeoutCallback, _next.timeout + K.timeBetweenOpen);

               _open(_next.src,
                     _successCallback);
            }, K.timeBetweenOpen);
        } else {
            setTimeout(start, 0);
        }
    };

    var _open = function(src, successCallback) {
        var readyStateInterval;

        var onload = function(e) {
            clearInterval(readyStateInterval);
            K.window.document.documentElement.tabIndex = 0;
            setTimeout(function() {
                K.window.focus();
            }, 0);
            K.$(K.window).unbind({
                'load': onload
            });
            _successCallback();
        };

        var onunload = function(e) {
            K.$(K.window).unbind({
                'load': onload,
                'unload': onunload
            });
        };

        var checkreadystate = function() {
            if ((K.window.document.readyState == 'complete' ||
                 K.window.document.readyState == 'loaded') &&
                K.window.location.href != 'about:blank') {
                onload();
            }
        };

        if (K.window) {
            K.window.location = src;
        } else {
            K.window = window.open(src, 'kunit');
        }

        K.$(K.window).bind({
            'unload': onunload
        });
        if ('readyState' in K.window.document) {
            if ('onreadystatechange' in K.window.document) {
                K.window.document.onreadystatechange = checkreadystate;
            } else {
                readyStateInterval = setInterval(function() {
                    if (!K.window.document) {
                        return;
                    }

                    checkreadystate();
                }, 200);
            }
        } else {
            K.$(K.window).bind({
                'load': onload
            });
        }
    };

    return {
        '$': jQuery.noConflict(),

        /**
         * Wrapper for Syn, with predefined context = K.window.document.body
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
                        args[1] = K.window.document.body;
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
        jQuery.each(chunks, function(key, value) {
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
