// Polyfills for cross-browser compatibility

// Core-js stable polyfills
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Additional polyfills for older browsers
if (typeof window !== 'undefined') {
  // Polyfill for Element.prototype.closest (IE 11)
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
      var el = this;
      do {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }

  // Polyfill for Array.prototype.includes (IE 11)
  if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
      value: function(searchElement, fromIndex) {
        if (this == null) {
          throw new TypeError('"this" is null or not defined');
        }

        var o = Object(this);
        var len = o.length >>> 0;

        if (len === 0) {
          return false;
        }

        var n = fromIndex | 0;
        var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

        function sameValueZero(x, y) {
          return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
        }

        while (k < len) {
          if (sameValueZero(o[k], searchElement)) {
            return true;
          }
          k++;
        }

        return false;
      }
    });
  }

  // Polyfill for String.prototype.includes (IE 11)
  if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
      'use strict';
      if (typeof start !== 'number') {
        start = 0;
      }

      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }

  // Polyfill for Object.assign (IE 11)
  if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
      'use strict';
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      target = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source != null) {
          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key];
            }
          }
        }
      }
      return target;
    };
  }

  // Polyfill for Promise (IE 11)
  if (typeof Promise === 'undefined') {
    require('core-js/features/promise');
  }

  // Polyfill for fetch (IE 11)
  if (!window.fetch) {
    require('whatwg-fetch');
  }
}
