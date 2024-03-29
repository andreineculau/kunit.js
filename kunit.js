/*global jQuery: true, window: true, Syn: true*/
/*global ok: true, start: true, stop: true, equal: true*/ // QUnit functions
/*jslint browser:true, eqeqeq: true*/
/*jshint browser:true, eqeqeq: true*/
var kunit = function(selector, context){
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
jQuery.extend(kunit, (function(window, document, $) {
    "use strict";
    var self, _queue, _queuePos, _next, _incallback,
        _add, _successCallback, _timeoutCallback, _done, _open;

    self = kunit;
    _queue = [];
    _queuePos = 0;
    _incallback = false;

    _add = function(handler) {
        if (_incallback) {
            _queue.splice(_queuePos, 0, handler);
            _queuePos++;
        } else {
            _queue.push(handler);
        }

        if (_queue.length === 1 && !_incallback) {
            setTimeout(_done, 0);
        }
    };

    _successCallback = function() {
        _incallback = true;
        clearTimeout(_next.nextTimer);

        if (_next.successCallback) {
            _next.successCallback.apply(_next.callbackScope || null, arguments);
        }
        _incallback = false;
        _done();
    };

    _timeoutCallback = function() {
        _incallback = true;
        clearTimeout(_next.nextTimer);
        ok(false, 'Page ' + _next.src + ' did not load in time!');

        if (_next.timeoutCallback) {
            _next.timeoutCallback.apply(_next.callbackScope || null, arguments);
        }

        _incallback = false;
        _done();
    };

    _done = function() {
        if (_queue.length) {
            _next = _queue.shift();
            _queuePos = 0;

            setTimeout(function() {
                _next.nextTimer = setTimeout(_timeoutCallback, _next.timeout +
                                             self.timeBetweenOpen);

               _open(_next.src, _successCallback);
            }, _queue.length === 0 ? 0 : self.timeBetweenOpen);
        } else {
            setTimeout(start, 0);
        }
    };

    _open = function(src, successCallback) {
        var w, readyStateInterval, onload, onunload, checkreadystate;

        w = self.window;
        onload = function(e) {
            clearInterval(readyStateInterval);
            w.document.documentElement.tabIndex = 0;
            setTimeout(function() {
                w.focus();
            }, 0);
            $(w).unbind({
                'load': onload
            });
            _successCallback();
        };

        onunload = function(e) {
            $(w).unbind({
                'load': onload,
                'unload': onunload
            });
        };

        checkreadystate = function() {
            if ((w.document.readyState === 'complete' ||
                 w.document.readyState === 'loaded') &&
                w.location.href !== 'about:blank') {
                onload();
            }
        };

        if (w) {
            w.location = src;
        } else {
            if (kunit._hideTestWindow) {
                w = document.createElement('IFRAME');
                w.setAttribute('src', src);
                w.setAttribute('id', 'pageUnderTest');
                w.setAttribute('name', 'pageUnderTest');
                w.setAttribute('style', 'visibility: hidden');
                document.body.appendChild(w);
                w.document = w.contentDocument;
                w = w.contentWindow;
                self.window = w;
            } else {
                w = window.open(src, 'kunit');
                self.window = w;
            }
        }

        $(w).bind({
            'unload': onunload
        });
        if ('readyState' in w.document) {
            if ('onreadystatechange' in w.document &&
                !$.browser.webkit // In webkit document.onreadystatechange is
                                  // never triggered.
               ) {
                w.document.onreadystatechange = checkreadystate;
            } else {
                readyStateInterval = setInterval(function() {
                    if (!w.document) {
                        return;
                    }

                    checkreadystate();
                }, 200);
            }
        } else {
            $(w).bind({
                'load': onload
            });
        }
    };

    /**
     * @return {String} the type of an object
     */
    var _getType = function(obj) {
        return Object.prototype.toString.call(obj).match(/\[object (.+)\]/)[1];
    };

    return {
        '$': $.noConflict(),

        /**
         * Wrapper for Syn, with predefined context = self.window.document.body
         * {@link Syn} is a synthetic event generator
         * @see http://jupiterjs.com/news/syn-a-standalone-synthetic-event-library
         */
        'syn': (function() {
            var result = {};
            $.each(Syn, function(methodName, method) {
                if (typeof method === 'function') {
                    result[methodName] = function() {
                        var args = [];
                        $.each(arguments, function() {
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

        /**
         * The time (ms) between opening .
         * @attribute
         */
        'timeBetweenOpen': 100,

        /**
         * Open a new window / tab / iframe  where the testcase at src is run.
         * @param {String} src URL of testcase (js file)
         * @param {String} callback function to execute when loaded with success
         * @param {Number} timeout Time (ms) to wait before load fail error
         */
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
                'timeout': timeout || 5000
                //'timeoutCallback': function() {}
            });
        },

        /**
         * Type check an object.
         * @param {String} type The type/class (e.g. String, Array, Object)
         * @param {mixed} obj The object to check
         * @param {String} [msg] The information text for the assertion
         */
        is: function(type, obj, msg) {
            equal(_getType(obj), type, msg);
        }

    };
})(window, document, jQuery));

(function() {
    var unserialize, hash, script;
    unserialize = function(str){
        var obj = {}, chunks = str.split("&");
        kunit.$.each(chunks, function(key, value) {
            var spl = value.split("=");
            obj[spl[0]] = decodeURIComponent(spl[1]);
        });
        return obj;
    };
    hash = unserialize(window.location.search.slice(1));
    script = document.createElement('SCRIPT');
    script.setAttribute('src', hash.test);
    window.document.getElementsByTagName('head')[0].appendChild(script);

    kunit._hideTestWindow = hash.hidePage ? true : false;
})();
