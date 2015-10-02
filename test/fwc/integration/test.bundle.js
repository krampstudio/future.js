(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;

var _import = require('./handlebars/base');

var base = _interopRequireWildcard(_import);

// Each of these augment the Handlebars object. No need to setup here.
// (This is done to easily share code between commonjs and browse envs)

var _SafeString = require('./handlebars/safe-string');

var _SafeString2 = _interopRequireWildcard(_SafeString);

var _Exception = require('./handlebars/exception');

var _Exception2 = _interopRequireWildcard(_Exception);

var _import2 = require('./handlebars/utils');

var Utils = _interopRequireWildcard(_import2);

var _import3 = require('./handlebars/runtime');

var runtime = _interopRequireWildcard(_import3);

var _noConflict = require('./handlebars/no-conflict');

var _noConflict2 = _interopRequireWildcard(_noConflict);

// For compatibility and usage outside of module systems, make the Handlebars object a namespace
function create() {
  var hb = new base.HandlebarsEnvironment();

  Utils.extend(hb, base);
  hb.SafeString = _SafeString2['default'];
  hb.Exception = _Exception2['default'];
  hb.Utils = Utils;
  hb.escapeExpression = Utils.escapeExpression;

  hb.VM = runtime;
  hb.template = function (spec) {
    return runtime.template(spec, hb);
  };

  return hb;
}

var inst = create();
inst.create = create;

_noConflict2['default'](inst);

inst['default'] = inst;

exports['default'] = inst;
module.exports = exports['default'];
},{"./handlebars/base":2,"./handlebars/exception":3,"./handlebars/no-conflict":4,"./handlebars/runtime":5,"./handlebars/safe-string":6,"./handlebars/utils":7}],2:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;
exports.HandlebarsEnvironment = HandlebarsEnvironment;
exports.createFrame = createFrame;

var _import = require('./utils');

var Utils = _interopRequireWildcard(_import);

var _Exception = require('./exception');

var _Exception2 = _interopRequireWildcard(_Exception);

var VERSION = '3.0.1';
exports.VERSION = VERSION;
var COMPILER_REVISION = 6;

exports.COMPILER_REVISION = COMPILER_REVISION;
var REVISION_CHANGES = {
  1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
  2: '== 1.0.0-rc.3',
  3: '== 1.0.0-rc.4',
  4: '== 1.x.x',
  5: '== 2.0.0-alpha.x',
  6: '>= 2.0.0-beta.1'
};

exports.REVISION_CHANGES = REVISION_CHANGES;
var isArray = Utils.isArray,
    isFunction = Utils.isFunction,
    toString = Utils.toString,
    objectType = '[object Object]';

function HandlebarsEnvironment(helpers, partials) {
  this.helpers = helpers || {};
  this.partials = partials || {};

  registerDefaultHelpers(this);
}

HandlebarsEnvironment.prototype = {
  constructor: HandlebarsEnvironment,

  logger: logger,
  log: log,

  registerHelper: function registerHelper(name, fn) {
    if (toString.call(name) === objectType) {
      if (fn) {
        throw new _Exception2['default']('Arg not supported with multiple helpers');
      }
      Utils.extend(this.helpers, name);
    } else {
      this.helpers[name] = fn;
    }
  },
  unregisterHelper: function unregisterHelper(name) {
    delete this.helpers[name];
  },

  registerPartial: function registerPartial(name, partial) {
    if (toString.call(name) === objectType) {
      Utils.extend(this.partials, name);
    } else {
      if (typeof partial === 'undefined') {
        throw new _Exception2['default']('Attempting to register a partial as undefined');
      }
      this.partials[name] = partial;
    }
  },
  unregisterPartial: function unregisterPartial(name) {
    delete this.partials[name];
  }
};

function registerDefaultHelpers(instance) {
  instance.registerHelper('helperMissing', function () {
    if (arguments.length === 1) {
      // A missing field in a {{foo}} constuct.
      return undefined;
    } else {
      // Someone is actually trying to call something, blow up.
      throw new _Exception2['default']('Missing helper: "' + arguments[arguments.length - 1].name + '"');
    }
  });

  instance.registerHelper('blockHelperMissing', function (context, options) {
    var inverse = options.inverse,
        fn = options.fn;

    if (context === true) {
      return fn(this);
    } else if (context === false || context == null) {
      return inverse(this);
    } else if (isArray(context)) {
      if (context.length > 0) {
        if (options.ids) {
          options.ids = [options.name];
        }

        return instance.helpers.each(context, options);
      } else {
        return inverse(this);
      }
    } else {
      if (options.data && options.ids) {
        var data = createFrame(options.data);
        data.contextPath = Utils.appendContextPath(options.data.contextPath, options.name);
        options = { data: data };
      }

      return fn(context, options);
    }
  });

  instance.registerHelper('each', function (context, options) {
    if (!options) {
      throw new _Exception2['default']('Must pass iterator to #each');
    }

    var fn = options.fn,
        inverse = options.inverse,
        i = 0,
        ret = '',
        data = undefined,
        contextPath = undefined;

    if (options.data && options.ids) {
      contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]) + '.';
    }

    if (isFunction(context)) {
      context = context.call(this);
    }

    if (options.data) {
      data = createFrame(options.data);
    }

    function execIteration(field, index, last) {
      if (data) {
        data.key = field;
        data.index = index;
        data.first = index === 0;
        data.last = !!last;

        if (contextPath) {
          data.contextPath = contextPath + field;
        }
      }

      ret = ret + fn(context[field], {
        data: data,
        blockParams: Utils.blockParams([context[field], field], [contextPath + field, null])
      });
    }

    if (context && typeof context === 'object') {
      if (isArray(context)) {
        for (var j = context.length; i < j; i++) {
          execIteration(i, i, i === context.length - 1);
        }
      } else {
        var priorKey = undefined;

        for (var key in context) {
          if (context.hasOwnProperty(key)) {
            // We're running the iterations one step out of sync so we can detect
            // the last iteration without have to scan the object twice and create
            // an itermediate keys array.
            if (priorKey) {
              execIteration(priorKey, i - 1);
            }
            priorKey = key;
            i++;
          }
        }
        if (priorKey) {
          execIteration(priorKey, i - 1, true);
        }
      }
    }

    if (i === 0) {
      ret = inverse(this);
    }

    return ret;
  });

  instance.registerHelper('if', function (conditional, options) {
    if (isFunction(conditional)) {
      conditional = conditional.call(this);
    }

    // Default behavior is to render the positive path if the value is truthy and not empty.
    // The `includeZero` option may be set to treat the condtional as purely not empty based on the
    // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
    if (!options.hash.includeZero && !conditional || Utils.isEmpty(conditional)) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  instance.registerHelper('unless', function (conditional, options) {
    return instance.helpers['if'].call(this, conditional, { fn: options.inverse, inverse: options.fn, hash: options.hash });
  });

  instance.registerHelper('with', function (context, options) {
    if (isFunction(context)) {
      context = context.call(this);
    }

    var fn = options.fn;

    if (!Utils.isEmpty(context)) {
      if (options.data && options.ids) {
        var data = createFrame(options.data);
        data.contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]);
        options = { data: data };
      }

      return fn(context, options);
    } else {
      return options.inverse(this);
    }
  });

  instance.registerHelper('log', function (message, options) {
    var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
    instance.log(level, message);
  });

  instance.registerHelper('lookup', function (obj, field) {
    return obj && obj[field];
  });
}

var logger = {
  methodMap: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },

  // State enum
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  level: 1,

  // Can be overridden in the host environment
  log: function log(level, message) {
    if (typeof console !== 'undefined' && logger.level <= level) {
      var method = logger.methodMap[level];
      (console[method] || console.log).call(console, message); // eslint-disable-line no-console
    }
  }
};

exports.logger = logger;
var log = logger.log;

exports.log = log;

function createFrame(object) {
  var frame = Utils.extend({}, object);
  frame._parent = object;
  return frame;
}

/* [args, ]options */
},{"./exception":3,"./utils":7}],3:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

function Exception(message, node) {
  var loc = node && node.loc,
      line = undefined,
      column = undefined;
  if (loc) {
    line = loc.start.line;
    column = loc.start.column;

    message += ' - ' + line + ':' + column;
  }

  var tmp = Error.prototype.constructor.call(this, message);

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, Exception);
  }

  if (loc) {
    this.lineNumber = line;
    this.column = column;
  }
}

Exception.prototype = new Error();

exports['default'] = Exception;
module.exports = exports['default'];
},{}],4:[function(require,module,exports){
(function (global){
'use strict';

exports.__esModule = true;
/*global window */

exports['default'] = function (Handlebars) {
  /* istanbul ignore next */
  var root = typeof global !== 'undefined' ? global : window,
      $Handlebars = root.Handlebars;
  /* istanbul ignore next */
  Handlebars.noConflict = function () {
    if (root.Handlebars === Handlebars) {
      root.Handlebars = $Handlebars;
    }
  };
};

module.exports = exports['default'];
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],5:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;
exports.checkRevision = checkRevision;

// TODO: Remove this line and break up compilePartial

exports.template = template;
exports.wrapProgram = wrapProgram;
exports.resolvePartial = resolvePartial;
exports.invokePartial = invokePartial;
exports.noop = noop;

var _import = require('./utils');

var Utils = _interopRequireWildcard(_import);

var _Exception = require('./exception');

var _Exception2 = _interopRequireWildcard(_Exception);

var _COMPILER_REVISION$REVISION_CHANGES$createFrame = require('./base');

function checkRevision(compilerInfo) {
  var compilerRevision = compilerInfo && compilerInfo[0] || 1,
      currentRevision = _COMPILER_REVISION$REVISION_CHANGES$createFrame.COMPILER_REVISION;

  if (compilerRevision !== currentRevision) {
    if (compilerRevision < currentRevision) {
      var runtimeVersions = _COMPILER_REVISION$REVISION_CHANGES$createFrame.REVISION_CHANGES[currentRevision],
          compilerVersions = _COMPILER_REVISION$REVISION_CHANGES$createFrame.REVISION_CHANGES[compilerRevision];
      throw new _Exception2['default']('Template was precompiled with an older version of Handlebars than the current runtime. ' + 'Please update your precompiler to a newer version (' + runtimeVersions + ') or downgrade your runtime to an older version (' + compilerVersions + ').');
    } else {
      // Use the embedded version info since the runtime doesn't know about this revision yet
      throw new _Exception2['default']('Template was precompiled with a newer version of Handlebars than the current runtime. ' + 'Please update your runtime to a newer version (' + compilerInfo[1] + ').');
    }
  }
}

function template(templateSpec, env) {
  /* istanbul ignore next */
  if (!env) {
    throw new _Exception2['default']('No environment passed to template');
  }
  if (!templateSpec || !templateSpec.main) {
    throw new _Exception2['default']('Unknown template object: ' + typeof templateSpec);
  }

  // Note: Using env.VM references rather than local var references throughout this section to allow
  // for external users to override these as psuedo-supported APIs.
  env.VM.checkRevision(templateSpec.compiler);

  function invokePartialWrapper(partial, context, options) {
    if (options.hash) {
      context = Utils.extend({}, context, options.hash);
    }

    partial = env.VM.resolvePartial.call(this, partial, context, options);
    var result = env.VM.invokePartial.call(this, partial, context, options);

    if (result == null && env.compile) {
      options.partials[options.name] = env.compile(partial, templateSpec.compilerOptions, env);
      result = options.partials[options.name](context, options);
    }
    if (result != null) {
      if (options.indent) {
        var lines = result.split('\n');
        for (var i = 0, l = lines.length; i < l; i++) {
          if (!lines[i] && i + 1 === l) {
            break;
          }

          lines[i] = options.indent + lines[i];
        }
        result = lines.join('\n');
      }
      return result;
    } else {
      throw new _Exception2['default']('The partial ' + options.name + ' could not be compiled when running in runtime-only mode');
    }
  }

  // Just add water
  var container = {
    strict: function strict(obj, name) {
      if (!(name in obj)) {
        throw new _Exception2['default']('"' + name + '" not defined in ' + obj);
      }
      return obj[name];
    },
    lookup: function lookup(depths, name) {
      var len = depths.length;
      for (var i = 0; i < len; i++) {
        if (depths[i] && depths[i][name] != null) {
          return depths[i][name];
        }
      }
    },
    lambda: function lambda(current, context) {
      return typeof current === 'function' ? current.call(context) : current;
    },

    escapeExpression: Utils.escapeExpression,
    invokePartial: invokePartialWrapper,

    fn: function fn(i) {
      return templateSpec[i];
    },

    programs: [],
    program: function program(i, data, declaredBlockParams, blockParams, depths) {
      var programWrapper = this.programs[i],
          fn = this.fn(i);
      if (data || depths || blockParams || declaredBlockParams) {
        programWrapper = wrapProgram(this, i, fn, data, declaredBlockParams, blockParams, depths);
      } else if (!programWrapper) {
        programWrapper = this.programs[i] = wrapProgram(this, i, fn);
      }
      return programWrapper;
    },

    data: function data(value, depth) {
      while (value && depth--) {
        value = value._parent;
      }
      return value;
    },
    merge: function merge(param, common) {
      var obj = param || common;

      if (param && common && param !== common) {
        obj = Utils.extend({}, common, param);
      }

      return obj;
    },

    noop: env.VM.noop,
    compilerInfo: templateSpec.compiler
  };

  function ret(context) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    var data = options.data;

    ret._setup(options);
    if (!options.partial && templateSpec.useData) {
      data = initData(context, data);
    }
    var depths = undefined,
        blockParams = templateSpec.useBlockParams ? [] : undefined;
    if (templateSpec.useDepths) {
      depths = options.depths ? [context].concat(options.depths) : [context];
    }

    return templateSpec.main.call(container, context, container.helpers, container.partials, data, blockParams, depths);
  }
  ret.isTop = true;

  ret._setup = function (options) {
    if (!options.partial) {
      container.helpers = container.merge(options.helpers, env.helpers);

      if (templateSpec.usePartial) {
        container.partials = container.merge(options.partials, env.partials);
      }
    } else {
      container.helpers = options.helpers;
      container.partials = options.partials;
    }
  };

  ret._child = function (i, data, blockParams, depths) {
    if (templateSpec.useBlockParams && !blockParams) {
      throw new _Exception2['default']('must pass block params');
    }
    if (templateSpec.useDepths && !depths) {
      throw new _Exception2['default']('must pass parent depths');
    }

    return wrapProgram(container, i, templateSpec[i], data, 0, blockParams, depths);
  };
  return ret;
}

function wrapProgram(container, i, fn, data, declaredBlockParams, blockParams, depths) {
  function prog(context) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    return fn.call(container, context, container.helpers, container.partials, options.data || data, blockParams && [options.blockParams].concat(blockParams), depths && [context].concat(depths));
  }
  prog.program = i;
  prog.depth = depths ? depths.length : 0;
  prog.blockParams = declaredBlockParams || 0;
  return prog;
}

function resolvePartial(partial, context, options) {
  if (!partial) {
    partial = options.partials[options.name];
  } else if (!partial.call && !options.name) {
    // This is a dynamic partial that returned a string
    options.name = partial;
    partial = options.partials[partial];
  }
  return partial;
}

function invokePartial(partial, context, options) {
  options.partial = true;

  if (partial === undefined) {
    throw new _Exception2['default']('The partial ' + options.name + ' could not be found');
  } else if (partial instanceof Function) {
    return partial(context, options);
  }
}

function noop() {
  return '';
}

function initData(context, data) {
  if (!data || !('root' in data)) {
    data = data ? _COMPILER_REVISION$REVISION_CHANGES$createFrame.createFrame(data) : {};
    data.root = context;
  }
  return data;
}
},{"./base":2,"./exception":3,"./utils":7}],6:[function(require,module,exports){
'use strict';

exports.__esModule = true;
// Build out our basic SafeString type
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = SafeString.prototype.toHTML = function () {
  return '' + this.string;
};

exports['default'] = SafeString;
module.exports = exports['default'];
},{}],7:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.extend = extend;

// Older IE versions do not directly support indexOf so we must implement our own, sadly.
exports.indexOf = indexOf;
exports.escapeExpression = escapeExpression;
exports.isEmpty = isEmpty;
exports.blockParams = blockParams;
exports.appendContextPath = appendContextPath;
var escape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#x27;',
  '`': '&#x60;'
};

var badChars = /[&<>"'`]/g,
    possible = /[&<>"'`]/;

function escapeChar(chr) {
  return escape[chr];
}

function extend(obj /* , ...source */) {
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key];
      }
    }
  }

  return obj;
}

var toString = Object.prototype.toString;

exports.toString = toString;
// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
/*eslint-disable func-style, no-var */
var isFunction = function isFunction(value) {
  return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
/* istanbul ignore next */
if (isFunction(/x/)) {
  exports.isFunction = isFunction = function (value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
var isFunction;
exports.isFunction = isFunction;
/*eslint-enable func-style, no-var */

/* istanbul ignore next */
var isArray = Array.isArray || function (value) {
  return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
};exports.isArray = isArray;

function indexOf(array, value) {
  for (var i = 0, len = array.length; i < len; i++) {
    if (array[i] === value) {
      return i;
    }
  }
  return -1;
}

function escapeExpression(string) {
  if (typeof string !== 'string') {
    // don't escape SafeStrings, since they're already safe
    if (string && string.toHTML) {
      return string.toHTML();
    } else if (string == null) {
      return '';
    } else if (!string) {
      return string + '';
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = '' + string;
  }

  if (!possible.test(string)) {
    return string;
  }
  return string.replace(badChars, escapeChar);
}

function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}

function blockParams(params, ids) {
  params.path = ids;
  return params;
}

function appendContextPath(contextPath, id) {
  return (contextPath ? contextPath + '.' : '') + id;
}
},{}],8:[function(require,module,exports){
// Create a simple path alias to allow browserify to resolve
// the runtime on a supported path.
module.exports = require('./dist/cjs/handlebars.runtime')['default'];

},{"./dist/cjs/handlebars.runtime":1}],9:[function(require,module,exports){
module.exports = require("handlebars/runtime")["default"];

},{"handlebars/runtime":8}],10:[function(require,module,exports){
/*!
 * QUnit 1.19.0
 * http://qunitjs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2015-09-01T15:00Z
 */

(function( global ) {

var QUnit = {};

var Date = global.Date;
var now = Date.now || function() {
	return new Date().getTime();
};

var setTimeout = global.setTimeout;
var clearTimeout = global.clearTimeout;

// Store a local window from the global to allow direct references.
var window = global.window;

var defined = {
	document: window && window.document !== undefined,
	setTimeout: setTimeout !== undefined,
	sessionStorage: (function() {
		var x = "qunit-test-string";
		try {
			sessionStorage.setItem( x, x );
			sessionStorage.removeItem( x );
			return true;
		} catch ( e ) {
			return false;
		}
	}() )
};

var fileName = ( sourceFromStacktrace( 0 ) || "" ).replace( /(:\d+)+\)?/, "" ).replace( /.+\//, "" );
var globalStartCalled = false;
var runStarted = false;

var toString = Object.prototype.toString,
	hasOwn = Object.prototype.hasOwnProperty;

// returns a new Array with the elements that are in a but not in b
function diff( a, b ) {
	var i, j,
		result = a.slice();

	for ( i = 0; i < result.length; i++ ) {
		for ( j = 0; j < b.length; j++ ) {
			if ( result[ i ] === b[ j ] ) {
				result.splice( i, 1 );
				i--;
				break;
			}
		}
	}
	return result;
}

// from jquery.js
function inArray( elem, array ) {
	if ( array.indexOf ) {
		return array.indexOf( elem );
	}

	for ( var i = 0, length = array.length; i < length; i++ ) {
		if ( array[ i ] === elem ) {
			return i;
		}
	}

	return -1;
}

/**
 * Makes a clone of an object using only Array or Object as base,
 * and copies over the own enumerable properties.
 *
 * @param {Object} obj
 * @return {Object} New object with only the own properties (recursively).
 */
function objectValues ( obj ) {
	var key, val,
		vals = QUnit.is( "array", obj ) ? [] : {};
	for ( key in obj ) {
		if ( hasOwn.call( obj, key ) ) {
			val = obj[ key ];
			vals[ key ] = val === Object( val ) ? objectValues( val ) : val;
		}
	}
	return vals;
}

function extend( a, b, undefOnly ) {
	for ( var prop in b ) {
		if ( hasOwn.call( b, prop ) ) {

			// Avoid "Member not found" error in IE8 caused by messing with window.constructor
			// This block runs on every environment, so `global` is being used instead of `window`
			// to avoid errors on node.
			if ( prop !== "constructor" || a !== global ) {
				if ( b[ prop ] === undefined ) {
					delete a[ prop ];
				} else if ( !( undefOnly && typeof a[ prop ] !== "undefined" ) ) {
					a[ prop ] = b[ prop ];
				}
			}
		}
	}

	return a;
}

function objectType( obj ) {
	if ( typeof obj === "undefined" ) {
		return "undefined";
	}

	// Consider: typeof null === object
	if ( obj === null ) {
		return "null";
	}

	var match = toString.call( obj ).match( /^\[object\s(.*)\]$/ ),
		type = match && match[ 1 ] || "";

	switch ( type ) {
		case "Number":
			if ( isNaN( obj ) ) {
				return "nan";
			}
			return "number";
		case "String":
		case "Boolean":
		case "Array":
		case "Set":
		case "Map":
		case "Date":
		case "RegExp":
		case "Function":
			return type.toLowerCase();
	}
	if ( typeof obj === "object" ) {
		return "object";
	}
	return undefined;
}

// Safe object type checking
function is( type, obj ) {
	return QUnit.objectType( obj ) === type;
}

var getUrlParams = function() {
	var i, current;
	var urlParams = {};
	var location = window.location;
	var params = location.search.slice( 1 ).split( "&" );
	var length = params.length;

	if ( params[ 0 ] ) {
		for ( i = 0; i < length; i++ ) {
			current = params[ i ].split( "=" );
			current[ 0 ] = decodeURIComponent( current[ 0 ] );

			// allow just a key to turn on a flag, e.g., test.html?noglobals
			current[ 1 ] = current[ 1 ] ? decodeURIComponent( current[ 1 ] ) : true;
			if ( urlParams[ current[ 0 ] ] ) {
				urlParams[ current[ 0 ] ] = [].concat( urlParams[ current[ 0 ] ], current[ 1 ] );
			} else {
				urlParams[ current[ 0 ] ] = current[ 1 ];
			}
		}
	}

	return urlParams;
};

// Doesn't support IE6 to IE9, it will return undefined on these browsers
// See also https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error/Stack
function extractStacktrace( e, offset ) {
	offset = offset === undefined ? 4 : offset;

	var stack, include, i;

	if ( e.stack ) {
		stack = e.stack.split( "\n" );
		if ( /^error$/i.test( stack[ 0 ] ) ) {
			stack.shift();
		}
		if ( fileName ) {
			include = [];
			for ( i = offset; i < stack.length; i++ ) {
				if ( stack[ i ].indexOf( fileName ) !== -1 ) {
					break;
				}
				include.push( stack[ i ] );
			}
			if ( include.length ) {
				return include.join( "\n" );
			}
		}
		return stack[ offset ];

	// Support: Safari <=6 only
	} else if ( e.sourceURL ) {

		// exclude useless self-reference for generated Error objects
		if ( /qunit.js$/.test( e.sourceURL ) ) {
			return;
		}

		// for actual exceptions, this is useful
		return e.sourceURL + ":" + e.line;
	}
}

function sourceFromStacktrace( offset ) {
	var error = new Error();

	// Support: Safari <=7 only, IE <=10 - 11 only
	// Not all browsers generate the `stack` property for `new Error()`, see also #636
	if ( !error.stack ) {
		try {
			throw error;
		} catch ( err ) {
			error = err;
		}
	}

	return extractStacktrace( error, offset );
}

/**
 * Config object: Maintain internal state
 * Later exposed as QUnit.config
 * `config` initialized at top of scope
 */
var config = {
	// The queue of tests to run
	queue: [],

	// block until document ready
	blocking: true,

	// by default, run previously failed tests first
	// very useful in combination with "Hide passed tests" checked
	reorder: true,

	// by default, modify document.title when suite is done
	altertitle: true,

	// by default, scroll to top of the page when suite is done
	scrolltop: true,

	// depth up-to which object will be dumped
	maxDepth: 5,

	// when enabled, all tests must call expect()
	requireExpects: false,

	// add checkboxes that are persisted in the query-string
	// when enabled, the id is set to `true` as a `QUnit.config` property
	urlConfig: [
		{
			id: "hidepassed",
			label: "Hide passed tests",
			tooltip: "Only show tests and assertions that fail. Stored as query-strings."
		},
		{
			id: "noglobals",
			label: "Check for Globals",
			tooltip: "Enabling this will test if any test introduces new properties on the " +
				"global object (`window` in Browsers). Stored as query-strings."
		},
		{
			id: "notrycatch",
			label: "No try-catch",
			tooltip: "Enabling this will run tests outside of a try-catch block. Makes debugging " +
				"exceptions in IE reasonable. Stored as query-strings."
		}
	],

	// Set of all modules.
	modules: [],

	// The first unnamed module
	currentModule: {
		name: "",
		tests: []
	},

	callbacks: {}
};

var urlParams = defined.document ? getUrlParams() : {};

// Push a loose unnamed module to the modules collection
config.modules.push( config.currentModule );

if ( urlParams.filter === true ) {
	delete urlParams.filter;
}

// String search anywhere in moduleName+testName
config.filter = urlParams.filter;

config.testId = [];
if ( urlParams.testId ) {
	// Ensure that urlParams.testId is an array
	urlParams.testId = decodeURIComponent( urlParams.testId ).split( "," );
	for (var i = 0; i < urlParams.testId.length; i++ ) {
		config.testId.push( urlParams.testId[ i ] );
	}
}

var loggingCallbacks = {};

// Register logging callbacks
function registerLoggingCallbacks( obj ) {
	var i, l, key,
		callbackNames = [ "begin", "done", "log", "testStart", "testDone",
			"moduleStart", "moduleDone" ];

	function registerLoggingCallback( key ) {
		var loggingCallback = function( callback ) {
			if ( objectType( callback ) !== "function" ) {
				throw new Error(
					"QUnit logging methods require a callback function as their first parameters."
				);
			}

			config.callbacks[ key ].push( callback );
		};

		// DEPRECATED: This will be removed on QUnit 2.0.0+
		// Stores the registered functions allowing restoring
		// at verifyLoggingCallbacks() if modified
		loggingCallbacks[ key ] = loggingCallback;

		return loggingCallback;
	}

	for ( i = 0, l = callbackNames.length; i < l; i++ ) {
		key = callbackNames[ i ];

		// Initialize key collection of logging callback
		if ( objectType( config.callbacks[ key ] ) === "undefined" ) {
			config.callbacks[ key ] = [];
		}

		obj[ key ] = registerLoggingCallback( key );
	}
}

function runLoggingCallbacks( key, args ) {
	var i, l, callbacks;

	callbacks = config.callbacks[ key ];
	for ( i = 0, l = callbacks.length; i < l; i++ ) {
		callbacks[ i ]( args );
	}
}

// DEPRECATED: This will be removed on 2.0.0+
// This function verifies if the loggingCallbacks were modified by the user
// If so, it will restore it, assign the given callback and print a console warning
function verifyLoggingCallbacks() {
	var loggingCallback, userCallback;

	for ( loggingCallback in loggingCallbacks ) {
		if ( QUnit[ loggingCallback ] !== loggingCallbacks[ loggingCallback ] ) {

			userCallback = QUnit[ loggingCallback ];

			// Restore the callback function
			QUnit[ loggingCallback ] = loggingCallbacks[ loggingCallback ];

			// Assign the deprecated given callback
			QUnit[ loggingCallback ]( userCallback );

			if ( global.console && global.console.warn ) {
				global.console.warn(
					"QUnit." + loggingCallback + " was replaced with a new value.\n" +
					"Please, check out the documentation on how to apply logging callbacks.\n" +
					"Reference: http://api.qunitjs.com/category/callbacks/"
				);
			}
		}
	}
}

( function() {
	if ( !defined.document ) {
		return;
	}

	// `onErrorFnPrev` initialized at top of scope
	// Preserve other handlers
	var onErrorFnPrev = window.onerror;

	// Cover uncaught exceptions
	// Returning true will suppress the default browser handler,
	// returning false will let it run.
	window.onerror = function( error, filePath, linerNr ) {
		var ret = false;
		if ( onErrorFnPrev ) {
			ret = onErrorFnPrev( error, filePath, linerNr );
		}

		// Treat return value as window.onerror itself does,
		// Only do our handling if not suppressed.
		if ( ret !== true ) {
			if ( QUnit.config.current ) {
				if ( QUnit.config.current.ignoreGlobalErrors ) {
					return true;
				}
				QUnit.pushFailure( error, filePath + ":" + linerNr );
			} else {
				QUnit.test( "global failure", extend(function() {
					QUnit.pushFailure( error, filePath + ":" + linerNr );
				}, { validTest: true } ) );
			}
			return false;
		}

		return ret;
	};
} )();

QUnit.urlParams = urlParams;

// Figure out if we're running the tests from a server or not
QUnit.isLocal = !( defined.document && window.location.protocol !== "file:" );

// Expose the current QUnit version
QUnit.version = "1.19.0";

extend( QUnit, {

	// call on start of module test to prepend name to all tests
	module: function( name, testEnvironment ) {
		var currentModule = {
			name: name,
			testEnvironment: testEnvironment,
			tests: []
		};

		// DEPRECATED: handles setup/teardown functions,
		// beforeEach and afterEach should be used instead
		if ( testEnvironment && testEnvironment.setup ) {
			testEnvironment.beforeEach = testEnvironment.setup;
			delete testEnvironment.setup;
		}
		if ( testEnvironment && testEnvironment.teardown ) {
			testEnvironment.afterEach = testEnvironment.teardown;
			delete testEnvironment.teardown;
		}

		config.modules.push( currentModule );
		config.currentModule = currentModule;
	},

	// DEPRECATED: QUnit.asyncTest() will be removed in QUnit 2.0.
	asyncTest: asyncTest,

	test: test,

	skip: skip,

	// DEPRECATED: The functionality of QUnit.start() will be altered in QUnit 2.0.
	// In QUnit 2.0, invoking it will ONLY affect the `QUnit.config.autostart` blocking behavior.
	start: function( count ) {
		var globalStartAlreadyCalled = globalStartCalled;

		if ( !config.current ) {
			globalStartCalled = true;

			if ( runStarted ) {
				throw new Error( "Called start() outside of a test context while already started" );
			} else if ( globalStartAlreadyCalled || count > 1 ) {
				throw new Error( "Called start() outside of a test context too many times" );
			} else if ( config.autostart ) {
				throw new Error( "Called start() outside of a test context when " +
					"QUnit.config.autostart was true" );
			} else if ( !config.pageLoaded ) {

				// The page isn't completely loaded yet, so bail out and let `QUnit.load` handle it
				config.autostart = true;
				return;
			}
		} else {

			// If a test is running, adjust its semaphore
			config.current.semaphore -= count || 1;

			// Don't start until equal number of stop-calls
			if ( config.current.semaphore > 0 ) {
				return;
			}

			// throw an Error if start is called more often than stop
			if ( config.current.semaphore < 0 ) {
				config.current.semaphore = 0;

				QUnit.pushFailure(
					"Called start() while already started (test's semaphore was 0 already)",
					sourceFromStacktrace( 2 )
				);
				return;
			}
		}

		resumeProcessing();
	},

	// DEPRECATED: QUnit.stop() will be removed in QUnit 2.0.
	stop: function( count ) {

		// If there isn't a test running, don't allow QUnit.stop() to be called
		if ( !config.current ) {
			throw new Error( "Called stop() outside of a test context" );
		}

		// If a test is running, adjust its semaphore
		config.current.semaphore += count || 1;

		pauseProcessing();
	},

	config: config,

	is: is,

	objectType: objectType,

	extend: extend,

	load: function() {
		config.pageLoaded = true;

		// Initialize the configuration options
		extend( config, {
			stats: { all: 0, bad: 0 },
			moduleStats: { all: 0, bad: 0 },
			started: 0,
			updateRate: 1000,
			autostart: true,
			filter: ""
		}, true );

		config.blocking = false;

		if ( config.autostart ) {
			resumeProcessing();
		}
	},

	stack: function( offset ) {
		offset = ( offset || 0 ) + 2;
		return sourceFromStacktrace( offset );
	}
});

registerLoggingCallbacks( QUnit );

function begin() {
	var i, l,
		modulesLog = [];

	// If the test run hasn't officially begun yet
	if ( !config.started ) {

		// Record the time of the test run's beginning
		config.started = now();

		verifyLoggingCallbacks();

		// Delete the loose unnamed module if unused.
		if ( config.modules[ 0 ].name === "" && config.modules[ 0 ].tests.length === 0 ) {
			config.modules.shift();
		}

		// Avoid unnecessary information by not logging modules' test environments
		for ( i = 0, l = config.modules.length; i < l; i++ ) {
			modulesLog.push({
				name: config.modules[ i ].name,
				tests: config.modules[ i ].tests
			});
		}

		// The test run is officially beginning now
		runLoggingCallbacks( "begin", {
			totalTests: Test.count,
			modules: modulesLog
		});
	}

	config.blocking = false;
	process( true );
}

function process( last ) {
	function next() {
		process( last );
	}
	var start = now();
	config.depth = ( config.depth || 0 ) + 1;

	while ( config.queue.length && !config.blocking ) {
		if ( !defined.setTimeout || config.updateRate <= 0 ||
				( ( now() - start ) < config.updateRate ) ) {
			if ( config.current ) {

				// Reset async tracking for each phase of the Test lifecycle
				config.current.usedAsync = false;
			}
			config.queue.shift()();
		} else {
			setTimeout( next, 13 );
			break;
		}
	}
	config.depth--;
	if ( last && !config.blocking && !config.queue.length && config.depth === 0 ) {
		done();
	}
}

function pauseProcessing() {
	config.blocking = true;

	if ( config.testTimeout && defined.setTimeout ) {
		clearTimeout( config.timeout );
		config.timeout = setTimeout(function() {
			if ( config.current ) {
				config.current.semaphore = 0;
				QUnit.pushFailure( "Test timed out", sourceFromStacktrace( 2 ) );
			} else {
				throw new Error( "Test timed out" );
			}
			resumeProcessing();
		}, config.testTimeout );
	}
}

function resumeProcessing() {
	runStarted = true;

	// A slight delay to allow this iteration of the event loop to finish (more assertions, etc.)
	if ( defined.setTimeout ) {
		setTimeout(function() {
			if ( config.current && config.current.semaphore > 0 ) {
				return;
			}
			if ( config.timeout ) {
				clearTimeout( config.timeout );
			}

			begin();
		}, 13 );
	} else {
		begin();
	}
}

function done() {
	var runtime, passed;

	config.autorun = true;

	// Log the last module results
	if ( config.previousModule ) {
		runLoggingCallbacks( "moduleDone", {
			name: config.previousModule.name,
			tests: config.previousModule.tests,
			failed: config.moduleStats.bad,
			passed: config.moduleStats.all - config.moduleStats.bad,
			total: config.moduleStats.all,
			runtime: now() - config.moduleStats.started
		});
	}
	delete config.previousModule;

	runtime = now() - config.started;
	passed = config.stats.all - config.stats.bad;

	runLoggingCallbacks( "done", {
		failed: config.stats.bad,
		passed: passed,
		total: config.stats.all,
		runtime: runtime
	});
}

function Test( settings ) {
	var i, l;

	++Test.count;

	extend( this, settings );
	this.assertions = [];
	this.semaphore = 0;
	this.usedAsync = false;
	this.module = config.currentModule;
	this.stack = sourceFromStacktrace( 3 );

	// Register unique strings
	for ( i = 0, l = this.module.tests; i < l.length; i++ ) {
		if ( this.module.tests[ i ].name === this.testName ) {
			this.testName += " ";
		}
	}

	this.testId = generateHash( this.module.name, this.testName );

	this.module.tests.push({
		name: this.testName,
		testId: this.testId
	});

	if ( settings.skip ) {

		// Skipped tests will fully ignore any sent callback
		this.callback = function() {};
		this.async = false;
		this.expected = 0;
	} else {
		this.assert = new Assert( this );
	}
}

Test.count = 0;

Test.prototype = {
	before: function() {
		if (

			// Emit moduleStart when we're switching from one module to another
			this.module !== config.previousModule ||

				// They could be equal (both undefined) but if the previousModule property doesn't
				// yet exist it means this is the first test in a suite that isn't wrapped in a
				// module, in which case we'll just emit a moduleStart event for 'undefined'.
				// Without this, reporters can get testStart before moduleStart  which is a problem.
				!hasOwn.call( config, "previousModule" )
		) {
			if ( hasOwn.call( config, "previousModule" ) ) {
				runLoggingCallbacks( "moduleDone", {
					name: config.previousModule.name,
					tests: config.previousModule.tests,
					failed: config.moduleStats.bad,
					passed: config.moduleStats.all - config.moduleStats.bad,
					total: config.moduleStats.all,
					runtime: now() - config.moduleStats.started
				});
			}
			config.previousModule = this.module;
			config.moduleStats = { all: 0, bad: 0, started: now() };
			runLoggingCallbacks( "moduleStart", {
				name: this.module.name,
				tests: this.module.tests
			});
		}

		config.current = this;

		if ( this.module.testEnvironment ) {
			delete this.module.testEnvironment.beforeEach;
			delete this.module.testEnvironment.afterEach;
		}
		this.testEnvironment = extend( {}, this.module.testEnvironment );

		this.started = now();
		runLoggingCallbacks( "testStart", {
			name: this.testName,
			module: this.module.name,
			testId: this.testId
		});

		if ( !config.pollution ) {
			saveGlobal();
		}
	},

	run: function() {
		var promise;

		config.current = this;

		if ( this.async ) {
			QUnit.stop();
		}

		this.callbackStarted = now();

		if ( config.notrycatch ) {
			promise = this.callback.call( this.testEnvironment, this.assert );
			this.resolvePromise( promise );
			return;
		}

		try {
			promise = this.callback.call( this.testEnvironment, this.assert );
			this.resolvePromise( promise );
		} catch ( e ) {
			this.pushFailure( "Died on test #" + ( this.assertions.length + 1 ) + " " +
				this.stack + ": " + ( e.message || e ), extractStacktrace( e, 0 ) );

			// else next test will carry the responsibility
			saveGlobal();

			// Restart the tests if they're blocking
			if ( config.blocking ) {
				QUnit.start();
			}
		}
	},

	after: function() {
		checkPollution();
	},

	queueHook: function( hook, hookName ) {
		var promise,
			test = this;
		return function runHook() {
			config.current = test;
			if ( config.notrycatch ) {
				promise = hook.call( test.testEnvironment, test.assert );
				test.resolvePromise( promise, hookName );
				return;
			}
			try {
				promise = hook.call( test.testEnvironment, test.assert );
				test.resolvePromise( promise, hookName );
			} catch ( error ) {
				test.pushFailure( hookName + " failed on " + test.testName + ": " +
					( error.message || error ), extractStacktrace( error, 0 ) );
			}
		};
	},

	// Currently only used for module level hooks, can be used to add global level ones
	hooks: function( handler ) {
		var hooks = [];

		// Hooks are ignored on skipped tests
		if ( this.skip ) {
			return hooks;
		}

		if ( this.module.testEnvironment &&
				QUnit.objectType( this.module.testEnvironment[ handler ] ) === "function" ) {
			hooks.push( this.queueHook( this.module.testEnvironment[ handler ], handler ) );
		}

		return hooks;
	},

	finish: function() {
		config.current = this;
		if ( config.requireExpects && this.expected === null ) {
			this.pushFailure( "Expected number of assertions to be defined, but expect() was " +
				"not called.", this.stack );
		} else if ( this.expected !== null && this.expected !== this.assertions.length ) {
			this.pushFailure( "Expected " + this.expected + " assertions, but " +
				this.assertions.length + " were run", this.stack );
		} else if ( this.expected === null && !this.assertions.length ) {
			this.pushFailure( "Expected at least one assertion, but none were run - call " +
				"expect(0) to accept zero assertions.", this.stack );
		}

		var i,
			bad = 0;

		this.runtime = now() - this.started;
		config.stats.all += this.assertions.length;
		config.moduleStats.all += this.assertions.length;

		for ( i = 0; i < this.assertions.length; i++ ) {
			if ( !this.assertions[ i ].result ) {
				bad++;
				config.stats.bad++;
				config.moduleStats.bad++;
			}
		}

		runLoggingCallbacks( "testDone", {
			name: this.testName,
			module: this.module.name,
			skipped: !!this.skip,
			failed: bad,
			passed: this.assertions.length - bad,
			total: this.assertions.length,
			runtime: this.runtime,

			// HTML Reporter use
			assertions: this.assertions,
			testId: this.testId,

			// Source of Test
			source: this.stack,

			// DEPRECATED: this property will be removed in 2.0.0, use runtime instead
			duration: this.runtime
		});

		// QUnit.reset() is deprecated and will be replaced for a new
		// fixture reset function on QUnit 2.0/2.1.
		// It's still called here for backwards compatibility handling
		QUnit.reset();

		config.current = undefined;
	},

	queue: function() {
		var bad,
			test = this;

		if ( !this.valid() ) {
			return;
		}

		function run() {

			// each of these can by async
			synchronize([
				function() {
					test.before();
				},

				test.hooks( "beforeEach" ),

				function() {
					test.run();
				},

				test.hooks( "afterEach" ).reverse(),

				function() {
					test.after();
				},
				function() {
					test.finish();
				}
			]);
		}

		// `bad` initialized at top of scope
		// defer when previous test run passed, if storage is available
		bad = QUnit.config.reorder && defined.sessionStorage &&
				+sessionStorage.getItem( "qunit-test-" + this.module.name + "-" + this.testName );

		if ( bad ) {
			run();
		} else {
			synchronize( run, true );
		}
	},

	push: function( result, actual, expected, message, negative ) {
		var source,
			details = {
				module: this.module.name,
				name: this.testName,
				result: result,
				message: message,
				actual: actual,
				expected: expected,
				testId: this.testId,
				negative: negative || false,
				runtime: now() - this.started
			};

		if ( !result ) {
			source = sourceFromStacktrace();

			if ( source ) {
				details.source = source;
			}
		}

		runLoggingCallbacks( "log", details );

		this.assertions.push({
			result: !!result,
			message: message
		});
	},

	pushFailure: function( message, source, actual ) {
		if ( !( this instanceof Test ) ) {
			throw new Error( "pushFailure() assertion outside test context, was " +
				sourceFromStacktrace( 2 ) );
		}

		var details = {
				module: this.module.name,
				name: this.testName,
				result: false,
				message: message || "error",
				actual: actual || null,
				testId: this.testId,
				runtime: now() - this.started
			};

		if ( source ) {
			details.source = source;
		}

		runLoggingCallbacks( "log", details );

		this.assertions.push({
			result: false,
			message: message
		});
	},

	resolvePromise: function( promise, phase ) {
		var then, message,
			test = this;
		if ( promise != null ) {
			then = promise.then;
			if ( QUnit.objectType( then ) === "function" ) {
				QUnit.stop();
				then.call(
					promise,
					function() { QUnit.start(); },
					function( error ) {
						message = "Promise rejected " +
							( !phase ? "during" : phase.replace( /Each$/, "" ) ) +
							" " + test.testName + ": " + ( error.message || error );
						test.pushFailure( message, extractStacktrace( error, 0 ) );

						// else next test will carry the responsibility
						saveGlobal();

						// Unblock
						QUnit.start();
					}
				);
			}
		}
	},

	valid: function() {
		var include,
			filter = config.filter && config.filter.toLowerCase(),
			module = QUnit.urlParams.module && QUnit.urlParams.module.toLowerCase(),
			fullName = ( this.module.name + ": " + this.testName ).toLowerCase();

		// Internally-generated tests are always valid
		if ( this.callback && this.callback.validTest ) {
			return true;
		}

		if ( config.testId.length > 0 && inArray( this.testId, config.testId ) < 0 ) {
			return false;
		}

		if ( module && ( !this.module.name || this.module.name.toLowerCase() !== module ) ) {
			return false;
		}

		if ( !filter ) {
			return true;
		}

		include = filter.charAt( 0 ) !== "!";
		if ( !include ) {
			filter = filter.slice( 1 );
		}

		// If the filter matches, we need to honour include
		if ( fullName.indexOf( filter ) !== -1 ) {
			return include;
		}

		// Otherwise, do the opposite
		return !include;
	}

};

// Resets the test setup. Useful for tests that modify the DOM.
/*
DEPRECATED: Use multiple tests instead of resetting inside a test.
Use testStart or testDone for custom cleanup.
This method will throw an error in 2.0, and will be removed in 2.1
*/
QUnit.reset = function() {

	// Return on non-browser environments
	// This is necessary to not break on node tests
	if ( !defined.document ) {
		return;
	}

	var fixture = defined.document && document.getElementById &&
			document.getElementById( "qunit-fixture" );

	if ( fixture ) {
		fixture.innerHTML = config.fixture;
	}
};

QUnit.pushFailure = function() {
	if ( !QUnit.config.current ) {
		throw new Error( "pushFailure() assertion outside test context, in " +
			sourceFromStacktrace( 2 ) );
	}

	// Gets current test obj
	var currentTest = QUnit.config.current;

	return currentTest.pushFailure.apply( currentTest, arguments );
};

// Based on Java's String.hashCode, a simple but not
// rigorously collision resistant hashing function
function generateHash( module, testName ) {
	var hex,
		i = 0,
		hash = 0,
		str = module + "\x1C" + testName,
		len = str.length;

	for ( ; i < len; i++ ) {
		hash  = ( ( hash << 5 ) - hash ) + str.charCodeAt( i );
		hash |= 0;
	}

	// Convert the possibly negative integer hash code into an 8 character hex string, which isn't
	// strictly necessary but increases user understanding that the id is a SHA-like hash
	hex = ( 0x100000000 + hash ).toString( 16 );
	if ( hex.length < 8 ) {
		hex = "0000000" + hex;
	}

	return hex.slice( -8 );
}

function synchronize( callback, last ) {
	if ( QUnit.objectType( callback ) === "array" ) {
		while ( callback.length ) {
			synchronize( callback.shift() );
		}
		return;
	}
	config.queue.push( callback );

	if ( config.autorun && !config.blocking ) {
		process( last );
	}
}

function saveGlobal() {
	config.pollution = [];

	if ( config.noglobals ) {
		for ( var key in global ) {
			if ( hasOwn.call( global, key ) ) {

				// in Opera sometimes DOM element ids show up here, ignore them
				if ( /^qunit-test-output/.test( key ) ) {
					continue;
				}
				config.pollution.push( key );
			}
		}
	}
}

function checkPollution() {
	var newGlobals,
		deletedGlobals,
		old = config.pollution;

	saveGlobal();

	newGlobals = diff( config.pollution, old );
	if ( newGlobals.length > 0 ) {
		QUnit.pushFailure( "Introduced global variable(s): " + newGlobals.join( ", " ) );
	}

	deletedGlobals = diff( old, config.pollution );
	if ( deletedGlobals.length > 0 ) {
		QUnit.pushFailure( "Deleted global variable(s): " + deletedGlobals.join( ", " ) );
	}
}

// Will be exposed as QUnit.asyncTest
function asyncTest( testName, expected, callback ) {
	if ( arguments.length === 2 ) {
		callback = expected;
		expected = null;
	}

	QUnit.test( testName, expected, callback, true );
}

// Will be exposed as QUnit.test
function test( testName, expected, callback, async ) {
	var newTest;

	if ( arguments.length === 2 ) {
		callback = expected;
		expected = null;
	}

	newTest = new Test({
		testName: testName,
		expected: expected,
		async: async,
		callback: callback
	});

	newTest.queue();
}

// Will be exposed as QUnit.skip
function skip( testName ) {
	var test = new Test({
		testName: testName,
		skip: true
	});

	test.queue();
}

function Assert( testContext ) {
	this.test = testContext;
}

// Assert helpers
QUnit.assert = Assert.prototype = {

	// Specify the number of expected assertions to guarantee that failed test
	// (no assertions are run at all) don't slip through.
	expect: function( asserts ) {
		if ( arguments.length === 1 ) {
			this.test.expected = asserts;
		} else {
			return this.test.expected;
		}
	},

	// Increment this Test's semaphore counter, then return a single-use function that
	// decrements that counter a maximum of once.
	async: function() {
		var test = this.test,
			popped = false;

		test.semaphore += 1;
		test.usedAsync = true;
		pauseProcessing();

		return function done() {
			if ( !popped ) {
				test.semaphore -= 1;
				popped = true;
				resumeProcessing();
			} else {
				test.pushFailure( "Called the callback returned from `assert.async` more than once",
					sourceFromStacktrace( 2 ) );
			}
		};
	},

	// Exports test.push() to the user API
	push: function( /* result, actual, expected, message, negative */ ) {
		var assert = this,
			currentTest = ( assert instanceof Assert && assert.test ) || QUnit.config.current;

		// Backwards compatibility fix.
		// Allows the direct use of global exported assertions and QUnit.assert.*
		// Although, it's use is not recommended as it can leak assertions
		// to other tests from async tests, because we only get a reference to the current test,
		// not exactly the test where assertion were intended to be called.
		if ( !currentTest ) {
			throw new Error( "assertion outside test context, in " + sourceFromStacktrace( 2 ) );
		}

		if ( currentTest.usedAsync === true && currentTest.semaphore === 0 ) {
			currentTest.pushFailure( "Assertion after the final `assert.async` was resolved",
				sourceFromStacktrace( 2 ) );

			// Allow this assertion to continue running anyway...
		}

		if ( !( assert instanceof Assert ) ) {
			assert = currentTest.assert;
		}
		return assert.test.push.apply( assert.test, arguments );
	},

	ok: function( result, message ) {
		message = message || ( result ? "okay" : "failed, expected argument to be truthy, was: " +
			QUnit.dump.parse( result ) );
		this.push( !!result, result, true, message );
	},

	notOk: function( result, message ) {
		message = message || ( !result ? "okay" : "failed, expected argument to be falsy, was: " +
			QUnit.dump.parse( result ) );
		this.push( !result, result, false, message, true );
	},

	equal: function( actual, expected, message ) {
		/*jshint eqeqeq:false */
		this.push( expected == actual, actual, expected, message );
	},

	notEqual: function( actual, expected, message ) {
		/*jshint eqeqeq:false */
		this.push( expected != actual, actual, expected, message, true );
	},

	propEqual: function( actual, expected, message ) {
		actual = objectValues( actual );
		expected = objectValues( expected );
		this.push( QUnit.equiv( actual, expected ), actual, expected, message );
	},

	notPropEqual: function( actual, expected, message ) {
		actual = objectValues( actual );
		expected = objectValues( expected );
		this.push( !QUnit.equiv( actual, expected ), actual, expected, message, true );
	},

	deepEqual: function( actual, expected, message ) {
		this.push( QUnit.equiv( actual, expected ), actual, expected, message );
	},

	notDeepEqual: function( actual, expected, message ) {
		this.push( !QUnit.equiv( actual, expected ), actual, expected, message, true );
	},

	strictEqual: function( actual, expected, message ) {
		this.push( expected === actual, actual, expected, message );
	},

	notStrictEqual: function( actual, expected, message ) {
		this.push( expected !== actual, actual, expected, message, true );
	},

	"throws": function( block, expected, message ) {
		var actual, expectedType,
			expectedOutput = expected,
			ok = false,
			currentTest = ( this instanceof Assert && this.test ) || QUnit.config.current;

		// 'expected' is optional unless doing string comparison
		if ( message == null && typeof expected === "string" ) {
			message = expected;
			expected = null;
		}

		currentTest.ignoreGlobalErrors = true;
		try {
			block.call( currentTest.testEnvironment );
		} catch (e) {
			actual = e;
		}
		currentTest.ignoreGlobalErrors = false;

		if ( actual ) {
			expectedType = QUnit.objectType( expected );

			// we don't want to validate thrown error
			if ( !expected ) {
				ok = true;
				expectedOutput = null;

			// expected is a regexp
			} else if ( expectedType === "regexp" ) {
				ok = expected.test( errorString( actual ) );

			// expected is a string
			} else if ( expectedType === "string" ) {
				ok = expected === errorString( actual );

			// expected is a constructor, maybe an Error constructor
			} else if ( expectedType === "function" && actual instanceof expected ) {
				ok = true;

			// expected is an Error object
			} else if ( expectedType === "object" ) {
				ok = actual instanceof expected.constructor &&
					actual.name === expected.name &&
					actual.message === expected.message;

			// expected is a validation function which returns true if validation passed
			} else if ( expectedType === "function" && expected.call( {}, actual ) === true ) {
				expectedOutput = null;
				ok = true;
			}
		}

		currentTest.assert.push( ok, actual, expectedOutput, message );
	}
};

// Provide an alternative to assert.throws(), for enviroments that consider throws a reserved word
// Known to us are: Closure Compiler, Narwhal
(function() {
	/*jshint sub:true */
	Assert.prototype.raises = Assert.prototype[ "throws" ];
}());

function errorString( error ) {
	var name, message,
		resultErrorString = error.toString();
	if ( resultErrorString.substring( 0, 7 ) === "[object" ) {
		name = error.name ? error.name.toString() : "Error";
		message = error.message ? error.message.toString() : "";
		if ( name && message ) {
			return name + ": " + message;
		} else if ( name ) {
			return name;
		} else if ( message ) {
			return message;
		} else {
			return "Error";
		}
	} else {
		return resultErrorString;
	}
}

// Test for equality any JavaScript type.
// Author: Philippe Rathé <prathe@gmail.com>
QUnit.equiv = (function() {

	// Call the o related callback with the given arguments.
	function bindCallbacks( o, callbacks, args ) {
		var prop = QUnit.objectType( o );
		if ( prop ) {
			if ( QUnit.objectType( callbacks[ prop ] ) === "function" ) {
				return callbacks[ prop ].apply( callbacks, args );
			} else {
				return callbacks[ prop ]; // or undefined
			}
		}
	}

	// the real equiv function
	var innerEquiv,

		// stack to decide between skip/abort functions
		callers = [],

		// stack to avoiding loops from circular referencing
		parents = [],
		parentsB = [],

		getProto = Object.getPrototypeOf || function( obj ) {
			/* jshint camelcase: false, proto: true */
			return obj.__proto__;
		},
		callbacks = (function() {

			// for string, boolean, number and null
			function useStrictEquality( b, a ) {

				/*jshint eqeqeq:false */
				if ( b instanceof a.constructor || a instanceof b.constructor ) {

					// to catch short annotation VS 'new' annotation of a
					// declaration
					// e.g. var i = 1;
					// var j = new Number(1);
					return a == b;
				} else {
					return a === b;
				}
			}

			return {
				"string": useStrictEquality,
				"boolean": useStrictEquality,
				"number": useStrictEquality,
				"null": useStrictEquality,
				"undefined": useStrictEquality,

				"nan": function( b ) {
					return isNaN( b );
				},

				"date": function( b, a ) {
					return QUnit.objectType( b ) === "date" && a.valueOf() === b.valueOf();
				},

				"regexp": function( b, a ) {
					return QUnit.objectType( b ) === "regexp" &&

						// the regex itself
						a.source === b.source &&

						// and its modifiers
						a.global === b.global &&

						// (gmi) ...
						a.ignoreCase === b.ignoreCase &&
						a.multiline === b.multiline &&
						a.sticky === b.sticky;
				},

				// - skip when the property is a method of an instance (OOP)
				// - abort otherwise,
				// initial === would have catch identical references anyway
				"function": function() {
					var caller = callers[ callers.length - 1 ];
					return caller !== Object && typeof caller !== "undefined";
				},

				"array": function( b, a ) {
					var i, j, len, loop, aCircular, bCircular;

					// b could be an object literal here
					if ( QUnit.objectType( b ) !== "array" ) {
						return false;
					}

					len = a.length;
					if ( len !== b.length ) {
						// safe and faster
						return false;
					}

					// track reference to avoid circular references
					parents.push( a );
					parentsB.push( b );
					for ( i = 0; i < len; i++ ) {
						loop = false;
						for ( j = 0; j < parents.length; j++ ) {
							aCircular = parents[ j ] === a[ i ];
							bCircular = parentsB[ j ] === b[ i ];
							if ( aCircular || bCircular ) {
								if ( a[ i ] === b[ i ] || aCircular && bCircular ) {
									loop = true;
								} else {
									parents.pop();
									parentsB.pop();
									return false;
								}
							}
						}
						if ( !loop && !innerEquiv( a[ i ], b[ i ] ) ) {
							parents.pop();
							parentsB.pop();
							return false;
						}
					}
					parents.pop();
					parentsB.pop();
					return true;
				},

				"set": function( b, a ) {
					var aArray, bArray;

					// b could be any object here
					if ( QUnit.objectType( b ) !== "set" ) {
						return false;
					}

					aArray = [];
					a.forEach( function( v ) {
						aArray.push( v );
					});
					bArray = [];
					b.forEach( function( v ) {
						bArray.push( v );
					});

					return innerEquiv( bArray, aArray );
				},

				"map": function( b, a ) {
					var aArray, bArray;

					// b could be any object here
					if ( QUnit.objectType( b ) !== "map" ) {
						return false;
					}

					aArray = [];
					a.forEach( function( v, k ) {
						aArray.push( [ k, v ] );
					});
					bArray = [];
					b.forEach( function( v, k ) {
						bArray.push( [ k, v ] );
					});

					return innerEquiv( bArray, aArray );
				},

				"object": function( b, a ) {

					/*jshint forin:false */
					var i, j, loop, aCircular, bCircular,
						// Default to true
						eq = true,
						aProperties = [],
						bProperties = [];

					// comparing constructors is more strict than using
					// instanceof
					if ( a.constructor !== b.constructor ) {

						// Allow objects with no prototype to be equivalent to
						// objects with Object as their constructor.
						if ( !( ( getProto( a ) === null && getProto( b ) === Object.prototype ) ||
							( getProto( b ) === null && getProto( a ) === Object.prototype ) ) ) {
							return false;
						}
					}

					// stack constructor before traversing properties
					callers.push( a.constructor );

					// track reference to avoid circular references
					parents.push( a );
					parentsB.push( b );

					// be strict: don't ensure hasOwnProperty and go deep
					for ( i in a ) {
						loop = false;
						for ( j = 0; j < parents.length; j++ ) {
							aCircular = parents[ j ] === a[ i ];
							bCircular = parentsB[ j ] === b[ i ];
							if ( aCircular || bCircular ) {
								if ( a[ i ] === b[ i ] || aCircular && bCircular ) {
									loop = true;
								} else {
									eq = false;
									break;
								}
							}
						}
						aProperties.push( i );
						if ( !loop && !innerEquiv( a[ i ], b[ i ] ) ) {
							eq = false;
							break;
						}
					}

					parents.pop();
					parentsB.pop();
					callers.pop(); // unstack, we are done

					for ( i in b ) {
						bProperties.push( i ); // collect b's properties
					}

					// Ensures identical properties name
					return eq && innerEquiv( aProperties.sort(), bProperties.sort() );
				}
			};
		}());

	innerEquiv = function() { // can take multiple arguments
		var args = [].slice.apply( arguments );
		if ( args.length < 2 ) {
			return true; // end transition
		}

		return ( (function( a, b ) {
			if ( a === b ) {
				return true; // catch the most you can
			} else if ( a === null || b === null || typeof a === "undefined" ||
					typeof b === "undefined" ||
					QUnit.objectType( a ) !== QUnit.objectType( b ) ) {

				// don't lose time with error prone cases
				return false;
			} else {
				return bindCallbacks( a, callbacks, [ b, a ] );
			}

			// apply transition with (1..n) arguments
		}( args[ 0 ], args[ 1 ] ) ) &&
			innerEquiv.apply( this, args.splice( 1, args.length - 1 ) ) );
	};

	return innerEquiv;
}());

// Based on jsDump by Ariel Flesler
// http://flesler.blogspot.com/2008/05/jsdump-pretty-dump-of-any-javascript.html
QUnit.dump = (function() {
	function quote( str ) {
		return "\"" + str.toString().replace( /\\/g, "\\\\" ).replace( /"/g, "\\\"" ) + "\"";
	}
	function literal( o ) {
		return o + "";
	}
	function join( pre, arr, post ) {
		var s = dump.separator(),
			base = dump.indent(),
			inner = dump.indent( 1 );
		if ( arr.join ) {
			arr = arr.join( "," + s + inner );
		}
		if ( !arr ) {
			return pre + post;
		}
		return [ pre, inner + arr, base + post ].join( s );
	}
	function array( arr, stack ) {
		var i = arr.length,
			ret = new Array( i );

		if ( dump.maxDepth && dump.depth > dump.maxDepth ) {
			return "[object Array]";
		}

		this.up();
		while ( i-- ) {
			ret[ i ] = this.parse( arr[ i ], undefined, stack );
		}
		this.down();
		return join( "[", ret, "]" );
	}

	var reName = /^function (\w+)/,
		dump = {

			// objType is used mostly internally, you can fix a (custom) type in advance
			parse: function( obj, objType, stack ) {
				stack = stack || [];
				var res, parser, parserType,
					inStack = inArray( obj, stack );

				if ( inStack !== -1 ) {
					return "recursion(" + ( inStack - stack.length ) + ")";
				}

				objType = objType || this.typeOf( obj  );
				parser = this.parsers[ objType ];
				parserType = typeof parser;

				if ( parserType === "function" ) {
					stack.push( obj );
					res = parser.call( this, obj, stack );
					stack.pop();
					return res;
				}
				return ( parserType === "string" ) ? parser : this.parsers.error;
			},
			typeOf: function( obj ) {
				var type;
				if ( obj === null ) {
					type = "null";
				} else if ( typeof obj === "undefined" ) {
					type = "undefined";
				} else if ( QUnit.is( "regexp", obj ) ) {
					type = "regexp";
				} else if ( QUnit.is( "date", obj ) ) {
					type = "date";
				} else if ( QUnit.is( "function", obj ) ) {
					type = "function";
				} else if ( obj.setInterval !== undefined &&
						obj.document !== undefined &&
						obj.nodeType === undefined ) {
					type = "window";
				} else if ( obj.nodeType === 9 ) {
					type = "document";
				} else if ( obj.nodeType ) {
					type = "node";
				} else if (

					// native arrays
					toString.call( obj ) === "[object Array]" ||

					// NodeList objects
					( typeof obj.length === "number" && obj.item !== undefined &&
					( obj.length ? obj.item( 0 ) === obj[ 0 ] : ( obj.item( 0 ) === null &&
					obj[ 0 ] === undefined ) ) )
				) {
					type = "array";
				} else if ( obj.constructor === Error.prototype.constructor ) {
					type = "error";
				} else {
					type = typeof obj;
				}
				return type;
			},
			separator: function() {
				return this.multiline ? this.HTML ? "<br />" : "\n" : this.HTML ? "&#160;" : " ";
			},
			// extra can be a number, shortcut for increasing-calling-decreasing
			indent: function( extra ) {
				if ( !this.multiline ) {
					return "";
				}
				var chr = this.indentChar;
				if ( this.HTML ) {
					chr = chr.replace( /\t/g, "   " ).replace( / /g, "&#160;" );
				}
				return new Array( this.depth + ( extra || 0 ) ).join( chr );
			},
			up: function( a ) {
				this.depth += a || 1;
			},
			down: function( a ) {
				this.depth -= a || 1;
			},
			setParser: function( name, parser ) {
				this.parsers[ name ] = parser;
			},
			// The next 3 are exposed so you can use them
			quote: quote,
			literal: literal,
			join: join,
			//
			depth: 1,
			maxDepth: QUnit.config.maxDepth,

			// This is the list of parsers, to modify them, use dump.setParser
			parsers: {
				window: "[Window]",
				document: "[Document]",
				error: function( error ) {
					return "Error(\"" + error.message + "\")";
				},
				unknown: "[Unknown]",
				"null": "null",
				"undefined": "undefined",
				"function": function( fn ) {
					var ret = "function",

						// functions never have name in IE
						name = "name" in fn ? fn.name : ( reName.exec( fn ) || [] )[ 1 ];

					if ( name ) {
						ret += " " + name;
					}
					ret += "( ";

					ret = [ ret, dump.parse( fn, "functionArgs" ), "){" ].join( "" );
					return join( ret, dump.parse( fn, "functionCode" ), "}" );
				},
				array: array,
				nodelist: array,
				"arguments": array,
				object: function( map, stack ) {
					var keys, key, val, i, nonEnumerableProperties,
						ret = [];

					if ( dump.maxDepth && dump.depth > dump.maxDepth ) {
						return "[object Object]";
					}

					dump.up();
					keys = [];
					for ( key in map ) {
						keys.push( key );
					}

					// Some properties are not always enumerable on Error objects.
					nonEnumerableProperties = [ "message", "name" ];
					for ( i in nonEnumerableProperties ) {
						key = nonEnumerableProperties[ i ];
						if ( key in map && inArray( key, keys ) < 0 ) {
							keys.push( key );
						}
					}
					keys.sort();
					for ( i = 0; i < keys.length; i++ ) {
						key = keys[ i ];
						val = map[ key ];
						ret.push( dump.parse( key, "key" ) + ": " +
							dump.parse( val, undefined, stack ) );
					}
					dump.down();
					return join( "{", ret, "}" );
				},
				node: function( node ) {
					var len, i, val,
						open = dump.HTML ? "&lt;" : "<",
						close = dump.HTML ? "&gt;" : ">",
						tag = node.nodeName.toLowerCase(),
						ret = open + tag,
						attrs = node.attributes;

					if ( attrs ) {
						for ( i = 0, len = attrs.length; i < len; i++ ) {
							val = attrs[ i ].nodeValue;

							// IE6 includes all attributes in .attributes, even ones not explicitly
							// set. Those have values like undefined, null, 0, false, "" or
							// "inherit".
							if ( val && val !== "inherit" ) {
								ret += " " + attrs[ i ].nodeName + "=" +
									dump.parse( val, "attribute" );
							}
						}
					}
					ret += close;

					// Show content of TextNode or CDATASection
					if ( node.nodeType === 3 || node.nodeType === 4 ) {
						ret += node.nodeValue;
					}

					return ret + open + "/" + tag + close;
				},

				// function calls it internally, it's the arguments part of the function
				functionArgs: function( fn ) {
					var args,
						l = fn.length;

					if ( !l ) {
						return "";
					}

					args = new Array( l );
					while ( l-- ) {

						// 97 is 'a'
						args[ l ] = String.fromCharCode( 97 + l );
					}
					return " " + args.join( ", " ) + " ";
				},
				// object calls it internally, the key part of an item in a map
				key: quote,
				// function calls it internally, it's the content of the function
				functionCode: "[code]",
				// node calls it internally, it's an html attribute value
				attribute: quote,
				string: quote,
				date: quote,
				regexp: literal,
				number: literal,
				"boolean": literal
			},
			// if true, entities are escaped ( <, >, \t, space and \n )
			HTML: false,
			// indentation unit
			indentChar: "  ",
			// if true, items in a collection, are separated by a \n, else just a space.
			multiline: true
		};

	return dump;
}());

// back compat
QUnit.jsDump = QUnit.dump;

// For browser, export only select globals
if ( defined.document ) {

	// Deprecated
	// Extend assert methods to QUnit and Global scope through Backwards compatibility
	(function() {
		var i,
			assertions = Assert.prototype;

		function applyCurrent( current ) {
			return function() {
				var assert = new Assert( QUnit.config.current );
				current.apply( assert, arguments );
			};
		}

		for ( i in assertions ) {
			QUnit[ i ] = applyCurrent( assertions[ i ] );
		}
	})();

	(function() {
		var i, l,
			keys = [
				"test",
				"module",
				"expect",
				"asyncTest",
				"start",
				"stop",
				"ok",
				"notOk",
				"equal",
				"notEqual",
				"propEqual",
				"notPropEqual",
				"deepEqual",
				"notDeepEqual",
				"strictEqual",
				"notStrictEqual",
				"throws"
			];

		for ( i = 0, l = keys.length; i < l; i++ ) {
			window[ keys[ i ] ] = QUnit[ keys[ i ] ];
		}
	})();

	window.QUnit = QUnit;
}

// For nodejs
if ( typeof module !== "undefined" && module && module.exports ) {
	module.exports = QUnit;

	// For consistency with CommonJS environments' exports
	module.exports.QUnit = QUnit;
}

// For CommonJS with exports, but without module.exports, like Rhino
if ( typeof exports !== "undefined" && exports ) {
	exports.QUnit = QUnit;
}

if ( typeof define === "function" && define.amd ) {
	define( function() {
		return QUnit;
	} );
	QUnit.config.autostart = false;
}

/*
 * This file is a modified version of google-diff-match-patch's JavaScript implementation
 * (https://code.google.com/p/google-diff-match-patch/source/browse/trunk/javascript/diff_match_patch_uncompressed.js),
 * modifications are licensed as more fully set forth in LICENSE.txt.
 *
 * The original source of google-diff-match-patch is attributable and licensed as follows:
 *
 * Copyright 2006 Google Inc.
 * http://code.google.com/p/google-diff-match-patch/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * More Info:
 *  https://code.google.com/p/google-diff-match-patch/
 *
 * Usage: QUnit.diff(expected, actual)
 *
 */
QUnit.diff = ( function() {
	function DiffMatchPatch() {
	}

	//  DIFF FUNCTIONS

	/**
	 * The data structure representing a diff is an array of tuples:
	 * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
	 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
	 */
	var DIFF_DELETE = -1,
		DIFF_INSERT = 1,
		DIFF_EQUAL = 0;

	/**
	 * Find the differences between two texts.  Simplifies the problem by stripping
	 * any common prefix or suffix off the texts before diffing.
	 * @param {string} text1 Old string to be diffed.
	 * @param {string} text2 New string to be diffed.
	 * @param {boolean=} optChecklines Optional speedup flag. If present and false,
	 *     then don't run a line-level diff first to identify the changed areas.
	 *     Defaults to true, which does a faster, slightly less optimal diff.
	 * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
	 */
	DiffMatchPatch.prototype.DiffMain = function( text1, text2, optChecklines ) {
		var deadline, checklines, commonlength,
			commonprefix, commonsuffix, diffs;

		// The diff must be complete in up to 1 second.
		deadline = ( new Date() ).getTime() + 1000;

		// Check for null inputs.
		if ( text1 === null || text2 === null ) {
			throw new Error( "Null input. (DiffMain)" );
		}

		// Check for equality (speedup).
		if ( text1 === text2 ) {
			if ( text1 ) {
				return [
					[ DIFF_EQUAL, text1 ]
				];
			}
			return [];
		}

		if ( typeof optChecklines === "undefined" ) {
			optChecklines = true;
		}

		checklines = optChecklines;

		// Trim off common prefix (speedup).
		commonlength = this.diffCommonPrefix( text1, text2 );
		commonprefix = text1.substring( 0, commonlength );
		text1 = text1.substring( commonlength );
		text2 = text2.substring( commonlength );

		// Trim off common suffix (speedup).
		commonlength = this.diffCommonSuffix( text1, text2 );
		commonsuffix = text1.substring( text1.length - commonlength );
		text1 = text1.substring( 0, text1.length - commonlength );
		text2 = text2.substring( 0, text2.length - commonlength );

		// Compute the diff on the middle block.
		diffs = this.diffCompute( text1, text2, checklines, deadline );

		// Restore the prefix and suffix.
		if ( commonprefix ) {
			diffs.unshift( [ DIFF_EQUAL, commonprefix ] );
		}
		if ( commonsuffix ) {
			diffs.push( [ DIFF_EQUAL, commonsuffix ] );
		}
		this.diffCleanupMerge( diffs );
		return diffs;
	};

	/**
	 * Reduce the number of edits by eliminating operationally trivial equalities.
	 * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
	 */
	DiffMatchPatch.prototype.diffCleanupEfficiency = function( diffs ) {
		var changes, equalities, equalitiesLength, lastequality,
			pointer, preIns, preDel, postIns, postDel;
		changes = false;
		equalities = []; // Stack of indices where equalities are found.
		equalitiesLength = 0; // Keeping our own length var is faster in JS.
		/** @type {?string} */
		lastequality = null;
		// Always equal to diffs[equalities[equalitiesLength - 1]][1]
		pointer = 0; // Index of current position.
		// Is there an insertion operation before the last equality.
		preIns = false;
		// Is there a deletion operation before the last equality.
		preDel = false;
		// Is there an insertion operation after the last equality.
		postIns = false;
		// Is there a deletion operation after the last equality.
		postDel = false;
		while ( pointer < diffs.length ) {

			// Equality found.
			if ( diffs[ pointer ][ 0 ] === DIFF_EQUAL ) {
				if ( diffs[ pointer ][ 1 ].length < 4 && ( postIns || postDel ) ) {

					// Candidate found.
					equalities[ equalitiesLength++ ] = pointer;
					preIns = postIns;
					preDel = postDel;
					lastequality = diffs[ pointer ][ 1 ];
				} else {

					// Not a candidate, and can never become one.
					equalitiesLength = 0;
					lastequality = null;
				}
				postIns = postDel = false;

			// An insertion or deletion.
			} else {

				if ( diffs[ pointer ][ 0 ] === DIFF_DELETE ) {
					postDel = true;
				} else {
					postIns = true;
				}

				/*
				 * Five types to be split:
				 * <ins>A</ins><del>B</del>XY<ins>C</ins><del>D</del>
				 * <ins>A</ins>X<ins>C</ins><del>D</del>
				 * <ins>A</ins><del>B</del>X<ins>C</ins>
				 * <ins>A</del>X<ins>C</ins><del>D</del>
				 * <ins>A</ins><del>B</del>X<del>C</del>
				 */
				if ( lastequality && ( ( preIns && preDel && postIns && postDel ) ||
						( ( lastequality.length < 2 ) &&
						( preIns + preDel + postIns + postDel ) === 3 ) ) ) {

					// Duplicate record.
					diffs.splice(
						equalities[ equalitiesLength - 1 ],
						0,
						[ DIFF_DELETE, lastequality ]
					);

					// Change second copy to insert.
					diffs[ equalities[ equalitiesLength - 1 ] + 1 ][ 0 ] = DIFF_INSERT;
					equalitiesLength--; // Throw away the equality we just deleted;
					lastequality = null;
					if ( preIns && preDel ) {
						// No changes made which could affect previous entry, keep going.
						postIns = postDel = true;
						equalitiesLength = 0;
					} else {
						equalitiesLength--; // Throw away the previous equality.
						pointer = equalitiesLength > 0 ? equalities[ equalitiesLength - 1 ] : -1;
						postIns = postDel = false;
					}
					changes = true;
				}
			}
			pointer++;
		}

		if ( changes ) {
			this.diffCleanupMerge( diffs );
		}
	};

	/**
	 * Convert a diff array into a pretty HTML report.
	 * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
	 * @param {integer} string to be beautified.
	 * @return {string} HTML representation.
	 */
	DiffMatchPatch.prototype.diffPrettyHtml = function( diffs ) {
		var op, data, x,
			html = [];
		for ( x = 0; x < diffs.length; x++ ) {
			op = diffs[ x ][ 0 ]; // Operation (insert, delete, equal)
			data = diffs[ x ][ 1 ]; // Text of change.
			switch ( op ) {
			case DIFF_INSERT:
				html[ x ] = "<ins>" + data + "</ins>";
				break;
			case DIFF_DELETE:
				html[ x ] = "<del>" + data + "</del>";
				break;
			case DIFF_EQUAL:
				html[ x ] = "<span>" + data + "</span>";
				break;
			}
		}
		return html.join( "" );
	};

	/**
	 * Determine the common prefix of two strings.
	 * @param {string} text1 First string.
	 * @param {string} text2 Second string.
	 * @return {number} The number of characters common to the start of each
	 *     string.
	 */
	DiffMatchPatch.prototype.diffCommonPrefix = function( text1, text2 ) {
		var pointermid, pointermax, pointermin, pointerstart;
		// Quick check for common null cases.
		if ( !text1 || !text2 || text1.charAt( 0 ) !== text2.charAt( 0 ) ) {
			return 0;
		}
		// Binary search.
		// Performance analysis: http://neil.fraser.name/news/2007/10/09/
		pointermin = 0;
		pointermax = Math.min( text1.length, text2.length );
		pointermid = pointermax;
		pointerstart = 0;
		while ( pointermin < pointermid ) {
			if ( text1.substring( pointerstart, pointermid ) ===
					text2.substring( pointerstart, pointermid ) ) {
				pointermin = pointermid;
				pointerstart = pointermin;
			} else {
				pointermax = pointermid;
			}
			pointermid = Math.floor( ( pointermax - pointermin ) / 2 + pointermin );
		}
		return pointermid;
	};

	/**
	 * Determine the common suffix of two strings.
	 * @param {string} text1 First string.
	 * @param {string} text2 Second string.
	 * @return {number} The number of characters common to the end of each string.
	 */
	DiffMatchPatch.prototype.diffCommonSuffix = function( text1, text2 ) {
		var pointermid, pointermax, pointermin, pointerend;
		// Quick check for common null cases.
		if ( !text1 ||
				!text2 ||
				text1.charAt( text1.length - 1 ) !== text2.charAt( text2.length - 1 ) ) {
			return 0;
		}
		// Binary search.
		// Performance analysis: http://neil.fraser.name/news/2007/10/09/
		pointermin = 0;
		pointermax = Math.min( text1.length, text2.length );
		pointermid = pointermax;
		pointerend = 0;
		while ( pointermin < pointermid ) {
			if ( text1.substring( text1.length - pointermid, text1.length - pointerend ) ===
					text2.substring( text2.length - pointermid, text2.length - pointerend ) ) {
				pointermin = pointermid;
				pointerend = pointermin;
			} else {
				pointermax = pointermid;
			}
			pointermid = Math.floor( ( pointermax - pointermin ) / 2 + pointermin );
		}
		return pointermid;
	};

	/**
	 * Find the differences between two texts.  Assumes that the texts do not
	 * have any common prefix or suffix.
	 * @param {string} text1 Old string to be diffed.
	 * @param {string} text2 New string to be diffed.
	 * @param {boolean} checklines Speedup flag.  If false, then don't run a
	 *     line-level diff first to identify the changed areas.
	 *     If true, then run a faster, slightly less optimal diff.
	 * @param {number} deadline Time when the diff should be complete by.
	 * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
	 * @private
	 */
	DiffMatchPatch.prototype.diffCompute = function( text1, text2, checklines, deadline ) {
		var diffs, longtext, shorttext, i, hm,
			text1A, text2A, text1B, text2B,
			midCommon, diffsA, diffsB;

		if ( !text1 ) {
			// Just add some text (speedup).
			return [
				[ DIFF_INSERT, text2 ]
			];
		}

		if ( !text2 ) {
			// Just delete some text (speedup).
			return [
				[ DIFF_DELETE, text1 ]
			];
		}

		longtext = text1.length > text2.length ? text1 : text2;
		shorttext = text1.length > text2.length ? text2 : text1;
		i = longtext.indexOf( shorttext );
		if ( i !== -1 ) {
			// Shorter text is inside the longer text (speedup).
			diffs = [
				[ DIFF_INSERT, longtext.substring( 0, i ) ],
				[ DIFF_EQUAL, shorttext ],
				[ DIFF_INSERT, longtext.substring( i + shorttext.length ) ]
			];
			// Swap insertions for deletions if diff is reversed.
			if ( text1.length > text2.length ) {
				diffs[ 0 ][ 0 ] = diffs[ 2 ][ 0 ] = DIFF_DELETE;
			}
			return diffs;
		}

		if ( shorttext.length === 1 ) {
			// Single character string.
			// After the previous speedup, the character can't be an equality.
			return [
				[ DIFF_DELETE, text1 ],
				[ DIFF_INSERT, text2 ]
			];
		}

		// Check to see if the problem can be split in two.
		hm = this.diffHalfMatch( text1, text2 );
		if ( hm ) {
			// A half-match was found, sort out the return data.
			text1A = hm[ 0 ];
			text1B = hm[ 1 ];
			text2A = hm[ 2 ];
			text2B = hm[ 3 ];
			midCommon = hm[ 4 ];
			// Send both pairs off for separate processing.
			diffsA = this.DiffMain( text1A, text2A, checklines, deadline );
			diffsB = this.DiffMain( text1B, text2B, checklines, deadline );
			// Merge the results.
			return diffsA.concat( [
				[ DIFF_EQUAL, midCommon ]
			], diffsB );
		}

		if ( checklines && text1.length > 100 && text2.length > 100 ) {
			return this.diffLineMode( text1, text2, deadline );
		}

		return this.diffBisect( text1, text2, deadline );
	};

	/**
	 * Do the two texts share a substring which is at least half the length of the
	 * longer text?
	 * This speedup can produce non-minimal diffs.
	 * @param {string} text1 First string.
	 * @param {string} text2 Second string.
	 * @return {Array.<string>} Five element Array, containing the prefix of
	 *     text1, the suffix of text1, the prefix of text2, the suffix of
	 *     text2 and the common middle.  Or null if there was no match.
	 * @private
	 */
	DiffMatchPatch.prototype.diffHalfMatch = function( text1, text2 ) {
		var longtext, shorttext, dmp,
			text1A, text2B, text2A, text1B, midCommon,
			hm1, hm2, hm;

		longtext = text1.length > text2.length ? text1 : text2;
		shorttext = text1.length > text2.length ? text2 : text1;
		if ( longtext.length < 4 || shorttext.length * 2 < longtext.length ) {
			return null; // Pointless.
		}
		dmp = this; // 'this' becomes 'window' in a closure.

		/**
		 * Does a substring of shorttext exist within longtext such that the substring
		 * is at least half the length of longtext?
		 * Closure, but does not reference any external variables.
		 * @param {string} longtext Longer string.
		 * @param {string} shorttext Shorter string.
		 * @param {number} i Start index of quarter length substring within longtext.
		 * @return {Array.<string>} Five element Array, containing the prefix of
		 *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
		 *     of shorttext and the common middle.  Or null if there was no match.
		 * @private
		 */
		function diffHalfMatchI( longtext, shorttext, i ) {
			var seed, j, bestCommon, prefixLength, suffixLength,
				bestLongtextA, bestLongtextB, bestShorttextA, bestShorttextB;
			// Start with a 1/4 length substring at position i as a seed.
			seed = longtext.substring( i, i + Math.floor( longtext.length / 4 ) );
			j = -1;
			bestCommon = "";
			while ( ( j = shorttext.indexOf( seed, j + 1 ) ) !== -1 ) {
				prefixLength = dmp.diffCommonPrefix( longtext.substring( i ),
					shorttext.substring( j ) );
				suffixLength = dmp.diffCommonSuffix( longtext.substring( 0, i ),
					shorttext.substring( 0, j ) );
				if ( bestCommon.length < suffixLength + prefixLength ) {
					bestCommon = shorttext.substring( j - suffixLength, j ) +
						shorttext.substring( j, j + prefixLength );
					bestLongtextA = longtext.substring( 0, i - suffixLength );
					bestLongtextB = longtext.substring( i + prefixLength );
					bestShorttextA = shorttext.substring( 0, j - suffixLength );
					bestShorttextB = shorttext.substring( j + prefixLength );
				}
			}
			if ( bestCommon.length * 2 >= longtext.length ) {
				return [ bestLongtextA, bestLongtextB,
					bestShorttextA, bestShorttextB, bestCommon
				];
			} else {
				return null;
			}
		}

		// First check if the second quarter is the seed for a half-match.
		hm1 = diffHalfMatchI( longtext, shorttext,
			Math.ceil( longtext.length / 4 ) );
		// Check again based on the third quarter.
		hm2 = diffHalfMatchI( longtext, shorttext,
			Math.ceil( longtext.length / 2 ) );
		if ( !hm1 && !hm2 ) {
			return null;
		} else if ( !hm2 ) {
			hm = hm1;
		} else if ( !hm1 ) {
			hm = hm2;
		} else {
			// Both matched.  Select the longest.
			hm = hm1[ 4 ].length > hm2[ 4 ].length ? hm1 : hm2;
		}

		// A half-match was found, sort out the return data.
		text1A, text1B, text2A, text2B;
		if ( text1.length > text2.length ) {
			text1A = hm[ 0 ];
			text1B = hm[ 1 ];
			text2A = hm[ 2 ];
			text2B = hm[ 3 ];
		} else {
			text2A = hm[ 0 ];
			text2B = hm[ 1 ];
			text1A = hm[ 2 ];
			text1B = hm[ 3 ];
		}
		midCommon = hm[ 4 ];
		return [ text1A, text1B, text2A, text2B, midCommon ];
	};

	/**
	 * Do a quick line-level diff on both strings, then rediff the parts for
	 * greater accuracy.
	 * This speedup can produce non-minimal diffs.
	 * @param {string} text1 Old string to be diffed.
	 * @param {string} text2 New string to be diffed.
	 * @param {number} deadline Time when the diff should be complete by.
	 * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
	 * @private
	 */
	DiffMatchPatch.prototype.diffLineMode = function( text1, text2, deadline ) {
		var a, diffs, linearray, pointer, countInsert,
			countDelete, textInsert, textDelete, j;
		// Scan the text on a line-by-line basis first.
		a = this.diffLinesToChars( text1, text2 );
		text1 = a.chars1;
		text2 = a.chars2;
		linearray = a.lineArray;

		diffs = this.DiffMain( text1, text2, false, deadline );

		// Convert the diff back to original text.
		this.diffCharsToLines( diffs, linearray );
		// Eliminate freak matches (e.g. blank lines)
		this.diffCleanupSemantic( diffs );

		// Rediff any replacement blocks, this time character-by-character.
		// Add a dummy entry at the end.
		diffs.push( [ DIFF_EQUAL, "" ] );
		pointer = 0;
		countDelete = 0;
		countInsert = 0;
		textDelete = "";
		textInsert = "";
		while ( pointer < diffs.length ) {
			switch ( diffs[ pointer ][ 0 ] ) {
			case DIFF_INSERT:
				countInsert++;
				textInsert += diffs[ pointer ][ 1 ];
				break;
			case DIFF_DELETE:
				countDelete++;
				textDelete += diffs[ pointer ][ 1 ];
				break;
			case DIFF_EQUAL:
				// Upon reaching an equality, check for prior redundancies.
				if ( countDelete >= 1 && countInsert >= 1 ) {
					// Delete the offending records and add the merged ones.
					diffs.splice( pointer - countDelete - countInsert,
						countDelete + countInsert );
					pointer = pointer - countDelete - countInsert;
					a = this.DiffMain( textDelete, textInsert, false, deadline );
					for ( j = a.length - 1; j >= 0; j-- ) {
						diffs.splice( pointer, 0, a[ j ] );
					}
					pointer = pointer + a.length;
				}
				countInsert = 0;
				countDelete = 0;
				textDelete = "";
				textInsert = "";
				break;
			}
			pointer++;
		}
		diffs.pop(); // Remove the dummy entry at the end.

		return diffs;
	};

	/**
	 * Find the 'middle snake' of a diff, split the problem in two
	 * and return the recursively constructed diff.
	 * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
	 * @param {string} text1 Old string to be diffed.
	 * @param {string} text2 New string to be diffed.
	 * @param {number} deadline Time at which to bail if not yet complete.
	 * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
	 * @private
	 */
	DiffMatchPatch.prototype.diffBisect = function( text1, text2, deadline ) {
		var text1Length, text2Length, maxD, vOffset, vLength,
			v1, v2, x, delta, front, k1start, k1end, k2start,
			k2end, k2Offset, k1Offset, x1, x2, y1, y2, d, k1, k2;
		// Cache the text lengths to prevent multiple calls.
		text1Length = text1.length;
		text2Length = text2.length;
		maxD = Math.ceil( ( text1Length + text2Length ) / 2 );
		vOffset = maxD;
		vLength = 2 * maxD;
		v1 = new Array( vLength );
		v2 = new Array( vLength );
		// Setting all elements to -1 is faster in Chrome & Firefox than mixing
		// integers and undefined.
		for ( x = 0; x < vLength; x++ ) {
			v1[ x ] = -1;
			v2[ x ] = -1;
		}
		v1[ vOffset + 1 ] = 0;
		v2[ vOffset + 1 ] = 0;
		delta = text1Length - text2Length;
		// If the total number of characters is odd, then the front path will collide
		// with the reverse path.
		front = ( delta % 2 !== 0 );
		// Offsets for start and end of k loop.
		// Prevents mapping of space beyond the grid.
		k1start = 0;
		k1end = 0;
		k2start = 0;
		k2end = 0;
		for ( d = 0; d < maxD; d++ ) {
			// Bail out if deadline is reached.
			if ( ( new Date() ).getTime() > deadline ) {
				break;
			}

			// Walk the front path one step.
			for ( k1 = -d + k1start; k1 <= d - k1end; k1 += 2 ) {
				k1Offset = vOffset + k1;
				if ( k1 === -d || ( k1 !== d && v1[ k1Offset - 1 ] < v1[ k1Offset + 1 ] ) ) {
					x1 = v1[ k1Offset + 1 ];
				} else {
					x1 = v1[ k1Offset - 1 ] + 1;
				}
				y1 = x1 - k1;
				while ( x1 < text1Length && y1 < text2Length &&
					text1.charAt( x1 ) === text2.charAt( y1 ) ) {
					x1++;
					y1++;
				}
				v1[ k1Offset ] = x1;
				if ( x1 > text1Length ) {
					// Ran off the right of the graph.
					k1end += 2;
				} else if ( y1 > text2Length ) {
					// Ran off the bottom of the graph.
					k1start += 2;
				} else if ( front ) {
					k2Offset = vOffset + delta - k1;
					if ( k2Offset >= 0 && k2Offset < vLength && v2[ k2Offset ] !== -1 ) {
						// Mirror x2 onto top-left coordinate system.
						x2 = text1Length - v2[ k2Offset ];
						if ( x1 >= x2 ) {
							// Overlap detected.
							return this.diffBisectSplit( text1, text2, x1, y1, deadline );
						}
					}
				}
			}

			// Walk the reverse path one step.
			for ( k2 = -d + k2start; k2 <= d - k2end; k2 += 2 ) {
				k2Offset = vOffset + k2;
				if ( k2 === -d || ( k2 !== d && v2[ k2Offset - 1 ] < v2[ k2Offset + 1 ] ) ) {
					x2 = v2[ k2Offset + 1 ];
				} else {
					x2 = v2[ k2Offset - 1 ] + 1;
				}
				y2 = x2 - k2;
				while ( x2 < text1Length && y2 < text2Length &&
					text1.charAt( text1Length - x2 - 1 ) ===
					text2.charAt( text2Length - y2 - 1 ) ) {
					x2++;
					y2++;
				}
				v2[ k2Offset ] = x2;
				if ( x2 > text1Length ) {
					// Ran off the left of the graph.
					k2end += 2;
				} else if ( y2 > text2Length ) {
					// Ran off the top of the graph.
					k2start += 2;
				} else if ( !front ) {
					k1Offset = vOffset + delta - k2;
					if ( k1Offset >= 0 && k1Offset < vLength && v1[ k1Offset ] !== -1 ) {
						x1 = v1[ k1Offset ];
						y1 = vOffset + x1 - k1Offset;
						// Mirror x2 onto top-left coordinate system.
						x2 = text1Length - x2;
						if ( x1 >= x2 ) {
							// Overlap detected.
							return this.diffBisectSplit( text1, text2, x1, y1, deadline );
						}
					}
				}
			}
		}
		// Diff took too long and hit the deadline or
		// number of diffs equals number of characters, no commonality at all.
		return [
			[ DIFF_DELETE, text1 ],
			[ DIFF_INSERT, text2 ]
		];
	};

	/**
	 * Given the location of the 'middle snake', split the diff in two parts
	 * and recurse.
	 * @param {string} text1 Old string to be diffed.
	 * @param {string} text2 New string to be diffed.
	 * @param {number} x Index of split point in text1.
	 * @param {number} y Index of split point in text2.
	 * @param {number} deadline Time at which to bail if not yet complete.
	 * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
	 * @private
	 */
	DiffMatchPatch.prototype.diffBisectSplit = function( text1, text2, x, y, deadline ) {
		var text1a, text1b, text2a, text2b, diffs, diffsb;
		text1a = text1.substring( 0, x );
		text2a = text2.substring( 0, y );
		text1b = text1.substring( x );
		text2b = text2.substring( y );

		// Compute both diffs serially.
		diffs = this.DiffMain( text1a, text2a, false, deadline );
		diffsb = this.DiffMain( text1b, text2b, false, deadline );

		return diffs.concat( diffsb );
	};

	/**
	 * Reduce the number of edits by eliminating semantically trivial equalities.
	 * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
	 */
	DiffMatchPatch.prototype.diffCleanupSemantic = function( diffs ) {
		var changes, equalities, equalitiesLength, lastequality,
			pointer, lengthInsertions2, lengthDeletions2, lengthInsertions1,
			lengthDeletions1, deletion, insertion, overlapLength1, overlapLength2;
		changes = false;
		equalities = []; // Stack of indices where equalities are found.
		equalitiesLength = 0; // Keeping our own length var is faster in JS.
		/** @type {?string} */
		lastequality = null;
		// Always equal to diffs[equalities[equalitiesLength - 1]][1]
		pointer = 0; // Index of current position.
		// Number of characters that changed prior to the equality.
		lengthInsertions1 = 0;
		lengthDeletions1 = 0;
		// Number of characters that changed after the equality.
		lengthInsertions2 = 0;
		lengthDeletions2 = 0;
		while ( pointer < diffs.length ) {
			if ( diffs[ pointer ][ 0 ] === DIFF_EQUAL ) { // Equality found.
				equalities[ equalitiesLength++ ] = pointer;
				lengthInsertions1 = lengthInsertions2;
				lengthDeletions1 = lengthDeletions2;
				lengthInsertions2 = 0;
				lengthDeletions2 = 0;
				lastequality = diffs[ pointer ][ 1 ];
			} else { // An insertion or deletion.
				if ( diffs[ pointer ][ 0 ] === DIFF_INSERT ) {
					lengthInsertions2 += diffs[ pointer ][ 1 ].length;
				} else {
					lengthDeletions2 += diffs[ pointer ][ 1 ].length;
				}
				// Eliminate an equality that is smaller or equal to the edits on both
				// sides of it.
				if ( lastequality && ( lastequality.length <=
						Math.max( lengthInsertions1, lengthDeletions1 ) ) &&
						( lastequality.length <= Math.max( lengthInsertions2,
							lengthDeletions2 ) ) ) {

					// Duplicate record.
					diffs.splice(
						equalities[ equalitiesLength - 1 ],
						0,
						[ DIFF_DELETE, lastequality ]
					);

					// Change second copy to insert.
					diffs[ equalities[ equalitiesLength - 1 ] + 1 ][ 0 ] = DIFF_INSERT;

					// Throw away the equality we just deleted.
					equalitiesLength--;

					// Throw away the previous equality (it needs to be reevaluated).
					equalitiesLength--;
					pointer = equalitiesLength > 0 ? equalities[ equalitiesLength - 1 ] : -1;

					// Reset the counters.
					lengthInsertions1 = 0;
					lengthDeletions1 = 0;
					lengthInsertions2 = 0;
					lengthDeletions2 = 0;
					lastequality = null;
					changes = true;
				}
			}
			pointer++;
		}

		// Normalize the diff.
		if ( changes ) {
			this.diffCleanupMerge( diffs );
		}

		// Find any overlaps between deletions and insertions.
		// e.g: <del>abcxxx</del><ins>xxxdef</ins>
		//   -> <del>abc</del>xxx<ins>def</ins>
		// e.g: <del>xxxabc</del><ins>defxxx</ins>
		//   -> <ins>def</ins>xxx<del>abc</del>
		// Only extract an overlap if it is as big as the edit ahead or behind it.
		pointer = 1;
		while ( pointer < diffs.length ) {
			if ( diffs[ pointer - 1 ][ 0 ] === DIFF_DELETE &&
					diffs[ pointer ][ 0 ] === DIFF_INSERT ) {
				deletion = diffs[ pointer - 1 ][ 1 ];
				insertion = diffs[ pointer ][ 1 ];
				overlapLength1 = this.diffCommonOverlap( deletion, insertion );
				overlapLength2 = this.diffCommonOverlap( insertion, deletion );
				if ( overlapLength1 >= overlapLength2 ) {
					if ( overlapLength1 >= deletion.length / 2 ||
							overlapLength1 >= insertion.length / 2 ) {
						// Overlap found.  Insert an equality and trim the surrounding edits.
						diffs.splice(
							pointer,
							0,
							[ DIFF_EQUAL, insertion.substring( 0, overlapLength1 ) ]
						);
						diffs[ pointer - 1 ][ 1 ] =
							deletion.substring( 0, deletion.length - overlapLength1 );
						diffs[ pointer + 1 ][ 1 ] = insertion.substring( overlapLength1 );
						pointer++;
					}
				} else {
					if ( overlapLength2 >= deletion.length / 2 ||
							overlapLength2 >= insertion.length / 2 ) {

						// Reverse overlap found.
						// Insert an equality and swap and trim the surrounding edits.
						diffs.splice(
							pointer,
							0,
							[ DIFF_EQUAL, deletion.substring( 0, overlapLength2 ) ]
						);

						diffs[ pointer - 1 ][ 0 ] = DIFF_INSERT;
						diffs[ pointer - 1 ][ 1 ] =
							insertion.substring( 0, insertion.length - overlapLength2 );
						diffs[ pointer + 1 ][ 0 ] = DIFF_DELETE;
						diffs[ pointer + 1 ][ 1 ] =
							deletion.substring( overlapLength2 );
						pointer++;
					}
				}
				pointer++;
			}
			pointer++;
		}
	};

	/**
	 * Determine if the suffix of one string is the prefix of another.
	 * @param {string} text1 First string.
	 * @param {string} text2 Second string.
	 * @return {number} The number of characters common to the end of the first
	 *     string and the start of the second string.
	 * @private
	 */
	DiffMatchPatch.prototype.diffCommonOverlap = function( text1, text2 ) {
		var text1Length, text2Length, textLength,
			best, length, pattern, found;
		// Cache the text lengths to prevent multiple calls.
		text1Length = text1.length;
		text2Length = text2.length;
		// Eliminate the null case.
		if ( text1Length === 0 || text2Length === 0 ) {
			return 0;
		}
		// Truncate the longer string.
		if ( text1Length > text2Length ) {
			text1 = text1.substring( text1Length - text2Length );
		} else if ( text1Length < text2Length ) {
			text2 = text2.substring( 0, text1Length );
		}
		textLength = Math.min( text1Length, text2Length );
		// Quick check for the worst case.
		if ( text1 === text2 ) {
			return textLength;
		}

		// Start by looking for a single character match
		// and increase length until no match is found.
		// Performance analysis: http://neil.fraser.name/news/2010/11/04/
		best = 0;
		length = 1;
		while ( true ) {
			pattern = text1.substring( textLength - length );
			found = text2.indexOf( pattern );
			if ( found === -1 ) {
				return best;
			}
			length += found;
			if ( found === 0 || text1.substring( textLength - length ) ===
					text2.substring( 0, length ) ) {
				best = length;
				length++;
			}
		}
	};

	/**
	 * Split two texts into an array of strings.  Reduce the texts to a string of
	 * hashes where each Unicode character represents one line.
	 * @param {string} text1 First string.
	 * @param {string} text2 Second string.
	 * @return {{chars1: string, chars2: string, lineArray: !Array.<string>}}
	 *     An object containing the encoded text1, the encoded text2 and
	 *     the array of unique strings.
	 *     The zeroth element of the array of unique strings is intentionally blank.
	 * @private
	 */
	DiffMatchPatch.prototype.diffLinesToChars = function( text1, text2 ) {
		var lineArray, lineHash, chars1, chars2;
		lineArray = []; // e.g. lineArray[4] === 'Hello\n'
		lineHash = {}; // e.g. lineHash['Hello\n'] === 4

		// '\x00' is a valid character, but various debuggers don't like it.
		// So we'll insert a junk entry to avoid generating a null character.
		lineArray[ 0 ] = "";

		/**
		 * Split a text into an array of strings.  Reduce the texts to a string of
		 * hashes where each Unicode character represents one line.
		 * Modifies linearray and linehash through being a closure.
		 * @param {string} text String to encode.
		 * @return {string} Encoded string.
		 * @private
		 */
		function diffLinesToCharsMunge( text ) {
			var chars, lineStart, lineEnd, lineArrayLength, line;
			chars = "";
			// Walk the text, pulling out a substring for each line.
			// text.split('\n') would would temporarily double our memory footprint.
			// Modifying text would create many large strings to garbage collect.
			lineStart = 0;
			lineEnd = -1;
			// Keeping our own length variable is faster than looking it up.
			lineArrayLength = lineArray.length;
			while ( lineEnd < text.length - 1 ) {
				lineEnd = text.indexOf( "\n", lineStart );
				if ( lineEnd === -1 ) {
					lineEnd = text.length - 1;
				}
				line = text.substring( lineStart, lineEnd + 1 );
				lineStart = lineEnd + 1;

				if ( lineHash.hasOwnProperty ? lineHash.hasOwnProperty( line ) :
							( lineHash[ line ] !== undefined ) ) {
					chars += String.fromCharCode( lineHash[ line ] );
				} else {
					chars += String.fromCharCode( lineArrayLength );
					lineHash[ line ] = lineArrayLength;
					lineArray[ lineArrayLength++ ] = line;
				}
			}
			return chars;
		}

		chars1 = diffLinesToCharsMunge( text1 );
		chars2 = diffLinesToCharsMunge( text2 );
		return {
			chars1: chars1,
			chars2: chars2,
			lineArray: lineArray
		};
	};

	/**
	 * Rehydrate the text in a diff from a string of line hashes to real lines of
	 * text.
	 * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
	 * @param {!Array.<string>} lineArray Array of unique strings.
	 * @private
	 */
	DiffMatchPatch.prototype.diffCharsToLines = function( diffs, lineArray ) {
		var x, chars, text, y;
		for ( x = 0; x < diffs.length; x++ ) {
			chars = diffs[ x ][ 1 ];
			text = [];
			for ( y = 0; y < chars.length; y++ ) {
				text[ y ] = lineArray[ chars.charCodeAt( y ) ];
			}
			diffs[ x ][ 1 ] = text.join( "" );
		}
	};

	/**
	 * Reorder and merge like edit sections.  Merge equalities.
	 * Any edit section can move as long as it doesn't cross an equality.
	 * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
	 */
	DiffMatchPatch.prototype.diffCleanupMerge = function( diffs ) {
		var pointer, countDelete, countInsert, textInsert, textDelete,
			commonlength, changes, diffPointer, position;
		diffs.push( [ DIFF_EQUAL, "" ] ); // Add a dummy entry at the end.
		pointer = 0;
		countDelete = 0;
		countInsert = 0;
		textDelete = "";
		textInsert = "";
		commonlength;
		while ( pointer < diffs.length ) {
			switch ( diffs[ pointer ][ 0 ] ) {
			case DIFF_INSERT:
				countInsert++;
				textInsert += diffs[ pointer ][ 1 ];
				pointer++;
				break;
			case DIFF_DELETE:
				countDelete++;
				textDelete += diffs[ pointer ][ 1 ];
				pointer++;
				break;
			case DIFF_EQUAL:
				// Upon reaching an equality, check for prior redundancies.
				if ( countDelete + countInsert > 1 ) {
					if ( countDelete !== 0 && countInsert !== 0 ) {
						// Factor out any common prefixies.
						commonlength = this.diffCommonPrefix( textInsert, textDelete );
						if ( commonlength !== 0 ) {
							if ( ( pointer - countDelete - countInsert ) > 0 &&
									diffs[ pointer - countDelete - countInsert - 1 ][ 0 ] ===
									DIFF_EQUAL ) {
								diffs[ pointer - countDelete - countInsert - 1 ][ 1 ] +=
									textInsert.substring( 0, commonlength );
							} else {
								diffs.splice( 0, 0, [ DIFF_EQUAL,
									textInsert.substring( 0, commonlength )
								] );
								pointer++;
							}
							textInsert = textInsert.substring( commonlength );
							textDelete = textDelete.substring( commonlength );
						}
						// Factor out any common suffixies.
						commonlength = this.diffCommonSuffix( textInsert, textDelete );
						if ( commonlength !== 0 ) {
							diffs[ pointer ][ 1 ] = textInsert.substring( textInsert.length -
									commonlength ) + diffs[ pointer ][ 1 ];
							textInsert = textInsert.substring( 0, textInsert.length -
								commonlength );
							textDelete = textDelete.substring( 0, textDelete.length -
								commonlength );
						}
					}
					// Delete the offending records and add the merged ones.
					if ( countDelete === 0 ) {
						diffs.splice( pointer - countInsert,
							countDelete + countInsert, [ DIFF_INSERT, textInsert ] );
					} else if ( countInsert === 0 ) {
						diffs.splice( pointer - countDelete,
							countDelete + countInsert, [ DIFF_DELETE, textDelete ] );
					} else {
						diffs.splice(
							pointer - countDelete - countInsert,
							countDelete + countInsert,
							[ DIFF_DELETE, textDelete ], [ DIFF_INSERT, textInsert ]
						);
					}
					pointer = pointer - countDelete - countInsert +
						( countDelete ? 1 : 0 ) + ( countInsert ? 1 : 0 ) + 1;
				} else if ( pointer !== 0 && diffs[ pointer - 1 ][ 0 ] === DIFF_EQUAL ) {

					// Merge this equality with the previous one.
					diffs[ pointer - 1 ][ 1 ] += diffs[ pointer ][ 1 ];
					diffs.splice( pointer, 1 );
				} else {
					pointer++;
				}
				countInsert = 0;
				countDelete = 0;
				textDelete = "";
				textInsert = "";
				break;
			}
		}
		if ( diffs[ diffs.length - 1 ][ 1 ] === "" ) {
			diffs.pop(); // Remove the dummy entry at the end.
		}

		// Second pass: look for single edits surrounded on both sides by equalities
		// which can be shifted sideways to eliminate an equality.
		// e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
		changes = false;
		pointer = 1;

		// Intentionally ignore the first and last element (don't need checking).
		while ( pointer < diffs.length - 1 ) {
			if ( diffs[ pointer - 1 ][ 0 ] === DIFF_EQUAL &&
					diffs[ pointer + 1 ][ 0 ] === DIFF_EQUAL ) {

				diffPointer = diffs[ pointer ][ 1 ];
				position = diffPointer.substring(
					diffPointer.length - diffs[ pointer - 1 ][ 1 ].length
				);

				// This is a single edit surrounded by equalities.
				if ( position === diffs[ pointer - 1 ][ 1 ] ) {

					// Shift the edit over the previous equality.
					diffs[ pointer ][ 1 ] = diffs[ pointer - 1 ][ 1 ] +
						diffs[ pointer ][ 1 ].substring( 0, diffs[ pointer ][ 1 ].length -
							diffs[ pointer - 1 ][ 1 ].length );
					diffs[ pointer + 1 ][ 1 ] =
						diffs[ pointer - 1 ][ 1 ] + diffs[ pointer + 1 ][ 1 ];
					diffs.splice( pointer - 1, 1 );
					changes = true;
				} else if ( diffPointer.substring( 0, diffs[ pointer + 1 ][ 1 ].length ) ===
						diffs[ pointer + 1 ][ 1 ] ) {

					// Shift the edit over the next equality.
					diffs[ pointer - 1 ][ 1 ] += diffs[ pointer + 1 ][ 1 ];
					diffs[ pointer ][ 1 ] =
						diffs[ pointer ][ 1 ].substring( diffs[ pointer + 1 ][ 1 ].length ) +
						diffs[ pointer + 1 ][ 1 ];
					diffs.splice( pointer + 1, 1 );
					changes = true;
				}
			}
			pointer++;
		}
		// If shifts were made, the diff needs reordering and another shift sweep.
		if ( changes ) {
			this.diffCleanupMerge( diffs );
		}
	};

	return function( o, n ) {
		var diff, output, text;
		diff = new DiffMatchPatch();
		output = diff.DiffMain( o, n );
		diff.diffCleanupEfficiency( output );
		text = diff.diffPrettyHtml( output );

		return text;
	};
}() );

// Get a reference to the global object, like window in browsers
}( (function() {
	return this;
})() ));

(function() {

// Don't load the HTML Reporter on non-Browser environments
if ( typeof window === "undefined" || !window.document ) {
	return;
}

// Deprecated QUnit.init - Ref #530
// Re-initialize the configuration options
QUnit.init = function() {
	var tests, banner, result, qunit,
		config = QUnit.config;

	config.stats = { all: 0, bad: 0 };
	config.moduleStats = { all: 0, bad: 0 };
	config.started = 0;
	config.updateRate = 1000;
	config.blocking = false;
	config.autostart = true;
	config.autorun = false;
	config.filter = "";
	config.queue = [];

	// Return on non-browser environments
	// This is necessary to not break on node tests
	if ( typeof window === "undefined" ) {
		return;
	}

	qunit = id( "qunit" );
	if ( qunit ) {
		qunit.innerHTML =
			"<h1 id='qunit-header'>" + escapeText( document.title ) + "</h1>" +
			"<h2 id='qunit-banner'></h2>" +
			"<div id='qunit-testrunner-toolbar'></div>" +
			"<h2 id='qunit-userAgent'></h2>" +
			"<ol id='qunit-tests'></ol>";
	}

	tests = id( "qunit-tests" );
	banner = id( "qunit-banner" );
	result = id( "qunit-testresult" );

	if ( tests ) {
		tests.innerHTML = "";
	}

	if ( banner ) {
		banner.className = "";
	}

	if ( result ) {
		result.parentNode.removeChild( result );
	}

	if ( tests ) {
		result = document.createElement( "p" );
		result.id = "qunit-testresult";
		result.className = "result";
		tests.parentNode.insertBefore( result, tests );
		result.innerHTML = "Running...<br />&#160;";
	}
};

var config = QUnit.config,
	hasOwn = Object.prototype.hasOwnProperty,
	defined = {
		document: window.document !== undefined,
		sessionStorage: (function() {
			var x = "qunit-test-string";
			try {
				sessionStorage.setItem( x, x );
				sessionStorage.removeItem( x );
				return true;
			} catch ( e ) {
				return false;
			}
		}())
	},
	modulesList = [];

/**
* Escape text for attribute or text content.
*/
function escapeText( s ) {
	if ( !s ) {
		return "";
	}
	s = s + "";

	// Both single quotes and double quotes (for attributes)
	return s.replace( /['"<>&]/g, function( s ) {
		switch ( s ) {
		case "'":
			return "&#039;";
		case "\"":
			return "&quot;";
		case "<":
			return "&lt;";
		case ">":
			return "&gt;";
		case "&":
			return "&amp;";
		}
	});
}

/**
 * @param {HTMLElement} elem
 * @param {string} type
 * @param {Function} fn
 */
function addEvent( elem, type, fn ) {
	if ( elem.addEventListener ) {

		// Standards-based browsers
		elem.addEventListener( type, fn, false );
	} else if ( elem.attachEvent ) {

		// support: IE <9
		elem.attachEvent( "on" + type, function() {
			var event = window.event;
			if ( !event.target ) {
				event.target = event.srcElement || document;
			}

			fn.call( elem, event );
		});
	}
}

/**
 * @param {Array|NodeList} elems
 * @param {string} type
 * @param {Function} fn
 */
function addEvents( elems, type, fn ) {
	var i = elems.length;
	while ( i-- ) {
		addEvent( elems[ i ], type, fn );
	}
}

function hasClass( elem, name ) {
	return ( " " + elem.className + " " ).indexOf( " " + name + " " ) >= 0;
}

function addClass( elem, name ) {
	if ( !hasClass( elem, name ) ) {
		elem.className += ( elem.className ? " " : "" ) + name;
	}
}

function toggleClass( elem, name ) {
	if ( hasClass( elem, name ) ) {
		removeClass( elem, name );
	} else {
		addClass( elem, name );
	}
}

function removeClass( elem, name ) {
	var set = " " + elem.className + " ";

	// Class name may appear multiple times
	while ( set.indexOf( " " + name + " " ) >= 0 ) {
		set = set.replace( " " + name + " ", " " );
	}

	// trim for prettiness
	elem.className = typeof set.trim === "function" ? set.trim() : set.replace( /^\s+|\s+$/g, "" );
}

function id( name ) {
	return defined.document && document.getElementById && document.getElementById( name );
}

function getUrlConfigHtml() {
	var i, j, val,
		escaped, escapedTooltip,
		selection = false,
		len = config.urlConfig.length,
		urlConfigHtml = "";

	for ( i = 0; i < len; i++ ) {
		val = config.urlConfig[ i ];
		if ( typeof val === "string" ) {
			val = {
				id: val,
				label: val
			};
		}

		escaped = escapeText( val.id );
		escapedTooltip = escapeText( val.tooltip );

		if ( config[ val.id ] === undefined ) {
			config[ val.id ] = QUnit.urlParams[ val.id ];
		}

		if ( !val.value || typeof val.value === "string" ) {
			urlConfigHtml += "<input id='qunit-urlconfig-" + escaped +
				"' name='" + escaped + "' type='checkbox'" +
				( val.value ? " value='" + escapeText( val.value ) + "'" : "" ) +
				( config[ val.id ] ? " checked='checked'" : "" ) +
				" title='" + escapedTooltip + "' /><label for='qunit-urlconfig-" + escaped +
				"' title='" + escapedTooltip + "'>" + val.label + "</label>";
		} else {
			urlConfigHtml += "<label for='qunit-urlconfig-" + escaped +
				"' title='" + escapedTooltip + "'>" + val.label +
				": </label><select id='qunit-urlconfig-" + escaped +
				"' name='" + escaped + "' title='" + escapedTooltip + "'><option></option>";

			if ( QUnit.is( "array", val.value ) ) {
				for ( j = 0; j < val.value.length; j++ ) {
					escaped = escapeText( val.value[ j ] );
					urlConfigHtml += "<option value='" + escaped + "'" +
						( config[ val.id ] === val.value[ j ] ?
							( selection = true ) && " selected='selected'" : "" ) +
						">" + escaped + "</option>";
				}
			} else {
				for ( j in val.value ) {
					if ( hasOwn.call( val.value, j ) ) {
						urlConfigHtml += "<option value='" + escapeText( j ) + "'" +
							( config[ val.id ] === j ?
								( selection = true ) && " selected='selected'" : "" ) +
							">" + escapeText( val.value[ j ] ) + "</option>";
					}
				}
			}
			if ( config[ val.id ] && !selection ) {
				escaped = escapeText( config[ val.id ] );
				urlConfigHtml += "<option value='" + escaped +
					"' selected='selected' disabled='disabled'>" + escaped + "</option>";
			}
			urlConfigHtml += "</select>";
		}
	}

	return urlConfigHtml;
}

// Handle "click" events on toolbar checkboxes and "change" for select menus.
// Updates the URL with the new state of `config.urlConfig` values.
function toolbarChanged() {
	var updatedUrl, value,
		field = this,
		params = {};

	// Detect if field is a select menu or a checkbox
	if ( "selectedIndex" in field ) {
		value = field.options[ field.selectedIndex ].value || undefined;
	} else {
		value = field.checked ? ( field.defaultValue || true ) : undefined;
	}

	params[ field.name ] = value;
	updatedUrl = setUrl( params );

	if ( "hidepassed" === field.name && "replaceState" in window.history ) {
		config[ field.name ] = value || false;
		if ( value ) {
			addClass( id( "qunit-tests" ), "hidepass" );
		} else {
			removeClass( id( "qunit-tests" ), "hidepass" );
		}

		// It is not necessary to refresh the whole page
		window.history.replaceState( null, "", updatedUrl );
	} else {
		window.location = updatedUrl;
	}
}

function setUrl( params ) {
	var key,
		querystring = "?";

	params = QUnit.extend( QUnit.extend( {}, QUnit.urlParams ), params );

	for ( key in params ) {
		if ( hasOwn.call( params, key ) ) {
			if ( params[ key ] === undefined ) {
				continue;
			}
			querystring += encodeURIComponent( key );
			if ( params[ key ] !== true ) {
				querystring += "=" + encodeURIComponent( params[ key ] );
			}
			querystring += "&";
		}
	}
	return location.protocol + "//" + location.host +
		location.pathname + querystring.slice( 0, -1 );
}

function applyUrlParams() {
	var selectedModule,
		modulesList = id( "qunit-modulefilter" ),
		filter = id( "qunit-filter-input" ).value;

	selectedModule = modulesList ?
		decodeURIComponent( modulesList.options[ modulesList.selectedIndex ].value ) :
		undefined;

	window.location = setUrl({
		module: ( selectedModule === "" ) ? undefined : selectedModule,
		filter: ( filter === "" ) ? undefined : filter,

		// Remove testId filter
		testId: undefined
	});
}

function toolbarUrlConfigContainer() {
	var urlConfigContainer = document.createElement( "span" );

	urlConfigContainer.innerHTML = getUrlConfigHtml();
	addClass( urlConfigContainer, "qunit-url-config" );

	// For oldIE support:
	// * Add handlers to the individual elements instead of the container
	// * Use "click" instead of "change" for checkboxes
	addEvents( urlConfigContainer.getElementsByTagName( "input" ), "click", toolbarChanged );
	addEvents( urlConfigContainer.getElementsByTagName( "select" ), "change", toolbarChanged );

	return urlConfigContainer;
}

function toolbarLooseFilter() {
	var filter = document.createElement( "form" ),
		label = document.createElement( "label" ),
		input = document.createElement( "input" ),
		button = document.createElement( "button" );

	addClass( filter, "qunit-filter" );

	label.innerHTML = "Filter: ";

	input.type = "text";
	input.value = config.filter || "";
	input.name = "filter";
	input.id = "qunit-filter-input";

	button.innerHTML = "Go";

	label.appendChild( input );

	filter.appendChild( label );
	filter.appendChild( button );
	addEvent( filter, "submit", function( ev ) {
		applyUrlParams();

		if ( ev && ev.preventDefault ) {
			ev.preventDefault();
		}

		return false;
	});

	return filter;
}

function toolbarModuleFilterHtml() {
	var i,
		moduleFilterHtml = "";

	if ( !modulesList.length ) {
		return false;
	}

	modulesList.sort(function( a, b ) {
		return a.localeCompare( b );
	});

	moduleFilterHtml += "<label for='qunit-modulefilter'>Module: </label>" +
		"<select id='qunit-modulefilter' name='modulefilter'><option value='' " +
		( QUnit.urlParams.module === undefined ? "selected='selected'" : "" ) +
		">< All Modules ></option>";

	for ( i = 0; i < modulesList.length; i++ ) {
		moduleFilterHtml += "<option value='" +
			escapeText( encodeURIComponent( modulesList[ i ] ) ) + "' " +
			( QUnit.urlParams.module === modulesList[ i ] ? "selected='selected'" : "" ) +
			">" + escapeText( modulesList[ i ] ) + "</option>";
	}
	moduleFilterHtml += "</select>";

	return moduleFilterHtml;
}

function toolbarModuleFilter() {
	var toolbar = id( "qunit-testrunner-toolbar" ),
		moduleFilter = document.createElement( "span" ),
		moduleFilterHtml = toolbarModuleFilterHtml();

	if ( !toolbar || !moduleFilterHtml ) {
		return false;
	}

	moduleFilter.setAttribute( "id", "qunit-modulefilter-container" );
	moduleFilter.innerHTML = moduleFilterHtml;

	addEvent( moduleFilter.lastChild, "change", applyUrlParams );

	toolbar.appendChild( moduleFilter );
}

function appendToolbar() {
	var toolbar = id( "qunit-testrunner-toolbar" );

	if ( toolbar ) {
		toolbar.appendChild( toolbarUrlConfigContainer() );
		toolbar.appendChild( toolbarLooseFilter() );
	}
}

function appendHeader() {
	var header = id( "qunit-header" );

	if ( header ) {
		header.innerHTML = "<a href='" +
			setUrl({ filter: undefined, module: undefined, testId: undefined }) +
			"'>" + header.innerHTML + "</a> ";
	}
}

function appendBanner() {
	var banner = id( "qunit-banner" );

	if ( banner ) {
		banner.className = "";
	}
}

function appendTestResults() {
	var tests = id( "qunit-tests" ),
		result = id( "qunit-testresult" );

	if ( result ) {
		result.parentNode.removeChild( result );
	}

	if ( tests ) {
		tests.innerHTML = "";
		result = document.createElement( "p" );
		result.id = "qunit-testresult";
		result.className = "result";
		tests.parentNode.insertBefore( result, tests );
		result.innerHTML = "Running...<br />&#160;";
	}
}

function storeFixture() {
	var fixture = id( "qunit-fixture" );
	if ( fixture ) {
		config.fixture = fixture.innerHTML;
	}
}

function appendUserAgent() {
	var userAgent = id( "qunit-userAgent" );

	if ( userAgent ) {
		userAgent.innerHTML = "";
		userAgent.appendChild(
			document.createTextNode(
				"QUnit " + QUnit.version  + "; " + navigator.userAgent
			)
		);
	}
}

function appendTestsList( modules ) {
	var i, l, x, z, test, moduleObj;

	for ( i = 0, l = modules.length; i < l; i++ ) {
		moduleObj = modules[ i ];

		if ( moduleObj.name ) {
			modulesList.push( moduleObj.name );
		}

		for ( x = 0, z = moduleObj.tests.length; x < z; x++ ) {
			test = moduleObj.tests[ x ];

			appendTest( test.name, test.testId, moduleObj.name );
		}
	}
}

function appendTest( name, testId, moduleName ) {
	var title, rerunTrigger, testBlock, assertList,
		tests = id( "qunit-tests" );

	if ( !tests ) {
		return;
	}

	title = document.createElement( "strong" );
	title.innerHTML = getNameHtml( name, moduleName );

	rerunTrigger = document.createElement( "a" );
	rerunTrigger.innerHTML = "Rerun";
	rerunTrigger.href = setUrl({ testId: testId });

	testBlock = document.createElement( "li" );
	testBlock.appendChild( title );
	testBlock.appendChild( rerunTrigger );
	testBlock.id = "qunit-test-output-" + testId;

	assertList = document.createElement( "ol" );
	assertList.className = "qunit-assert-list";

	testBlock.appendChild( assertList );

	tests.appendChild( testBlock );
}

// HTML Reporter initialization and load
QUnit.begin(function( details ) {
	var qunit = id( "qunit" );

	// Fixture is the only one necessary to run without the #qunit element
	storeFixture();

	if ( qunit ) {
		qunit.innerHTML =
			"<h1 id='qunit-header'>" + escapeText( document.title ) + "</h1>" +
			"<h2 id='qunit-banner'></h2>" +
			"<div id='qunit-testrunner-toolbar'></div>" +
			"<h2 id='qunit-userAgent'></h2>" +
			"<ol id='qunit-tests'></ol>";
	}

	appendHeader();
	appendBanner();
	appendTestResults();
	appendUserAgent();
	appendToolbar();
	appendTestsList( details.modules );
	toolbarModuleFilter();

	if ( qunit && config.hidepassed ) {
		addClass( qunit.lastChild, "hidepass" );
	}
});

QUnit.done(function( details ) {
	var i, key,
		banner = id( "qunit-banner" ),
		tests = id( "qunit-tests" ),
		html = [
			"Tests completed in ",
			details.runtime,
			" milliseconds.<br />",
			"<span class='passed'>",
			details.passed,
			"</span> assertions of <span class='total'>",
			details.total,
			"</span> passed, <span class='failed'>",
			details.failed,
			"</span> failed."
		].join( "" );

	if ( banner ) {
		banner.className = details.failed ? "qunit-fail" : "qunit-pass";
	}

	if ( tests ) {
		id( "qunit-testresult" ).innerHTML = html;
	}

	if ( config.altertitle && defined.document && document.title ) {

		// show ✖ for good, ✔ for bad suite result in title
		// use escape sequences in case file gets loaded with non-utf-8-charset
		document.title = [
			( details.failed ? "\u2716" : "\u2714" ),
			document.title.replace( /^[\u2714\u2716] /i, "" )
		].join( " " );
	}

	// clear own sessionStorage items if all tests passed
	if ( config.reorder && defined.sessionStorage && details.failed === 0 ) {
		for ( i = 0; i < sessionStorage.length; i++ ) {
			key = sessionStorage.key( i++ );
			if ( key.indexOf( "qunit-test-" ) === 0 ) {
				sessionStorage.removeItem( key );
			}
		}
	}

	// scroll back to top to show results
	if ( config.scrolltop && window.scrollTo ) {
		window.scrollTo( 0, 0 );
	}
});

function getNameHtml( name, module ) {
	var nameHtml = "";

	if ( module ) {
		nameHtml = "<span class='module-name'>" + escapeText( module ) + "</span>: ";
	}

	nameHtml += "<span class='test-name'>" + escapeText( name ) + "</span>";

	return nameHtml;
}

QUnit.testStart(function( details ) {
	var running, testBlock, bad;

	testBlock = id( "qunit-test-output-" + details.testId );
	if ( testBlock ) {
		testBlock.className = "running";
	} else {

		// Report later registered tests
		appendTest( details.name, details.testId, details.module );
	}

	running = id( "qunit-testresult" );
	if ( running ) {
		bad = QUnit.config.reorder && defined.sessionStorage &&
			+sessionStorage.getItem( "qunit-test-" + details.module + "-" + details.name );

		running.innerHTML = ( bad ?
			"Rerunning previously failed test: <br />" :
			"Running: <br />" ) +
			getNameHtml( details.name, details.module );
	}

});

function stripHtml( string ) {
	// strip tags, html entity and whitespaces
	return string.replace(/<\/?[^>]+(>|$)/g, "").replace(/\&quot;/g, "").replace(/\s+/g, "");
}

QUnit.log(function( details ) {
	var assertList, assertLi,
		message, expected, actual, diff,
		showDiff = false,
		testItem = id( "qunit-test-output-" + details.testId );

	if ( !testItem ) {
		return;
	}

	message = escapeText( details.message ) || ( details.result ? "okay" : "failed" );
	message = "<span class='test-message'>" + message + "</span>";
	message += "<span class='runtime'>@ " + details.runtime + " ms</span>";

	// pushFailure doesn't provide details.expected
	// when it calls, it's implicit to also not show expected and diff stuff
	// Also, we need to check details.expected existence, as it can exist and be undefined
	if ( !details.result && hasOwn.call( details, "expected" ) ) {
		if ( details.negative ) {
			expected = escapeText( "NOT " + QUnit.dump.parse( details.expected ) );
		} else {
			expected = escapeText( QUnit.dump.parse( details.expected ) );
		}

		actual = escapeText( QUnit.dump.parse( details.actual ) );
		message += "<table><tr class='test-expected'><th>Expected: </th><td><pre>" +
			expected +
			"</pre></td></tr>";

		if ( actual !== expected ) {

			message += "<tr class='test-actual'><th>Result: </th><td><pre>" +
				actual + "</pre></td></tr>";

			// Don't show diff if actual or expected are booleans
			if ( !( /^(true|false)$/.test( actual ) ) &&
					!( /^(true|false)$/.test( expected ) ) ) {
				diff = QUnit.diff( expected, actual );
				showDiff = stripHtml( diff ).length !==
					stripHtml( expected ).length +
					stripHtml( actual ).length;
			}

			// Don't show diff if expected and actual are totally different
			if ( showDiff ) {
				message += "<tr class='test-diff'><th>Diff: </th><td><pre>" +
					diff + "</pre></td></tr>";
			}
		} else if ( expected.indexOf( "[object Array]" ) !== -1 ||
				expected.indexOf( "[object Object]" ) !== -1 ) {
			message += "<tr class='test-message'><th>Message: </th><td>" +
				"Diff suppressed as the depth of object is more than current max depth (" +
				QUnit.config.maxDepth + ").<p>Hint: Use <code>QUnit.dump.maxDepth</code> to " +
				" run with a higher max depth or <a href='" + setUrl({ maxDepth: -1 }) + "'>" +
				"Rerun</a> without max depth.</p></td></tr>";
		}

		if ( details.source ) {
			message += "<tr class='test-source'><th>Source: </th><td><pre>" +
				escapeText( details.source ) + "</pre></td></tr>";
		}

		message += "</table>";

	// this occours when pushFailure is set and we have an extracted stack trace
	} else if ( !details.result && details.source ) {
		message += "<table>" +
			"<tr class='test-source'><th>Source: </th><td><pre>" +
			escapeText( details.source ) + "</pre></td></tr>" +
			"</table>";
	}

	assertList = testItem.getElementsByTagName( "ol" )[ 0 ];

	assertLi = document.createElement( "li" );
	assertLi.className = details.result ? "pass" : "fail";
	assertLi.innerHTML = message;
	assertList.appendChild( assertLi );
});

QUnit.testDone(function( details ) {
	var testTitle, time, testItem, assertList,
		good, bad, testCounts, skipped, sourceName,
		tests = id( "qunit-tests" );

	if ( !tests ) {
		return;
	}

	testItem = id( "qunit-test-output-" + details.testId );

	assertList = testItem.getElementsByTagName( "ol" )[ 0 ];

	good = details.passed;
	bad = details.failed;

	// store result when possible
	if ( config.reorder && defined.sessionStorage ) {
		if ( bad ) {
			sessionStorage.setItem( "qunit-test-" + details.module + "-" + details.name, bad );
		} else {
			sessionStorage.removeItem( "qunit-test-" + details.module + "-" + details.name );
		}
	}

	if ( bad === 0 ) {
		addClass( assertList, "qunit-collapsed" );
	}

	// testItem.firstChild is the test name
	testTitle = testItem.firstChild;

	testCounts = bad ?
		"<b class='failed'>" + bad + "</b>, " + "<b class='passed'>" + good + "</b>, " :
		"";

	testTitle.innerHTML += " <b class='counts'>(" + testCounts +
		details.assertions.length + ")</b>";

	if ( details.skipped ) {
		testItem.className = "skipped";
		skipped = document.createElement( "em" );
		skipped.className = "qunit-skipped-label";
		skipped.innerHTML = "skipped";
		testItem.insertBefore( skipped, testTitle );
	} else {
		addEvent( testTitle, "click", function() {
			toggleClass( assertList, "qunit-collapsed" );
		});

		testItem.className = bad ? "fail" : "pass";

		time = document.createElement( "span" );
		time.className = "runtime";
		time.innerHTML = details.runtime + " ms";
		testItem.insertBefore( time, assertList );
	}

	// Show the source of the test when showing assertions
	if ( details.source ) {
		sourceName = document.createElement( "p" );
		sourceName.innerHTML = "<strong>Source: </strong>" + details.source;
		addClass( sourceName, "qunit-source" );
		if ( bad === 0 ) {
			addClass( sourceName, "qunit-collapsed" );
		}
		addEvent( testTitle, "click", function() {
			toggleClass( sourceName, "qunit-collapsed" );
		});
		testItem.appendChild( sourceName );
	}
});

if ( defined.document ) {

	// Avoid readyState issue with phantomjs
	// Ref: #818
	var notPhantom = ( function( p ) {
		return !( p && p.version && p.version.major > 0 );
	} )( window.phantom );

	if ( notPhantom && document.readyState === "complete" ) {
		QUnit.load();
	} else {
		addEvent( window, "load", QUnit.load );
	}
} else {
	config.pageLoaded = true;
	config.autorun = true;
}

})();

},{}],11:[function(require,module,exports){
/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
// @version 0.7.2
window.WebComponents = window.WebComponents || {};

(function(scope) {
  var flags = scope.flags || {};
  var file = "webcomponents.js";
  var script = document.querySelector('script[src*="' + file + '"]');
  if (!flags.noOpts) {
    location.search.slice(1).split("&").forEach(function(option) {
      var parts = option.split("=");
      var match;
      if (parts[0] && (match = parts[0].match(/wc-(.+)/))) {
        flags[match[1]] = parts[1] || true;
      }
    });
    if (script) {
      for (var i = 0, a; a = script.attributes[i]; i++) {
        if (a.name !== "src") {
          flags[a.name] = a.value || true;
        }
      }
    }
    if (flags.log && flags.log.split) {
      var parts = flags.log.split(",");
      flags.log = {};
      parts.forEach(function(f) {
        flags.log[f] = true;
      });
    } else {
      flags.log = {};
    }
  }
  flags.shadow = flags.shadow || flags.shadowdom || flags.polyfill;
  if (flags.shadow === "native") {
    flags.shadow = false;
  } else {
    flags.shadow = flags.shadow || !HTMLElement.prototype.createShadowRoot;
  }
  if (flags.register) {
    window.CustomElements = window.CustomElements || {
      flags: {}
    };
    window.CustomElements.flags.register = flags.register;
  }
  scope.flags = flags;
})(WebComponents);

if (WebComponents.flags.shadow) {
  if (typeof WeakMap === "undefined") {
    (function() {
      var defineProperty = Object.defineProperty;
      var counter = Date.now() % 1e9;
      var WeakMap = function() {
        this.name = "__st" + (Math.random() * 1e9 >>> 0) + (counter++ + "__");
      };
      WeakMap.prototype = {
        set: function(key, value) {
          var entry = key[this.name];
          if (entry && entry[0] === key) entry[1] = value; else defineProperty(key, this.name, {
            value: [ key, value ],
            writable: true
          });
          return this;
        },
        get: function(key) {
          var entry;
          return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
        },
        "delete": function(key) {
          var entry = key[this.name];
          if (!entry || entry[0] !== key) return false;
          entry[0] = entry[1] = undefined;
          return true;
        },
        has: function(key) {
          var entry = key[this.name];
          if (!entry) return false;
          return entry[0] === key;
        }
      };
      window.WeakMap = WeakMap;
    })();
  }
  window.ShadowDOMPolyfill = {};
  (function(scope) {
    "use strict";
    var constructorTable = new WeakMap();
    var nativePrototypeTable = new WeakMap();
    var wrappers = Object.create(null);
    function detectEval() {
      if (typeof chrome !== "undefined" && chrome.app && chrome.app.runtime) {
        return false;
      }
      if (navigator.getDeviceStorage) {
        return false;
      }
      try {
        var f = new Function("return true;");
        return f();
      } catch (ex) {
        return false;
      }
    }
    var hasEval = detectEval();
    function assert(b) {
      if (!b) throw new Error("Assertion failed");
    }
    var defineProperty = Object.defineProperty;
    var getOwnPropertyNames = Object.getOwnPropertyNames;
    var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    function mixin(to, from) {
      var names = getOwnPropertyNames(from);
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        defineProperty(to, name, getOwnPropertyDescriptor(from, name));
      }
      return to;
    }
    function mixinStatics(to, from) {
      var names = getOwnPropertyNames(from);
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        switch (name) {
         case "arguments":
         case "caller":
         case "length":
         case "name":
         case "prototype":
         case "toString":
          continue;
        }
        defineProperty(to, name, getOwnPropertyDescriptor(from, name));
      }
      return to;
    }
    function oneOf(object, propertyNames) {
      for (var i = 0; i < propertyNames.length; i++) {
        if (propertyNames[i] in object) return propertyNames[i];
      }
    }
    var nonEnumerableDataDescriptor = {
      value: undefined,
      configurable: true,
      enumerable: false,
      writable: true
    };
    function defineNonEnumerableDataProperty(object, name, value) {
      nonEnumerableDataDescriptor.value = value;
      defineProperty(object, name, nonEnumerableDataDescriptor);
    }
    getOwnPropertyNames(window);
    function getWrapperConstructor(node) {
      var nativePrototype = node.__proto__ || Object.getPrototypeOf(node);
      if (isFirefox) {
        try {
          getOwnPropertyNames(nativePrototype);
        } catch (error) {
          nativePrototype = nativePrototype.__proto__;
        }
      }
      var wrapperConstructor = constructorTable.get(nativePrototype);
      if (wrapperConstructor) return wrapperConstructor;
      var parentWrapperConstructor = getWrapperConstructor(nativePrototype);
      var GeneratedWrapper = createWrapperConstructor(parentWrapperConstructor);
      registerInternal(nativePrototype, GeneratedWrapper, node);
      return GeneratedWrapper;
    }
    function addForwardingProperties(nativePrototype, wrapperPrototype) {
      installProperty(nativePrototype, wrapperPrototype, true);
    }
    function registerInstanceProperties(wrapperPrototype, instanceObject) {
      installProperty(instanceObject, wrapperPrototype, false);
    }
    var isFirefox = /Firefox/.test(navigator.userAgent);
    var dummyDescriptor = {
      get: function() {},
      set: function(v) {},
      configurable: true,
      enumerable: true
    };
    function isEventHandlerName(name) {
      return /^on[a-z]+$/.test(name);
    }
    function isIdentifierName(name) {
      return /^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(name);
    }
    function getGetter(name) {
      return hasEval && isIdentifierName(name) ? new Function("return this.__impl4cf1e782hg__." + name) : function() {
        return this.__impl4cf1e782hg__[name];
      };
    }
    function getSetter(name) {
      return hasEval && isIdentifierName(name) ? new Function("v", "this.__impl4cf1e782hg__." + name + " = v") : function(v) {
        this.__impl4cf1e782hg__[name] = v;
      };
    }
    function getMethod(name) {
      return hasEval && isIdentifierName(name) ? new Function("return this.__impl4cf1e782hg__." + name + ".apply(this.__impl4cf1e782hg__, arguments)") : function() {
        return this.__impl4cf1e782hg__[name].apply(this.__impl4cf1e782hg__, arguments);
      };
    }
    function getDescriptor(source, name) {
      try {
        return Object.getOwnPropertyDescriptor(source, name);
      } catch (ex) {
        return dummyDescriptor;
      }
    }
    var isBrokenSafari = function() {
      var descr = Object.getOwnPropertyDescriptor(Node.prototype, "nodeType");
      return descr && !descr.get && !descr.set;
    }();
    function installProperty(source, target, allowMethod, opt_blacklist) {
      var names = getOwnPropertyNames(source);
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        if (name === "polymerBlackList_") continue;
        if (name in target) continue;
        if (source.polymerBlackList_ && source.polymerBlackList_[name]) continue;
        if (isFirefox) {
          source.__lookupGetter__(name);
        }
        var descriptor = getDescriptor(source, name);
        var getter, setter;
        if (allowMethod && typeof descriptor.value === "function") {
          target[name] = getMethod(name);
          continue;
        }
        var isEvent = isEventHandlerName(name);
        if (isEvent) getter = scope.getEventHandlerGetter(name); else getter = getGetter(name);
        if (descriptor.writable || descriptor.set || isBrokenSafari) {
          if (isEvent) setter = scope.getEventHandlerSetter(name); else setter = getSetter(name);
        }
        var configurable = isBrokenSafari || descriptor.configurable;
        defineProperty(target, name, {
          get: getter,
          set: setter,
          configurable: configurable,
          enumerable: descriptor.enumerable
        });
      }
    }
    function register(nativeConstructor, wrapperConstructor, opt_instance) {
      if (nativeConstructor == null) {
        return;
      }
      var nativePrototype = nativeConstructor.prototype;
      registerInternal(nativePrototype, wrapperConstructor, opt_instance);
      mixinStatics(wrapperConstructor, nativeConstructor);
    }
    function registerInternal(nativePrototype, wrapperConstructor, opt_instance) {
      var wrapperPrototype = wrapperConstructor.prototype;
      assert(constructorTable.get(nativePrototype) === undefined);
      constructorTable.set(nativePrototype, wrapperConstructor);
      nativePrototypeTable.set(wrapperPrototype, nativePrototype);
      addForwardingProperties(nativePrototype, wrapperPrototype);
      if (opt_instance) registerInstanceProperties(wrapperPrototype, opt_instance);
      defineNonEnumerableDataProperty(wrapperPrototype, "constructor", wrapperConstructor);
      wrapperConstructor.prototype = wrapperPrototype;
    }
    function isWrapperFor(wrapperConstructor, nativeConstructor) {
      return constructorTable.get(nativeConstructor.prototype) === wrapperConstructor;
    }
    function registerObject(object) {
      var nativePrototype = Object.getPrototypeOf(object);
      var superWrapperConstructor = getWrapperConstructor(nativePrototype);
      var GeneratedWrapper = createWrapperConstructor(superWrapperConstructor);
      registerInternal(nativePrototype, GeneratedWrapper, object);
      return GeneratedWrapper;
    }
    function createWrapperConstructor(superWrapperConstructor) {
      function GeneratedWrapper(node) {
        superWrapperConstructor.call(this, node);
      }
      var p = Object.create(superWrapperConstructor.prototype);
      p.constructor = GeneratedWrapper;
      GeneratedWrapper.prototype = p;
      return GeneratedWrapper;
    }
    function isWrapper(object) {
      return object && object.__impl4cf1e782hg__;
    }
    function isNative(object) {
      return !isWrapper(object);
    }
    function wrap(impl) {
      if (impl === null) return null;
      assert(isNative(impl));
      return impl.__wrapper8e3dd93a60__ || (impl.__wrapper8e3dd93a60__ = new (getWrapperConstructor(impl))(impl));
    }
    function unwrap(wrapper) {
      if (wrapper === null) return null;
      assert(isWrapper(wrapper));
      return wrapper.__impl4cf1e782hg__;
    }
    function unsafeUnwrap(wrapper) {
      return wrapper.__impl4cf1e782hg__;
    }
    function setWrapper(impl, wrapper) {
      wrapper.__impl4cf1e782hg__ = impl;
      impl.__wrapper8e3dd93a60__ = wrapper;
    }
    function unwrapIfNeeded(object) {
      return object && isWrapper(object) ? unwrap(object) : object;
    }
    function wrapIfNeeded(object) {
      return object && !isWrapper(object) ? wrap(object) : object;
    }
    function rewrap(node, wrapper) {
      if (wrapper === null) return;
      assert(isNative(node));
      assert(wrapper === undefined || isWrapper(wrapper));
      node.__wrapper8e3dd93a60__ = wrapper;
    }
    var getterDescriptor = {
      get: undefined,
      configurable: true,
      enumerable: true
    };
    function defineGetter(constructor, name, getter) {
      getterDescriptor.get = getter;
      defineProperty(constructor.prototype, name, getterDescriptor);
    }
    function defineWrapGetter(constructor, name) {
      defineGetter(constructor, name, function() {
        return wrap(this.__impl4cf1e782hg__[name]);
      });
    }
    function forwardMethodsToWrapper(constructors, names) {
      constructors.forEach(function(constructor) {
        names.forEach(function(name) {
          constructor.prototype[name] = function() {
            var w = wrapIfNeeded(this);
            return w[name].apply(w, arguments);
          };
        });
      });
    }
    scope.assert = assert;
    scope.constructorTable = constructorTable;
    scope.defineGetter = defineGetter;
    scope.defineWrapGetter = defineWrapGetter;
    scope.forwardMethodsToWrapper = forwardMethodsToWrapper;
    scope.isIdentifierName = isIdentifierName;
    scope.isWrapper = isWrapper;
    scope.isWrapperFor = isWrapperFor;
    scope.mixin = mixin;
    scope.nativePrototypeTable = nativePrototypeTable;
    scope.oneOf = oneOf;
    scope.registerObject = registerObject;
    scope.registerWrapper = register;
    scope.rewrap = rewrap;
    scope.setWrapper = setWrapper;
    scope.unsafeUnwrap = unsafeUnwrap;
    scope.unwrap = unwrap;
    scope.unwrapIfNeeded = unwrapIfNeeded;
    scope.wrap = wrap;
    scope.wrapIfNeeded = wrapIfNeeded;
    scope.wrappers = wrappers;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    function newSplice(index, removed, addedCount) {
      return {
        index: index,
        removed: removed,
        addedCount: addedCount
      };
    }
    var EDIT_LEAVE = 0;
    var EDIT_UPDATE = 1;
    var EDIT_ADD = 2;
    var EDIT_DELETE = 3;
    function ArraySplice() {}
    ArraySplice.prototype = {
      calcEditDistances: function(current, currentStart, currentEnd, old, oldStart, oldEnd) {
        var rowCount = oldEnd - oldStart + 1;
        var columnCount = currentEnd - currentStart + 1;
        var distances = new Array(rowCount);
        for (var i = 0; i < rowCount; i++) {
          distances[i] = new Array(columnCount);
          distances[i][0] = i;
        }
        for (var j = 0; j < columnCount; j++) distances[0][j] = j;
        for (var i = 1; i < rowCount; i++) {
          for (var j = 1; j < columnCount; j++) {
            if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1])) distances[i][j] = distances[i - 1][j - 1]; else {
              var north = distances[i - 1][j] + 1;
              var west = distances[i][j - 1] + 1;
              distances[i][j] = north < west ? north : west;
            }
          }
        }
        return distances;
      },
      spliceOperationsFromEditDistances: function(distances) {
        var i = distances.length - 1;
        var j = distances[0].length - 1;
        var current = distances[i][j];
        var edits = [];
        while (i > 0 || j > 0) {
          if (i == 0) {
            edits.push(EDIT_ADD);
            j--;
            continue;
          }
          if (j == 0) {
            edits.push(EDIT_DELETE);
            i--;
            continue;
          }
          var northWest = distances[i - 1][j - 1];
          var west = distances[i - 1][j];
          var north = distances[i][j - 1];
          var min;
          if (west < north) min = west < northWest ? west : northWest; else min = north < northWest ? north : northWest;
          if (min == northWest) {
            if (northWest == current) {
              edits.push(EDIT_LEAVE);
            } else {
              edits.push(EDIT_UPDATE);
              current = northWest;
            }
            i--;
            j--;
          } else if (min == west) {
            edits.push(EDIT_DELETE);
            i--;
            current = west;
          } else {
            edits.push(EDIT_ADD);
            j--;
            current = north;
          }
        }
        edits.reverse();
        return edits;
      },
      calcSplices: function(current, currentStart, currentEnd, old, oldStart, oldEnd) {
        var prefixCount = 0;
        var suffixCount = 0;
        var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
        if (currentStart == 0 && oldStart == 0) prefixCount = this.sharedPrefix(current, old, minLength);
        if (currentEnd == current.length && oldEnd == old.length) suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);
        currentStart += prefixCount;
        oldStart += prefixCount;
        currentEnd -= suffixCount;
        oldEnd -= suffixCount;
        if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0) return [];
        if (currentStart == currentEnd) {
          var splice = newSplice(currentStart, [], 0);
          while (oldStart < oldEnd) splice.removed.push(old[oldStart++]);
          return [ splice ];
        } else if (oldStart == oldEnd) return [ newSplice(currentStart, [], currentEnd - currentStart) ];
        var ops = this.spliceOperationsFromEditDistances(this.calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd));
        var splice = undefined;
        var splices = [];
        var index = currentStart;
        var oldIndex = oldStart;
        for (var i = 0; i < ops.length; i++) {
          switch (ops[i]) {
           case EDIT_LEAVE:
            if (splice) {
              splices.push(splice);
              splice = undefined;
            }
            index++;
            oldIndex++;
            break;

           case EDIT_UPDATE:
            if (!splice) splice = newSplice(index, [], 0);
            splice.addedCount++;
            index++;
            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;

           case EDIT_ADD:
            if (!splice) splice = newSplice(index, [], 0);
            splice.addedCount++;
            index++;
            break;

           case EDIT_DELETE:
            if (!splice) splice = newSplice(index, [], 0);
            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;
          }
        }
        if (splice) {
          splices.push(splice);
        }
        return splices;
      },
      sharedPrefix: function(current, old, searchLength) {
        for (var i = 0; i < searchLength; i++) if (!this.equals(current[i], old[i])) return i;
        return searchLength;
      },
      sharedSuffix: function(current, old, searchLength) {
        var index1 = current.length;
        var index2 = old.length;
        var count = 0;
        while (count < searchLength && this.equals(current[--index1], old[--index2])) count++;
        return count;
      },
      calculateSplices: function(current, previous) {
        return this.calcSplices(current, 0, current.length, previous, 0, previous.length);
      },
      equals: function(currentValue, previousValue) {
        return currentValue === previousValue;
      }
    };
    scope.ArraySplice = ArraySplice;
  })(window.ShadowDOMPolyfill);
  (function(context) {
    "use strict";
    var OriginalMutationObserver = window.MutationObserver;
    var callbacks = [];
    var pending = false;
    var timerFunc;
    function handle() {
      pending = false;
      var copies = callbacks.slice(0);
      callbacks = [];
      for (var i = 0; i < copies.length; i++) {
        (0, copies[i])();
      }
    }
    if (OriginalMutationObserver) {
      var counter = 1;
      var observer = new OriginalMutationObserver(handle);
      var textNode = document.createTextNode(counter);
      observer.observe(textNode, {
        characterData: true
      });
      timerFunc = function() {
        counter = (counter + 1) % 2;
        textNode.data = counter;
      };
    } else {
      timerFunc = window.setTimeout;
    }
    function setEndOfMicrotask(func) {
      callbacks.push(func);
      if (pending) return;
      pending = true;
      timerFunc(handle, 0);
    }
    context.setEndOfMicrotask = setEndOfMicrotask;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var setEndOfMicrotask = scope.setEndOfMicrotask;
    var wrapIfNeeded = scope.wrapIfNeeded;
    var wrappers = scope.wrappers;
    var registrationsTable = new WeakMap();
    var globalMutationObservers = [];
    var isScheduled = false;
    function scheduleCallback(observer) {
      if (observer.scheduled_) return;
      observer.scheduled_ = true;
      globalMutationObservers.push(observer);
      if (isScheduled) return;
      setEndOfMicrotask(notifyObservers);
      isScheduled = true;
    }
    function notifyObservers() {
      isScheduled = false;
      while (globalMutationObservers.length) {
        var notifyList = globalMutationObservers;
        globalMutationObservers = [];
        notifyList.sort(function(x, y) {
          return x.uid_ - y.uid_;
        });
        for (var i = 0; i < notifyList.length; i++) {
          var mo = notifyList[i];
          mo.scheduled_ = false;
          var queue = mo.takeRecords();
          removeTransientObserversFor(mo);
          if (queue.length) {
            mo.callback_(queue, mo);
          }
        }
      }
    }
    function MutationRecord(type, target) {
      this.type = type;
      this.target = target;
      this.addedNodes = new wrappers.NodeList();
      this.removedNodes = new wrappers.NodeList();
      this.previousSibling = null;
      this.nextSibling = null;
      this.attributeName = null;
      this.attributeNamespace = null;
      this.oldValue = null;
    }
    function registerTransientObservers(ancestor, node) {
      for (;ancestor; ancestor = ancestor.parentNode) {
        var registrations = registrationsTable.get(ancestor);
        if (!registrations) continue;
        for (var i = 0; i < registrations.length; i++) {
          var registration = registrations[i];
          if (registration.options.subtree) registration.addTransientObserver(node);
        }
      }
    }
    function removeTransientObserversFor(observer) {
      for (var i = 0; i < observer.nodes_.length; i++) {
        var node = observer.nodes_[i];
        var registrations = registrationsTable.get(node);
        if (!registrations) return;
        for (var j = 0; j < registrations.length; j++) {
          var registration = registrations[j];
          if (registration.observer === observer) registration.removeTransientObservers();
        }
      }
    }
    function enqueueMutation(target, type, data) {
      var interestedObservers = Object.create(null);
      var associatedStrings = Object.create(null);
      for (var node = target; node; node = node.parentNode) {
        var registrations = registrationsTable.get(node);
        if (!registrations) continue;
        for (var j = 0; j < registrations.length; j++) {
          var registration = registrations[j];
          var options = registration.options;
          if (node !== target && !options.subtree) continue;
          if (type === "attributes" && !options.attributes) continue;
          if (type === "attributes" && options.attributeFilter && (data.namespace !== null || options.attributeFilter.indexOf(data.name) === -1)) {
            continue;
          }
          if (type === "characterData" && !options.characterData) continue;
          if (type === "childList" && !options.childList) continue;
          var observer = registration.observer;
          interestedObservers[observer.uid_] = observer;
          if (type === "attributes" && options.attributeOldValue || type === "characterData" && options.characterDataOldValue) {
            associatedStrings[observer.uid_] = data.oldValue;
          }
        }
      }
      for (var uid in interestedObservers) {
        var observer = interestedObservers[uid];
        var record = new MutationRecord(type, target);
        if ("name" in data && "namespace" in data) {
          record.attributeName = data.name;
          record.attributeNamespace = data.namespace;
        }
        if (data.addedNodes) record.addedNodes = data.addedNodes;
        if (data.removedNodes) record.removedNodes = data.removedNodes;
        if (data.previousSibling) record.previousSibling = data.previousSibling;
        if (data.nextSibling) record.nextSibling = data.nextSibling;
        if (associatedStrings[uid] !== undefined) record.oldValue = associatedStrings[uid];
        scheduleCallback(observer);
        observer.records_.push(record);
      }
    }
    var slice = Array.prototype.slice;
    function MutationObserverOptions(options) {
      this.childList = !!options.childList;
      this.subtree = !!options.subtree;
      if (!("attributes" in options) && ("attributeOldValue" in options || "attributeFilter" in options)) {
        this.attributes = true;
      } else {
        this.attributes = !!options.attributes;
      }
      if ("characterDataOldValue" in options && !("characterData" in options)) this.characterData = true; else this.characterData = !!options.characterData;
      if (!this.attributes && (options.attributeOldValue || "attributeFilter" in options) || !this.characterData && options.characterDataOldValue) {
        throw new TypeError();
      }
      this.characterData = !!options.characterData;
      this.attributeOldValue = !!options.attributeOldValue;
      this.characterDataOldValue = !!options.characterDataOldValue;
      if ("attributeFilter" in options) {
        if (options.attributeFilter == null || typeof options.attributeFilter !== "object") {
          throw new TypeError();
        }
        this.attributeFilter = slice.call(options.attributeFilter);
      } else {
        this.attributeFilter = null;
      }
    }
    var uidCounter = 0;
    function MutationObserver(callback) {
      this.callback_ = callback;
      this.nodes_ = [];
      this.records_ = [];
      this.uid_ = ++uidCounter;
      this.scheduled_ = false;
    }
    MutationObserver.prototype = {
      constructor: MutationObserver,
      observe: function(target, options) {
        target = wrapIfNeeded(target);
        var newOptions = new MutationObserverOptions(options);
        var registration;
        var registrations = registrationsTable.get(target);
        if (!registrations) registrationsTable.set(target, registrations = []);
        for (var i = 0; i < registrations.length; i++) {
          if (registrations[i].observer === this) {
            registration = registrations[i];
            registration.removeTransientObservers();
            registration.options = newOptions;
          }
        }
        if (!registration) {
          registration = new Registration(this, target, newOptions);
          registrations.push(registration);
          this.nodes_.push(target);
        }
      },
      disconnect: function() {
        this.nodes_.forEach(function(node) {
          var registrations = registrationsTable.get(node);
          for (var i = 0; i < registrations.length; i++) {
            var registration = registrations[i];
            if (registration.observer === this) {
              registrations.splice(i, 1);
              break;
            }
          }
        }, this);
        this.records_ = [];
      },
      takeRecords: function() {
        var copyOfRecords = this.records_;
        this.records_ = [];
        return copyOfRecords;
      }
    };
    function Registration(observer, target, options) {
      this.observer = observer;
      this.target = target;
      this.options = options;
      this.transientObservedNodes = [];
    }
    Registration.prototype = {
      addTransientObserver: function(node) {
        if (node === this.target) return;
        scheduleCallback(this.observer);
        this.transientObservedNodes.push(node);
        var registrations = registrationsTable.get(node);
        if (!registrations) registrationsTable.set(node, registrations = []);
        registrations.push(this);
      },
      removeTransientObservers: function() {
        var transientObservedNodes = this.transientObservedNodes;
        this.transientObservedNodes = [];
        for (var i = 0; i < transientObservedNodes.length; i++) {
          var node = transientObservedNodes[i];
          var registrations = registrationsTable.get(node);
          for (var j = 0; j < registrations.length; j++) {
            if (registrations[j] === this) {
              registrations.splice(j, 1);
              break;
            }
          }
        }
      }
    };
    scope.enqueueMutation = enqueueMutation;
    scope.registerTransientObservers = registerTransientObservers;
    scope.wrappers.MutationObserver = MutationObserver;
    scope.wrappers.MutationRecord = MutationRecord;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    function TreeScope(root, parent) {
      this.root = root;
      this.parent = parent;
    }
    TreeScope.prototype = {
      get renderer() {
        if (this.root instanceof scope.wrappers.ShadowRoot) {
          return scope.getRendererForHost(this.root.host);
        }
        return null;
      },
      contains: function(treeScope) {
        for (;treeScope; treeScope = treeScope.parent) {
          if (treeScope === this) return true;
        }
        return false;
      }
    };
    function setTreeScope(node, treeScope) {
      if (node.treeScope_ !== treeScope) {
        node.treeScope_ = treeScope;
        for (var sr = node.shadowRoot; sr; sr = sr.olderShadowRoot) {
          sr.treeScope_.parent = treeScope;
        }
        for (var child = node.firstChild; child; child = child.nextSibling) {
          setTreeScope(child, treeScope);
        }
      }
    }
    function getTreeScope(node) {
      if (node instanceof scope.wrappers.Window) {
        debugger;
      }
      if (node.treeScope_) return node.treeScope_;
      var parent = node.parentNode;
      var treeScope;
      if (parent) treeScope = getTreeScope(parent); else treeScope = new TreeScope(node, null);
      return node.treeScope_ = treeScope;
    }
    scope.TreeScope = TreeScope;
    scope.getTreeScope = getTreeScope;
    scope.setTreeScope = setTreeScope;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var forwardMethodsToWrapper = scope.forwardMethodsToWrapper;
    var getTreeScope = scope.getTreeScope;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var wrappers = scope.wrappers;
    var wrappedFuns = new WeakMap();
    var listenersTable = new WeakMap();
    var handledEventsTable = new WeakMap();
    var currentlyDispatchingEvents = new WeakMap();
    var targetTable = new WeakMap();
    var currentTargetTable = new WeakMap();
    var relatedTargetTable = new WeakMap();
    var eventPhaseTable = new WeakMap();
    var stopPropagationTable = new WeakMap();
    var stopImmediatePropagationTable = new WeakMap();
    var eventHandlersTable = new WeakMap();
    var eventPathTable = new WeakMap();
    function isShadowRoot(node) {
      return node instanceof wrappers.ShadowRoot;
    }
    function rootOfNode(node) {
      return getTreeScope(node).root;
    }
    function getEventPath(node, event) {
      var path = [];
      var current = node;
      path.push(current);
      while (current) {
        var destinationInsertionPoints = getDestinationInsertionPoints(current);
        if (destinationInsertionPoints && destinationInsertionPoints.length > 0) {
          for (var i = 0; i < destinationInsertionPoints.length; i++) {
            var insertionPoint = destinationInsertionPoints[i];
            if (isShadowInsertionPoint(insertionPoint)) {
              var shadowRoot = rootOfNode(insertionPoint);
              var olderShadowRoot = shadowRoot.olderShadowRoot;
              if (olderShadowRoot) path.push(olderShadowRoot);
            }
            path.push(insertionPoint);
          }
          current = destinationInsertionPoints[destinationInsertionPoints.length - 1];
        } else {
          if (isShadowRoot(current)) {
            if (inSameTree(node, current) && eventMustBeStopped(event)) {
              break;
            }
            current = current.host;
            path.push(current);
          } else {
            current = current.parentNode;
            if (current) path.push(current);
          }
        }
      }
      return path;
    }
    function eventMustBeStopped(event) {
      if (!event) return false;
      switch (event.type) {
       case "abort":
       case "error":
       case "select":
       case "change":
       case "load":
       case "reset":
       case "resize":
       case "scroll":
       case "selectstart":
        return true;
      }
      return false;
    }
    function isShadowInsertionPoint(node) {
      return node instanceof HTMLShadowElement;
    }
    function getDestinationInsertionPoints(node) {
      return scope.getDestinationInsertionPoints(node);
    }
    function eventRetargetting(path, currentTarget) {
      if (path.length === 0) return currentTarget;
      if (currentTarget instanceof wrappers.Window) currentTarget = currentTarget.document;
      var currentTargetTree = getTreeScope(currentTarget);
      var originalTarget = path[0];
      var originalTargetTree = getTreeScope(originalTarget);
      var relativeTargetTree = lowestCommonInclusiveAncestor(currentTargetTree, originalTargetTree);
      for (var i = 0; i < path.length; i++) {
        var node = path[i];
        if (getTreeScope(node) === relativeTargetTree) return node;
      }
      return path[path.length - 1];
    }
    function getTreeScopeAncestors(treeScope) {
      var ancestors = [];
      for (;treeScope; treeScope = treeScope.parent) {
        ancestors.push(treeScope);
      }
      return ancestors;
    }
    function lowestCommonInclusiveAncestor(tsA, tsB) {
      var ancestorsA = getTreeScopeAncestors(tsA);
      var ancestorsB = getTreeScopeAncestors(tsB);
      var result = null;
      while (ancestorsA.length > 0 && ancestorsB.length > 0) {
        var a = ancestorsA.pop();
        var b = ancestorsB.pop();
        if (a === b) result = a; else break;
      }
      return result;
    }
    function getTreeScopeRoot(ts) {
      if (!ts.parent) return ts;
      return getTreeScopeRoot(ts.parent);
    }
    function relatedTargetResolution(event, currentTarget, relatedTarget) {
      if (currentTarget instanceof wrappers.Window) currentTarget = currentTarget.document;
      var currentTargetTree = getTreeScope(currentTarget);
      var relatedTargetTree = getTreeScope(relatedTarget);
      var relatedTargetEventPath = getEventPath(relatedTarget, event);
      var lowestCommonAncestorTree;
      var lowestCommonAncestorTree = lowestCommonInclusiveAncestor(currentTargetTree, relatedTargetTree);
      if (!lowestCommonAncestorTree) lowestCommonAncestorTree = relatedTargetTree.root;
      for (var commonAncestorTree = lowestCommonAncestorTree; commonAncestorTree; commonAncestorTree = commonAncestorTree.parent) {
        var adjustedRelatedTarget;
        for (var i = 0; i < relatedTargetEventPath.length; i++) {
          var node = relatedTargetEventPath[i];
          if (getTreeScope(node) === commonAncestorTree) return node;
        }
      }
      return null;
    }
    function inSameTree(a, b) {
      return getTreeScope(a) === getTreeScope(b);
    }
    var NONE = 0;
    var CAPTURING_PHASE = 1;
    var AT_TARGET = 2;
    var BUBBLING_PHASE = 3;
    var pendingError;
    function dispatchOriginalEvent(originalEvent) {
      if (handledEventsTable.get(originalEvent)) return;
      handledEventsTable.set(originalEvent, true);
      dispatchEvent(wrap(originalEvent), wrap(originalEvent.target));
      if (pendingError) {
        var err = pendingError;
        pendingError = null;
        throw err;
      }
    }
    function isLoadLikeEvent(event) {
      switch (event.type) {
       case "load":
       case "beforeunload":
       case "unload":
        return true;
      }
      return false;
    }
    function dispatchEvent(event, originalWrapperTarget) {
      if (currentlyDispatchingEvents.get(event)) throw new Error("InvalidStateError");
      currentlyDispatchingEvents.set(event, true);
      scope.renderAllPending();
      var eventPath;
      var overrideTarget;
      var win;
      if (isLoadLikeEvent(event) && !event.bubbles) {
        var doc = originalWrapperTarget;
        if (doc instanceof wrappers.Document && (win = doc.defaultView)) {
          overrideTarget = doc;
          eventPath = [];
        }
      }
      if (!eventPath) {
        if (originalWrapperTarget instanceof wrappers.Window) {
          win = originalWrapperTarget;
          eventPath = [];
        } else {
          eventPath = getEventPath(originalWrapperTarget, event);
          if (!isLoadLikeEvent(event)) {
            var doc = eventPath[eventPath.length - 1];
            if (doc instanceof wrappers.Document) win = doc.defaultView;
          }
        }
      }
      eventPathTable.set(event, eventPath);
      if (dispatchCapturing(event, eventPath, win, overrideTarget)) {
        if (dispatchAtTarget(event, eventPath, win, overrideTarget)) {
          dispatchBubbling(event, eventPath, win, overrideTarget);
        }
      }
      eventPhaseTable.set(event, NONE);
      currentTargetTable.delete(event, null);
      currentlyDispatchingEvents.delete(event);
      return event.defaultPrevented;
    }
    function dispatchCapturing(event, eventPath, win, overrideTarget) {
      var phase = CAPTURING_PHASE;
      if (win) {
        if (!invoke(win, event, phase, eventPath, overrideTarget)) return false;
      }
      for (var i = eventPath.length - 1; i > 0; i--) {
        if (!invoke(eventPath[i], event, phase, eventPath, overrideTarget)) return false;
      }
      return true;
    }
    function dispatchAtTarget(event, eventPath, win, overrideTarget) {
      var phase = AT_TARGET;
      var currentTarget = eventPath[0] || win;
      return invoke(currentTarget, event, phase, eventPath, overrideTarget);
    }
    function dispatchBubbling(event, eventPath, win, overrideTarget) {
      var phase = BUBBLING_PHASE;
      for (var i = 1; i < eventPath.length; i++) {
        if (!invoke(eventPath[i], event, phase, eventPath, overrideTarget)) return;
      }
      if (win && eventPath.length > 0) {
        invoke(win, event, phase, eventPath, overrideTarget);
      }
    }
    function invoke(currentTarget, event, phase, eventPath, overrideTarget) {
      var listeners = listenersTable.get(currentTarget);
      if (!listeners) return true;
      var target = overrideTarget || eventRetargetting(eventPath, currentTarget);
      if (target === currentTarget) {
        if (phase === CAPTURING_PHASE) return true;
        if (phase === BUBBLING_PHASE) phase = AT_TARGET;
      } else if (phase === BUBBLING_PHASE && !event.bubbles) {
        return true;
      }
      if ("relatedTarget" in event) {
        var originalEvent = unwrap(event);
        var unwrappedRelatedTarget = originalEvent.relatedTarget;
        if (unwrappedRelatedTarget) {
          if (unwrappedRelatedTarget instanceof Object && unwrappedRelatedTarget.addEventListener) {
            var relatedTarget = wrap(unwrappedRelatedTarget);
            var adjusted = relatedTargetResolution(event, currentTarget, relatedTarget);
            if (adjusted === target) return true;
          } else {
            adjusted = null;
          }
          relatedTargetTable.set(event, adjusted);
        }
      }
      eventPhaseTable.set(event, phase);
      var type = event.type;
      var anyRemoved = false;
      targetTable.set(event, target);
      currentTargetTable.set(event, currentTarget);
      listeners.depth++;
      for (var i = 0, len = listeners.length; i < len; i++) {
        var listener = listeners[i];
        if (listener.removed) {
          anyRemoved = true;
          continue;
        }
        if (listener.type !== type || !listener.capture && phase === CAPTURING_PHASE || listener.capture && phase === BUBBLING_PHASE) {
          continue;
        }
        try {
          if (typeof listener.handler === "function") listener.handler.call(currentTarget, event); else listener.handler.handleEvent(event);
          if (stopImmediatePropagationTable.get(event)) return false;
        } catch (ex) {
          if (!pendingError) pendingError = ex;
        }
      }
      listeners.depth--;
      if (anyRemoved && listeners.depth === 0) {
        var copy = listeners.slice();
        listeners.length = 0;
        for (var i = 0; i < copy.length; i++) {
          if (!copy[i].removed) listeners.push(copy[i]);
        }
      }
      return !stopPropagationTable.get(event);
    }
    function Listener(type, handler, capture) {
      this.type = type;
      this.handler = handler;
      this.capture = Boolean(capture);
    }
    Listener.prototype = {
      equals: function(that) {
        return this.handler === that.handler && this.type === that.type && this.capture === that.capture;
      },
      get removed() {
        return this.handler === null;
      },
      remove: function() {
        this.handler = null;
      }
    };
    var OriginalEvent = window.Event;
    OriginalEvent.prototype.polymerBlackList_ = {
      returnValue: true,
      keyLocation: true
    };
    function Event(type, options) {
      if (type instanceof OriginalEvent) {
        var impl = type;
        if (!OriginalBeforeUnloadEvent && impl.type === "beforeunload" && !(this instanceof BeforeUnloadEvent)) {
          return new BeforeUnloadEvent(impl);
        }
        setWrapper(impl, this);
      } else {
        return wrap(constructEvent(OriginalEvent, "Event", type, options));
      }
    }
    Event.prototype = {
      get target() {
        return targetTable.get(this);
      },
      get currentTarget() {
        return currentTargetTable.get(this);
      },
      get eventPhase() {
        return eventPhaseTable.get(this);
      },
      get path() {
        var eventPath = eventPathTable.get(this);
        if (!eventPath) return [];
        return eventPath.slice();
      },
      stopPropagation: function() {
        stopPropagationTable.set(this, true);
      },
      stopImmediatePropagation: function() {
        stopPropagationTable.set(this, true);
        stopImmediatePropagationTable.set(this, true);
      }
    };
    registerWrapper(OriginalEvent, Event, document.createEvent("Event"));
    function unwrapOptions(options) {
      if (!options || !options.relatedTarget) return options;
      return Object.create(options, {
        relatedTarget: {
          value: unwrap(options.relatedTarget)
        }
      });
    }
    function registerGenericEvent(name, SuperEvent, prototype) {
      var OriginalEvent = window[name];
      var GenericEvent = function(type, options) {
        if (type instanceof OriginalEvent) setWrapper(type, this); else return wrap(constructEvent(OriginalEvent, name, type, options));
      };
      GenericEvent.prototype = Object.create(SuperEvent.prototype);
      if (prototype) mixin(GenericEvent.prototype, prototype);
      if (OriginalEvent) {
        try {
          registerWrapper(OriginalEvent, GenericEvent, new OriginalEvent("temp"));
        } catch (ex) {
          registerWrapper(OriginalEvent, GenericEvent, document.createEvent(name));
        }
      }
      return GenericEvent;
    }
    var UIEvent = registerGenericEvent("UIEvent", Event);
    var CustomEvent = registerGenericEvent("CustomEvent", Event);
    var relatedTargetProto = {
      get relatedTarget() {
        var relatedTarget = relatedTargetTable.get(this);
        if (relatedTarget !== undefined) return relatedTarget;
        return wrap(unwrap(this).relatedTarget);
      }
    };
    function getInitFunction(name, relatedTargetIndex) {
      return function() {
        arguments[relatedTargetIndex] = unwrap(arguments[relatedTargetIndex]);
        var impl = unwrap(this);
        impl[name].apply(impl, arguments);
      };
    }
    var mouseEventProto = mixin({
      initMouseEvent: getInitFunction("initMouseEvent", 14)
    }, relatedTargetProto);
    var focusEventProto = mixin({
      initFocusEvent: getInitFunction("initFocusEvent", 5)
    }, relatedTargetProto);
    var MouseEvent = registerGenericEvent("MouseEvent", UIEvent, mouseEventProto);
    var FocusEvent = registerGenericEvent("FocusEvent", UIEvent, focusEventProto);
    var defaultInitDicts = Object.create(null);
    var supportsEventConstructors = function() {
      try {
        new window.FocusEvent("focus");
      } catch (ex) {
        return false;
      }
      return true;
    }();
    function constructEvent(OriginalEvent, name, type, options) {
      if (supportsEventConstructors) return new OriginalEvent(type, unwrapOptions(options));
      var event = unwrap(document.createEvent(name));
      var defaultDict = defaultInitDicts[name];
      var args = [ type ];
      Object.keys(defaultDict).forEach(function(key) {
        var v = options != null && key in options ? options[key] : defaultDict[key];
        if (key === "relatedTarget") v = unwrap(v);
        args.push(v);
      });
      event["init" + name].apply(event, args);
      return event;
    }
    if (!supportsEventConstructors) {
      var configureEventConstructor = function(name, initDict, superName) {
        if (superName) {
          var superDict = defaultInitDicts[superName];
          initDict = mixin(mixin({}, superDict), initDict);
        }
        defaultInitDicts[name] = initDict;
      };
      configureEventConstructor("Event", {
        bubbles: false,
        cancelable: false
      });
      configureEventConstructor("CustomEvent", {
        detail: null
      }, "Event");
      configureEventConstructor("UIEvent", {
        view: null,
        detail: 0
      }, "Event");
      configureEventConstructor("MouseEvent", {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        button: 0,
        relatedTarget: null
      }, "UIEvent");
      configureEventConstructor("FocusEvent", {
        relatedTarget: null
      }, "UIEvent");
    }
    var OriginalBeforeUnloadEvent = window.BeforeUnloadEvent;
    function BeforeUnloadEvent(impl) {
      Event.call(this, impl);
    }
    BeforeUnloadEvent.prototype = Object.create(Event.prototype);
    mixin(BeforeUnloadEvent.prototype, {
      get returnValue() {
        return unsafeUnwrap(this).returnValue;
      },
      set returnValue(v) {
        unsafeUnwrap(this).returnValue = v;
      }
    });
    if (OriginalBeforeUnloadEvent) registerWrapper(OriginalBeforeUnloadEvent, BeforeUnloadEvent);
    function isValidListener(fun) {
      if (typeof fun === "function") return true;
      return fun && fun.handleEvent;
    }
    function isMutationEvent(type) {
      switch (type) {
       case "DOMAttrModified":
       case "DOMAttributeNameChanged":
       case "DOMCharacterDataModified":
       case "DOMElementNameChanged":
       case "DOMNodeInserted":
       case "DOMNodeInsertedIntoDocument":
       case "DOMNodeRemoved":
       case "DOMNodeRemovedFromDocument":
       case "DOMSubtreeModified":
        return true;
      }
      return false;
    }
    var OriginalEventTarget = window.EventTarget;
    function EventTarget(impl) {
      setWrapper(impl, this);
    }
    var methodNames = [ "addEventListener", "removeEventListener", "dispatchEvent" ];
    [ Node, Window ].forEach(function(constructor) {
      var p = constructor.prototype;
      methodNames.forEach(function(name) {
        Object.defineProperty(p, name + "_", {
          value: p[name]
        });
      });
    });
    function getTargetToListenAt(wrapper) {
      if (wrapper instanceof wrappers.ShadowRoot) wrapper = wrapper.host;
      return unwrap(wrapper);
    }
    EventTarget.prototype = {
      addEventListener: function(type, fun, capture) {
        if (!isValidListener(fun) || isMutationEvent(type)) return;
        var listener = new Listener(type, fun, capture);
        var listeners = listenersTable.get(this);
        if (!listeners) {
          listeners = [];
          listeners.depth = 0;
          listenersTable.set(this, listeners);
        } else {
          for (var i = 0; i < listeners.length; i++) {
            if (listener.equals(listeners[i])) return;
          }
        }
        listeners.push(listener);
        var target = getTargetToListenAt(this);
        target.addEventListener_(type, dispatchOriginalEvent, true);
      },
      removeEventListener: function(type, fun, capture) {
        capture = Boolean(capture);
        var listeners = listenersTable.get(this);
        if (!listeners) return;
        var count = 0, found = false;
        for (var i = 0; i < listeners.length; i++) {
          if (listeners[i].type === type && listeners[i].capture === capture) {
            count++;
            if (listeners[i].handler === fun) {
              found = true;
              listeners[i].remove();
            }
          }
        }
        if (found && count === 1) {
          var target = getTargetToListenAt(this);
          target.removeEventListener_(type, dispatchOriginalEvent, true);
        }
      },
      dispatchEvent: function(event) {
        var nativeEvent = unwrap(event);
        var eventType = nativeEvent.type;
        handledEventsTable.set(nativeEvent, false);
        scope.renderAllPending();
        var tempListener;
        if (!hasListenerInAncestors(this, eventType)) {
          tempListener = function() {};
          this.addEventListener(eventType, tempListener, true);
        }
        try {
          return unwrap(this).dispatchEvent_(nativeEvent);
        } finally {
          if (tempListener) this.removeEventListener(eventType, tempListener, true);
        }
      }
    };
    function hasListener(node, type) {
      var listeners = listenersTable.get(node);
      if (listeners) {
        for (var i = 0; i < listeners.length; i++) {
          if (!listeners[i].removed && listeners[i].type === type) return true;
        }
      }
      return false;
    }
    function hasListenerInAncestors(target, type) {
      for (var node = unwrap(target); node; node = node.parentNode) {
        if (hasListener(wrap(node), type)) return true;
      }
      return false;
    }
    if (OriginalEventTarget) registerWrapper(OriginalEventTarget, EventTarget);
    function wrapEventTargetMethods(constructors) {
      forwardMethodsToWrapper(constructors, methodNames);
    }
    var originalElementFromPoint = document.elementFromPoint;
    function elementFromPoint(self, document, x, y) {
      scope.renderAllPending();
      var element = wrap(originalElementFromPoint.call(unsafeUnwrap(document), x, y));
      if (!element) return null;
      var path = getEventPath(element, null);
      var idx = path.lastIndexOf(self);
      if (idx == -1) return null; else path = path.slice(0, idx);
      return eventRetargetting(path, self);
    }
    function getEventHandlerGetter(name) {
      return function() {
        var inlineEventHandlers = eventHandlersTable.get(this);
        return inlineEventHandlers && inlineEventHandlers[name] && inlineEventHandlers[name].value || null;
      };
    }
    function getEventHandlerSetter(name) {
      var eventType = name.slice(2);
      return function(value) {
        var inlineEventHandlers = eventHandlersTable.get(this);
        if (!inlineEventHandlers) {
          inlineEventHandlers = Object.create(null);
          eventHandlersTable.set(this, inlineEventHandlers);
        }
        var old = inlineEventHandlers[name];
        if (old) this.removeEventListener(eventType, old.wrapped, false);
        if (typeof value === "function") {
          var wrapped = function(e) {
            var rv = value.call(this, e);
            if (rv === false) e.preventDefault(); else if (name === "onbeforeunload" && typeof rv === "string") e.returnValue = rv;
          };
          this.addEventListener(eventType, wrapped, false);
          inlineEventHandlers[name] = {
            value: value,
            wrapped: wrapped
          };
        }
      };
    }
    scope.elementFromPoint = elementFromPoint;
    scope.getEventHandlerGetter = getEventHandlerGetter;
    scope.getEventHandlerSetter = getEventHandlerSetter;
    scope.wrapEventTargetMethods = wrapEventTargetMethods;
    scope.wrappers.BeforeUnloadEvent = BeforeUnloadEvent;
    scope.wrappers.CustomEvent = CustomEvent;
    scope.wrappers.Event = Event;
    scope.wrappers.EventTarget = EventTarget;
    scope.wrappers.FocusEvent = FocusEvent;
    scope.wrappers.MouseEvent = MouseEvent;
    scope.wrappers.UIEvent = UIEvent;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var UIEvent = scope.wrappers.UIEvent;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var wrap = scope.wrap;
    var OriginalTouchEvent = window.TouchEvent;
    if (!OriginalTouchEvent) return;
    var nativeEvent;
    try {
      nativeEvent = document.createEvent("TouchEvent");
    } catch (ex) {
      return;
    }
    var nonEnumDescriptor = {
      enumerable: false
    };
    function nonEnum(obj, prop) {
      Object.defineProperty(obj, prop, nonEnumDescriptor);
    }
    function Touch(impl) {
      setWrapper(impl, this);
    }
    Touch.prototype = {
      get target() {
        return wrap(unsafeUnwrap(this).target);
      }
    };
    var descr = {
      configurable: true,
      enumerable: true,
      get: null
    };
    [ "clientX", "clientY", "screenX", "screenY", "pageX", "pageY", "identifier", "webkitRadiusX", "webkitRadiusY", "webkitRotationAngle", "webkitForce" ].forEach(function(name) {
      descr.get = function() {
        return unsafeUnwrap(this)[name];
      };
      Object.defineProperty(Touch.prototype, name, descr);
    });
    function TouchList() {
      this.length = 0;
      nonEnum(this, "length");
    }
    TouchList.prototype = {
      item: function(index) {
        return this[index];
      }
    };
    function wrapTouchList(nativeTouchList) {
      var list = new TouchList();
      for (var i = 0; i < nativeTouchList.length; i++) {
        list[i] = new Touch(nativeTouchList[i]);
      }
      list.length = i;
      return list;
    }
    function TouchEvent(impl) {
      UIEvent.call(this, impl);
    }
    TouchEvent.prototype = Object.create(UIEvent.prototype);
    mixin(TouchEvent.prototype, {
      get touches() {
        return wrapTouchList(unsafeUnwrap(this).touches);
      },
      get targetTouches() {
        return wrapTouchList(unsafeUnwrap(this).targetTouches);
      },
      get changedTouches() {
        return wrapTouchList(unsafeUnwrap(this).changedTouches);
      },
      initTouchEvent: function() {
        throw new Error("Not implemented");
      }
    });
    registerWrapper(OriginalTouchEvent, TouchEvent, nativeEvent);
    scope.wrappers.Touch = Touch;
    scope.wrappers.TouchEvent = TouchEvent;
    scope.wrappers.TouchList = TouchList;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var unsafeUnwrap = scope.unsafeUnwrap;
    var wrap = scope.wrap;
    var nonEnumDescriptor = {
      enumerable: false
    };
    function nonEnum(obj, prop) {
      Object.defineProperty(obj, prop, nonEnumDescriptor);
    }
    function NodeList() {
      this.length = 0;
      nonEnum(this, "length");
    }
    NodeList.prototype = {
      item: function(index) {
        return this[index];
      }
    };
    nonEnum(NodeList.prototype, "item");
    function wrapNodeList(list) {
      if (list == null) return list;
      var wrapperList = new NodeList();
      for (var i = 0, length = list.length; i < length; i++) {
        wrapperList[i] = wrap(list[i]);
      }
      wrapperList.length = length;
      return wrapperList;
    }
    function addWrapNodeListMethod(wrapperConstructor, name) {
      wrapperConstructor.prototype[name] = function() {
        return wrapNodeList(unsafeUnwrap(this)[name].apply(unsafeUnwrap(this), arguments));
      };
    }
    scope.wrappers.NodeList = NodeList;
    scope.addWrapNodeListMethod = addWrapNodeListMethod;
    scope.wrapNodeList = wrapNodeList;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    scope.wrapHTMLCollection = scope.wrapNodeList;
    scope.wrappers.HTMLCollection = scope.wrappers.NodeList;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var EventTarget = scope.wrappers.EventTarget;
    var NodeList = scope.wrappers.NodeList;
    var TreeScope = scope.TreeScope;
    var assert = scope.assert;
    var defineWrapGetter = scope.defineWrapGetter;
    var enqueueMutation = scope.enqueueMutation;
    var getTreeScope = scope.getTreeScope;
    var isWrapper = scope.isWrapper;
    var mixin = scope.mixin;
    var registerTransientObservers = scope.registerTransientObservers;
    var registerWrapper = scope.registerWrapper;
    var setTreeScope = scope.setTreeScope;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var wrap = scope.wrap;
    var wrapIfNeeded = scope.wrapIfNeeded;
    var wrappers = scope.wrappers;
    function assertIsNodeWrapper(node) {
      assert(node instanceof Node);
    }
    function createOneElementNodeList(node) {
      var nodes = new NodeList();
      nodes[0] = node;
      nodes.length = 1;
      return nodes;
    }
    var surpressMutations = false;
    function enqueueRemovalForInsertedNodes(node, parent, nodes) {
      enqueueMutation(parent, "childList", {
        removedNodes: nodes,
        previousSibling: node.previousSibling,
        nextSibling: node.nextSibling
      });
    }
    function enqueueRemovalForInsertedDocumentFragment(df, nodes) {
      enqueueMutation(df, "childList", {
        removedNodes: nodes
      });
    }
    function collectNodes(node, parentNode, previousNode, nextNode) {
      if (node instanceof DocumentFragment) {
        var nodes = collectNodesForDocumentFragment(node);
        surpressMutations = true;
        for (var i = nodes.length - 1; i >= 0; i--) {
          node.removeChild(nodes[i]);
          nodes[i].parentNode_ = parentNode;
        }
        surpressMutations = false;
        for (var i = 0; i < nodes.length; i++) {
          nodes[i].previousSibling_ = nodes[i - 1] || previousNode;
          nodes[i].nextSibling_ = nodes[i + 1] || nextNode;
        }
        if (previousNode) previousNode.nextSibling_ = nodes[0];
        if (nextNode) nextNode.previousSibling_ = nodes[nodes.length - 1];
        return nodes;
      }
      var nodes = createOneElementNodeList(node);
      var oldParent = node.parentNode;
      if (oldParent) {
        oldParent.removeChild(node);
      }
      node.parentNode_ = parentNode;
      node.previousSibling_ = previousNode;
      node.nextSibling_ = nextNode;
      if (previousNode) previousNode.nextSibling_ = node;
      if (nextNode) nextNode.previousSibling_ = node;
      return nodes;
    }
    function collectNodesNative(node) {
      if (node instanceof DocumentFragment) return collectNodesForDocumentFragment(node);
      var nodes = createOneElementNodeList(node);
      var oldParent = node.parentNode;
      if (oldParent) enqueueRemovalForInsertedNodes(node, oldParent, nodes);
      return nodes;
    }
    function collectNodesForDocumentFragment(node) {
      var nodes = new NodeList();
      var i = 0;
      for (var child = node.firstChild; child; child = child.nextSibling) {
        nodes[i++] = child;
      }
      nodes.length = i;
      enqueueRemovalForInsertedDocumentFragment(node, nodes);
      return nodes;
    }
    function snapshotNodeList(nodeList) {
      return nodeList;
    }
    function nodeWasAdded(node, treeScope) {
      setTreeScope(node, treeScope);
      node.nodeIsInserted_();
    }
    function nodesWereAdded(nodes, parent) {
      var treeScope = getTreeScope(parent);
      for (var i = 0; i < nodes.length; i++) {
        nodeWasAdded(nodes[i], treeScope);
      }
    }
    function nodeWasRemoved(node) {
      setTreeScope(node, new TreeScope(node, null));
    }
    function nodesWereRemoved(nodes) {
      for (var i = 0; i < nodes.length; i++) {
        nodeWasRemoved(nodes[i]);
      }
    }
    function ensureSameOwnerDocument(parent, child) {
      var ownerDoc = parent.nodeType === Node.DOCUMENT_NODE ? parent : parent.ownerDocument;
      if (ownerDoc !== child.ownerDocument) ownerDoc.adoptNode(child);
    }
    function adoptNodesIfNeeded(owner, nodes) {
      if (!nodes.length) return;
      var ownerDoc = owner.ownerDocument;
      if (ownerDoc === nodes[0].ownerDocument) return;
      for (var i = 0; i < nodes.length; i++) {
        scope.adoptNodeNoRemove(nodes[i], ownerDoc);
      }
    }
    function unwrapNodesForInsertion(owner, nodes) {
      adoptNodesIfNeeded(owner, nodes);
      var length = nodes.length;
      if (length === 1) return unwrap(nodes[0]);
      var df = unwrap(owner.ownerDocument.createDocumentFragment());
      for (var i = 0; i < length; i++) {
        df.appendChild(unwrap(nodes[i]));
      }
      return df;
    }
    function clearChildNodes(wrapper) {
      if (wrapper.firstChild_ !== undefined) {
        var child = wrapper.firstChild_;
        while (child) {
          var tmp = child;
          child = child.nextSibling_;
          tmp.parentNode_ = tmp.previousSibling_ = tmp.nextSibling_ = undefined;
        }
      }
      wrapper.firstChild_ = wrapper.lastChild_ = undefined;
    }
    function removeAllChildNodes(wrapper) {
      if (wrapper.invalidateShadowRenderer()) {
        var childWrapper = wrapper.firstChild;
        while (childWrapper) {
          assert(childWrapper.parentNode === wrapper);
          var nextSibling = childWrapper.nextSibling;
          var childNode = unwrap(childWrapper);
          var parentNode = childNode.parentNode;
          if (parentNode) originalRemoveChild.call(parentNode, childNode);
          childWrapper.previousSibling_ = childWrapper.nextSibling_ = childWrapper.parentNode_ = null;
          childWrapper = nextSibling;
        }
        wrapper.firstChild_ = wrapper.lastChild_ = null;
      } else {
        var node = unwrap(wrapper);
        var child = node.firstChild;
        var nextSibling;
        while (child) {
          nextSibling = child.nextSibling;
          originalRemoveChild.call(node, child);
          child = nextSibling;
        }
      }
    }
    function invalidateParent(node) {
      var p = node.parentNode;
      return p && p.invalidateShadowRenderer();
    }
    function cleanupNodes(nodes) {
      for (var i = 0, n; i < nodes.length; i++) {
        n = nodes[i];
        n.parentNode.removeChild(n);
      }
    }
    var originalImportNode = document.importNode;
    var originalCloneNode = window.Node.prototype.cloneNode;
    function cloneNode(node, deep, opt_doc) {
      var clone;
      if (opt_doc) clone = wrap(originalImportNode.call(opt_doc, unsafeUnwrap(node), false)); else clone = wrap(originalCloneNode.call(unsafeUnwrap(node), false));
      if (deep) {
        for (var child = node.firstChild; child; child = child.nextSibling) {
          clone.appendChild(cloneNode(child, true, opt_doc));
        }
        if (node instanceof wrappers.HTMLTemplateElement) {
          var cloneContent = clone.content;
          for (var child = node.content.firstChild; child; child = child.nextSibling) {
            cloneContent.appendChild(cloneNode(child, true, opt_doc));
          }
        }
      }
      return clone;
    }
    function contains(self, child) {
      if (!child || getTreeScope(self) !== getTreeScope(child)) return false;
      for (var node = child; node; node = node.parentNode) {
        if (node === self) return true;
      }
      return false;
    }
    var OriginalNode = window.Node;
    function Node(original) {
      assert(original instanceof OriginalNode);
      EventTarget.call(this, original);
      this.parentNode_ = undefined;
      this.firstChild_ = undefined;
      this.lastChild_ = undefined;
      this.nextSibling_ = undefined;
      this.previousSibling_ = undefined;
      this.treeScope_ = undefined;
    }
    var OriginalDocumentFragment = window.DocumentFragment;
    var originalAppendChild = OriginalNode.prototype.appendChild;
    var originalCompareDocumentPosition = OriginalNode.prototype.compareDocumentPosition;
    var originalIsEqualNode = OriginalNode.prototype.isEqualNode;
    var originalInsertBefore = OriginalNode.prototype.insertBefore;
    var originalRemoveChild = OriginalNode.prototype.removeChild;
    var originalReplaceChild = OriginalNode.prototype.replaceChild;
    var isIe = /Trident|Edge/.test(navigator.userAgent);
    var removeChildOriginalHelper = isIe ? function(parent, child) {
      try {
        originalRemoveChild.call(parent, child);
      } catch (ex) {
        if (!(parent instanceof OriginalDocumentFragment)) throw ex;
      }
    } : function(parent, child) {
      originalRemoveChild.call(parent, child);
    };
    Node.prototype = Object.create(EventTarget.prototype);
    mixin(Node.prototype, {
      appendChild: function(childWrapper) {
        return this.insertBefore(childWrapper, null);
      },
      insertBefore: function(childWrapper, refWrapper) {
        assertIsNodeWrapper(childWrapper);
        var refNode;
        if (refWrapper) {
          if (isWrapper(refWrapper)) {
            refNode = unwrap(refWrapper);
          } else {
            refNode = refWrapper;
            refWrapper = wrap(refNode);
          }
        } else {
          refWrapper = null;
          refNode = null;
        }
        refWrapper && assert(refWrapper.parentNode === this);
        var nodes;
        var previousNode = refWrapper ? refWrapper.previousSibling : this.lastChild;
        var useNative = !this.invalidateShadowRenderer() && !invalidateParent(childWrapper);
        if (useNative) nodes = collectNodesNative(childWrapper); else nodes = collectNodes(childWrapper, this, previousNode, refWrapper);
        if (useNative) {
          ensureSameOwnerDocument(this, childWrapper);
          clearChildNodes(this);
          originalInsertBefore.call(unsafeUnwrap(this), unwrap(childWrapper), refNode);
        } else {
          if (!previousNode) this.firstChild_ = nodes[0];
          if (!refWrapper) {
            this.lastChild_ = nodes[nodes.length - 1];
            if (this.firstChild_ === undefined) this.firstChild_ = this.firstChild;
          }
          var parentNode = refNode ? refNode.parentNode : unsafeUnwrap(this);
          if (parentNode) {
            originalInsertBefore.call(parentNode, unwrapNodesForInsertion(this, nodes), refNode);
          } else {
            adoptNodesIfNeeded(this, nodes);
          }
        }
        enqueueMutation(this, "childList", {
          addedNodes: nodes,
          nextSibling: refWrapper,
          previousSibling: previousNode
        });
        nodesWereAdded(nodes, this);
        return childWrapper;
      },
      removeChild: function(childWrapper) {
        assertIsNodeWrapper(childWrapper);
        if (childWrapper.parentNode !== this) {
          var found = false;
          var childNodes = this.childNodes;
          for (var ieChild = this.firstChild; ieChild; ieChild = ieChild.nextSibling) {
            if (ieChild === childWrapper) {
              found = true;
              break;
            }
          }
          if (!found) {
            throw new Error("NotFoundError");
          }
        }
        var childNode = unwrap(childWrapper);
        var childWrapperNextSibling = childWrapper.nextSibling;
        var childWrapperPreviousSibling = childWrapper.previousSibling;
        if (this.invalidateShadowRenderer()) {
          var thisFirstChild = this.firstChild;
          var thisLastChild = this.lastChild;
          var parentNode = childNode.parentNode;
          if (parentNode) removeChildOriginalHelper(parentNode, childNode);
          if (thisFirstChild === childWrapper) this.firstChild_ = childWrapperNextSibling;
          if (thisLastChild === childWrapper) this.lastChild_ = childWrapperPreviousSibling;
          if (childWrapperPreviousSibling) childWrapperPreviousSibling.nextSibling_ = childWrapperNextSibling;
          if (childWrapperNextSibling) {
            childWrapperNextSibling.previousSibling_ = childWrapperPreviousSibling;
          }
          childWrapper.previousSibling_ = childWrapper.nextSibling_ = childWrapper.parentNode_ = undefined;
        } else {
          clearChildNodes(this);
          removeChildOriginalHelper(unsafeUnwrap(this), childNode);
        }
        if (!surpressMutations) {
          enqueueMutation(this, "childList", {
            removedNodes: createOneElementNodeList(childWrapper),
            nextSibling: childWrapperNextSibling,
            previousSibling: childWrapperPreviousSibling
          });
        }
        registerTransientObservers(this, childWrapper);
        return childWrapper;
      },
      replaceChild: function(newChildWrapper, oldChildWrapper) {
        assertIsNodeWrapper(newChildWrapper);
        var oldChildNode;
        if (isWrapper(oldChildWrapper)) {
          oldChildNode = unwrap(oldChildWrapper);
        } else {
          oldChildNode = oldChildWrapper;
          oldChildWrapper = wrap(oldChildNode);
        }
        if (oldChildWrapper.parentNode !== this) {
          throw new Error("NotFoundError");
        }
        var nextNode = oldChildWrapper.nextSibling;
        var previousNode = oldChildWrapper.previousSibling;
        var nodes;
        var useNative = !this.invalidateShadowRenderer() && !invalidateParent(newChildWrapper);
        if (useNative) {
          nodes = collectNodesNative(newChildWrapper);
        } else {
          if (nextNode === newChildWrapper) nextNode = newChildWrapper.nextSibling;
          nodes = collectNodes(newChildWrapper, this, previousNode, nextNode);
        }
        if (!useNative) {
          if (this.firstChild === oldChildWrapper) this.firstChild_ = nodes[0];
          if (this.lastChild === oldChildWrapper) this.lastChild_ = nodes[nodes.length - 1];
          oldChildWrapper.previousSibling_ = oldChildWrapper.nextSibling_ = oldChildWrapper.parentNode_ = undefined;
          if (oldChildNode.parentNode) {
            originalReplaceChild.call(oldChildNode.parentNode, unwrapNodesForInsertion(this, nodes), oldChildNode);
          }
        } else {
          ensureSameOwnerDocument(this, newChildWrapper);
          clearChildNodes(this);
          originalReplaceChild.call(unsafeUnwrap(this), unwrap(newChildWrapper), oldChildNode);
        }
        enqueueMutation(this, "childList", {
          addedNodes: nodes,
          removedNodes: createOneElementNodeList(oldChildWrapper),
          nextSibling: nextNode,
          previousSibling: previousNode
        });
        nodeWasRemoved(oldChildWrapper);
        nodesWereAdded(nodes, this);
        return oldChildWrapper;
      },
      nodeIsInserted_: function() {
        for (var child = this.firstChild; child; child = child.nextSibling) {
          child.nodeIsInserted_();
        }
      },
      hasChildNodes: function() {
        return this.firstChild !== null;
      },
      get parentNode() {
        return this.parentNode_ !== undefined ? this.parentNode_ : wrap(unsafeUnwrap(this).parentNode);
      },
      get firstChild() {
        return this.firstChild_ !== undefined ? this.firstChild_ : wrap(unsafeUnwrap(this).firstChild);
      },
      get lastChild() {
        return this.lastChild_ !== undefined ? this.lastChild_ : wrap(unsafeUnwrap(this).lastChild);
      },
      get nextSibling() {
        return this.nextSibling_ !== undefined ? this.nextSibling_ : wrap(unsafeUnwrap(this).nextSibling);
      },
      get previousSibling() {
        return this.previousSibling_ !== undefined ? this.previousSibling_ : wrap(unsafeUnwrap(this).previousSibling);
      },
      get parentElement() {
        var p = this.parentNode;
        while (p && p.nodeType !== Node.ELEMENT_NODE) {
          p = p.parentNode;
        }
        return p;
      },
      get textContent() {
        var s = "";
        for (var child = this.firstChild; child; child = child.nextSibling) {
          if (child.nodeType != Node.COMMENT_NODE) {
            s += child.textContent;
          }
        }
        return s;
      },
      set textContent(textContent) {
        if (textContent == null) textContent = "";
        var removedNodes = snapshotNodeList(this.childNodes);
        if (this.invalidateShadowRenderer()) {
          removeAllChildNodes(this);
          if (textContent !== "") {
            var textNode = unsafeUnwrap(this).ownerDocument.createTextNode(textContent);
            this.appendChild(textNode);
          }
        } else {
          clearChildNodes(this);
          unsafeUnwrap(this).textContent = textContent;
        }
        var addedNodes = snapshotNodeList(this.childNodes);
        enqueueMutation(this, "childList", {
          addedNodes: addedNodes,
          removedNodes: removedNodes
        });
        nodesWereRemoved(removedNodes);
        nodesWereAdded(addedNodes, this);
      },
      get childNodes() {
        var wrapperList = new NodeList();
        var i = 0;
        for (var child = this.firstChild; child; child = child.nextSibling) {
          wrapperList[i++] = child;
        }
        wrapperList.length = i;
        return wrapperList;
      },
      cloneNode: function(deep) {
        return cloneNode(this, deep);
      },
      contains: function(child) {
        return contains(this, wrapIfNeeded(child));
      },
      compareDocumentPosition: function(otherNode) {
        return originalCompareDocumentPosition.call(unsafeUnwrap(this), unwrapIfNeeded(otherNode));
      },
      isEqualNode: function(otherNode) {
        return originalIsEqualNode.call(unsafeUnwrap(this), unwrapIfNeeded(otherNode));
      },
      normalize: function() {
        var nodes = snapshotNodeList(this.childNodes);
        var remNodes = [];
        var s = "";
        var modNode;
        for (var i = 0, n; i < nodes.length; i++) {
          n = nodes[i];
          if (n.nodeType === Node.TEXT_NODE) {
            if (!modNode && !n.data.length) this.removeChild(n); else if (!modNode) modNode = n; else {
              s += n.data;
              remNodes.push(n);
            }
          } else {
            if (modNode && remNodes.length) {
              modNode.data += s;
              cleanupNodes(remNodes);
            }
            remNodes = [];
            s = "";
            modNode = null;
            if (n.childNodes.length) n.normalize();
          }
        }
        if (modNode && remNodes.length) {
          modNode.data += s;
          cleanupNodes(remNodes);
        }
      }
    });
    defineWrapGetter(Node, "ownerDocument");
    registerWrapper(OriginalNode, Node, document.createDocumentFragment());
    delete Node.prototype.querySelector;
    delete Node.prototype.querySelectorAll;
    Node.prototype = mixin(Object.create(EventTarget.prototype), Node.prototype);
    scope.cloneNode = cloneNode;
    scope.nodeWasAdded = nodeWasAdded;
    scope.nodeWasRemoved = nodeWasRemoved;
    scope.nodesWereAdded = nodesWereAdded;
    scope.nodesWereRemoved = nodesWereRemoved;
    scope.originalInsertBefore = originalInsertBefore;
    scope.originalRemoveChild = originalRemoveChild;
    scope.snapshotNodeList = snapshotNodeList;
    scope.wrappers.Node = Node;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLCollection = scope.wrappers.HTMLCollection;
    var NodeList = scope.wrappers.NodeList;
    var getTreeScope = scope.getTreeScope;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var wrap = scope.wrap;
    var originalDocumentQuerySelector = document.querySelector;
    var originalElementQuerySelector = document.documentElement.querySelector;
    var originalDocumentQuerySelectorAll = document.querySelectorAll;
    var originalElementQuerySelectorAll = document.documentElement.querySelectorAll;
    var originalDocumentGetElementsByTagName = document.getElementsByTagName;
    var originalElementGetElementsByTagName = document.documentElement.getElementsByTagName;
    var originalDocumentGetElementsByTagNameNS = document.getElementsByTagNameNS;
    var originalElementGetElementsByTagNameNS = document.documentElement.getElementsByTagNameNS;
    var OriginalElement = window.Element;
    var OriginalDocument = window.HTMLDocument || window.Document;
    function filterNodeList(list, index, result, deep) {
      var wrappedItem = null;
      var root = null;
      for (var i = 0, length = list.length; i < length; i++) {
        wrappedItem = wrap(list[i]);
        if (!deep && (root = getTreeScope(wrappedItem).root)) {
          if (root instanceof scope.wrappers.ShadowRoot) {
            continue;
          }
        }
        result[index++] = wrappedItem;
      }
      return index;
    }
    function shimSelector(selector) {
      return String(selector).replace(/\/deep\/|::shadow|>>>/g, " ");
    }
    function shimMatchesSelector(selector) {
      return String(selector).replace(/:host\(([^\s]+)\)/g, "$1").replace(/([^\s]):host/g, "$1").replace(":host", "*").replace(/\^|\/shadow\/|\/shadow-deep\/|::shadow|\/deep\/|::content|>>>/g, " ");
    }
    function findOne(node, selector) {
      var m, el = node.firstElementChild;
      while (el) {
        if (el.matches(selector)) return el;
        m = findOne(el, selector);
        if (m) return m;
        el = el.nextElementSibling;
      }
      return null;
    }
    function matchesSelector(el, selector) {
      return el.matches(selector);
    }
    var XHTML_NS = "http://www.w3.org/1999/xhtml";
    function matchesTagName(el, localName, localNameLowerCase) {
      var ln = el.localName;
      return ln === localName || ln === localNameLowerCase && el.namespaceURI === XHTML_NS;
    }
    function matchesEveryThing() {
      return true;
    }
    function matchesLocalNameOnly(el, ns, localName) {
      return el.localName === localName;
    }
    function matchesNameSpace(el, ns) {
      return el.namespaceURI === ns;
    }
    function matchesLocalNameNS(el, ns, localName) {
      return el.namespaceURI === ns && el.localName === localName;
    }
    function findElements(node, index, result, p, arg0, arg1) {
      var el = node.firstElementChild;
      while (el) {
        if (p(el, arg0, arg1)) result[index++] = el;
        index = findElements(el, index, result, p, arg0, arg1);
        el = el.nextElementSibling;
      }
      return index;
    }
    function querySelectorAllFiltered(p, index, result, selector, deep) {
      var target = unsafeUnwrap(this);
      var list;
      var root = getTreeScope(this).root;
      if (root instanceof scope.wrappers.ShadowRoot) {
        return findElements(this, index, result, p, selector, null);
      } else if (target instanceof OriginalElement) {
        list = originalElementQuerySelectorAll.call(target, selector);
      } else if (target instanceof OriginalDocument) {
        list = originalDocumentQuerySelectorAll.call(target, selector);
      } else {
        return findElements(this, index, result, p, selector, null);
      }
      return filterNodeList(list, index, result, deep);
    }
    var SelectorsInterface = {
      querySelector: function(selector) {
        var shimmed = shimSelector(selector);
        var deep = shimmed !== selector;
        selector = shimmed;
        var target = unsafeUnwrap(this);
        var wrappedItem;
        var root = getTreeScope(this).root;
        if (root instanceof scope.wrappers.ShadowRoot) {
          return findOne(this, selector);
        } else if (target instanceof OriginalElement) {
          wrappedItem = wrap(originalElementQuerySelector.call(target, selector));
        } else if (target instanceof OriginalDocument) {
          wrappedItem = wrap(originalDocumentQuerySelector.call(target, selector));
        } else {
          return findOne(this, selector);
        }
        if (!wrappedItem) {
          return wrappedItem;
        } else if (!deep && (root = getTreeScope(wrappedItem).root)) {
          if (root instanceof scope.wrappers.ShadowRoot) {
            return findOne(this, selector);
          }
        }
        return wrappedItem;
      },
      querySelectorAll: function(selector) {
        var shimmed = shimSelector(selector);
        var deep = shimmed !== selector;
        selector = shimmed;
        var result = new NodeList();
        result.length = querySelectorAllFiltered.call(this, matchesSelector, 0, result, selector, deep);
        return result;
      }
    };
    var MatchesInterface = {
      matches: function(selector) {
        selector = shimMatchesSelector(selector);
        return scope.originalMatches.call(unsafeUnwrap(this), selector);
      }
    };
    function getElementsByTagNameFiltered(p, index, result, localName, lowercase) {
      var target = unsafeUnwrap(this);
      var list;
      var root = getTreeScope(this).root;
      if (root instanceof scope.wrappers.ShadowRoot) {
        return findElements(this, index, result, p, localName, lowercase);
      } else if (target instanceof OriginalElement) {
        list = originalElementGetElementsByTagName.call(target, localName, lowercase);
      } else if (target instanceof OriginalDocument) {
        list = originalDocumentGetElementsByTagName.call(target, localName, lowercase);
      } else {
        return findElements(this, index, result, p, localName, lowercase);
      }
      return filterNodeList(list, index, result, false);
    }
    function getElementsByTagNameNSFiltered(p, index, result, ns, localName) {
      var target = unsafeUnwrap(this);
      var list;
      var root = getTreeScope(this).root;
      if (root instanceof scope.wrappers.ShadowRoot) {
        return findElements(this, index, result, p, ns, localName);
      } else if (target instanceof OriginalElement) {
        list = originalElementGetElementsByTagNameNS.call(target, ns, localName);
      } else if (target instanceof OriginalDocument) {
        list = originalDocumentGetElementsByTagNameNS.call(target, ns, localName);
      } else {
        return findElements(this, index, result, p, ns, localName);
      }
      return filterNodeList(list, index, result, false);
    }
    var GetElementsByInterface = {
      getElementsByTagName: function(localName) {
        var result = new HTMLCollection();
        var match = localName === "*" ? matchesEveryThing : matchesTagName;
        result.length = getElementsByTagNameFiltered.call(this, match, 0, result, localName, localName.toLowerCase());
        return result;
      },
      getElementsByClassName: function(className) {
        return this.querySelectorAll("." + className);
      },
      getElementsByTagNameNS: function(ns, localName) {
        var result = new HTMLCollection();
        var match = null;
        if (ns === "*") {
          match = localName === "*" ? matchesEveryThing : matchesLocalNameOnly;
        } else {
          match = localName === "*" ? matchesNameSpace : matchesLocalNameNS;
        }
        result.length = getElementsByTagNameNSFiltered.call(this, match, 0, result, ns || null, localName);
        return result;
      }
    };
    scope.GetElementsByInterface = GetElementsByInterface;
    scope.SelectorsInterface = SelectorsInterface;
    scope.MatchesInterface = MatchesInterface;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var NodeList = scope.wrappers.NodeList;
    function forwardElement(node) {
      while (node && node.nodeType !== Node.ELEMENT_NODE) {
        node = node.nextSibling;
      }
      return node;
    }
    function backwardsElement(node) {
      while (node && node.nodeType !== Node.ELEMENT_NODE) {
        node = node.previousSibling;
      }
      return node;
    }
    var ParentNodeInterface = {
      get firstElementChild() {
        return forwardElement(this.firstChild);
      },
      get lastElementChild() {
        return backwardsElement(this.lastChild);
      },
      get childElementCount() {
        var count = 0;
        for (var child = this.firstElementChild; child; child = child.nextElementSibling) {
          count++;
        }
        return count;
      },
      get children() {
        var wrapperList = new NodeList();
        var i = 0;
        for (var child = this.firstElementChild; child; child = child.nextElementSibling) {
          wrapperList[i++] = child;
        }
        wrapperList.length = i;
        return wrapperList;
      },
      remove: function() {
        var p = this.parentNode;
        if (p) p.removeChild(this);
      }
    };
    var ChildNodeInterface = {
      get nextElementSibling() {
        return forwardElement(this.nextSibling);
      },
      get previousElementSibling() {
        return backwardsElement(this.previousSibling);
      }
    };
    var NonElementParentNodeInterface = {
      getElementById: function(id) {
        if (/[ \t\n\r\f]/.test(id)) return null;
        return this.querySelector('[id="' + id + '"]');
      }
    };
    scope.ChildNodeInterface = ChildNodeInterface;
    scope.NonElementParentNodeInterface = NonElementParentNodeInterface;
    scope.ParentNodeInterface = ParentNodeInterface;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var ChildNodeInterface = scope.ChildNodeInterface;
    var Node = scope.wrappers.Node;
    var enqueueMutation = scope.enqueueMutation;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var OriginalCharacterData = window.CharacterData;
    function CharacterData(node) {
      Node.call(this, node);
    }
    CharacterData.prototype = Object.create(Node.prototype);
    mixin(CharacterData.prototype, {
      get nodeValue() {
        return this.data;
      },
      set nodeValue(data) {
        this.data = data;
      },
      get textContent() {
        return this.data;
      },
      set textContent(value) {
        this.data = value;
      },
      get data() {
        return unsafeUnwrap(this).data;
      },
      set data(value) {
        var oldValue = unsafeUnwrap(this).data;
        enqueueMutation(this, "characterData", {
          oldValue: oldValue
        });
        unsafeUnwrap(this).data = value;
      }
    });
    mixin(CharacterData.prototype, ChildNodeInterface);
    registerWrapper(OriginalCharacterData, CharacterData, document.createTextNode(""));
    scope.wrappers.CharacterData = CharacterData;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var CharacterData = scope.wrappers.CharacterData;
    var enqueueMutation = scope.enqueueMutation;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    function toUInt32(x) {
      return x >>> 0;
    }
    var OriginalText = window.Text;
    function Text(node) {
      CharacterData.call(this, node);
    }
    Text.prototype = Object.create(CharacterData.prototype);
    mixin(Text.prototype, {
      splitText: function(offset) {
        offset = toUInt32(offset);
        var s = this.data;
        if (offset > s.length) throw new Error("IndexSizeError");
        var head = s.slice(0, offset);
        var tail = s.slice(offset);
        this.data = head;
        var newTextNode = this.ownerDocument.createTextNode(tail);
        if (this.parentNode) this.parentNode.insertBefore(newTextNode, this.nextSibling);
        return newTextNode;
      }
    });
    registerWrapper(OriginalText, Text, document.createTextNode(""));
    scope.wrappers.Text = Text;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    if (!window.DOMTokenList) {
      console.warn("Missing DOMTokenList prototype, please include a " + "compatible classList polyfill such as http://goo.gl/uTcepH.");
      return;
    }
    var unsafeUnwrap = scope.unsafeUnwrap;
    var enqueueMutation = scope.enqueueMutation;
    function getClass(el) {
      return unsafeUnwrap(el).getAttribute("class");
    }
    function enqueueClassAttributeChange(el, oldValue) {
      enqueueMutation(el, "attributes", {
        name: "class",
        namespace: null,
        oldValue: oldValue
      });
    }
    function invalidateClass(el) {
      scope.invalidateRendererBasedOnAttribute(el, "class");
    }
    function changeClass(tokenList, method, args) {
      var ownerElement = tokenList.ownerElement_;
      if (ownerElement == null) {
        return method.apply(tokenList, args);
      }
      var oldValue = getClass(ownerElement);
      var retv = method.apply(tokenList, args);
      if (getClass(ownerElement) !== oldValue) {
        enqueueClassAttributeChange(ownerElement, oldValue);
        invalidateClass(ownerElement);
      }
      return retv;
    }
    var oldAdd = DOMTokenList.prototype.add;
    DOMTokenList.prototype.add = function() {
      changeClass(this, oldAdd, arguments);
    };
    var oldRemove = DOMTokenList.prototype.remove;
    DOMTokenList.prototype.remove = function() {
      changeClass(this, oldRemove, arguments);
    };
    var oldToggle = DOMTokenList.prototype.toggle;
    DOMTokenList.prototype.toggle = function() {
      return changeClass(this, oldToggle, arguments);
    };
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var ChildNodeInterface = scope.ChildNodeInterface;
    var GetElementsByInterface = scope.GetElementsByInterface;
    var Node = scope.wrappers.Node;
    var ParentNodeInterface = scope.ParentNodeInterface;
    var SelectorsInterface = scope.SelectorsInterface;
    var MatchesInterface = scope.MatchesInterface;
    var addWrapNodeListMethod = scope.addWrapNodeListMethod;
    var enqueueMutation = scope.enqueueMutation;
    var mixin = scope.mixin;
    var oneOf = scope.oneOf;
    var registerWrapper = scope.registerWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var wrappers = scope.wrappers;
    var OriginalElement = window.Element;
    var matchesNames = [ "matches", "mozMatchesSelector", "msMatchesSelector", "webkitMatchesSelector" ].filter(function(name) {
      return OriginalElement.prototype[name];
    });
    var matchesName = matchesNames[0];
    var originalMatches = OriginalElement.prototype[matchesName];
    function invalidateRendererBasedOnAttribute(element, name) {
      var p = element.parentNode;
      if (!p || !p.shadowRoot) return;
      var renderer = scope.getRendererForHost(p);
      if (renderer.dependsOnAttribute(name)) renderer.invalidate();
    }
    function enqueAttributeChange(element, name, oldValue) {
      enqueueMutation(element, "attributes", {
        name: name,
        namespace: null,
        oldValue: oldValue
      });
    }
    var classListTable = new WeakMap();
    function Element(node) {
      Node.call(this, node);
    }
    Element.prototype = Object.create(Node.prototype);
    mixin(Element.prototype, {
      createShadowRoot: function() {
        var newShadowRoot = new wrappers.ShadowRoot(this);
        unsafeUnwrap(this).polymerShadowRoot_ = newShadowRoot;
        var renderer = scope.getRendererForHost(this);
        renderer.invalidate();
        return newShadowRoot;
      },
      get shadowRoot() {
        return unsafeUnwrap(this).polymerShadowRoot_ || null;
      },
      setAttribute: function(name, value) {
        var oldValue = unsafeUnwrap(this).getAttribute(name);
        unsafeUnwrap(this).setAttribute(name, value);
        enqueAttributeChange(this, name, oldValue);
        invalidateRendererBasedOnAttribute(this, name);
      },
      removeAttribute: function(name) {
        var oldValue = unsafeUnwrap(this).getAttribute(name);
        unsafeUnwrap(this).removeAttribute(name);
        enqueAttributeChange(this, name, oldValue);
        invalidateRendererBasedOnAttribute(this, name);
      },
      get classList() {
        var list = classListTable.get(this);
        if (!list) {
          list = unsafeUnwrap(this).classList;
          if (!list) return;
          list.ownerElement_ = this;
          classListTable.set(this, list);
        }
        return list;
      },
      get className() {
        return unsafeUnwrap(this).className;
      },
      set className(v) {
        this.setAttribute("class", v);
      },
      get id() {
        return unsafeUnwrap(this).id;
      },
      set id(v) {
        this.setAttribute("id", v);
      }
    });
    matchesNames.forEach(function(name) {
      if (name !== "matches") {
        Element.prototype[name] = function(selector) {
          return this.matches(selector);
        };
      }
    });
    if (OriginalElement.prototype.webkitCreateShadowRoot) {
      Element.prototype.webkitCreateShadowRoot = Element.prototype.createShadowRoot;
    }
    mixin(Element.prototype, ChildNodeInterface);
    mixin(Element.prototype, GetElementsByInterface);
    mixin(Element.prototype, ParentNodeInterface);
    mixin(Element.prototype, SelectorsInterface);
    mixin(Element.prototype, MatchesInterface);
    registerWrapper(OriginalElement, Element, document.createElementNS(null, "x"));
    scope.invalidateRendererBasedOnAttribute = invalidateRendererBasedOnAttribute;
    scope.matchesNames = matchesNames;
    scope.originalMatches = originalMatches;
    scope.wrappers.Element = Element;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var Element = scope.wrappers.Element;
    var defineGetter = scope.defineGetter;
    var enqueueMutation = scope.enqueueMutation;
    var mixin = scope.mixin;
    var nodesWereAdded = scope.nodesWereAdded;
    var nodesWereRemoved = scope.nodesWereRemoved;
    var registerWrapper = scope.registerWrapper;
    var snapshotNodeList = scope.snapshotNodeList;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var wrappers = scope.wrappers;
    var escapeAttrRegExp = /[&\u00A0"]/g;
    var escapeDataRegExp = /[&\u00A0<>]/g;
    function escapeReplace(c) {
      switch (c) {
       case "&":
        return "&amp;";

       case "<":
        return "&lt;";

       case ">":
        return "&gt;";

       case '"':
        return "&quot;";

       case " ":
        return "&nbsp;";
      }
    }
    function escapeAttr(s) {
      return s.replace(escapeAttrRegExp, escapeReplace);
    }
    function escapeData(s) {
      return s.replace(escapeDataRegExp, escapeReplace);
    }
    function makeSet(arr) {
      var set = {};
      for (var i = 0; i < arr.length; i++) {
        set[arr[i]] = true;
      }
      return set;
    }
    var voidElements = makeSet([ "area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr" ]);
    var plaintextParents = makeSet([ "style", "script", "xmp", "iframe", "noembed", "noframes", "plaintext", "noscript" ]);
    var XHTML_NS = "http://www.w3.org/1999/xhtml";
    function needsSelfClosingSlash(node) {
      if (node.namespaceURI !== XHTML_NS) return true;
      var doctype = node.ownerDocument.doctype;
      return doctype && doctype.publicId && doctype.systemId;
    }
    function getOuterHTML(node, parentNode) {
      switch (node.nodeType) {
       case Node.ELEMENT_NODE:
        var tagName = node.tagName.toLowerCase();
        var s = "<" + tagName;
        var attrs = node.attributes;
        for (var i = 0, attr; attr = attrs[i]; i++) {
          s += " " + attr.name + '="' + escapeAttr(attr.value) + '"';
        }
        if (voidElements[tagName]) {
          if (needsSelfClosingSlash(node)) s += "/";
          return s + ">";
        }
        return s + ">" + getInnerHTML(node) + "</" + tagName + ">";

       case Node.TEXT_NODE:
        var data = node.data;
        if (parentNode && plaintextParents[parentNode.localName]) return data;
        return escapeData(data);

       case Node.COMMENT_NODE:
        return "<!--" + node.data + "-->";

       default:
        console.error(node);
        throw new Error("not implemented");
      }
    }
    function getInnerHTML(node) {
      if (node instanceof wrappers.HTMLTemplateElement) node = node.content;
      var s = "";
      for (var child = node.firstChild; child; child = child.nextSibling) {
        s += getOuterHTML(child, node);
      }
      return s;
    }
    function setInnerHTML(node, value, opt_tagName) {
      var tagName = opt_tagName || "div";
      node.textContent = "";
      var tempElement = unwrap(node.ownerDocument.createElement(tagName));
      tempElement.innerHTML = value;
      var firstChild;
      while (firstChild = tempElement.firstChild) {
        node.appendChild(wrap(firstChild));
      }
    }
    var oldIe = /MSIE/.test(navigator.userAgent);
    var OriginalHTMLElement = window.HTMLElement;
    var OriginalHTMLTemplateElement = window.HTMLTemplateElement;
    function HTMLElement(node) {
      Element.call(this, node);
    }
    HTMLElement.prototype = Object.create(Element.prototype);
    mixin(HTMLElement.prototype, {
      get innerHTML() {
        return getInnerHTML(this);
      },
      set innerHTML(value) {
        if (oldIe && plaintextParents[this.localName]) {
          this.textContent = value;
          return;
        }
        var removedNodes = snapshotNodeList(this.childNodes);
        if (this.invalidateShadowRenderer()) {
          if (this instanceof wrappers.HTMLTemplateElement) setInnerHTML(this.content, value); else setInnerHTML(this, value, this.tagName);
        } else if (!OriginalHTMLTemplateElement && this instanceof wrappers.HTMLTemplateElement) {
          setInnerHTML(this.content, value);
        } else {
          unsafeUnwrap(this).innerHTML = value;
        }
        var addedNodes = snapshotNodeList(this.childNodes);
        enqueueMutation(this, "childList", {
          addedNodes: addedNodes,
          removedNodes: removedNodes
        });
        nodesWereRemoved(removedNodes);
        nodesWereAdded(addedNodes, this);
      },
      get outerHTML() {
        return getOuterHTML(this, this.parentNode);
      },
      set outerHTML(value) {
        var p = this.parentNode;
        if (p) {
          p.invalidateShadowRenderer();
          var df = frag(p, value);
          p.replaceChild(df, this);
        }
      },
      insertAdjacentHTML: function(position, text) {
        var contextElement, refNode;
        switch (String(position).toLowerCase()) {
         case "beforebegin":
          contextElement = this.parentNode;
          refNode = this;
          break;

         case "afterend":
          contextElement = this.parentNode;
          refNode = this.nextSibling;
          break;

         case "afterbegin":
          contextElement = this;
          refNode = this.firstChild;
          break;

         case "beforeend":
          contextElement = this;
          refNode = null;
          break;

         default:
          return;
        }
        var df = frag(contextElement, text);
        contextElement.insertBefore(df, refNode);
      },
      get hidden() {
        return this.hasAttribute("hidden");
      },
      set hidden(v) {
        if (v) {
          this.setAttribute("hidden", "");
        } else {
          this.removeAttribute("hidden");
        }
      }
    });
    function frag(contextElement, html) {
      var p = unwrap(contextElement.cloneNode(false));
      p.innerHTML = html;
      var df = unwrap(document.createDocumentFragment());
      var c;
      while (c = p.firstChild) {
        df.appendChild(c);
      }
      return wrap(df);
    }
    function getter(name) {
      return function() {
        scope.renderAllPending();
        return unsafeUnwrap(this)[name];
      };
    }
    function getterRequiresRendering(name) {
      defineGetter(HTMLElement, name, getter(name));
    }
    [ "clientHeight", "clientLeft", "clientTop", "clientWidth", "offsetHeight", "offsetLeft", "offsetTop", "offsetWidth", "scrollHeight", "scrollWidth" ].forEach(getterRequiresRendering);
    function getterAndSetterRequiresRendering(name) {
      Object.defineProperty(HTMLElement.prototype, name, {
        get: getter(name),
        set: function(v) {
          scope.renderAllPending();
          unsafeUnwrap(this)[name] = v;
        },
        configurable: true,
        enumerable: true
      });
    }
    [ "scrollLeft", "scrollTop" ].forEach(getterAndSetterRequiresRendering);
    function methodRequiresRendering(name) {
      Object.defineProperty(HTMLElement.prototype, name, {
        value: function() {
          scope.renderAllPending();
          return unsafeUnwrap(this)[name].apply(unsafeUnwrap(this), arguments);
        },
        configurable: true,
        enumerable: true
      });
    }
    [ "getBoundingClientRect", "getClientRects", "scrollIntoView" ].forEach(methodRequiresRendering);
    registerWrapper(OriginalHTMLElement, HTMLElement, document.createElement("b"));
    scope.wrappers.HTMLElement = HTMLElement;
    scope.getInnerHTML = getInnerHTML;
    scope.setInnerHTML = setInnerHTML;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var wrap = scope.wrap;
    var OriginalHTMLCanvasElement = window.HTMLCanvasElement;
    function HTMLCanvasElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLCanvasElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLCanvasElement.prototype, {
      getContext: function() {
        var context = unsafeUnwrap(this).getContext.apply(unsafeUnwrap(this), arguments);
        return context && wrap(context);
      }
    });
    registerWrapper(OriginalHTMLCanvasElement, HTMLCanvasElement, document.createElement("canvas"));
    scope.wrappers.HTMLCanvasElement = HTMLCanvasElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var OriginalHTMLContentElement = window.HTMLContentElement;
    function HTMLContentElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLContentElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLContentElement.prototype, {
      constructor: HTMLContentElement,
      get select() {
        return this.getAttribute("select");
      },
      set select(value) {
        this.setAttribute("select", value);
      },
      setAttribute: function(n, v) {
        HTMLElement.prototype.setAttribute.call(this, n, v);
        if (String(n).toLowerCase() === "select") this.invalidateShadowRenderer(true);
      }
    });
    if (OriginalHTMLContentElement) registerWrapper(OriginalHTMLContentElement, HTMLContentElement);
    scope.wrappers.HTMLContentElement = HTMLContentElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var wrapHTMLCollection = scope.wrapHTMLCollection;
    var unwrap = scope.unwrap;
    var OriginalHTMLFormElement = window.HTMLFormElement;
    function HTMLFormElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLFormElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLFormElement.prototype, {
      get elements() {
        return wrapHTMLCollection(unwrap(this).elements);
      }
    });
    registerWrapper(OriginalHTMLFormElement, HTMLFormElement, document.createElement("form"));
    scope.wrappers.HTMLFormElement = HTMLFormElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var registerWrapper = scope.registerWrapper;
    var unwrap = scope.unwrap;
    var rewrap = scope.rewrap;
    var OriginalHTMLImageElement = window.HTMLImageElement;
    function HTMLImageElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLImageElement.prototype = Object.create(HTMLElement.prototype);
    registerWrapper(OriginalHTMLImageElement, HTMLImageElement, document.createElement("img"));
    function Image(width, height) {
      if (!(this instanceof Image)) {
        throw new TypeError("DOM object constructor cannot be called as a function.");
      }
      var node = unwrap(document.createElement("img"));
      HTMLElement.call(this, node);
      rewrap(node, this);
      if (width !== undefined) node.width = width;
      if (height !== undefined) node.height = height;
    }
    Image.prototype = HTMLImageElement.prototype;
    scope.wrappers.HTMLImageElement = HTMLImageElement;
    scope.wrappers.Image = Image;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var NodeList = scope.wrappers.NodeList;
    var registerWrapper = scope.registerWrapper;
    var OriginalHTMLShadowElement = window.HTMLShadowElement;
    function HTMLShadowElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLShadowElement.prototype = Object.create(HTMLElement.prototype);
    HTMLShadowElement.prototype.constructor = HTMLShadowElement;
    if (OriginalHTMLShadowElement) registerWrapper(OriginalHTMLShadowElement, HTMLShadowElement);
    scope.wrappers.HTMLShadowElement = HTMLShadowElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var contentTable = new WeakMap();
    var templateContentsOwnerTable = new WeakMap();
    function getTemplateContentsOwner(doc) {
      if (!doc.defaultView) return doc;
      var d = templateContentsOwnerTable.get(doc);
      if (!d) {
        d = doc.implementation.createHTMLDocument("");
        while (d.lastChild) {
          d.removeChild(d.lastChild);
        }
        templateContentsOwnerTable.set(doc, d);
      }
      return d;
    }
    function extractContent(templateElement) {
      var doc = getTemplateContentsOwner(templateElement.ownerDocument);
      var df = unwrap(doc.createDocumentFragment());
      var child;
      while (child = templateElement.firstChild) {
        df.appendChild(child);
      }
      return df;
    }
    var OriginalHTMLTemplateElement = window.HTMLTemplateElement;
    function HTMLTemplateElement(node) {
      HTMLElement.call(this, node);
      if (!OriginalHTMLTemplateElement) {
        var content = extractContent(node);
        contentTable.set(this, wrap(content));
      }
    }
    HTMLTemplateElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLTemplateElement.prototype, {
      constructor: HTMLTemplateElement,
      get content() {
        if (OriginalHTMLTemplateElement) return wrap(unsafeUnwrap(this).content);
        return contentTable.get(this);
      }
    });
    if (OriginalHTMLTemplateElement) registerWrapper(OriginalHTMLTemplateElement, HTMLTemplateElement);
    scope.wrappers.HTMLTemplateElement = HTMLTemplateElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var registerWrapper = scope.registerWrapper;
    var OriginalHTMLMediaElement = window.HTMLMediaElement;
    if (!OriginalHTMLMediaElement) return;
    function HTMLMediaElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLMediaElement.prototype = Object.create(HTMLElement.prototype);
    registerWrapper(OriginalHTMLMediaElement, HTMLMediaElement, document.createElement("audio"));
    scope.wrappers.HTMLMediaElement = HTMLMediaElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLMediaElement = scope.wrappers.HTMLMediaElement;
    var registerWrapper = scope.registerWrapper;
    var unwrap = scope.unwrap;
    var rewrap = scope.rewrap;
    var OriginalHTMLAudioElement = window.HTMLAudioElement;
    if (!OriginalHTMLAudioElement) return;
    function HTMLAudioElement(node) {
      HTMLMediaElement.call(this, node);
    }
    HTMLAudioElement.prototype = Object.create(HTMLMediaElement.prototype);
    registerWrapper(OriginalHTMLAudioElement, HTMLAudioElement, document.createElement("audio"));
    function Audio(src) {
      if (!(this instanceof Audio)) {
        throw new TypeError("DOM object constructor cannot be called as a function.");
      }
      var node = unwrap(document.createElement("audio"));
      HTMLMediaElement.call(this, node);
      rewrap(node, this);
      node.setAttribute("preload", "auto");
      if (src !== undefined) node.setAttribute("src", src);
    }
    Audio.prototype = HTMLAudioElement.prototype;
    scope.wrappers.HTMLAudioElement = HTMLAudioElement;
    scope.wrappers.Audio = Audio;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var rewrap = scope.rewrap;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var OriginalHTMLOptionElement = window.HTMLOptionElement;
    function trimText(s) {
      return s.replace(/\s+/g, " ").trim();
    }
    function HTMLOptionElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLOptionElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLOptionElement.prototype, {
      get text() {
        return trimText(this.textContent);
      },
      set text(value) {
        this.textContent = trimText(String(value));
      },
      get form() {
        return wrap(unwrap(this).form);
      }
    });
    registerWrapper(OriginalHTMLOptionElement, HTMLOptionElement, document.createElement("option"));
    function Option(text, value, defaultSelected, selected) {
      if (!(this instanceof Option)) {
        throw new TypeError("DOM object constructor cannot be called as a function.");
      }
      var node = unwrap(document.createElement("option"));
      HTMLElement.call(this, node);
      rewrap(node, this);
      if (text !== undefined) node.text = text;
      if (value !== undefined) node.setAttribute("value", value);
      if (defaultSelected === true) node.setAttribute("selected", "");
      node.selected = selected === true;
    }
    Option.prototype = HTMLOptionElement.prototype;
    scope.wrappers.HTMLOptionElement = HTMLOptionElement;
    scope.wrappers.Option = Option;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var OriginalHTMLSelectElement = window.HTMLSelectElement;
    function HTMLSelectElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLSelectElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLSelectElement.prototype, {
      add: function(element, before) {
        if (typeof before === "object") before = unwrap(before);
        unwrap(this).add(unwrap(element), before);
      },
      remove: function(indexOrNode) {
        if (indexOrNode === undefined) {
          HTMLElement.prototype.remove.call(this);
          return;
        }
        if (typeof indexOrNode === "object") indexOrNode = unwrap(indexOrNode);
        unwrap(this).remove(indexOrNode);
      },
      get form() {
        return wrap(unwrap(this).form);
      }
    });
    registerWrapper(OriginalHTMLSelectElement, HTMLSelectElement, document.createElement("select"));
    scope.wrappers.HTMLSelectElement = HTMLSelectElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var wrapHTMLCollection = scope.wrapHTMLCollection;
    var OriginalHTMLTableElement = window.HTMLTableElement;
    function HTMLTableElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLTableElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLTableElement.prototype, {
      get caption() {
        return wrap(unwrap(this).caption);
      },
      createCaption: function() {
        return wrap(unwrap(this).createCaption());
      },
      get tHead() {
        return wrap(unwrap(this).tHead);
      },
      createTHead: function() {
        return wrap(unwrap(this).createTHead());
      },
      createTFoot: function() {
        return wrap(unwrap(this).createTFoot());
      },
      get tFoot() {
        return wrap(unwrap(this).tFoot);
      },
      get tBodies() {
        return wrapHTMLCollection(unwrap(this).tBodies);
      },
      createTBody: function() {
        return wrap(unwrap(this).createTBody());
      },
      get rows() {
        return wrapHTMLCollection(unwrap(this).rows);
      },
      insertRow: function(index) {
        return wrap(unwrap(this).insertRow(index));
      }
    });
    registerWrapper(OriginalHTMLTableElement, HTMLTableElement, document.createElement("table"));
    scope.wrappers.HTMLTableElement = HTMLTableElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var wrapHTMLCollection = scope.wrapHTMLCollection;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var OriginalHTMLTableSectionElement = window.HTMLTableSectionElement;
    function HTMLTableSectionElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLTableSectionElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLTableSectionElement.prototype, {
      constructor: HTMLTableSectionElement,
      get rows() {
        return wrapHTMLCollection(unwrap(this).rows);
      },
      insertRow: function(index) {
        return wrap(unwrap(this).insertRow(index));
      }
    });
    registerWrapper(OriginalHTMLTableSectionElement, HTMLTableSectionElement, document.createElement("thead"));
    scope.wrappers.HTMLTableSectionElement = HTMLTableSectionElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var wrapHTMLCollection = scope.wrapHTMLCollection;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var OriginalHTMLTableRowElement = window.HTMLTableRowElement;
    function HTMLTableRowElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLTableRowElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLTableRowElement.prototype, {
      get cells() {
        return wrapHTMLCollection(unwrap(this).cells);
      },
      insertCell: function(index) {
        return wrap(unwrap(this).insertCell(index));
      }
    });
    registerWrapper(OriginalHTMLTableRowElement, HTMLTableRowElement, document.createElement("tr"));
    scope.wrappers.HTMLTableRowElement = HTMLTableRowElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLContentElement = scope.wrappers.HTMLContentElement;
    var HTMLElement = scope.wrappers.HTMLElement;
    var HTMLShadowElement = scope.wrappers.HTMLShadowElement;
    var HTMLTemplateElement = scope.wrappers.HTMLTemplateElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var OriginalHTMLUnknownElement = window.HTMLUnknownElement;
    function HTMLUnknownElement(node) {
      switch (node.localName) {
       case "content":
        return new HTMLContentElement(node);

       case "shadow":
        return new HTMLShadowElement(node);

       case "template":
        return new HTMLTemplateElement(node);
      }
      HTMLElement.call(this, node);
    }
    HTMLUnknownElement.prototype = Object.create(HTMLElement.prototype);
    registerWrapper(OriginalHTMLUnknownElement, HTMLUnknownElement);
    scope.wrappers.HTMLUnknownElement = HTMLUnknownElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var Element = scope.wrappers.Element;
    var HTMLElement = scope.wrappers.HTMLElement;
    var registerObject = scope.registerObject;
    var defineWrapGetter = scope.defineWrapGetter;
    var SVG_NS = "http://www.w3.org/2000/svg";
    var svgTitleElement = document.createElementNS(SVG_NS, "title");
    var SVGTitleElement = registerObject(svgTitleElement);
    var SVGElement = Object.getPrototypeOf(SVGTitleElement.prototype).constructor;
    if (!("classList" in svgTitleElement)) {
      var descr = Object.getOwnPropertyDescriptor(Element.prototype, "classList");
      Object.defineProperty(HTMLElement.prototype, "classList", descr);
      delete Element.prototype.classList;
    }
    defineWrapGetter(SVGElement, "ownerSVGElement");
    scope.wrappers.SVGElement = SVGElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var OriginalSVGUseElement = window.SVGUseElement;
    var SVG_NS = "http://www.w3.org/2000/svg";
    var gWrapper = wrap(document.createElementNS(SVG_NS, "g"));
    var useElement = document.createElementNS(SVG_NS, "use");
    var SVGGElement = gWrapper.constructor;
    var parentInterfacePrototype = Object.getPrototypeOf(SVGGElement.prototype);
    var parentInterface = parentInterfacePrototype.constructor;
    function SVGUseElement(impl) {
      parentInterface.call(this, impl);
    }
    SVGUseElement.prototype = Object.create(parentInterfacePrototype);
    if ("instanceRoot" in useElement) {
      mixin(SVGUseElement.prototype, {
        get instanceRoot() {
          return wrap(unwrap(this).instanceRoot);
        },
        get animatedInstanceRoot() {
          return wrap(unwrap(this).animatedInstanceRoot);
        }
      });
    }
    registerWrapper(OriginalSVGUseElement, SVGUseElement, useElement);
    scope.wrappers.SVGUseElement = SVGUseElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var EventTarget = scope.wrappers.EventTarget;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var wrap = scope.wrap;
    var OriginalSVGElementInstance = window.SVGElementInstance;
    if (!OriginalSVGElementInstance) return;
    function SVGElementInstance(impl) {
      EventTarget.call(this, impl);
    }
    SVGElementInstance.prototype = Object.create(EventTarget.prototype);
    mixin(SVGElementInstance.prototype, {
      get correspondingElement() {
        return wrap(unsafeUnwrap(this).correspondingElement);
      },
      get correspondingUseElement() {
        return wrap(unsafeUnwrap(this).correspondingUseElement);
      },
      get parentNode() {
        return wrap(unsafeUnwrap(this).parentNode);
      },
      get childNodes() {
        throw new Error("Not implemented");
      },
      get firstChild() {
        return wrap(unsafeUnwrap(this).firstChild);
      },
      get lastChild() {
        return wrap(unsafeUnwrap(this).lastChild);
      },
      get previousSibling() {
        return wrap(unsafeUnwrap(this).previousSibling);
      },
      get nextSibling() {
        return wrap(unsafeUnwrap(this).nextSibling);
      }
    });
    registerWrapper(OriginalSVGElementInstance, SVGElementInstance);
    scope.wrappers.SVGElementInstance = SVGElementInstance;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var wrap = scope.wrap;
    var OriginalCanvasRenderingContext2D = window.CanvasRenderingContext2D;
    function CanvasRenderingContext2D(impl) {
      setWrapper(impl, this);
    }
    mixin(CanvasRenderingContext2D.prototype, {
      get canvas() {
        return wrap(unsafeUnwrap(this).canvas);
      },
      drawImage: function() {
        arguments[0] = unwrapIfNeeded(arguments[0]);
        unsafeUnwrap(this).drawImage.apply(unsafeUnwrap(this), arguments);
      },
      createPattern: function() {
        arguments[0] = unwrap(arguments[0]);
        return unsafeUnwrap(this).createPattern.apply(unsafeUnwrap(this), arguments);
      }
    });
    registerWrapper(OriginalCanvasRenderingContext2D, CanvasRenderingContext2D, document.createElement("canvas").getContext("2d"));
    scope.wrappers.CanvasRenderingContext2D = CanvasRenderingContext2D;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var wrap = scope.wrap;
    var OriginalWebGLRenderingContext = window.WebGLRenderingContext;
    if (!OriginalWebGLRenderingContext) return;
    function WebGLRenderingContext(impl) {
      setWrapper(impl, this);
    }
    mixin(WebGLRenderingContext.prototype, {
      get canvas() {
        return wrap(unsafeUnwrap(this).canvas);
      },
      texImage2D: function() {
        arguments[5] = unwrapIfNeeded(arguments[5]);
        unsafeUnwrap(this).texImage2D.apply(unsafeUnwrap(this), arguments);
      },
      texSubImage2D: function() {
        arguments[6] = unwrapIfNeeded(arguments[6]);
        unsafeUnwrap(this).texSubImage2D.apply(unsafeUnwrap(this), arguments);
      }
    });
    var instanceProperties = /WebKit/.test(navigator.userAgent) ? {
      drawingBufferHeight: null,
      drawingBufferWidth: null
    } : {};
    registerWrapper(OriginalWebGLRenderingContext, WebGLRenderingContext, instanceProperties);
    scope.wrappers.WebGLRenderingContext = WebGLRenderingContext;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var GetElementsByInterface = scope.GetElementsByInterface;
    var NonElementParentNodeInterface = scope.NonElementParentNodeInterface;
    var ParentNodeInterface = scope.ParentNodeInterface;
    var SelectorsInterface = scope.SelectorsInterface;
    var mixin = scope.mixin;
    var registerObject = scope.registerObject;
    var DocumentFragment = registerObject(document.createDocumentFragment());
    mixin(DocumentFragment.prototype, ParentNodeInterface);
    mixin(DocumentFragment.prototype, SelectorsInterface);
    mixin(DocumentFragment.prototype, GetElementsByInterface);
    mixin(DocumentFragment.prototype, NonElementParentNodeInterface);
    var Comment = registerObject(document.createComment(""));
    scope.wrappers.Comment = Comment;
    scope.wrappers.DocumentFragment = DocumentFragment;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var DocumentFragment = scope.wrappers.DocumentFragment;
    var TreeScope = scope.TreeScope;
    var elementFromPoint = scope.elementFromPoint;
    var getInnerHTML = scope.getInnerHTML;
    var getTreeScope = scope.getTreeScope;
    var mixin = scope.mixin;
    var rewrap = scope.rewrap;
    var setInnerHTML = scope.setInnerHTML;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var shadowHostTable = new WeakMap();
    var nextOlderShadowTreeTable = new WeakMap();
    function ShadowRoot(hostWrapper) {
      var node = unwrap(unsafeUnwrap(hostWrapper).ownerDocument.createDocumentFragment());
      DocumentFragment.call(this, node);
      rewrap(node, this);
      var oldShadowRoot = hostWrapper.shadowRoot;
      nextOlderShadowTreeTable.set(this, oldShadowRoot);
      this.treeScope_ = new TreeScope(this, getTreeScope(oldShadowRoot || hostWrapper));
      shadowHostTable.set(this, hostWrapper);
    }
    ShadowRoot.prototype = Object.create(DocumentFragment.prototype);
    mixin(ShadowRoot.prototype, {
      constructor: ShadowRoot,
      get innerHTML() {
        return getInnerHTML(this);
      },
      set innerHTML(value) {
        setInnerHTML(this, value);
        this.invalidateShadowRenderer();
      },
      get olderShadowRoot() {
        return nextOlderShadowTreeTable.get(this) || null;
      },
      get host() {
        return shadowHostTable.get(this) || null;
      },
      invalidateShadowRenderer: function() {
        return shadowHostTable.get(this).invalidateShadowRenderer();
      },
      elementFromPoint: function(x, y) {
        return elementFromPoint(this, this.ownerDocument, x, y);
      }
    });
    scope.wrappers.ShadowRoot = ShadowRoot;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var wrap = scope.wrap;
    var getTreeScope = scope.getTreeScope;
    var OriginalRange = window.Range;
    var ShadowRoot = scope.wrappers.ShadowRoot;
    function getHost(node) {
      var root = getTreeScope(node).root;
      if (root instanceof ShadowRoot) {
        return root.host;
      }
      return null;
    }
    function hostNodeToShadowNode(refNode, offset) {
      if (refNode.shadowRoot) {
        offset = Math.min(refNode.childNodes.length - 1, offset);
        var child = refNode.childNodes[offset];
        if (child) {
          var insertionPoint = scope.getDestinationInsertionPoints(child);
          if (insertionPoint.length > 0) {
            var parentNode = insertionPoint[0].parentNode;
            if (parentNode.nodeType == Node.ELEMENT_NODE) {
              refNode = parentNode;
            }
          }
        }
      }
      return refNode;
    }
    function shadowNodeToHostNode(node) {
      node = wrap(node);
      return getHost(node) || node;
    }
    function Range(impl) {
      setWrapper(impl, this);
    }
    Range.prototype = {
      get startContainer() {
        return shadowNodeToHostNode(unsafeUnwrap(this).startContainer);
      },
      get endContainer() {
        return shadowNodeToHostNode(unsafeUnwrap(this).endContainer);
      },
      get commonAncestorContainer() {
        return shadowNodeToHostNode(unsafeUnwrap(this).commonAncestorContainer);
      },
      setStart: function(refNode, offset) {
        refNode = hostNodeToShadowNode(refNode, offset);
        unsafeUnwrap(this).setStart(unwrapIfNeeded(refNode), offset);
      },
      setEnd: function(refNode, offset) {
        refNode = hostNodeToShadowNode(refNode, offset);
        unsafeUnwrap(this).setEnd(unwrapIfNeeded(refNode), offset);
      },
      setStartBefore: function(refNode) {
        unsafeUnwrap(this).setStartBefore(unwrapIfNeeded(refNode));
      },
      setStartAfter: function(refNode) {
        unsafeUnwrap(this).setStartAfter(unwrapIfNeeded(refNode));
      },
      setEndBefore: function(refNode) {
        unsafeUnwrap(this).setEndBefore(unwrapIfNeeded(refNode));
      },
      setEndAfter: function(refNode) {
        unsafeUnwrap(this).setEndAfter(unwrapIfNeeded(refNode));
      },
      selectNode: function(refNode) {
        unsafeUnwrap(this).selectNode(unwrapIfNeeded(refNode));
      },
      selectNodeContents: function(refNode) {
        unsafeUnwrap(this).selectNodeContents(unwrapIfNeeded(refNode));
      },
      compareBoundaryPoints: function(how, sourceRange) {
        return unsafeUnwrap(this).compareBoundaryPoints(how, unwrap(sourceRange));
      },
      extractContents: function() {
        return wrap(unsafeUnwrap(this).extractContents());
      },
      cloneContents: function() {
        return wrap(unsafeUnwrap(this).cloneContents());
      },
      insertNode: function(node) {
        unsafeUnwrap(this).insertNode(unwrapIfNeeded(node));
      },
      surroundContents: function(newParent) {
        unsafeUnwrap(this).surroundContents(unwrapIfNeeded(newParent));
      },
      cloneRange: function() {
        return wrap(unsafeUnwrap(this).cloneRange());
      },
      isPointInRange: function(node, offset) {
        return unsafeUnwrap(this).isPointInRange(unwrapIfNeeded(node), offset);
      },
      comparePoint: function(node, offset) {
        return unsafeUnwrap(this).comparePoint(unwrapIfNeeded(node), offset);
      },
      intersectsNode: function(node) {
        return unsafeUnwrap(this).intersectsNode(unwrapIfNeeded(node));
      },
      toString: function() {
        return unsafeUnwrap(this).toString();
      }
    };
    if (OriginalRange.prototype.createContextualFragment) {
      Range.prototype.createContextualFragment = function(html) {
        return wrap(unsafeUnwrap(this).createContextualFragment(html));
      };
    }
    registerWrapper(window.Range, Range, document.createRange());
    scope.wrappers.Range = Range;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var Element = scope.wrappers.Element;
    var HTMLContentElement = scope.wrappers.HTMLContentElement;
    var HTMLShadowElement = scope.wrappers.HTMLShadowElement;
    var Node = scope.wrappers.Node;
    var ShadowRoot = scope.wrappers.ShadowRoot;
    var assert = scope.assert;
    var getTreeScope = scope.getTreeScope;
    var mixin = scope.mixin;
    var oneOf = scope.oneOf;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var ArraySplice = scope.ArraySplice;
    function updateWrapperUpAndSideways(wrapper) {
      wrapper.previousSibling_ = wrapper.previousSibling;
      wrapper.nextSibling_ = wrapper.nextSibling;
      wrapper.parentNode_ = wrapper.parentNode;
    }
    function updateWrapperDown(wrapper) {
      wrapper.firstChild_ = wrapper.firstChild;
      wrapper.lastChild_ = wrapper.lastChild;
    }
    function updateAllChildNodes(parentNodeWrapper) {
      assert(parentNodeWrapper instanceof Node);
      for (var childWrapper = parentNodeWrapper.firstChild; childWrapper; childWrapper = childWrapper.nextSibling) {
        updateWrapperUpAndSideways(childWrapper);
      }
      updateWrapperDown(parentNodeWrapper);
    }
    function insertBefore(parentNodeWrapper, newChildWrapper, refChildWrapper) {
      var parentNode = unwrap(parentNodeWrapper);
      var newChild = unwrap(newChildWrapper);
      var refChild = refChildWrapper ? unwrap(refChildWrapper) : null;
      remove(newChildWrapper);
      updateWrapperUpAndSideways(newChildWrapper);
      if (!refChildWrapper) {
        parentNodeWrapper.lastChild_ = parentNodeWrapper.lastChild;
        if (parentNodeWrapper.lastChild === parentNodeWrapper.firstChild) parentNodeWrapper.firstChild_ = parentNodeWrapper.firstChild;
        var lastChildWrapper = wrap(parentNode.lastChild);
        if (lastChildWrapper) lastChildWrapper.nextSibling_ = lastChildWrapper.nextSibling;
      } else {
        if (parentNodeWrapper.firstChild === refChildWrapper) parentNodeWrapper.firstChild_ = refChildWrapper;
        refChildWrapper.previousSibling_ = refChildWrapper.previousSibling;
      }
      scope.originalInsertBefore.call(parentNode, newChild, refChild);
    }
    function remove(nodeWrapper) {
      var node = unwrap(nodeWrapper);
      var parentNode = node.parentNode;
      if (!parentNode) return;
      var parentNodeWrapper = wrap(parentNode);
      updateWrapperUpAndSideways(nodeWrapper);
      if (nodeWrapper.previousSibling) nodeWrapper.previousSibling.nextSibling_ = nodeWrapper;
      if (nodeWrapper.nextSibling) nodeWrapper.nextSibling.previousSibling_ = nodeWrapper;
      if (parentNodeWrapper.lastChild === nodeWrapper) parentNodeWrapper.lastChild_ = nodeWrapper;
      if (parentNodeWrapper.firstChild === nodeWrapper) parentNodeWrapper.firstChild_ = nodeWrapper;
      scope.originalRemoveChild.call(parentNode, node);
    }
    var distributedNodesTable = new WeakMap();
    var destinationInsertionPointsTable = new WeakMap();
    var rendererForHostTable = new WeakMap();
    function resetDistributedNodes(insertionPoint) {
      distributedNodesTable.set(insertionPoint, []);
    }
    function getDistributedNodes(insertionPoint) {
      var rv = distributedNodesTable.get(insertionPoint);
      if (!rv) distributedNodesTable.set(insertionPoint, rv = []);
      return rv;
    }
    function getChildNodesSnapshot(node) {
      var result = [], i = 0;
      for (var child = node.firstChild; child; child = child.nextSibling) {
        result[i++] = child;
      }
      return result;
    }
    var request = oneOf(window, [ "requestAnimationFrame", "mozRequestAnimationFrame", "webkitRequestAnimationFrame", "setTimeout" ]);
    var pendingDirtyRenderers = [];
    var renderTimer;
    function renderAllPending() {
      for (var i = 0; i < pendingDirtyRenderers.length; i++) {
        var renderer = pendingDirtyRenderers[i];
        var parentRenderer = renderer.parentRenderer;
        if (parentRenderer && parentRenderer.dirty) continue;
        renderer.render();
      }
      pendingDirtyRenderers = [];
    }
    function handleRequestAnimationFrame() {
      renderTimer = null;
      renderAllPending();
    }
    function getRendererForHost(host) {
      var renderer = rendererForHostTable.get(host);
      if (!renderer) {
        renderer = new ShadowRenderer(host);
        rendererForHostTable.set(host, renderer);
      }
      return renderer;
    }
    function getShadowRootAncestor(node) {
      var root = getTreeScope(node).root;
      if (root instanceof ShadowRoot) return root;
      return null;
    }
    function getRendererForShadowRoot(shadowRoot) {
      return getRendererForHost(shadowRoot.host);
    }
    var spliceDiff = new ArraySplice();
    spliceDiff.equals = function(renderNode, rawNode) {
      return unwrap(renderNode.node) === rawNode;
    };
    function RenderNode(node) {
      this.skip = false;
      this.node = node;
      this.childNodes = [];
    }
    RenderNode.prototype = {
      append: function(node) {
        var rv = new RenderNode(node);
        this.childNodes.push(rv);
        return rv;
      },
      sync: function(opt_added) {
        if (this.skip) return;
        var nodeWrapper = this.node;
        var newChildren = this.childNodes;
        var oldChildren = getChildNodesSnapshot(unwrap(nodeWrapper));
        var added = opt_added || new WeakMap();
        var splices = spliceDiff.calculateSplices(newChildren, oldChildren);
        var newIndex = 0, oldIndex = 0;
        var lastIndex = 0;
        for (var i = 0; i < splices.length; i++) {
          var splice = splices[i];
          for (;lastIndex < splice.index; lastIndex++) {
            oldIndex++;
            newChildren[newIndex++].sync(added);
          }
          var removedCount = splice.removed.length;
          for (var j = 0; j < removedCount; j++) {
            var wrapper = wrap(oldChildren[oldIndex++]);
            if (!added.get(wrapper)) remove(wrapper);
          }
          var addedCount = splice.addedCount;
          var refNode = oldChildren[oldIndex] && wrap(oldChildren[oldIndex]);
          for (var j = 0; j < addedCount; j++) {
            var newChildRenderNode = newChildren[newIndex++];
            var newChildWrapper = newChildRenderNode.node;
            insertBefore(nodeWrapper, newChildWrapper, refNode);
            added.set(newChildWrapper, true);
            newChildRenderNode.sync(added);
          }
          lastIndex += addedCount;
        }
        for (var i = lastIndex; i < newChildren.length; i++) {
          newChildren[i].sync(added);
        }
      }
    };
    function ShadowRenderer(host) {
      this.host = host;
      this.dirty = false;
      this.invalidateAttributes();
      this.associateNode(host);
    }
    ShadowRenderer.prototype = {
      render: function(opt_renderNode) {
        if (!this.dirty) return;
        this.invalidateAttributes();
        var host = this.host;
        this.distribution(host);
        var renderNode = opt_renderNode || new RenderNode(host);
        this.buildRenderTree(renderNode, host);
        var topMostRenderer = !opt_renderNode;
        if (topMostRenderer) renderNode.sync();
        this.dirty = false;
      },
      get parentRenderer() {
        return getTreeScope(this.host).renderer;
      },
      invalidate: function() {
        if (!this.dirty) {
          this.dirty = true;
          var parentRenderer = this.parentRenderer;
          if (parentRenderer) parentRenderer.invalidate();
          pendingDirtyRenderers.push(this);
          if (renderTimer) return;
          renderTimer = window[request](handleRequestAnimationFrame, 0);
        }
      },
      distribution: function(root) {
        this.resetAllSubtrees(root);
        this.distributionResolution(root);
      },
      resetAll: function(node) {
        if (isInsertionPoint(node)) resetDistributedNodes(node); else resetDestinationInsertionPoints(node);
        this.resetAllSubtrees(node);
      },
      resetAllSubtrees: function(node) {
        for (var child = node.firstChild; child; child = child.nextSibling) {
          this.resetAll(child);
        }
        if (node.shadowRoot) this.resetAll(node.shadowRoot);
        if (node.olderShadowRoot) this.resetAll(node.olderShadowRoot);
      },
      distributionResolution: function(node) {
        if (isShadowHost(node)) {
          var shadowHost = node;
          var pool = poolPopulation(shadowHost);
          var shadowTrees = getShadowTrees(shadowHost);
          for (var i = 0; i < shadowTrees.length; i++) {
            this.poolDistribution(shadowTrees[i], pool);
          }
          for (var i = shadowTrees.length - 1; i >= 0; i--) {
            var shadowTree = shadowTrees[i];
            var shadow = getShadowInsertionPoint(shadowTree);
            if (shadow) {
              var olderShadowRoot = shadowTree.olderShadowRoot;
              if (olderShadowRoot) {
                pool = poolPopulation(olderShadowRoot);
              }
              for (var j = 0; j < pool.length; j++) {
                destributeNodeInto(pool[j], shadow);
              }
            }
            this.distributionResolution(shadowTree);
          }
        }
        for (var child = node.firstChild; child; child = child.nextSibling) {
          this.distributionResolution(child);
        }
      },
      poolDistribution: function(node, pool) {
        if (node instanceof HTMLShadowElement) return;
        if (node instanceof HTMLContentElement) {
          var content = node;
          this.updateDependentAttributes(content.getAttribute("select"));
          var anyDistributed = false;
          for (var i = 0; i < pool.length; i++) {
            var node = pool[i];
            if (!node) continue;
            if (matches(node, content)) {
              destributeNodeInto(node, content);
              pool[i] = undefined;
              anyDistributed = true;
            }
          }
          if (!anyDistributed) {
            for (var child = content.firstChild; child; child = child.nextSibling) {
              destributeNodeInto(child, content);
            }
          }
          return;
        }
        for (var child = node.firstChild; child; child = child.nextSibling) {
          this.poolDistribution(child, pool);
        }
      },
      buildRenderTree: function(renderNode, node) {
        var children = this.compose(node);
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          var childRenderNode = renderNode.append(child);
          this.buildRenderTree(childRenderNode, child);
        }
        if (isShadowHost(node)) {
          var renderer = getRendererForHost(node);
          renderer.dirty = false;
        }
      },
      compose: function(node) {
        var children = [];
        var p = node.shadowRoot || node;
        for (var child = p.firstChild; child; child = child.nextSibling) {
          if (isInsertionPoint(child)) {
            this.associateNode(p);
            var distributedNodes = getDistributedNodes(child);
            for (var j = 0; j < distributedNodes.length; j++) {
              var distributedNode = distributedNodes[j];
              if (isFinalDestination(child, distributedNode)) children.push(distributedNode);
            }
          } else {
            children.push(child);
          }
        }
        return children;
      },
      invalidateAttributes: function() {
        this.attributes = Object.create(null);
      },
      updateDependentAttributes: function(selector) {
        if (!selector) return;
        var attributes = this.attributes;
        if (/\.\w+/.test(selector)) attributes["class"] = true;
        if (/#\w+/.test(selector)) attributes["id"] = true;
        selector.replace(/\[\s*([^\s=\|~\]]+)/g, function(_, name) {
          attributes[name] = true;
        });
      },
      dependsOnAttribute: function(name) {
        return this.attributes[name];
      },
      associateNode: function(node) {
        unsafeUnwrap(node).polymerShadowRenderer_ = this;
      }
    };
    function poolPopulation(node) {
      var pool = [];
      for (var child = node.firstChild; child; child = child.nextSibling) {
        if (isInsertionPoint(child)) {
          pool.push.apply(pool, getDistributedNodes(child));
        } else {
          pool.push(child);
        }
      }
      return pool;
    }
    function getShadowInsertionPoint(node) {
      if (node instanceof HTMLShadowElement) return node;
      if (node instanceof HTMLContentElement) return null;
      for (var child = node.firstChild; child; child = child.nextSibling) {
        var res = getShadowInsertionPoint(child);
        if (res) return res;
      }
      return null;
    }
    function destributeNodeInto(child, insertionPoint) {
      getDistributedNodes(insertionPoint).push(child);
      var points = destinationInsertionPointsTable.get(child);
      if (!points) destinationInsertionPointsTable.set(child, [ insertionPoint ]); else points.push(insertionPoint);
    }
    function getDestinationInsertionPoints(node) {
      return destinationInsertionPointsTable.get(node);
    }
    function resetDestinationInsertionPoints(node) {
      destinationInsertionPointsTable.set(node, undefined);
    }
    var selectorStartCharRe = /^(:not\()?[*.#[a-zA-Z_|]/;
    function matches(node, contentElement) {
      var select = contentElement.getAttribute("select");
      if (!select) return true;
      select = select.trim();
      if (!select) return true;
      if (!(node instanceof Element)) return false;
      if (!selectorStartCharRe.test(select)) return false;
      try {
        return node.matches(select);
      } catch (ex) {
        return false;
      }
    }
    function isFinalDestination(insertionPoint, node) {
      var points = getDestinationInsertionPoints(node);
      return points && points[points.length - 1] === insertionPoint;
    }
    function isInsertionPoint(node) {
      return node instanceof HTMLContentElement || node instanceof HTMLShadowElement;
    }
    function isShadowHost(shadowHost) {
      return shadowHost.shadowRoot;
    }
    function getShadowTrees(host) {
      var trees = [];
      for (var tree = host.shadowRoot; tree; tree = tree.olderShadowRoot) {
        trees.push(tree);
      }
      return trees;
    }
    function render(host) {
      new ShadowRenderer(host).render();
    }
    Node.prototype.invalidateShadowRenderer = function(force) {
      var renderer = unsafeUnwrap(this).polymerShadowRenderer_;
      if (renderer) {
        renderer.invalidate();
        return true;
      }
      return false;
    };
    HTMLContentElement.prototype.getDistributedNodes = HTMLShadowElement.prototype.getDistributedNodes = function() {
      renderAllPending();
      return getDistributedNodes(this);
    };
    Element.prototype.getDestinationInsertionPoints = function() {
      renderAllPending();
      return getDestinationInsertionPoints(this) || [];
    };
    HTMLContentElement.prototype.nodeIsInserted_ = HTMLShadowElement.prototype.nodeIsInserted_ = function() {
      this.invalidateShadowRenderer();
      var shadowRoot = getShadowRootAncestor(this);
      var renderer;
      if (shadowRoot) renderer = getRendererForShadowRoot(shadowRoot);
      unsafeUnwrap(this).polymerShadowRenderer_ = renderer;
      if (renderer) renderer.invalidate();
    };
    scope.getRendererForHost = getRendererForHost;
    scope.getShadowTrees = getShadowTrees;
    scope.renderAllPending = renderAllPending;
    scope.getDestinationInsertionPoints = getDestinationInsertionPoints;
    scope.visual = {
      insertBefore: insertBefore,
      remove: remove
    };
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var assert = scope.assert;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var elementsWithFormProperty = [ "HTMLButtonElement", "HTMLFieldSetElement", "HTMLInputElement", "HTMLKeygenElement", "HTMLLabelElement", "HTMLLegendElement", "HTMLObjectElement", "HTMLOutputElement", "HTMLTextAreaElement" ];
    function createWrapperConstructor(name) {
      if (!window[name]) return;
      assert(!scope.wrappers[name]);
      var GeneratedWrapper = function(node) {
        HTMLElement.call(this, node);
      };
      GeneratedWrapper.prototype = Object.create(HTMLElement.prototype);
      mixin(GeneratedWrapper.prototype, {
        get form() {
          return wrap(unwrap(this).form);
        }
      });
      registerWrapper(window[name], GeneratedWrapper, document.createElement(name.slice(4, -7)));
      scope.wrappers[name] = GeneratedWrapper;
    }
    elementsWithFormProperty.forEach(createWrapperConstructor);
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var wrap = scope.wrap;
    var OriginalSelection = window.Selection;
    function Selection(impl) {
      setWrapper(impl, this);
    }
    Selection.prototype = {
      get anchorNode() {
        return wrap(unsafeUnwrap(this).anchorNode);
      },
      get focusNode() {
        return wrap(unsafeUnwrap(this).focusNode);
      },
      addRange: function(range) {
        unsafeUnwrap(this).addRange(unwrapIfNeeded(range));
      },
      collapse: function(node, index) {
        unsafeUnwrap(this).collapse(unwrapIfNeeded(node), index);
      },
      containsNode: function(node, allowPartial) {
        return unsafeUnwrap(this).containsNode(unwrapIfNeeded(node), allowPartial);
      },
      getRangeAt: function(index) {
        return wrap(unsafeUnwrap(this).getRangeAt(index));
      },
      removeRange: function(range) {
        unsafeUnwrap(this).removeRange(unwrap(range));
      },
      selectAllChildren: function(node) {
        unsafeUnwrap(this).selectAllChildren(unwrapIfNeeded(node));
      },
      toString: function() {
        return unsafeUnwrap(this).toString();
      }
    };
    if (OriginalSelection.prototype.extend) {
      Selection.prototype.extend = function(node, offset) {
        unsafeUnwrap(this).extend(unwrapIfNeeded(node), offset);
      };
    }
    registerWrapper(window.Selection, Selection, window.getSelection());
    scope.wrappers.Selection = Selection;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var wrap = scope.wrap;
    var OriginalTreeWalker = window.TreeWalker;
    function TreeWalker(impl) {
      setWrapper(impl, this);
    }
    TreeWalker.prototype = {
      get root() {
        return wrap(unsafeUnwrap(this).root);
      },
      get currentNode() {
        return wrap(unsafeUnwrap(this).currentNode);
      },
      set currentNode(node) {
        unsafeUnwrap(this).currentNode = unwrapIfNeeded(node);
      },
      get filter() {
        return unsafeUnwrap(this).filter;
      },
      parentNode: function() {
        return wrap(unsafeUnwrap(this).parentNode());
      },
      firstChild: function() {
        return wrap(unsafeUnwrap(this).firstChild());
      },
      lastChild: function() {
        return wrap(unsafeUnwrap(this).lastChild());
      },
      previousSibling: function() {
        return wrap(unsafeUnwrap(this).previousSibling());
      },
      previousNode: function() {
        return wrap(unsafeUnwrap(this).previousNode());
      },
      nextNode: function() {
        return wrap(unsafeUnwrap(this).nextNode());
      }
    };
    registerWrapper(OriginalTreeWalker, TreeWalker);
    scope.wrappers.TreeWalker = TreeWalker;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var GetElementsByInterface = scope.GetElementsByInterface;
    var Node = scope.wrappers.Node;
    var ParentNodeInterface = scope.ParentNodeInterface;
    var NonElementParentNodeInterface = scope.NonElementParentNodeInterface;
    var Selection = scope.wrappers.Selection;
    var SelectorsInterface = scope.SelectorsInterface;
    var ShadowRoot = scope.wrappers.ShadowRoot;
    var TreeScope = scope.TreeScope;
    var cloneNode = scope.cloneNode;
    var defineWrapGetter = scope.defineWrapGetter;
    var elementFromPoint = scope.elementFromPoint;
    var forwardMethodsToWrapper = scope.forwardMethodsToWrapper;
    var matchesNames = scope.matchesNames;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var renderAllPending = scope.renderAllPending;
    var rewrap = scope.rewrap;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var wrapEventTargetMethods = scope.wrapEventTargetMethods;
    var wrapNodeList = scope.wrapNodeList;
    var implementationTable = new WeakMap();
    function Document(node) {
      Node.call(this, node);
      this.treeScope_ = new TreeScope(this, null);
    }
    Document.prototype = Object.create(Node.prototype);
    defineWrapGetter(Document, "documentElement");
    defineWrapGetter(Document, "body");
    defineWrapGetter(Document, "head");
    function wrapMethod(name) {
      var original = document[name];
      Document.prototype[name] = function() {
        return wrap(original.apply(unsafeUnwrap(this), arguments));
      };
    }
    [ "createComment", "createDocumentFragment", "createElement", "createElementNS", "createEvent", "createEventNS", "createRange", "createTextNode" ].forEach(wrapMethod);
    var originalAdoptNode = document.adoptNode;
    function adoptNodeNoRemove(node, doc) {
      originalAdoptNode.call(unsafeUnwrap(doc), unwrap(node));
      adoptSubtree(node, doc);
    }
    function adoptSubtree(node, doc) {
      if (node.shadowRoot) doc.adoptNode(node.shadowRoot);
      if (node instanceof ShadowRoot) adoptOlderShadowRoots(node, doc);
      for (var child = node.firstChild; child; child = child.nextSibling) {
        adoptSubtree(child, doc);
      }
    }
    function adoptOlderShadowRoots(shadowRoot, doc) {
      var oldShadowRoot = shadowRoot.olderShadowRoot;
      if (oldShadowRoot) doc.adoptNode(oldShadowRoot);
    }
    var originalGetSelection = document.getSelection;
    mixin(Document.prototype, {
      adoptNode: function(node) {
        if (node.parentNode) node.parentNode.removeChild(node);
        adoptNodeNoRemove(node, this);
        return node;
      },
      elementFromPoint: function(x, y) {
        return elementFromPoint(this, this, x, y);
      },
      importNode: function(node, deep) {
        return cloneNode(node, deep, unsafeUnwrap(this));
      },
      getSelection: function() {
        renderAllPending();
        return new Selection(originalGetSelection.call(unwrap(this)));
      },
      getElementsByName: function(name) {
        return SelectorsInterface.querySelectorAll.call(this, "[name=" + JSON.stringify(String(name)) + "]");
      }
    });
    var originalCreateTreeWalker = document.createTreeWalker;
    var TreeWalkerWrapper = scope.wrappers.TreeWalker;
    Document.prototype.createTreeWalker = function(root, whatToShow, filter, expandEntityReferences) {
      var newFilter = null;
      if (filter) {
        if (filter.acceptNode && typeof filter.acceptNode === "function") {
          newFilter = {
            acceptNode: function(node) {
              return filter.acceptNode(wrap(node));
            }
          };
        } else if (typeof filter === "function") {
          newFilter = function(node) {
            return filter(wrap(node));
          };
        }
      }
      return new TreeWalkerWrapper(originalCreateTreeWalker.call(unwrap(this), unwrap(root), whatToShow, newFilter, expandEntityReferences));
    };
    if (document.registerElement) {
      var originalRegisterElement = document.registerElement;
      Document.prototype.registerElement = function(tagName, object) {
        var prototype, extendsOption;
        if (object !== undefined) {
          prototype = object.prototype;
          extendsOption = object.extends;
        }
        if (!prototype) prototype = Object.create(HTMLElement.prototype);
        if (scope.nativePrototypeTable.get(prototype)) {
          throw new Error("NotSupportedError");
        }
        var proto = Object.getPrototypeOf(prototype);
        var nativePrototype;
        var prototypes = [];
        while (proto) {
          nativePrototype = scope.nativePrototypeTable.get(proto);
          if (nativePrototype) break;
          prototypes.push(proto);
          proto = Object.getPrototypeOf(proto);
        }
        if (!nativePrototype) {
          throw new Error("NotSupportedError");
        }
        var newPrototype = Object.create(nativePrototype);
        for (var i = prototypes.length - 1; i >= 0; i--) {
          newPrototype = Object.create(newPrototype);
        }
        [ "createdCallback", "attachedCallback", "detachedCallback", "attributeChangedCallback" ].forEach(function(name) {
          var f = prototype[name];
          if (!f) return;
          newPrototype[name] = function() {
            if (!(wrap(this) instanceof CustomElementConstructor)) {
              rewrap(this);
            }
            f.apply(wrap(this), arguments);
          };
        });
        var p = {
          prototype: newPrototype
        };
        if (extendsOption) p.extends = extendsOption;
        function CustomElementConstructor(node) {
          if (!node) {
            if (extendsOption) {
              return document.createElement(extendsOption, tagName);
            } else {
              return document.createElement(tagName);
            }
          }
          setWrapper(node, this);
        }
        CustomElementConstructor.prototype = prototype;
        CustomElementConstructor.prototype.constructor = CustomElementConstructor;
        scope.constructorTable.set(newPrototype, CustomElementConstructor);
        scope.nativePrototypeTable.set(prototype, newPrototype);
        var nativeConstructor = originalRegisterElement.call(unwrap(this), tagName, p);
        return CustomElementConstructor;
      };
      forwardMethodsToWrapper([ window.HTMLDocument || window.Document ], [ "registerElement" ]);
    }
    forwardMethodsToWrapper([ window.HTMLBodyElement, window.HTMLDocument || window.Document, window.HTMLHeadElement, window.HTMLHtmlElement ], [ "appendChild", "compareDocumentPosition", "contains", "getElementsByClassName", "getElementsByTagName", "getElementsByTagNameNS", "insertBefore", "querySelector", "querySelectorAll", "removeChild", "replaceChild" ]);
    forwardMethodsToWrapper([ window.HTMLBodyElement, window.HTMLHeadElement, window.HTMLHtmlElement ], matchesNames);
    forwardMethodsToWrapper([ window.HTMLDocument || window.Document ], [ "adoptNode", "importNode", "contains", "createComment", "createDocumentFragment", "createElement", "createElementNS", "createEvent", "createEventNS", "createRange", "createTextNode", "createTreeWalker", "elementFromPoint", "getElementById", "getElementsByName", "getSelection" ]);
    mixin(Document.prototype, GetElementsByInterface);
    mixin(Document.prototype, ParentNodeInterface);
    mixin(Document.prototype, SelectorsInterface);
    mixin(Document.prototype, NonElementParentNodeInterface);
    mixin(Document.prototype, {
      get implementation() {
        var implementation = implementationTable.get(this);
        if (implementation) return implementation;
        implementation = new DOMImplementation(unwrap(this).implementation);
        implementationTable.set(this, implementation);
        return implementation;
      },
      get defaultView() {
        return wrap(unwrap(this).defaultView);
      }
    });
    registerWrapper(window.Document, Document, document.implementation.createHTMLDocument(""));
    if (window.HTMLDocument) registerWrapper(window.HTMLDocument, Document);
    wrapEventTargetMethods([ window.HTMLBodyElement, window.HTMLDocument || window.Document, window.HTMLHeadElement ]);
    function DOMImplementation(impl) {
      setWrapper(impl, this);
    }
    var originalCreateDocument = document.implementation.createDocument;
    DOMImplementation.prototype.createDocument = function() {
      arguments[2] = unwrap(arguments[2]);
      return wrap(originalCreateDocument.apply(unsafeUnwrap(this), arguments));
    };
    function wrapImplMethod(constructor, name) {
      var original = document.implementation[name];
      constructor.prototype[name] = function() {
        return wrap(original.apply(unsafeUnwrap(this), arguments));
      };
    }
    function forwardImplMethod(constructor, name) {
      var original = document.implementation[name];
      constructor.prototype[name] = function() {
        return original.apply(unsafeUnwrap(this), arguments);
      };
    }
    wrapImplMethod(DOMImplementation, "createDocumentType");
    wrapImplMethod(DOMImplementation, "createHTMLDocument");
    forwardImplMethod(DOMImplementation, "hasFeature");
    registerWrapper(window.DOMImplementation, DOMImplementation);
    forwardMethodsToWrapper([ window.DOMImplementation ], [ "createDocument", "createDocumentType", "createHTMLDocument", "hasFeature" ]);
    scope.adoptNodeNoRemove = adoptNodeNoRemove;
    scope.wrappers.DOMImplementation = DOMImplementation;
    scope.wrappers.Document = Document;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var EventTarget = scope.wrappers.EventTarget;
    var Selection = scope.wrappers.Selection;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var renderAllPending = scope.renderAllPending;
    var unwrap = scope.unwrap;
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var wrap = scope.wrap;
    var OriginalWindow = window.Window;
    var originalGetComputedStyle = window.getComputedStyle;
    var originalGetDefaultComputedStyle = window.getDefaultComputedStyle;
    var originalGetSelection = window.getSelection;
    function Window(impl) {
      EventTarget.call(this, impl);
    }
    Window.prototype = Object.create(EventTarget.prototype);
    OriginalWindow.prototype.getComputedStyle = function(el, pseudo) {
      return wrap(this || window).getComputedStyle(unwrapIfNeeded(el), pseudo);
    };
    if (originalGetDefaultComputedStyle) {
      OriginalWindow.prototype.getDefaultComputedStyle = function(el, pseudo) {
        return wrap(this || window).getDefaultComputedStyle(unwrapIfNeeded(el), pseudo);
      };
    }
    OriginalWindow.prototype.getSelection = function() {
      return wrap(this || window).getSelection();
    };
    delete window.getComputedStyle;
    delete window.getDefaultComputedStyle;
    delete window.getSelection;
    [ "addEventListener", "removeEventListener", "dispatchEvent" ].forEach(function(name) {
      OriginalWindow.prototype[name] = function() {
        var w = wrap(this || window);
        return w[name].apply(w, arguments);
      };
      delete window[name];
    });
    mixin(Window.prototype, {
      getComputedStyle: function(el, pseudo) {
        renderAllPending();
        return originalGetComputedStyle.call(unwrap(this), unwrapIfNeeded(el), pseudo);
      },
      getSelection: function() {
        renderAllPending();
        return new Selection(originalGetSelection.call(unwrap(this)));
      },
      get document() {
        return wrap(unwrap(this).document);
      }
    });
    if (originalGetDefaultComputedStyle) {
      Window.prototype.getDefaultComputedStyle = function(el, pseudo) {
        renderAllPending();
        return originalGetDefaultComputedStyle.call(unwrap(this), unwrapIfNeeded(el), pseudo);
      };
    }
    registerWrapper(OriginalWindow, Window, window);
    scope.wrappers.Window = Window;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var unwrap = scope.unwrap;
    var OriginalDataTransfer = window.DataTransfer || window.Clipboard;
    var OriginalDataTransferSetDragImage = OriginalDataTransfer.prototype.setDragImage;
    if (OriginalDataTransferSetDragImage) {
      OriginalDataTransfer.prototype.setDragImage = function(image, x, y) {
        OriginalDataTransferSetDragImage.call(this, unwrap(image), x, y);
      };
    }
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unwrap = scope.unwrap;
    var OriginalFormData = window.FormData;
    if (!OriginalFormData) return;
    function FormData(formElement) {
      var impl;
      if (formElement instanceof OriginalFormData) {
        impl = formElement;
      } else {
        impl = new OriginalFormData(formElement && unwrap(formElement));
      }
      setWrapper(impl, this);
    }
    registerWrapper(OriginalFormData, FormData, new OriginalFormData());
    scope.wrappers.FormData = FormData;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(obj) {
      return originalSend.call(this, unwrapIfNeeded(obj));
    };
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var isWrapperFor = scope.isWrapperFor;
    var elements = {
      a: "HTMLAnchorElement",
      area: "HTMLAreaElement",
      audio: "HTMLAudioElement",
      base: "HTMLBaseElement",
      body: "HTMLBodyElement",
      br: "HTMLBRElement",
      button: "HTMLButtonElement",
      canvas: "HTMLCanvasElement",
      caption: "HTMLTableCaptionElement",
      col: "HTMLTableColElement",
      content: "HTMLContentElement",
      data: "HTMLDataElement",
      datalist: "HTMLDataListElement",
      del: "HTMLModElement",
      dir: "HTMLDirectoryElement",
      div: "HTMLDivElement",
      dl: "HTMLDListElement",
      embed: "HTMLEmbedElement",
      fieldset: "HTMLFieldSetElement",
      font: "HTMLFontElement",
      form: "HTMLFormElement",
      frame: "HTMLFrameElement",
      frameset: "HTMLFrameSetElement",
      h1: "HTMLHeadingElement",
      head: "HTMLHeadElement",
      hr: "HTMLHRElement",
      html: "HTMLHtmlElement",
      iframe: "HTMLIFrameElement",
      img: "HTMLImageElement",
      input: "HTMLInputElement",
      keygen: "HTMLKeygenElement",
      label: "HTMLLabelElement",
      legend: "HTMLLegendElement",
      li: "HTMLLIElement",
      link: "HTMLLinkElement",
      map: "HTMLMapElement",
      marquee: "HTMLMarqueeElement",
      menu: "HTMLMenuElement",
      menuitem: "HTMLMenuItemElement",
      meta: "HTMLMetaElement",
      meter: "HTMLMeterElement",
      object: "HTMLObjectElement",
      ol: "HTMLOListElement",
      optgroup: "HTMLOptGroupElement",
      option: "HTMLOptionElement",
      output: "HTMLOutputElement",
      p: "HTMLParagraphElement",
      param: "HTMLParamElement",
      pre: "HTMLPreElement",
      progress: "HTMLProgressElement",
      q: "HTMLQuoteElement",
      script: "HTMLScriptElement",
      select: "HTMLSelectElement",
      shadow: "HTMLShadowElement",
      source: "HTMLSourceElement",
      span: "HTMLSpanElement",
      style: "HTMLStyleElement",
      table: "HTMLTableElement",
      tbody: "HTMLTableSectionElement",
      template: "HTMLTemplateElement",
      textarea: "HTMLTextAreaElement",
      thead: "HTMLTableSectionElement",
      time: "HTMLTimeElement",
      title: "HTMLTitleElement",
      tr: "HTMLTableRowElement",
      track: "HTMLTrackElement",
      ul: "HTMLUListElement",
      video: "HTMLVideoElement"
    };
    function overrideConstructor(tagName) {
      var nativeConstructorName = elements[tagName];
      var nativeConstructor = window[nativeConstructorName];
      if (!nativeConstructor) return;
      var element = document.createElement(tagName);
      var wrapperConstructor = element.constructor;
      window[nativeConstructorName] = wrapperConstructor;
    }
    Object.keys(elements).forEach(overrideConstructor);
    Object.getOwnPropertyNames(scope.wrappers).forEach(function(name) {
      window[name] = scope.wrappers[name];
    });
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    var ShadowCSS = {
      strictStyling: false,
      registry: {},
      shimStyling: function(root, name, extendsName) {
        var scopeStyles = this.prepareRoot(root, name, extendsName);
        var typeExtension = this.isTypeExtension(extendsName);
        var scopeSelector = this.makeScopeSelector(name, typeExtension);
        var cssText = stylesToCssText(scopeStyles, true);
        cssText = this.scopeCssText(cssText, scopeSelector);
        if (root) {
          root.shimmedStyle = cssText;
        }
        this.addCssToDocument(cssText, name);
      },
      shimStyle: function(style, selector) {
        return this.shimCssText(style.textContent, selector);
      },
      shimCssText: function(cssText, selector) {
        cssText = this.insertDirectives(cssText);
        return this.scopeCssText(cssText, selector);
      },
      makeScopeSelector: function(name, typeExtension) {
        if (name) {
          return typeExtension ? "[is=" + name + "]" : name;
        }
        return "";
      },
      isTypeExtension: function(extendsName) {
        return extendsName && extendsName.indexOf("-") < 0;
      },
      prepareRoot: function(root, name, extendsName) {
        var def = this.registerRoot(root, name, extendsName);
        this.replaceTextInStyles(def.rootStyles, this.insertDirectives);
        this.removeStyles(root, def.rootStyles);
        if (this.strictStyling) {
          this.applyScopeToContent(root, name);
        }
        return def.scopeStyles;
      },
      removeStyles: function(root, styles) {
        for (var i = 0, l = styles.length, s; i < l && (s = styles[i]); i++) {
          s.parentNode.removeChild(s);
        }
      },
      registerRoot: function(root, name, extendsName) {
        var def = this.registry[name] = {
          root: root,
          name: name,
          extendsName: extendsName
        };
        var styles = this.findStyles(root);
        def.rootStyles = styles;
        def.scopeStyles = def.rootStyles;
        var extendee = this.registry[def.extendsName];
        if (extendee) {
          def.scopeStyles = extendee.scopeStyles.concat(def.scopeStyles);
        }
        return def;
      },
      findStyles: function(root) {
        if (!root) {
          return [];
        }
        var styles = root.querySelectorAll("style");
        return Array.prototype.filter.call(styles, function(s) {
          return !s.hasAttribute(NO_SHIM_ATTRIBUTE);
        });
      },
      applyScopeToContent: function(root, name) {
        if (root) {
          Array.prototype.forEach.call(root.querySelectorAll("*"), function(node) {
            node.setAttribute(name, "");
          });
          Array.prototype.forEach.call(root.querySelectorAll("template"), function(template) {
            this.applyScopeToContent(template.content, name);
          }, this);
        }
      },
      insertDirectives: function(cssText) {
        cssText = this.insertPolyfillDirectivesInCssText(cssText);
        return this.insertPolyfillRulesInCssText(cssText);
      },
      insertPolyfillDirectivesInCssText: function(cssText) {
        cssText = cssText.replace(cssCommentNextSelectorRe, function(match, p1) {
          return p1.slice(0, -2) + "{";
        });
        return cssText.replace(cssContentNextSelectorRe, function(match, p1) {
          return p1 + " {";
        });
      },
      insertPolyfillRulesInCssText: function(cssText) {
        cssText = cssText.replace(cssCommentRuleRe, function(match, p1) {
          return p1.slice(0, -1);
        });
        return cssText.replace(cssContentRuleRe, function(match, p1, p2, p3) {
          var rule = match.replace(p1, "").replace(p2, "");
          return p3 + rule;
        });
      },
      scopeCssText: function(cssText, scopeSelector) {
        var unscoped = this.extractUnscopedRulesFromCssText(cssText);
        cssText = this.insertPolyfillHostInCssText(cssText);
        cssText = this.convertColonHost(cssText);
        cssText = this.convertColonHostContext(cssText);
        cssText = this.convertShadowDOMSelectors(cssText);
        if (scopeSelector) {
          var self = this, cssText;
          withCssRules(cssText, function(rules) {
            cssText = self.scopeRules(rules, scopeSelector);
          });
        }
        cssText = cssText + "\n" + unscoped;
        return cssText.trim();
      },
      extractUnscopedRulesFromCssText: function(cssText) {
        var r = "", m;
        while (m = cssCommentUnscopedRuleRe.exec(cssText)) {
          r += m[1].slice(0, -1) + "\n\n";
        }
        while (m = cssContentUnscopedRuleRe.exec(cssText)) {
          r += m[0].replace(m[2], "").replace(m[1], m[3]) + "\n\n";
        }
        return r;
      },
      convertColonHost: function(cssText) {
        return this.convertColonRule(cssText, cssColonHostRe, this.colonHostPartReplacer);
      },
      convertColonHostContext: function(cssText) {
        return this.convertColonRule(cssText, cssColonHostContextRe, this.colonHostContextPartReplacer);
      },
      convertColonRule: function(cssText, regExp, partReplacer) {
        return cssText.replace(regExp, function(m, p1, p2, p3) {
          p1 = polyfillHostNoCombinator;
          if (p2) {
            var parts = p2.split(","), r = [];
            for (var i = 0, l = parts.length, p; i < l && (p = parts[i]); i++) {
              p = p.trim();
              r.push(partReplacer(p1, p, p3));
            }
            return r.join(",");
          } else {
            return p1 + p3;
          }
        });
      },
      colonHostContextPartReplacer: function(host, part, suffix) {
        if (part.match(polyfillHost)) {
          return this.colonHostPartReplacer(host, part, suffix);
        } else {
          return host + part + suffix + ", " + part + " " + host + suffix;
        }
      },
      colonHostPartReplacer: function(host, part, suffix) {
        return host + part.replace(polyfillHost, "") + suffix;
      },
      convertShadowDOMSelectors: function(cssText) {
        for (var i = 0; i < shadowDOMSelectorsRe.length; i++) {
          cssText = cssText.replace(shadowDOMSelectorsRe[i], " ");
        }
        return cssText;
      },
      scopeRules: function(cssRules, scopeSelector) {
        var cssText = "";
        if (cssRules) {
          Array.prototype.forEach.call(cssRules, function(rule) {
            if (rule.selectorText && (rule.style && rule.style.cssText !== undefined)) {
              cssText += this.scopeSelector(rule.selectorText, scopeSelector, this.strictStyling) + " {\n	";
              cssText += this.propertiesFromRule(rule) + "\n}\n\n";
            } else if (rule.type === CSSRule.MEDIA_RULE) {
              cssText += "@media " + rule.media.mediaText + " {\n";
              cssText += this.scopeRules(rule.cssRules, scopeSelector);
              cssText += "\n}\n\n";
            } else {
              try {
                if (rule.cssText) {
                  cssText += rule.cssText + "\n\n";
                }
              } catch (x) {
                if (rule.type === CSSRule.KEYFRAMES_RULE && rule.cssRules) {
                  cssText += this.ieSafeCssTextFromKeyFrameRule(rule);
                }
              }
            }
          }, this);
        }
        return cssText;
      },
      ieSafeCssTextFromKeyFrameRule: function(rule) {
        var cssText = "@keyframes " + rule.name + " {";
        Array.prototype.forEach.call(rule.cssRules, function(rule) {
          cssText += " " + rule.keyText + " {" + rule.style.cssText + "}";
        });
        cssText += " }";
        return cssText;
      },
      scopeSelector: function(selector, scopeSelector, strict) {
        var r = [], parts = selector.split(",");
        parts.forEach(function(p) {
          p = p.trim();
          if (this.selectorNeedsScoping(p, scopeSelector)) {
            p = strict && !p.match(polyfillHostNoCombinator) ? this.applyStrictSelectorScope(p, scopeSelector) : this.applySelectorScope(p, scopeSelector);
          }
          r.push(p);
        }, this);
        return r.join(", ");
      },
      selectorNeedsScoping: function(selector, scopeSelector) {
        if (Array.isArray(scopeSelector)) {
          return true;
        }
        var re = this.makeScopeMatcher(scopeSelector);
        return !selector.match(re);
      },
      makeScopeMatcher: function(scopeSelector) {
        scopeSelector = scopeSelector.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
        return new RegExp("^(" + scopeSelector + ")" + selectorReSuffix, "m");
      },
      applySelectorScope: function(selector, selectorScope) {
        return Array.isArray(selectorScope) ? this.applySelectorScopeList(selector, selectorScope) : this.applySimpleSelectorScope(selector, selectorScope);
      },
      applySelectorScopeList: function(selector, scopeSelectorList) {
        var r = [];
        for (var i = 0, s; s = scopeSelectorList[i]; i++) {
          r.push(this.applySimpleSelectorScope(selector, s));
        }
        return r.join(", ");
      },
      applySimpleSelectorScope: function(selector, scopeSelector) {
        if (selector.match(polyfillHostRe)) {
          selector = selector.replace(polyfillHostNoCombinator, scopeSelector);
          return selector.replace(polyfillHostRe, scopeSelector + " ");
        } else {
          return scopeSelector + " " + selector;
        }
      },
      applyStrictSelectorScope: function(selector, scopeSelector) {
        scopeSelector = scopeSelector.replace(/\[is=([^\]]*)\]/g, "$1");
        var splits = [ " ", ">", "+", "~" ], scoped = selector, attrName = "[" + scopeSelector + "]";
        splits.forEach(function(sep) {
          var parts = scoped.split(sep);
          scoped = parts.map(function(p) {
            var t = p.trim().replace(polyfillHostRe, "");
            if (t && splits.indexOf(t) < 0 && t.indexOf(attrName) < 0) {
              p = t.replace(/([^:]*)(:*)(.*)/, "$1" + attrName + "$2$3");
            }
            return p;
          }).join(sep);
        });
        return scoped;
      },
      insertPolyfillHostInCssText: function(selector) {
        return selector.replace(colonHostContextRe, polyfillHostContext).replace(colonHostRe, polyfillHost);
      },
      propertiesFromRule: function(rule) {
        var cssText = rule.style.cssText;
        if (rule.style.content && !rule.style.content.match(/['"]+|attr/)) {
          cssText = cssText.replace(/content:[^;]*;/g, "content: '" + rule.style.content + "';");
        }
        var style = rule.style;
        for (var i in style) {
          if (style[i] === "initial") {
            cssText += i + ": initial; ";
          }
        }
        return cssText;
      },
      replaceTextInStyles: function(styles, action) {
        if (styles && action) {
          if (!(styles instanceof Array)) {
            styles = [ styles ];
          }
          Array.prototype.forEach.call(styles, function(s) {
            s.textContent = action.call(this, s.textContent);
          }, this);
        }
      },
      addCssToDocument: function(cssText, name) {
        if (cssText.match("@import")) {
          addOwnSheet(cssText, name);
        } else {
          addCssToDocument(cssText);
        }
      }
    };
    var selectorRe = /([^{]*)({[\s\S]*?})/gim, cssCommentRe = /\/\*[^*]*\*+([^\/*][^*]*\*+)*\//gim, cssCommentNextSelectorRe = /\/\*\s*@polyfill ([^*]*\*+([^\/*][^*]*\*+)*\/)([^{]*?){/gim, cssContentNextSelectorRe = /polyfill-next-selector[^}]*content\:[\s]*?['"](.*?)['"][;\s]*}([^{]*?){/gim, cssCommentRuleRe = /\/\*\s@polyfill-rule([^*]*\*+([^\/*][^*]*\*+)*)\//gim, cssContentRuleRe = /(polyfill-rule)[^}]*(content\:[\s]*['"](.*?)['"])[;\s]*[^}]*}/gim, cssCommentUnscopedRuleRe = /\/\*\s@polyfill-unscoped-rule([^*]*\*+([^\/*][^*]*\*+)*)\//gim, cssContentUnscopedRuleRe = /(polyfill-unscoped-rule)[^}]*(content\:[\s]*['"](.*?)['"])[;\s]*[^}]*}/gim, cssPseudoRe = /::(x-[^\s{,(]*)/gim, cssPartRe = /::part\(([^)]*)\)/gim, polyfillHost = "-shadowcsshost", polyfillHostContext = "-shadowcsscontext", parenSuffix = ")(?:\\((" + "(?:\\([^)(]*\\)|[^)(]*)+?" + ")\\))?([^,{]*)";
    var cssColonHostRe = new RegExp("(" + polyfillHost + parenSuffix, "gim"), cssColonHostContextRe = new RegExp("(" + polyfillHostContext + parenSuffix, "gim"), selectorReSuffix = "([>\\s~+[.,{:][\\s\\S]*)?$", colonHostRe = /\:host/gim, colonHostContextRe = /\:host-context/gim, polyfillHostNoCombinator = polyfillHost + "-no-combinator", polyfillHostRe = new RegExp(polyfillHost, "gim"), polyfillHostContextRe = new RegExp(polyfillHostContext, "gim"), shadowDOMSelectorsRe = [ />>>/g, /::shadow/g, /::content/g, /\/deep\//g, /\/shadow\//g, /\/shadow-deep\//g, /\^\^/g, /\^/g ];
    function stylesToCssText(styles, preserveComments) {
      var cssText = "";
      Array.prototype.forEach.call(styles, function(s) {
        cssText += s.textContent + "\n\n";
      });
      if (!preserveComments) {
        cssText = cssText.replace(cssCommentRe, "");
      }
      return cssText;
    }
    function cssTextToStyle(cssText) {
      var style = document.createElement("style");
      style.textContent = cssText;
      return style;
    }
    function cssToRules(cssText) {
      var style = cssTextToStyle(cssText);
      document.head.appendChild(style);
      var rules = [];
      if (style.sheet) {
        try {
          rules = style.sheet.cssRules;
        } catch (e) {}
      } else {
        console.warn("sheet not found", style);
      }
      style.parentNode.removeChild(style);
      return rules;
    }
    var frame = document.createElement("iframe");
    frame.style.display = "none";
    function initFrame() {
      frame.initialized = true;
      document.body.appendChild(frame);
      var doc = frame.contentDocument;
      var base = doc.createElement("base");
      base.href = document.baseURI;
      doc.head.appendChild(base);
    }
    function inFrame(fn) {
      if (!frame.initialized) {
        initFrame();
      }
      document.body.appendChild(frame);
      fn(frame.contentDocument);
      document.body.removeChild(frame);
    }
    var isChrome = navigator.userAgent.match("Chrome");
    function withCssRules(cssText, callback) {
      if (!callback) {
        return;
      }
      var rules;
      if (cssText.match("@import") && isChrome) {
        var style = cssTextToStyle(cssText);
        inFrame(function(doc) {
          doc.head.appendChild(style.impl);
          rules = Array.prototype.slice.call(style.sheet.cssRules, 0);
          callback(rules);
        });
      } else {
        rules = cssToRules(cssText);
        callback(rules);
      }
    }
    function rulesToCss(cssRules) {
      for (var i = 0, css = []; i < cssRules.length; i++) {
        css.push(cssRules[i].cssText);
      }
      return css.join("\n\n");
    }
    function addCssToDocument(cssText) {
      if (cssText) {
        getSheet().appendChild(document.createTextNode(cssText));
      }
    }
    function addOwnSheet(cssText, name) {
      var style = cssTextToStyle(cssText);
      style.setAttribute(name, "");
      style.setAttribute(SHIMMED_ATTRIBUTE, "");
      document.head.appendChild(style);
    }
    var SHIM_ATTRIBUTE = "shim-shadowdom";
    var SHIMMED_ATTRIBUTE = "shim-shadowdom-css";
    var NO_SHIM_ATTRIBUTE = "no-shim";
    var sheet;
    function getSheet() {
      if (!sheet) {
        sheet = document.createElement("style");
        sheet.setAttribute(SHIMMED_ATTRIBUTE, "");
        sheet[SHIMMED_ATTRIBUTE] = true;
      }
      return sheet;
    }
    if (window.ShadowDOMPolyfill) {
      addCssToDocument("style { display: none !important; }\n");
      var doc = ShadowDOMPolyfill.wrap(document);
      var head = doc.querySelector("head");
      head.insertBefore(getSheet(), head.childNodes[0]);
      document.addEventListener("DOMContentLoaded", function() {
        var urlResolver = scope.urlResolver;
        if (window.HTMLImports && !HTMLImports.useNative) {
          var SHIM_SHEET_SELECTOR = "link[rel=stylesheet]" + "[" + SHIM_ATTRIBUTE + "]";
          var SHIM_STYLE_SELECTOR = "style[" + SHIM_ATTRIBUTE + "]";
          HTMLImports.importer.documentPreloadSelectors += "," + SHIM_SHEET_SELECTOR;
          HTMLImports.importer.importsPreloadSelectors += "," + SHIM_SHEET_SELECTOR;
          HTMLImports.parser.documentSelectors = [ HTMLImports.parser.documentSelectors, SHIM_SHEET_SELECTOR, SHIM_STYLE_SELECTOR ].join(",");
          var originalParseGeneric = HTMLImports.parser.parseGeneric;
          HTMLImports.parser.parseGeneric = function(elt) {
            if (elt[SHIMMED_ATTRIBUTE]) {
              return;
            }
            var style = elt.__importElement || elt;
            if (!style.hasAttribute(SHIM_ATTRIBUTE)) {
              originalParseGeneric.call(this, elt);
              return;
            }
            if (elt.__resource) {
              style = elt.ownerDocument.createElement("style");
              style.textContent = elt.__resource;
            }
            HTMLImports.path.resolveUrlsInStyle(style, elt.href);
            style.textContent = ShadowCSS.shimStyle(style);
            style.removeAttribute(SHIM_ATTRIBUTE, "");
            style.setAttribute(SHIMMED_ATTRIBUTE, "");
            style[SHIMMED_ATTRIBUTE] = true;
            if (style.parentNode !== head) {
              if (elt.parentNode === head) {
                head.replaceChild(style, elt);
              } else {
                this.addElementToDocument(style);
              }
            }
            style.__importParsed = true;
            this.markParsingComplete(elt);
            this.parseNext();
          };
          var hasResource = HTMLImports.parser.hasResource;
          HTMLImports.parser.hasResource = function(node) {
            if (node.localName === "link" && node.rel === "stylesheet" && node.hasAttribute(SHIM_ATTRIBUTE)) {
              return node.__resource;
            } else {
              return hasResource.call(this, node);
            }
          };
        }
      });
    }
    scope.ShadowCSS = ShadowCSS;
  })(window.WebComponents);
}

(function(scope) {
  if (window.ShadowDOMPolyfill) {
    window.wrap = ShadowDOMPolyfill.wrapIfNeeded;
    window.unwrap = ShadowDOMPolyfill.unwrapIfNeeded;
  } else {
    window.wrap = window.unwrap = function(n) {
      return n;
    };
  }
})(window.WebComponents);

(function(scope) {
  "use strict";
  var hasWorkingUrl = false;
  if (!scope.forceJURL) {
    try {
      var u = new URL("b", "http://a");
      u.pathname = "c%20d";
      hasWorkingUrl = u.href === "http://a/c%20d";
    } catch (e) {}
  }
  if (hasWorkingUrl) return;
  var relative = Object.create(null);
  relative["ftp"] = 21;
  relative["file"] = 0;
  relative["gopher"] = 70;
  relative["http"] = 80;
  relative["https"] = 443;
  relative["ws"] = 80;
  relative["wss"] = 443;
  var relativePathDotMapping = Object.create(null);
  relativePathDotMapping["%2e"] = ".";
  relativePathDotMapping[".%2e"] = "..";
  relativePathDotMapping["%2e."] = "..";
  relativePathDotMapping["%2e%2e"] = "..";
  function isRelativeScheme(scheme) {
    return relative[scheme] !== undefined;
  }
  function invalid() {
    clear.call(this);
    this._isInvalid = true;
  }
  function IDNAToASCII(h) {
    if ("" == h) {
      invalid.call(this);
    }
    return h.toLowerCase();
  }
  function percentEscape(c) {
    var unicode = c.charCodeAt(0);
    if (unicode > 32 && unicode < 127 && [ 34, 35, 60, 62, 63, 96 ].indexOf(unicode) == -1) {
      return c;
    }
    return encodeURIComponent(c);
  }
  function percentEscapeQuery(c) {
    var unicode = c.charCodeAt(0);
    if (unicode > 32 && unicode < 127 && [ 34, 35, 60, 62, 96 ].indexOf(unicode) == -1) {
      return c;
    }
    return encodeURIComponent(c);
  }
  var EOF = undefined, ALPHA = /[a-zA-Z]/, ALPHANUMERIC = /[a-zA-Z0-9\+\-\.]/;
  function parse(input, stateOverride, base) {
    function err(message) {
      errors.push(message);
    }
    var state = stateOverride || "scheme start", cursor = 0, buffer = "", seenAt = false, seenBracket = false, errors = [];
    loop: while ((input[cursor - 1] != EOF || cursor == 0) && !this._isInvalid) {
      var c = input[cursor];
      switch (state) {
       case "scheme start":
        if (c && ALPHA.test(c)) {
          buffer += c.toLowerCase();
          state = "scheme";
        } else if (!stateOverride) {
          buffer = "";
          state = "no scheme";
          continue;
        } else {
          err("Invalid scheme.");
          break loop;
        }
        break;

       case "scheme":
        if (c && ALPHANUMERIC.test(c)) {
          buffer += c.toLowerCase();
        } else if (":" == c) {
          this._scheme = buffer;
          buffer = "";
          if (stateOverride) {
            break loop;
          }
          if (isRelativeScheme(this._scheme)) {
            this._isRelative = true;
          }
          if ("file" == this._scheme) {
            state = "relative";
          } else if (this._isRelative && base && base._scheme == this._scheme) {
            state = "relative or authority";
          } else if (this._isRelative) {
            state = "authority first slash";
          } else {
            state = "scheme data";
          }
        } else if (!stateOverride) {
          buffer = "";
          cursor = 0;
          state = "no scheme";
          continue;
        } else if (EOF == c) {
          break loop;
        } else {
          err("Code point not allowed in scheme: " + c);
          break loop;
        }
        break;

       case "scheme data":
        if ("?" == c) {
          query = "?";
          state = "query";
        } else if ("#" == c) {
          this._fragment = "#";
          state = "fragment";
        } else {
          if (EOF != c && "	" != c && "\n" != c && "\r" != c) {
            this._schemeData += percentEscape(c);
          }
        }
        break;

       case "no scheme":
        if (!base || !isRelativeScheme(base._scheme)) {
          err("Missing scheme.");
          invalid.call(this);
        } else {
          state = "relative";
          continue;
        }
        break;

       case "relative or authority":
        if ("/" == c && "/" == input[cursor + 1]) {
          state = "authority ignore slashes";
        } else {
          err("Expected /, got: " + c);
          state = "relative";
          continue;
        }
        break;

       case "relative":
        this._isRelative = true;
        if ("file" != this._scheme) this._scheme = base._scheme;
        if (EOF == c) {
          this._host = base._host;
          this._port = base._port;
          this._path = base._path.slice();
          this._query = base._query;
          this._username = base._username;
          this._password = base._password;
          break loop;
        } else if ("/" == c || "\\" == c) {
          if ("\\" == c) err("\\ is an invalid code point.");
          state = "relative slash";
        } else if ("?" == c) {
          this._host = base._host;
          this._port = base._port;
          this._path = base._path.slice();
          this._query = "?";
          this._username = base._username;
          this._password = base._password;
          state = "query";
        } else if ("#" == c) {
          this._host = base._host;
          this._port = base._port;
          this._path = base._path.slice();
          this._query = base._query;
          this._fragment = "#";
          this._username = base._username;
          this._password = base._password;
          state = "fragment";
        } else {
          var nextC = input[cursor + 1];
          var nextNextC = input[cursor + 2];
          if ("file" != this._scheme || !ALPHA.test(c) || nextC != ":" && nextC != "|" || EOF != nextNextC && "/" != nextNextC && "\\" != nextNextC && "?" != nextNextC && "#" != nextNextC) {
            this._host = base._host;
            this._port = base._port;
            this._username = base._username;
            this._password = base._password;
            this._path = base._path.slice();
            this._path.pop();
          }
          state = "relative path";
          continue;
        }
        break;

       case "relative slash":
        if ("/" == c || "\\" == c) {
          if ("\\" == c) {
            err("\\ is an invalid code point.");
          }
          if ("file" == this._scheme) {
            state = "file host";
          } else {
            state = "authority ignore slashes";
          }
        } else {
          if ("file" != this._scheme) {
            this._host = base._host;
            this._port = base._port;
            this._username = base._username;
            this._password = base._password;
          }
          state = "relative path";
          continue;
        }
        break;

       case "authority first slash":
        if ("/" == c) {
          state = "authority second slash";
        } else {
          err("Expected '/', got: " + c);
          state = "authority ignore slashes";
          continue;
        }
        break;

       case "authority second slash":
        state = "authority ignore slashes";
        if ("/" != c) {
          err("Expected '/', got: " + c);
          continue;
        }
        break;

       case "authority ignore slashes":
        if ("/" != c && "\\" != c) {
          state = "authority";
          continue;
        } else {
          err("Expected authority, got: " + c);
        }
        break;

       case "authority":
        if ("@" == c) {
          if (seenAt) {
            err("@ already seen.");
            buffer += "%40";
          }
          seenAt = true;
          for (var i = 0; i < buffer.length; i++) {
            var cp = buffer[i];
            if ("	" == cp || "\n" == cp || "\r" == cp) {
              err("Invalid whitespace in authority.");
              continue;
            }
            if (":" == cp && null === this._password) {
              this._password = "";
              continue;
            }
            var tempC = percentEscape(cp);
            null !== this._password ? this._password += tempC : this._username += tempC;
          }
          buffer = "";
        } else if (EOF == c || "/" == c || "\\" == c || "?" == c || "#" == c) {
          cursor -= buffer.length;
          buffer = "";
          state = "host";
          continue;
        } else {
          buffer += c;
        }
        break;

       case "file host":
        if (EOF == c || "/" == c || "\\" == c || "?" == c || "#" == c) {
          if (buffer.length == 2 && ALPHA.test(buffer[0]) && (buffer[1] == ":" || buffer[1] == "|")) {
            state = "relative path";
          } else if (buffer.length == 0) {
            state = "relative path start";
          } else {
            this._host = IDNAToASCII.call(this, buffer);
            buffer = "";
            state = "relative path start";
          }
          continue;
        } else if ("	" == c || "\n" == c || "\r" == c) {
          err("Invalid whitespace in file host.");
        } else {
          buffer += c;
        }
        break;

       case "host":
       case "hostname":
        if (":" == c && !seenBracket) {
          this._host = IDNAToASCII.call(this, buffer);
          buffer = "";
          state = "port";
          if ("hostname" == stateOverride) {
            break loop;
          }
        } else if (EOF == c || "/" == c || "\\" == c || "?" == c || "#" == c) {
          this._host = IDNAToASCII.call(this, buffer);
          buffer = "";
          state = "relative path start";
          if (stateOverride) {
            break loop;
          }
          continue;
        } else if ("	" != c && "\n" != c && "\r" != c) {
          if ("[" == c) {
            seenBracket = true;
          } else if ("]" == c) {
            seenBracket = false;
          }
          buffer += c;
        } else {
          err("Invalid code point in host/hostname: " + c);
        }
        break;

       case "port":
        if (/[0-9]/.test(c)) {
          buffer += c;
        } else if (EOF == c || "/" == c || "\\" == c || "?" == c || "#" == c || stateOverride) {
          if ("" != buffer) {
            var temp = parseInt(buffer, 10);
            if (temp != relative[this._scheme]) {
              this._port = temp + "";
            }
            buffer = "";
          }
          if (stateOverride) {
            break loop;
          }
          state = "relative path start";
          continue;
        } else if ("	" == c || "\n" == c || "\r" == c) {
          err("Invalid code point in port: " + c);
        } else {
          invalid.call(this);
        }
        break;

       case "relative path start":
        if ("\\" == c) err("'\\' not allowed in path.");
        state = "relative path";
        if ("/" != c && "\\" != c) {
          continue;
        }
        break;

       case "relative path":
        if (EOF == c || "/" == c || "\\" == c || !stateOverride && ("?" == c || "#" == c)) {
          if ("\\" == c) {
            err("\\ not allowed in relative path.");
          }
          var tmp;
          if (tmp = relativePathDotMapping[buffer.toLowerCase()]) {
            buffer = tmp;
          }
          if (".." == buffer) {
            this._path.pop();
            if ("/" != c && "\\" != c) {
              this._path.push("");
            }
          } else if ("." == buffer && "/" != c && "\\" != c) {
            this._path.push("");
          } else if ("." != buffer) {
            if ("file" == this._scheme && this._path.length == 0 && buffer.length == 2 && ALPHA.test(buffer[0]) && buffer[1] == "|") {
              buffer = buffer[0] + ":";
            }
            this._path.push(buffer);
          }
          buffer = "";
          if ("?" == c) {
            this._query = "?";
            state = "query";
          } else if ("#" == c) {
            this._fragment = "#";
            state = "fragment";
          }
        } else if ("	" != c && "\n" != c && "\r" != c) {
          buffer += percentEscape(c);
        }
        break;

       case "query":
        if (!stateOverride && "#" == c) {
          this._fragment = "#";
          state = "fragment";
        } else if (EOF != c && "	" != c && "\n" != c && "\r" != c) {
          this._query += percentEscapeQuery(c);
        }
        break;

       case "fragment":
        if (EOF != c && "	" != c && "\n" != c && "\r" != c) {
          this._fragment += c;
        }
        break;
      }
      cursor++;
    }
  }
  function clear() {
    this._scheme = "";
    this._schemeData = "";
    this._username = "";
    this._password = null;
    this._host = "";
    this._port = "";
    this._path = [];
    this._query = "";
    this._fragment = "";
    this._isInvalid = false;
    this._isRelative = false;
  }
  function jURL(url, base) {
    if (base !== undefined && !(base instanceof jURL)) base = new jURL(String(base));
    this._url = url;
    clear.call(this);
    var input = url.replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/g, "");
    parse.call(this, input, null, base);
  }
  jURL.prototype = {
    toString: function() {
      return this.href;
    },
    get href() {
      if (this._isInvalid) return this._url;
      var authority = "";
      if ("" != this._username || null != this._password) {
        authority = this._username + (null != this._password ? ":" + this._password : "") + "@";
      }
      return this.protocol + (this._isRelative ? "//" + authority + this.host : "") + this.pathname + this._query + this._fragment;
    },
    set href(href) {
      clear.call(this);
      parse.call(this, href);
    },
    get protocol() {
      return this._scheme + ":";
    },
    set protocol(protocol) {
      if (this._isInvalid) return;
      parse.call(this, protocol + ":", "scheme start");
    },
    get host() {
      return this._isInvalid ? "" : this._port ? this._host + ":" + this._port : this._host;
    },
    set host(host) {
      if (this._isInvalid || !this._isRelative) return;
      parse.call(this, host, "host");
    },
    get hostname() {
      return this._host;
    },
    set hostname(hostname) {
      if (this._isInvalid || !this._isRelative) return;
      parse.call(this, hostname, "hostname");
    },
    get port() {
      return this._port;
    },
    set port(port) {
      if (this._isInvalid || !this._isRelative) return;
      parse.call(this, port, "port");
    },
    get pathname() {
      return this._isInvalid ? "" : this._isRelative ? "/" + this._path.join("/") : this._schemeData;
    },
    set pathname(pathname) {
      if (this._isInvalid || !this._isRelative) return;
      this._path = [];
      parse.call(this, pathname, "relative path start");
    },
    get search() {
      return this._isInvalid || !this._query || "?" == this._query ? "" : this._query;
    },
    set search(search) {
      if (this._isInvalid || !this._isRelative) return;
      this._query = "?";
      if ("?" == search[0]) search = search.slice(1);
      parse.call(this, search, "query");
    },
    get hash() {
      return this._isInvalid || !this._fragment || "#" == this._fragment ? "" : this._fragment;
    },
    set hash(hash) {
      if (this._isInvalid) return;
      this._fragment = "#";
      if ("#" == hash[0]) hash = hash.slice(1);
      parse.call(this, hash, "fragment");
    },
    get origin() {
      var host;
      if (this._isInvalid || !this._scheme) {
        return "";
      }
      switch (this._scheme) {
       case "data":
       case "file":
       case "javascript":
       case "mailto":
        return "null";
      }
      host = this.host;
      if (!host) {
        return "";
      }
      return this._scheme + "://" + host;
    }
  };
  var OriginalURL = scope.URL;
  if (OriginalURL) {
    jURL.createObjectURL = function(blob) {
      return OriginalURL.createObjectURL.apply(OriginalURL, arguments);
    };
    jURL.revokeObjectURL = function(url) {
      OriginalURL.revokeObjectURL(url);
    };
  }
  scope.URL = jURL;
})(this);

(function(global) {
  var registrationsTable = new WeakMap();
  var setImmediate;
  if (/Trident|Edge/.test(navigator.userAgent)) {
    setImmediate = setTimeout;
  } else if (window.setImmediate) {
    setImmediate = window.setImmediate;
  } else {
    var setImmediateQueue = [];
    var sentinel = String(Math.random());
    window.addEventListener("message", function(e) {
      if (e.data === sentinel) {
        var queue = setImmediateQueue;
        setImmediateQueue = [];
        queue.forEach(function(func) {
          func();
        });
      }
    });
    setImmediate = function(func) {
      setImmediateQueue.push(func);
      window.postMessage(sentinel, "*");
    };
  }
  var isScheduled = false;
  var scheduledObservers = [];
  function scheduleCallback(observer) {
    scheduledObservers.push(observer);
    if (!isScheduled) {
      isScheduled = true;
      setImmediate(dispatchCallbacks);
    }
  }
  function wrapIfNeeded(node) {
    return window.ShadowDOMPolyfill && window.ShadowDOMPolyfill.wrapIfNeeded(node) || node;
  }
  function dispatchCallbacks() {
    isScheduled = false;
    var observers = scheduledObservers;
    scheduledObservers = [];
    observers.sort(function(o1, o2) {
      return o1.uid_ - o2.uid_;
    });
    var anyNonEmpty = false;
    observers.forEach(function(observer) {
      var queue = observer.takeRecords();
      removeTransientObserversFor(observer);
      if (queue.length) {
        observer.callback_(queue, observer);
        anyNonEmpty = true;
      }
    });
    if (anyNonEmpty) dispatchCallbacks();
  }
  function removeTransientObserversFor(observer) {
    observer.nodes_.forEach(function(node) {
      var registrations = registrationsTable.get(node);
      if (!registrations) return;
      registrations.forEach(function(registration) {
        if (registration.observer === observer) registration.removeTransientObservers();
      });
    });
  }
  function forEachAncestorAndObserverEnqueueRecord(target, callback) {
    for (var node = target; node; node = node.parentNode) {
      var registrations = registrationsTable.get(node);
      if (registrations) {
        for (var j = 0; j < registrations.length; j++) {
          var registration = registrations[j];
          var options = registration.options;
          if (node !== target && !options.subtree) continue;
          var record = callback(options);
          if (record) registration.enqueue(record);
        }
      }
    }
  }
  var uidCounter = 0;
  function JsMutationObserver(callback) {
    this.callback_ = callback;
    this.nodes_ = [];
    this.records_ = [];
    this.uid_ = ++uidCounter;
  }
  JsMutationObserver.prototype = {
    observe: function(target, options) {
      target = wrapIfNeeded(target);
      if (!options.childList && !options.attributes && !options.characterData || options.attributeOldValue && !options.attributes || options.attributeFilter && options.attributeFilter.length && !options.attributes || options.characterDataOldValue && !options.characterData) {
        throw new SyntaxError();
      }
      var registrations = registrationsTable.get(target);
      if (!registrations) registrationsTable.set(target, registrations = []);
      var registration;
      for (var i = 0; i < registrations.length; i++) {
        if (registrations[i].observer === this) {
          registration = registrations[i];
          registration.removeListeners();
          registration.options = options;
          break;
        }
      }
      if (!registration) {
        registration = new Registration(this, target, options);
        registrations.push(registration);
        this.nodes_.push(target);
      }
      registration.addListeners();
    },
    disconnect: function() {
      this.nodes_.forEach(function(node) {
        var registrations = registrationsTable.get(node);
        for (var i = 0; i < registrations.length; i++) {
          var registration = registrations[i];
          if (registration.observer === this) {
            registration.removeListeners();
            registrations.splice(i, 1);
            break;
          }
        }
      }, this);
      this.records_ = [];
    },
    takeRecords: function() {
      var copyOfRecords = this.records_;
      this.records_ = [];
      return copyOfRecords;
    }
  };
  function MutationRecord(type, target) {
    this.type = type;
    this.target = target;
    this.addedNodes = [];
    this.removedNodes = [];
    this.previousSibling = null;
    this.nextSibling = null;
    this.attributeName = null;
    this.attributeNamespace = null;
    this.oldValue = null;
  }
  function copyMutationRecord(original) {
    var record = new MutationRecord(original.type, original.target);
    record.addedNodes = original.addedNodes.slice();
    record.removedNodes = original.removedNodes.slice();
    record.previousSibling = original.previousSibling;
    record.nextSibling = original.nextSibling;
    record.attributeName = original.attributeName;
    record.attributeNamespace = original.attributeNamespace;
    record.oldValue = original.oldValue;
    return record;
  }
  var currentRecord, recordWithOldValue;
  function getRecord(type, target) {
    return currentRecord = new MutationRecord(type, target);
  }
  function getRecordWithOldValue(oldValue) {
    if (recordWithOldValue) return recordWithOldValue;
    recordWithOldValue = copyMutationRecord(currentRecord);
    recordWithOldValue.oldValue = oldValue;
    return recordWithOldValue;
  }
  function clearRecords() {
    currentRecord = recordWithOldValue = undefined;
  }
  function recordRepresentsCurrentMutation(record) {
    return record === recordWithOldValue || record === currentRecord;
  }
  function selectRecord(lastRecord, newRecord) {
    if (lastRecord === newRecord) return lastRecord;
    if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord)) return recordWithOldValue;
    return null;
  }
  function Registration(observer, target, options) {
    this.observer = observer;
    this.target = target;
    this.options = options;
    this.transientObservedNodes = [];
  }
  Registration.prototype = {
    enqueue: function(record) {
      var records = this.observer.records_;
      var length = records.length;
      if (records.length > 0) {
        var lastRecord = records[length - 1];
        var recordToReplaceLast = selectRecord(lastRecord, record);
        if (recordToReplaceLast) {
          records[length - 1] = recordToReplaceLast;
          return;
        }
      } else {
        scheduleCallback(this.observer);
      }
      records[length] = record;
    },
    addListeners: function() {
      this.addListeners_(this.target);
    },
    addListeners_: function(node) {
      var options = this.options;
      if (options.attributes) node.addEventListener("DOMAttrModified", this, true);
      if (options.characterData) node.addEventListener("DOMCharacterDataModified", this, true);
      if (options.childList) node.addEventListener("DOMNodeInserted", this, true);
      if (options.childList || options.subtree) node.addEventListener("DOMNodeRemoved", this, true);
    },
    removeListeners: function() {
      this.removeListeners_(this.target);
    },
    removeListeners_: function(node) {
      var options = this.options;
      if (options.attributes) node.removeEventListener("DOMAttrModified", this, true);
      if (options.characterData) node.removeEventListener("DOMCharacterDataModified", this, true);
      if (options.childList) node.removeEventListener("DOMNodeInserted", this, true);
      if (options.childList || options.subtree) node.removeEventListener("DOMNodeRemoved", this, true);
    },
    addTransientObserver: function(node) {
      if (node === this.target) return;
      this.addListeners_(node);
      this.transientObservedNodes.push(node);
      var registrations = registrationsTable.get(node);
      if (!registrations) registrationsTable.set(node, registrations = []);
      registrations.push(this);
    },
    removeTransientObservers: function() {
      var transientObservedNodes = this.transientObservedNodes;
      this.transientObservedNodes = [];
      transientObservedNodes.forEach(function(node) {
        this.removeListeners_(node);
        var registrations = registrationsTable.get(node);
        for (var i = 0; i < registrations.length; i++) {
          if (registrations[i] === this) {
            registrations.splice(i, 1);
            break;
          }
        }
      }, this);
    },
    handleEvent: function(e) {
      e.stopImmediatePropagation();
      switch (e.type) {
       case "DOMAttrModified":
        var name = e.attrName;
        var namespace = e.relatedNode.namespaceURI;
        var target = e.target;
        var record = new getRecord("attributes", target);
        record.attributeName = name;
        record.attributeNamespace = namespace;
        var oldValue = e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;
        forEachAncestorAndObserverEnqueueRecord(target, function(options) {
          if (!options.attributes) return;
          if (options.attributeFilter && options.attributeFilter.length && options.attributeFilter.indexOf(name) === -1 && options.attributeFilter.indexOf(namespace) === -1) {
            return;
          }
          if (options.attributeOldValue) return getRecordWithOldValue(oldValue);
          return record;
        });
        break;

       case "DOMCharacterDataModified":
        var target = e.target;
        var record = getRecord("characterData", target);
        var oldValue = e.prevValue;
        forEachAncestorAndObserverEnqueueRecord(target, function(options) {
          if (!options.characterData) return;
          if (options.characterDataOldValue) return getRecordWithOldValue(oldValue);
          return record;
        });
        break;

       case "DOMNodeRemoved":
        this.addTransientObserver(e.target);

       case "DOMNodeInserted":
        var changedNode = e.target;
        var addedNodes, removedNodes;
        if (e.type === "DOMNodeInserted") {
          addedNodes = [ changedNode ];
          removedNodes = [];
        } else {
          addedNodes = [];
          removedNodes = [ changedNode ];
        }
        var previousSibling = changedNode.previousSibling;
        var nextSibling = changedNode.nextSibling;
        var record = getRecord("childList", e.target.parentNode);
        record.addedNodes = addedNodes;
        record.removedNodes = removedNodes;
        record.previousSibling = previousSibling;
        record.nextSibling = nextSibling;
        forEachAncestorAndObserverEnqueueRecord(e.relatedNode, function(options) {
          if (!options.childList) return;
          return record;
        });
      }
      clearRecords();
    }
  };
  global.JsMutationObserver = JsMutationObserver;
  if (!global.MutationObserver) global.MutationObserver = JsMutationObserver;
})(this);

window.HTMLImports = window.HTMLImports || {
  flags: {}
};

(function(scope) {
  var IMPORT_LINK_TYPE = "import";
  var useNative = Boolean(IMPORT_LINK_TYPE in document.createElement("link"));
  var hasShadowDOMPolyfill = Boolean(window.ShadowDOMPolyfill);
  var wrap = function(node) {
    return hasShadowDOMPolyfill ? ShadowDOMPolyfill.wrapIfNeeded(node) : node;
  };
  var rootDocument = wrap(document);
  var currentScriptDescriptor = {
    get: function() {
      var script = HTMLImports.currentScript || document.currentScript || (document.readyState !== "complete" ? document.scripts[document.scripts.length - 1] : null);
      return wrap(script);
    },
    configurable: true
  };
  Object.defineProperty(document, "_currentScript", currentScriptDescriptor);
  Object.defineProperty(rootDocument, "_currentScript", currentScriptDescriptor);
  var isIE = /Trident|Edge/.test(navigator.userAgent);
  function whenReady(callback, doc) {
    doc = doc || rootDocument;
    whenDocumentReady(function() {
      watchImportsLoad(callback, doc);
    }, doc);
  }
  var requiredReadyState = isIE ? "complete" : "interactive";
  var READY_EVENT = "readystatechange";
  function isDocumentReady(doc) {
    return doc.readyState === "complete" || doc.readyState === requiredReadyState;
  }
  function whenDocumentReady(callback, doc) {
    if (!isDocumentReady(doc)) {
      var checkReady = function() {
        if (doc.readyState === "complete" || doc.readyState === requiredReadyState) {
          doc.removeEventListener(READY_EVENT, checkReady);
          whenDocumentReady(callback, doc);
        }
      };
      doc.addEventListener(READY_EVENT, checkReady);
    } else if (callback) {
      callback();
    }
  }
  function markTargetLoaded(event) {
    event.target.__loaded = true;
  }
  function watchImportsLoad(callback, doc) {
    var imports = doc.querySelectorAll("link[rel=import]");
    var parsedCount = 0, importCount = imports.length, newImports = [], errorImports = [];
    function checkDone() {
      if (parsedCount == importCount && callback) {
        callback({
          allImports: imports,
          loadedImports: newImports,
          errorImports: errorImports
        });
      }
    }
    function loadedImport(e) {
      markTargetLoaded(e);
      newImports.push(this);
      parsedCount++;
      checkDone();
    }
    function errorLoadingImport(e) {
      errorImports.push(this);
      parsedCount++;
      checkDone();
    }
    if (importCount) {
      for (var i = 0, imp; i < importCount && (imp = imports[i]); i++) {
        if (isImportLoaded(imp)) {
          parsedCount++;
          checkDone();
        } else {
          imp.addEventListener("load", loadedImport);
          imp.addEventListener("error", errorLoadingImport);
        }
      }
    } else {
      checkDone();
    }
  }
  function isImportLoaded(link) {
    return useNative ? link.__loaded || link.import && link.import.readyState !== "loading" : link.__importParsed;
  }
  if (useNative) {
    new MutationObserver(function(mxns) {
      for (var i = 0, l = mxns.length, m; i < l && (m = mxns[i]); i++) {
        if (m.addedNodes) {
          handleImports(m.addedNodes);
        }
      }
    }).observe(document.head, {
      childList: true
    });
    function handleImports(nodes) {
      for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
        if (isImport(n)) {
          handleImport(n);
        }
      }
    }
    function isImport(element) {
      return element.localName === "link" && element.rel === "import";
    }
    function handleImport(element) {
      var loaded = element.import;
      if (loaded) {
        markTargetLoaded({
          target: element
        });
      } else {
        element.addEventListener("load", markTargetLoaded);
        element.addEventListener("error", markTargetLoaded);
      }
    }
    (function() {
      if (document.readyState === "loading") {
        var imports = document.querySelectorAll("link[rel=import]");
        for (var i = 0, l = imports.length, imp; i < l && (imp = imports[i]); i++) {
          handleImport(imp);
        }
      }
    })();
  }
  whenReady(function(detail) {
    HTMLImports.ready = true;
    HTMLImports.readyTime = new Date().getTime();
    var evt = rootDocument.createEvent("CustomEvent");
    evt.initCustomEvent("HTMLImportsLoaded", true, true, detail);
    rootDocument.dispatchEvent(evt);
  });
  scope.IMPORT_LINK_TYPE = IMPORT_LINK_TYPE;
  scope.useNative = useNative;
  scope.rootDocument = rootDocument;
  scope.whenReady = whenReady;
  scope.isIE = isIE;
})(HTMLImports);

(function(scope) {
  var modules = [];
  var addModule = function(module) {
    modules.push(module);
  };
  var initializeModules = function() {
    modules.forEach(function(module) {
      module(scope);
    });
  };
  scope.addModule = addModule;
  scope.initializeModules = initializeModules;
})(HTMLImports);

HTMLImports.addModule(function(scope) {
  var CSS_URL_REGEXP = /(url\()([^)]*)(\))/g;
  var CSS_IMPORT_REGEXP = /(@import[\s]+(?!url\())([^;]*)(;)/g;
  var path = {
    resolveUrlsInStyle: function(style, linkUrl) {
      var doc = style.ownerDocument;
      var resolver = doc.createElement("a");
      style.textContent = this.resolveUrlsInCssText(style.textContent, linkUrl, resolver);
      return style;
    },
    resolveUrlsInCssText: function(cssText, linkUrl, urlObj) {
      var r = this.replaceUrls(cssText, urlObj, linkUrl, CSS_URL_REGEXP);
      r = this.replaceUrls(r, urlObj, linkUrl, CSS_IMPORT_REGEXP);
      return r;
    },
    replaceUrls: function(text, urlObj, linkUrl, regexp) {
      return text.replace(regexp, function(m, pre, url, post) {
        var urlPath = url.replace(/["']/g, "");
        if (linkUrl) {
          urlPath = new URL(urlPath, linkUrl).href;
        }
        urlObj.href = urlPath;
        urlPath = urlObj.href;
        return pre + "'" + urlPath + "'" + post;
      });
    }
  };
  scope.path = path;
});

HTMLImports.addModule(function(scope) {
  var xhr = {
    async: true,
    ok: function(request) {
      return request.status >= 200 && request.status < 300 || request.status === 304 || request.status === 0;
    },
    load: function(url, next, nextContext) {
      var request = new XMLHttpRequest();
      if (scope.flags.debug || scope.flags.bust) {
        url += "?" + Math.random();
      }
      request.open("GET", url, xhr.async);
      request.addEventListener("readystatechange", function(e) {
        if (request.readyState === 4) {
          var locationHeader = request.getResponseHeader("Location");
          var redirectedUrl = null;
          if (locationHeader) {
            var redirectedUrl = locationHeader.substr(0, 1) === "/" ? location.origin + locationHeader : locationHeader;
          }
          next.call(nextContext, !xhr.ok(request) && request, request.response || request.responseText, redirectedUrl);
        }
      });
      request.send();
      return request;
    },
    loadDocument: function(url, next, nextContext) {
      this.load(url, next, nextContext).responseType = "document";
    }
  };
  scope.xhr = xhr;
});

HTMLImports.addModule(function(scope) {
  var xhr = scope.xhr;
  var flags = scope.flags;
  var Loader = function(onLoad, onComplete) {
    this.cache = {};
    this.onload = onLoad;
    this.oncomplete = onComplete;
    this.inflight = 0;
    this.pending = {};
  };
  Loader.prototype = {
    addNodes: function(nodes) {
      this.inflight += nodes.length;
      for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
        this.require(n);
      }
      this.checkDone();
    },
    addNode: function(node) {
      this.inflight++;
      this.require(node);
      this.checkDone();
    },
    require: function(elt) {
      var url = elt.src || elt.href;
      elt.__nodeUrl = url;
      if (!this.dedupe(url, elt)) {
        this.fetch(url, elt);
      }
    },
    dedupe: function(url, elt) {
      if (this.pending[url]) {
        this.pending[url].push(elt);
        return true;
      }
      var resource;
      if (this.cache[url]) {
        this.onload(url, elt, this.cache[url]);
        this.tail();
        return true;
      }
      this.pending[url] = [ elt ];
      return false;
    },
    fetch: function(url, elt) {
      flags.load && console.log("fetch", url, elt);
      if (!url) {
        setTimeout(function() {
          this.receive(url, elt, {
            error: "href must be specified"
          }, null);
        }.bind(this), 0);
      } else if (url.match(/^data:/)) {
        var pieces = url.split(",");
        var header = pieces[0];
        var body = pieces[1];
        if (header.indexOf(";base64") > -1) {
          body = atob(body);
        } else {
          body = decodeURIComponent(body);
        }
        setTimeout(function() {
          this.receive(url, elt, null, body);
        }.bind(this), 0);
      } else {
        var receiveXhr = function(err, resource, redirectedUrl) {
          this.receive(url, elt, err, resource, redirectedUrl);
        }.bind(this);
        xhr.load(url, receiveXhr);
      }
    },
    receive: function(url, elt, err, resource, redirectedUrl) {
      this.cache[url] = resource;
      var $p = this.pending[url];
      for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
        this.onload(url, p, resource, err, redirectedUrl);
        this.tail();
      }
      this.pending[url] = null;
    },
    tail: function() {
      --this.inflight;
      this.checkDone();
    },
    checkDone: function() {
      if (!this.inflight) {
        this.oncomplete();
      }
    }
  };
  scope.Loader = Loader;
});

HTMLImports.addModule(function(scope) {
  var Observer = function(addCallback) {
    this.addCallback = addCallback;
    this.mo = new MutationObserver(this.handler.bind(this));
  };
  Observer.prototype = {
    handler: function(mutations) {
      for (var i = 0, l = mutations.length, m; i < l && (m = mutations[i]); i++) {
        if (m.type === "childList" && m.addedNodes.length) {
          this.addedNodes(m.addedNodes);
        }
      }
    },
    addedNodes: function(nodes) {
      if (this.addCallback) {
        this.addCallback(nodes);
      }
      for (var i = 0, l = nodes.length, n, loading; i < l && (n = nodes[i]); i++) {
        if (n.children && n.children.length) {
          this.addedNodes(n.children);
        }
      }
    },
    observe: function(root) {
      this.mo.observe(root, {
        childList: true,
        subtree: true
      });
    }
  };
  scope.Observer = Observer;
});

HTMLImports.addModule(function(scope) {
  var path = scope.path;
  var rootDocument = scope.rootDocument;
  var flags = scope.flags;
  var isIE = scope.isIE;
  var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
  var IMPORT_SELECTOR = "link[rel=" + IMPORT_LINK_TYPE + "]";
  var importParser = {
    documentSelectors: IMPORT_SELECTOR,
    importsSelectors: [ IMPORT_SELECTOR, "link[rel=stylesheet]", "style", "script:not([type])", 'script[type="application/javascript"]', 'script[type="text/javascript"]' ].join(","),
    map: {
      link: "parseLink",
      script: "parseScript",
      style: "parseStyle"
    },
    dynamicElements: [],
    parseNext: function() {
      var next = this.nextToParse();
      if (next) {
        this.parse(next);
      }
    },
    parse: function(elt) {
      if (this.isParsed(elt)) {
        flags.parse && console.log("[%s] is already parsed", elt.localName);
        return;
      }
      var fn = this[this.map[elt.localName]];
      if (fn) {
        this.markParsing(elt);
        fn.call(this, elt);
      }
    },
    parseDynamic: function(elt, quiet) {
      this.dynamicElements.push(elt);
      if (!quiet) {
        this.parseNext();
      }
    },
    markParsing: function(elt) {
      flags.parse && console.log("parsing", elt);
      this.parsingElement = elt;
    },
    markParsingComplete: function(elt) {
      elt.__importParsed = true;
      this.markDynamicParsingComplete(elt);
      if (elt.__importElement) {
        elt.__importElement.__importParsed = true;
        this.markDynamicParsingComplete(elt.__importElement);
      }
      this.parsingElement = null;
      flags.parse && console.log("completed", elt);
    },
    markDynamicParsingComplete: function(elt) {
      var i = this.dynamicElements.indexOf(elt);
      if (i >= 0) {
        this.dynamicElements.splice(i, 1);
      }
    },
    parseImport: function(elt) {
      if (HTMLImports.__importsParsingHook) {
        HTMLImports.__importsParsingHook(elt);
      }
      if (elt.import) {
        elt.import.__importParsed = true;
      }
      this.markParsingComplete(elt);
      if (elt.__resource && !elt.__error) {
        elt.dispatchEvent(new CustomEvent("load", {
          bubbles: false
        }));
      } else {
        elt.dispatchEvent(new CustomEvent("error", {
          bubbles: false
        }));
      }
      if (elt.__pending) {
        var fn;
        while (elt.__pending.length) {
          fn = elt.__pending.shift();
          if (fn) {
            fn({
              target: elt
            });
          }
        }
      }
      this.parseNext();
    },
    parseLink: function(linkElt) {
      if (nodeIsImport(linkElt)) {
        this.parseImport(linkElt);
      } else {
        linkElt.href = linkElt.href;
        this.parseGeneric(linkElt);
      }
    },
    parseStyle: function(elt) {
      var src = elt;
      elt = cloneStyle(elt);
      src.__appliedElement = elt;
      elt.__importElement = src;
      this.parseGeneric(elt);
    },
    parseGeneric: function(elt) {
      this.trackElement(elt);
      this.addElementToDocument(elt);
    },
    rootImportForElement: function(elt) {
      var n = elt;
      while (n.ownerDocument.__importLink) {
        n = n.ownerDocument.__importLink;
      }
      return n;
    },
    addElementToDocument: function(elt) {
      var port = this.rootImportForElement(elt.__importElement || elt);
      port.parentNode.insertBefore(elt, port);
    },
    trackElement: function(elt, callback) {
      var self = this;
      var done = function(e) {
        if (callback) {
          callback(e);
        }
        self.markParsingComplete(elt);
        self.parseNext();
      };
      elt.addEventListener("load", done);
      elt.addEventListener("error", done);
      if (isIE && elt.localName === "style") {
        var fakeLoad = false;
        if (elt.textContent.indexOf("@import") == -1) {
          fakeLoad = true;
        } else if (elt.sheet) {
          fakeLoad = true;
          var csr = elt.sheet.cssRules;
          var len = csr ? csr.length : 0;
          for (var i = 0, r; i < len && (r = csr[i]); i++) {
            if (r.type === CSSRule.IMPORT_RULE) {
              fakeLoad = fakeLoad && Boolean(r.styleSheet);
            }
          }
        }
        if (fakeLoad) {
          setTimeout(function() {
            elt.dispatchEvent(new CustomEvent("load", {
              bubbles: false
            }));
          });
        }
      }
    },
    parseScript: function(scriptElt) {
      var script = document.createElement("script");
      script.__importElement = scriptElt;
      script.src = scriptElt.src ? scriptElt.src : generateScriptDataUrl(scriptElt);
      scope.currentScript = scriptElt;
      this.trackElement(script, function(e) {
        script.parentNode.removeChild(script);
        scope.currentScript = null;
      });
      this.addElementToDocument(script);
    },
    nextToParse: function() {
      this._mayParse = [];
      return !this.parsingElement && (this.nextToParseInDoc(rootDocument) || this.nextToParseDynamic());
    },
    nextToParseInDoc: function(doc, link) {
      if (doc && this._mayParse.indexOf(doc) < 0) {
        this._mayParse.push(doc);
        var nodes = doc.querySelectorAll(this.parseSelectorsForNode(doc));
        for (var i = 0, l = nodes.length, p = 0, n; i < l && (n = nodes[i]); i++) {
          if (!this.isParsed(n)) {
            if (this.hasResource(n)) {
              return nodeIsImport(n) ? this.nextToParseInDoc(n.import, n) : n;
            } else {
              return;
            }
          }
        }
      }
      return link;
    },
    nextToParseDynamic: function() {
      return this.dynamicElements[0];
    },
    parseSelectorsForNode: function(node) {
      var doc = node.ownerDocument || node;
      return doc === rootDocument ? this.documentSelectors : this.importsSelectors;
    },
    isParsed: function(node) {
      return node.__importParsed;
    },
    needsDynamicParsing: function(elt) {
      return this.dynamicElements.indexOf(elt) >= 0;
    },
    hasResource: function(node) {
      if (nodeIsImport(node) && node.import === undefined) {
        return false;
      }
      return true;
    }
  };
  function nodeIsImport(elt) {
    return elt.localName === "link" && elt.rel === IMPORT_LINK_TYPE;
  }
  function generateScriptDataUrl(script) {
    var scriptContent = generateScriptContent(script);
    return "data:text/javascript;charset=utf-8," + encodeURIComponent(scriptContent);
  }
  function generateScriptContent(script) {
    return script.textContent + generateSourceMapHint(script);
  }
  function generateSourceMapHint(script) {
    var owner = script.ownerDocument;
    owner.__importedScripts = owner.__importedScripts || 0;
    var moniker = script.ownerDocument.baseURI;
    var num = owner.__importedScripts ? "-" + owner.__importedScripts : "";
    owner.__importedScripts++;
    return "\n//# sourceURL=" + moniker + num + ".js\n";
  }
  function cloneStyle(style) {
    var clone = style.ownerDocument.createElement("style");
    clone.textContent = style.textContent;
    path.resolveUrlsInStyle(clone);
    return clone;
  }
  scope.parser = importParser;
  scope.IMPORT_SELECTOR = IMPORT_SELECTOR;
});

HTMLImports.addModule(function(scope) {
  var flags = scope.flags;
  var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
  var IMPORT_SELECTOR = scope.IMPORT_SELECTOR;
  var rootDocument = scope.rootDocument;
  var Loader = scope.Loader;
  var Observer = scope.Observer;
  var parser = scope.parser;
  var importer = {
    documents: {},
    documentPreloadSelectors: IMPORT_SELECTOR,
    importsPreloadSelectors: [ IMPORT_SELECTOR ].join(","),
    loadNode: function(node) {
      importLoader.addNode(node);
    },
    loadSubtree: function(parent) {
      var nodes = this.marshalNodes(parent);
      importLoader.addNodes(nodes);
    },
    marshalNodes: function(parent) {
      return parent.querySelectorAll(this.loadSelectorsForNode(parent));
    },
    loadSelectorsForNode: function(node) {
      var doc = node.ownerDocument || node;
      return doc === rootDocument ? this.documentPreloadSelectors : this.importsPreloadSelectors;
    },
    loaded: function(url, elt, resource, err, redirectedUrl) {
      flags.load && console.log("loaded", url, elt);
      elt.__resource = resource;
      elt.__error = err;
      if (isImportLink(elt)) {
        var doc = this.documents[url];
        if (doc === undefined) {
          doc = err ? null : makeDocument(resource, redirectedUrl || url);
          if (doc) {
            doc.__importLink = elt;
            this.bootDocument(doc);
          }
          this.documents[url] = doc;
        }
        elt.import = doc;
      }
      parser.parseNext();
    },
    bootDocument: function(doc) {
      this.loadSubtree(doc);
      this.observer.observe(doc);
      parser.parseNext();
    },
    loadedAll: function() {
      parser.parseNext();
    }
  };
  var importLoader = new Loader(importer.loaded.bind(importer), importer.loadedAll.bind(importer));
  importer.observer = new Observer();
  function isImportLink(elt) {
    return isLinkRel(elt, IMPORT_LINK_TYPE);
  }
  function isLinkRel(elt, rel) {
    return elt.localName === "link" && elt.getAttribute("rel") === rel;
  }
  function hasBaseURIAccessor(doc) {
    return !!Object.getOwnPropertyDescriptor(doc, "baseURI");
  }
  function makeDocument(resource, url) {
    var doc = document.implementation.createHTMLDocument(IMPORT_LINK_TYPE);
    doc._URL = url;
    var base = doc.createElement("base");
    base.setAttribute("href", url);
    if (!doc.baseURI && !hasBaseURIAccessor(doc)) {
      Object.defineProperty(doc, "baseURI", {
        value: url
      });
    }
    var meta = doc.createElement("meta");
    meta.setAttribute("charset", "utf-8");
    doc.head.appendChild(meta);
    doc.head.appendChild(base);
    doc.body.innerHTML = resource;
    if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap) {
      HTMLTemplateElement.bootstrap(doc);
    }
    return doc;
  }
  if (!document.baseURI) {
    var baseURIDescriptor = {
      get: function() {
        var base = document.querySelector("base");
        return base ? base.href : window.location.href;
      },
      configurable: true
    };
    Object.defineProperty(document, "baseURI", baseURIDescriptor);
    Object.defineProperty(rootDocument, "baseURI", baseURIDescriptor);
  }
  scope.importer = importer;
  scope.importLoader = importLoader;
});

HTMLImports.addModule(function(scope) {
  var parser = scope.parser;
  var importer = scope.importer;
  var dynamic = {
    added: function(nodes) {
      var owner, parsed, loading;
      for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
        if (!owner) {
          owner = n.ownerDocument;
          parsed = parser.isParsed(owner);
        }
        loading = this.shouldLoadNode(n);
        if (loading) {
          importer.loadNode(n);
        }
        if (this.shouldParseNode(n) && parsed) {
          parser.parseDynamic(n, loading);
        }
      }
    },
    shouldLoadNode: function(node) {
      return node.nodeType === 1 && matches.call(node, importer.loadSelectorsForNode(node));
    },
    shouldParseNode: function(node) {
      return node.nodeType === 1 && matches.call(node, parser.parseSelectorsForNode(node));
    }
  };
  importer.observer.addCallback = dynamic.added.bind(dynamic);
  var matches = HTMLElement.prototype.matches || HTMLElement.prototype.matchesSelector || HTMLElement.prototype.webkitMatchesSelector || HTMLElement.prototype.mozMatchesSelector || HTMLElement.prototype.msMatchesSelector;
});

(function(scope) {
  var initializeModules = scope.initializeModules;
  var isIE = scope.isIE;
  if (scope.useNative) {
    return;
  }
  if (isIE && typeof window.CustomEvent !== "function") {
    window.CustomEvent = function(inType, params) {
      params = params || {};
      var e = document.createEvent("CustomEvent");
      e.initCustomEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
      return e;
    };
    window.CustomEvent.prototype = window.Event.prototype;
  }
  initializeModules();
  var rootDocument = scope.rootDocument;
  function bootstrap() {
    HTMLImports.importer.bootDocument(rootDocument);
  }
  if (document.readyState === "complete" || document.readyState === "interactive" && !window.attachEvent) {
    bootstrap();
  } else {
    document.addEventListener("DOMContentLoaded", bootstrap);
  }
})(HTMLImports);

window.CustomElements = window.CustomElements || {
  flags: {}
};

(function(scope) {
  var flags = scope.flags;
  var modules = [];
  var addModule = function(module) {
    modules.push(module);
  };
  var initializeModules = function() {
    modules.forEach(function(module) {
      module(scope);
    });
  };
  scope.addModule = addModule;
  scope.initializeModules = initializeModules;
  scope.hasNative = Boolean(document.registerElement);
  scope.useNative = !flags.register && scope.hasNative && !window.ShadowDOMPolyfill && (!window.HTMLImports || HTMLImports.useNative);
})(CustomElements);

CustomElements.addModule(function(scope) {
  var IMPORT_LINK_TYPE = window.HTMLImports ? HTMLImports.IMPORT_LINK_TYPE : "none";
  function forSubtree(node, cb) {
    findAllElements(node, function(e) {
      if (cb(e)) {
        return true;
      }
      forRoots(e, cb);
    });
    forRoots(node, cb);
  }
  function findAllElements(node, find, data) {
    var e = node.firstElementChild;
    if (!e) {
      e = node.firstChild;
      while (e && e.nodeType !== Node.ELEMENT_NODE) {
        e = e.nextSibling;
      }
    }
    while (e) {
      if (find(e, data) !== true) {
        findAllElements(e, find, data);
      }
      e = e.nextElementSibling;
    }
    return null;
  }
  function forRoots(node, cb) {
    var root = node.shadowRoot;
    while (root) {
      forSubtree(root, cb);
      root = root.olderShadowRoot;
    }
  }
  function forDocumentTree(doc, cb) {
    _forDocumentTree(doc, cb, []);
  }
  function _forDocumentTree(doc, cb, processingDocuments) {
    doc = wrap(doc);
    if (processingDocuments.indexOf(doc) >= 0) {
      return;
    }
    processingDocuments.push(doc);
    var imports = doc.querySelectorAll("link[rel=" + IMPORT_LINK_TYPE + "]");
    for (var i = 0, l = imports.length, n; i < l && (n = imports[i]); i++) {
      if (n.import) {
        _forDocumentTree(n.import, cb, processingDocuments);
      }
    }
    cb(doc);
  }
  scope.forDocumentTree = forDocumentTree;
  scope.forSubtree = forSubtree;
});

CustomElements.addModule(function(scope) {
  var flags = scope.flags;
  var forSubtree = scope.forSubtree;
  var forDocumentTree = scope.forDocumentTree;
  function addedNode(node) {
    return added(node) || addedSubtree(node);
  }
  function added(node) {
    if (scope.upgrade(node)) {
      return true;
    }
    attached(node);
  }
  function addedSubtree(node) {
    forSubtree(node, function(e) {
      if (added(e)) {
        return true;
      }
    });
  }
  function attachedNode(node) {
    attached(node);
    if (inDocument(node)) {
      forSubtree(node, function(e) {
        attached(e);
      });
    }
  }
  var hasPolyfillMutations = !window.MutationObserver || window.MutationObserver === window.JsMutationObserver;
  scope.hasPolyfillMutations = hasPolyfillMutations;
  var isPendingMutations = false;
  var pendingMutations = [];
  function deferMutation(fn) {
    pendingMutations.push(fn);
    if (!isPendingMutations) {
      isPendingMutations = true;
      setTimeout(takeMutations);
    }
  }
  function takeMutations() {
    isPendingMutations = false;
    var $p = pendingMutations;
    for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
      p();
    }
    pendingMutations = [];
  }
  function attached(element) {
    if (hasPolyfillMutations) {
      deferMutation(function() {
        _attached(element);
      });
    } else {
      _attached(element);
    }
  }
  function _attached(element) {
    if (element.__upgraded__ && (element.attachedCallback || element.detachedCallback)) {
      if (!element.__attached && inDocument(element)) {
        element.__attached = true;
        if (element.attachedCallback) {
          element.attachedCallback();
        }
      }
    }
  }
  function detachedNode(node) {
    detached(node);
    forSubtree(node, function(e) {
      detached(e);
    });
  }
  function detached(element) {
    if (hasPolyfillMutations) {
      deferMutation(function() {
        _detached(element);
      });
    } else {
      _detached(element);
    }
  }
  function _detached(element) {
    if (element.__upgraded__ && (element.attachedCallback || element.detachedCallback)) {
      if (element.__attached && !inDocument(element)) {
        element.__attached = false;
        if (element.detachedCallback) {
          element.detachedCallback();
        }
      }
    }
  }
  function inDocument(element) {
    var p = element;
    var doc = wrap(document);
    while (p) {
      if (p == doc) {
        return true;
      }
      p = p.parentNode || p.nodeType === Node.DOCUMENT_FRAGMENT_NODE && p.host;
    }
  }
  function watchShadow(node) {
    if (node.shadowRoot && !node.shadowRoot.__watched) {
      flags.dom && console.log("watching shadow-root for: ", node.localName);
      var root = node.shadowRoot;
      while (root) {
        observe(root);
        root = root.olderShadowRoot;
      }
    }
  }
  function handler(mutations) {
    if (flags.dom) {
      var mx = mutations[0];
      if (mx && mx.type === "childList" && mx.addedNodes) {
        if (mx.addedNodes) {
          var d = mx.addedNodes[0];
          while (d && d !== document && !d.host) {
            d = d.parentNode;
          }
          var u = d && (d.URL || d._URL || d.host && d.host.localName) || "";
          u = u.split("/?").shift().split("/").pop();
        }
      }
      console.group("mutations (%d) [%s]", mutations.length, u || "");
    }
    mutations.forEach(function(mx) {
      if (mx.type === "childList") {
        forEach(mx.addedNodes, function(n) {
          if (!n.localName) {
            return;
          }
          addedNode(n);
        });
        forEach(mx.removedNodes, function(n) {
          if (!n.localName) {
            return;
          }
          detachedNode(n);
        });
      }
    });
    flags.dom && console.groupEnd();
  }
  function takeRecords(node) {
    node = wrap(node);
    if (!node) {
      node = wrap(document);
    }
    while (node.parentNode) {
      node = node.parentNode;
    }
    var observer = node.__observer;
    if (observer) {
      handler(observer.takeRecords());
      takeMutations();
    }
  }
  var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
  function observe(inRoot) {
    if (inRoot.__observer) {
      return;
    }
    var observer = new MutationObserver(handler);
    observer.observe(inRoot, {
      childList: true,
      subtree: true
    });
    inRoot.__observer = observer;
  }
  function upgradeDocument(doc) {
    doc = wrap(doc);
    flags.dom && console.group("upgradeDocument: ", doc.baseURI.split("/").pop());
    addedNode(doc);
    observe(doc);
    flags.dom && console.groupEnd();
  }
  function upgradeDocumentTree(doc) {
    forDocumentTree(doc, upgradeDocument);
  }
  var originalCreateShadowRoot = Element.prototype.createShadowRoot;
  if (originalCreateShadowRoot) {
    Element.prototype.createShadowRoot = function() {
      var root = originalCreateShadowRoot.call(this);
      CustomElements.watchShadow(this);
      return root;
    };
  }
  scope.watchShadow = watchShadow;
  scope.upgradeDocumentTree = upgradeDocumentTree;
  scope.upgradeSubtree = addedSubtree;
  scope.upgradeAll = addedNode;
  scope.attachedNode = attachedNode;
  scope.takeRecords = takeRecords;
});

CustomElements.addModule(function(scope) {
  var flags = scope.flags;
  function upgrade(node) {
    if (!node.__upgraded__ && node.nodeType === Node.ELEMENT_NODE) {
      var is = node.getAttribute("is");
      var definition = scope.getRegisteredDefinition(is || node.localName);
      if (definition) {
        if (is && definition.tag == node.localName) {
          return upgradeWithDefinition(node, definition);
        } else if (!is && !definition.extends) {
          return upgradeWithDefinition(node, definition);
        }
      }
    }
  }
  function upgradeWithDefinition(element, definition) {
    flags.upgrade && console.group("upgrade:", element.localName);
    if (definition.is) {
      element.setAttribute("is", definition.is);
    }
    implementPrototype(element, definition);
    element.__upgraded__ = true;
    created(element);
    scope.attachedNode(element);
    scope.upgradeSubtree(element);
    flags.upgrade && console.groupEnd();
    return element;
  }
  function implementPrototype(element, definition) {
    if (Object.__proto__) {
      element.__proto__ = definition.prototype;
    } else {
      customMixin(element, definition.prototype, definition.native);
      element.__proto__ = definition.prototype;
    }
  }
  function customMixin(inTarget, inSrc, inNative) {
    var used = {};
    var p = inSrc;
    while (p !== inNative && p !== HTMLElement.prototype) {
      var keys = Object.getOwnPropertyNames(p);
      for (var i = 0, k; k = keys[i]; i++) {
        if (!used[k]) {
          Object.defineProperty(inTarget, k, Object.getOwnPropertyDescriptor(p, k));
          used[k] = 1;
        }
      }
      p = Object.getPrototypeOf(p);
    }
  }
  function created(element) {
    if (element.createdCallback) {
      element.createdCallback();
    }
  }
  scope.upgrade = upgrade;
  scope.upgradeWithDefinition = upgradeWithDefinition;
  scope.implementPrototype = implementPrototype;
});

CustomElements.addModule(function(scope) {
  var isIE11OrOlder = scope.isIE11OrOlder;
  var upgradeDocumentTree = scope.upgradeDocumentTree;
  var upgradeAll = scope.upgradeAll;
  var upgradeWithDefinition = scope.upgradeWithDefinition;
  var implementPrototype = scope.implementPrototype;
  var useNative = scope.useNative;
  function register(name, options) {
    var definition = options || {};
    if (!name) {
      throw new Error("document.registerElement: first argument `name` must not be empty");
    }
    if (name.indexOf("-") < 0) {
      throw new Error("document.registerElement: first argument ('name') must contain a dash ('-'). Argument provided was '" + String(name) + "'.");
    }
    if (isReservedTag(name)) {
      throw new Error("Failed to execute 'registerElement' on 'Document': Registration failed for type '" + String(name) + "'. The type name is invalid.");
    }
    if (getRegisteredDefinition(name)) {
      throw new Error("DuplicateDefinitionError: a type with name '" + String(name) + "' is already registered");
    }
    if (!definition.prototype) {
      definition.prototype = Object.create(HTMLElement.prototype);
    }
    definition.__name = name.toLowerCase();
    definition.lifecycle = definition.lifecycle || {};
    definition.ancestry = ancestry(definition.extends);
    resolveTagName(definition);
    resolvePrototypeChain(definition);
    overrideAttributeApi(definition.prototype);
    registerDefinition(definition.__name, definition);
    definition.ctor = generateConstructor(definition);
    definition.ctor.prototype = definition.prototype;
    definition.prototype.constructor = definition.ctor;
    if (scope.ready) {
      upgradeDocumentTree(document);
    }
    return definition.ctor;
  }
  function overrideAttributeApi(prototype) {
    if (prototype.setAttribute._polyfilled) {
      return;
    }
    var setAttribute = prototype.setAttribute;
    prototype.setAttribute = function(name, value) {
      changeAttribute.call(this, name, value, setAttribute);
    };
    var removeAttribute = prototype.removeAttribute;
    prototype.removeAttribute = function(name) {
      changeAttribute.call(this, name, null, removeAttribute);
    };
    prototype.setAttribute._polyfilled = true;
  }
  function changeAttribute(name, value, operation) {
    name = name.toLowerCase();
    var oldValue = this.getAttribute(name);
    operation.apply(this, arguments);
    var newValue = this.getAttribute(name);
    if (this.attributeChangedCallback && newValue !== oldValue) {
      this.attributeChangedCallback(name, oldValue, newValue);
    }
  }
  function isReservedTag(name) {
    for (var i = 0; i < reservedTagList.length; i++) {
      if (name === reservedTagList[i]) {
        return true;
      }
    }
  }
  var reservedTagList = [ "annotation-xml", "color-profile", "font-face", "font-face-src", "font-face-uri", "font-face-format", "font-face-name", "missing-glyph" ];
  function ancestry(extnds) {
    var extendee = getRegisteredDefinition(extnds);
    if (extendee) {
      return ancestry(extendee.extends).concat([ extendee ]);
    }
    return [];
  }
  function resolveTagName(definition) {
    var baseTag = definition.extends;
    for (var i = 0, a; a = definition.ancestry[i]; i++) {
      baseTag = a.is && a.tag;
    }
    definition.tag = baseTag || definition.__name;
    if (baseTag) {
      definition.is = definition.__name;
    }
  }
  function resolvePrototypeChain(definition) {
    if (!Object.__proto__) {
      var nativePrototype = HTMLElement.prototype;
      if (definition.is) {
        var inst = document.createElement(definition.tag);
        var expectedPrototype = Object.getPrototypeOf(inst);
        if (expectedPrototype === definition.prototype) {
          nativePrototype = expectedPrototype;
        }
      }
      var proto = definition.prototype, ancestor;
      while (proto && proto !== nativePrototype) {
        ancestor = Object.getPrototypeOf(proto);
        proto.__proto__ = ancestor;
        proto = ancestor;
      }
      definition.native = nativePrototype;
    }
  }
  function instantiate(definition) {
    return upgradeWithDefinition(domCreateElement(definition.tag), definition);
  }
  var registry = {};
  function getRegisteredDefinition(name) {
    if (name) {
      return registry[name.toLowerCase()];
    }
  }
  function registerDefinition(name, definition) {
    registry[name] = definition;
  }
  function generateConstructor(definition) {
    return function() {
      return instantiate(definition);
    };
  }
  var HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
  function createElementNS(namespace, tag, typeExtension) {
    if (namespace === HTML_NAMESPACE) {
      return createElement(tag, typeExtension);
    } else {
      return domCreateElementNS(namespace, tag);
    }
  }
  function createElement(tag, typeExtension) {
    if (tag) {
      tag = tag.toLowerCase();
    }
    if (typeExtension) {
      typeExtension = typeExtension.toLowerCase();
    }
    var definition = getRegisteredDefinition(typeExtension || tag);
    if (definition) {
      if (tag == definition.tag && typeExtension == definition.is) {
        return new definition.ctor();
      }
      if (!typeExtension && !definition.is) {
        return new definition.ctor();
      }
    }
    var element;
    if (typeExtension) {
      element = createElement(tag);
      element.setAttribute("is", typeExtension);
      return element;
    }
    element = domCreateElement(tag);
    if (tag.indexOf("-") >= 0) {
      implementPrototype(element, HTMLElement);
    }
    return element;
  }
  var domCreateElement = document.createElement.bind(document);
  var domCreateElementNS = document.createElementNS.bind(document);
  var isInstance;
  if (!Object.__proto__ && !useNative) {
    isInstance = function(obj, ctor) {
      var p = obj;
      while (p) {
        if (p === ctor.prototype) {
          return true;
        }
        p = p.__proto__;
      }
      return false;
    };
  } else {
    isInstance = function(obj, base) {
      return obj instanceof base;
    };
  }
  function wrapDomMethodToForceUpgrade(obj, methodName) {
    var orig = obj[methodName];
    obj[methodName] = function() {
      var n = orig.apply(this, arguments);
      upgradeAll(n);
      return n;
    };
  }
  wrapDomMethodToForceUpgrade(Node.prototype, "cloneNode");
  wrapDomMethodToForceUpgrade(document, "importNode");
  if (isIE11OrOlder) {
    (function() {
      var importNode = document.importNode;
      document.importNode = function() {
        var n = importNode.apply(document, arguments);
        if (n.nodeType == n.DOCUMENT_FRAGMENT_NODE) {
          var f = document.createDocumentFragment();
          f.appendChild(n);
          return f;
        } else {
          return n;
        }
      };
    })();
  }
  document.registerElement = register;
  document.createElement = createElement;
  document.createElementNS = createElementNS;
  scope.registry = registry;
  scope.instanceof = isInstance;
  scope.reservedTagList = reservedTagList;
  scope.getRegisteredDefinition = getRegisteredDefinition;
  document.register = document.registerElement;
});

(function(scope) {
  var useNative = scope.useNative;
  var initializeModules = scope.initializeModules;
  var isIE11OrOlder = /Trident/.test(navigator.userAgent);
  if (useNative) {
    var nop = function() {};
    scope.watchShadow = nop;
    scope.upgrade = nop;
    scope.upgradeAll = nop;
    scope.upgradeDocumentTree = nop;
    scope.upgradeSubtree = nop;
    scope.takeRecords = nop;
    scope.instanceof = function(obj, base) {
      return obj instanceof base;
    };
  } else {
    initializeModules();
  }
  var upgradeDocumentTree = scope.upgradeDocumentTree;
  if (!window.wrap) {
    if (window.ShadowDOMPolyfill) {
      window.wrap = ShadowDOMPolyfill.wrapIfNeeded;
      window.unwrap = ShadowDOMPolyfill.unwrapIfNeeded;
    } else {
      window.wrap = window.unwrap = function(node) {
        return node;
      };
    }
  }
  function bootstrap() {
    upgradeDocumentTree(wrap(document));
    if (window.HTMLImports) {
      HTMLImports.__importsParsingHook = function(elt) {
        upgradeDocumentTree(wrap(elt.import));
      };
    }
    CustomElements.ready = true;
    setTimeout(function() {
      CustomElements.readyTime = Date.now();
      if (window.HTMLImports) {
        CustomElements.elapsed = CustomElements.readyTime - HTMLImports.readyTime;
      }
      document.dispatchEvent(new CustomEvent("WebComponentsReady", {
        bubbles: true
      }));
    });
  }
  if (isIE11OrOlder && typeof window.CustomEvent !== "function") {
    window.CustomEvent = function(inType, params) {
      params = params || {};
      var e = document.createEvent("CustomEvent");
      e.initCustomEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
      return e;
    };
    window.CustomEvent.prototype = window.Event.prototype;
  }
  if (document.readyState === "complete" || scope.flags.eager) {
    bootstrap();
  } else if (document.readyState === "interactive" && !window.attachEvent && (!window.HTMLImports || window.HTMLImports.ready)) {
    bootstrap();
  } else {
    var loadEvent = window.HTMLImports && !HTMLImports.ready ? "HTMLImportsLoaded" : "DOMContentLoaded";
    window.addEventListener(loadEvent, bootstrap);
  }
  scope.isIE11OrOlder = isIE11OrOlder;
})(window.CustomElements);

(function(scope) {
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(scope) {
      var self = this;
      var args = Array.prototype.slice.call(arguments, 1);
      return function() {
        var args2 = args.slice();
        args2.push.apply(args2, arguments);
        return self.apply(scope, args2);
      };
    };
  }
})(window.WebComponents);

(function(scope) {
  "use strict";
  if (!window.performance) {
    var start = Date.now();
    window.performance = {
      now: function() {
        return Date.now() - start;
      }
    };
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function() {
      var nativeRaf = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
      return nativeRaf ? function(callback) {
        return nativeRaf(function() {
          callback(performance.now());
        });
      } : function(callback) {
        return window.setTimeout(callback, 1e3 / 60);
      };
    }();
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function() {
      return window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || function(id) {
        clearTimeout(id);
      };
    }();
  }
  var elementDeclarations = [];
  var polymerStub = function(name, dictionary) {
    if (typeof name !== "string" && arguments.length === 1) {
      Array.prototype.push.call(arguments, document._currentScript);
    }
    elementDeclarations.push(arguments);
  };
  window.Polymer = polymerStub;
  scope.consumeDeclarations = function(callback) {
    scope.consumeDeclarations = function() {
      throw "Possible attempt to load Polymer twice";
    };
    if (callback) {
      callback(elementDeclarations);
    }
    elementDeclarations = null;
  };
  function installPolymerWarning() {
    if (window.Polymer === polymerStub) {
      window.Polymer = function() {
        throw new Error("You tried to use polymer without loading it first. To " + 'load polymer, <link rel="import" href="' + 'components/polymer/polymer.html">');
      };
    }
  }
  if (HTMLImports.useNative) {
    installPolymerWarning();
  } else {
    addEventListener("DOMContentLoaded", installPolymerWarning);
  }
})(window.WebComponents);

(function(scope) {
  var style = document.createElement("style");
  style.textContent = "" + "body {" + "transition: opacity ease-in 0.2s;" + " } \n" + "body[unresolved] {" + "opacity: 0; display: block; overflow: hidden; position: relative;" + " } \n";
  var head = document.querySelector("head");
  head.insertBefore(style, head.firstChild);
})(window.WebComponents);

(function(scope) {
  window.Platform = scope;
})(window.WebComponents);
},{}],12:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    var helper;

  return "<h1>Hello "
    + this.escapeExpression(((helper = (helper = helpers.who || (depth0 != null ? depth0.who : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"who","hash":{},"data":data}) : helper)))
    + "</h1>\n";
},"useData":true});

},{"hbsfy/runtime":9}],13:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

require('webcomponents.js/webcomponents.js');

require('../../sauce.js');

var _qunitjs = require('qunitjs');

var _qunitjs2 = _interopRequireDefault(_qunitjs);

var _fwc = require('fwc');

var _fwc2 = _interopRequireDefault(_fwc);

_qunitjs2['default'].module('Register');

_qunitjs2['default'].test('register and access a component', function (assert) {
    assert.expect(4);

    var done = assert.async();

    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    (0, _fwc2['default'])('base').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fBase = container.querySelector('f-base');
        assert.equal(fBase.nodeName, 'F-BASE', 'The f-base component is found');
        assert.equal(fBase.nodeName, elt.nodeName, 'The f-base component is given in parameter');
        assert.deepEqual(fBase, elt, 'The callback elt is the given node');

        done();
    }).register();
});

_qunitjs2['default'].test('register with another namespace', function (assert) {
    assert.expect(4);

    var done = assert.async();

    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    (0, _fwc2['default'])('bar', { namespace: 'foo' }).on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fooBar = container.querySelector('foo-bar');
        assert.equal(fooBar.nodeName, 'FOO-BAR', 'The foo-bar component is found');
        assert.equal(fooBar.nodeName, elt.nodeName, 'The foo-bar component is given in parameter');
        assert.deepEqual(fooBar, elt, 'The callback elt is the given node');

        done();
    }).register();
});

_qunitjs2['default'].test('register and multiple component', function (assert) {
    assert.expect(7);

    var done = assert.async();

    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    var sum = 0;

    (0, _fwc2['default'])('multi').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        assert.equal(elt.nodeName, 'F-MULTI', 'The element is a multi');
        var value = parseInt(elt.getAttribute('value'), 10);
        assert.ok(value > 0, 'The  value has an int');
        sum += value;

        if (sum === 7) {

            done();
        }
    }).register();
});

_qunitjs2['default'].module('Attributes');

_qunitjs2['default'].test('define basic attributes', function (assert) {
    assert.expect(8);

    var done = assert.async();

    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    (0, _fwc2['default'])('attr').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fAttr = container.querySelector('f-attr');
        assert.deepEqual(fAttr, elt, 'The callback elt is the given node');
        assert.equal(fAttr.foo, '');
        assert.equal(fAttr.bar, 'pur');
        assert.equal(fAttr.foo, fAttr.getAttribute('foo'));
        assert.equal(fAttr.bar, fAttr.getAttribute('bar'));

        fAttr.foo = 'moo';
        assert.equal(fAttr.foo, 'moo');
        assert.equal(fAttr.foo, fAttr.getAttribute('foo'));

        done();
    }).attrs('foo', 'bar').register();
});

_qunitjs2['default'].test('define attributes with type casting', function (assert) {
    assert.expect(16);

    var done = assert.async();

    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    (0, _fwc2['default'])('cast').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fCast = container.querySelector('f-cast');
        assert.deepEqual(fCast, elt, 'The callback elt is the given node');

        assert.equal(fCast.getAttribute('int'), '134.12', "The attribute exists");
        assert.equal(fCast.int, 134, "The getter gives you the parsed value");
        fCast.int = "5.77";
        assert.equal(fCast.getAttribute('int'), '5', "The value is updated once parsed");
        assert.equal(fCast.int, 5, "The getter gives you the parsed value");

        assert.equal(fCast.getAttribute('float'), 1.23, "The attribute exists");
        assert.equal(fCast.float, 1.23, "The getter gives you the parsed value");
        fCast.float = "00.77";
        assert.equal(fCast.getAttribute('float'), '0.77', "The value is updated once parsed");
        assert.equal(fCast.float, 0.77, "The getter gives you the parsed value");

        assert.ok(fCast.hasAttribute('bool'), "The attribute exists");
        assert.equal(fCast.bool, true, "The attribute has the parsed value");
        fCast.bool = false;
        assert.ok(!fCast.hasAttribute('bool'), "The attribute doesn't exists anymore");
        assert.equal(fCast.bool, false, "The attribute has the false value");
        fCast.bool = true;
        assert.ok(fCast.hasAttribute('bool'), "The attribute is again there");
        assert.equal(fCast.bool, true, "The attribute has the true value");

        done();
    }).attr('int', { type: 'integer' }).attr('float', { type: 'float' }).attr('bool', { type: 'boolean' }).register();
});

_qunitjs2['default'].test('define attributes with accessors', function (assert) {
    assert.expect(11);

    var done = assert.async();

    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    (0, _fwc2['default'])('access').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fAccess = container.querySelector('f-access');
        assert.deepEqual(fAccess, elt, 'The callback elt is the given node');
        assert.equal(fAccess.getAttribute('num'), '1', 'The num attribute has the value');
        assert.ok(fAccess.hasAttribute('bool'), 'The bool attribute exists');
        assert.equal(fAccess.getAttribute('inc'), '0', 'The inc attribute has the value');
        assert.equal(fAccess.getAttribute('double'), '0', 'The double attribute has the value');

        assert.equal(fAccess.num, 1, 'The num getter is called');
        assert.equal(fAccess.bool, false, 'The bool getter is called');
        assert.equal(fAccess.inc, 1, 'The inc getter is called');
        assert.equal(fAccess.inc, 2, 'The inc getter is called');

        fAccess.double = 2;
        assert.equal(fAccess.double, 4, 'The double setter is callede');

        done();
    }).attrs('num', 'bool', 'inc').access('num', {
        get: function get(val) {
            return parseInt(val, 10);
        }
    }).access('double', {
        get: function get(val) {
            return parseInt(val, 10);
        },
        set: function set(old, val) {
            val = parseInt(val, 10);
            val = val * 2;
            return val;
        }
    }).access('bool', {
        get: function get(val) {
            return !!val;
        }
    }).access('inc', {
        get: function get(val) {
            val = parseInt(val, 10);
            this.setAttribute('inc', ++val);
            return val;
        }
    }).register();
});

_qunitjs2['default'].module('Methods');

_qunitjs2['default'].test('Component with a method', function (assert) {
    assert.expect(7);

    var done = assert.async();

    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    var mTarget = container.querySelector('.mtarget');
    assert.ok(mTarget.style.display !== 'none', "The mtarget content is displayed");

    (0, _fwc2['default'])('method').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fMethod = container.querySelector('f-method');
        assert.deepEqual(fMethod, elt, 'The callback elt is the given node');

        assert.ok(typeof fMethod.hide === 'function', 'The element has the defined method');

        fMethod.hide();

        assert.equal(mTarget.style.display, 'none', "The mtarget content isn't displayed anymore");

        done();
    }).method('hide', function () {

        var fMethod = container.querySelector('f-method');
        assert.deepEqual(fMethod, this, 'This is the given node');

        assert.equal(this.target, '.mtarget', 'The attribute value is correct');

        document.querySelector(this.target).style.display = 'none';
    }).attrs('target').register();
});

_qunitjs2['default'].module('Content');

_qunitjs2['default'].test('Component with content from a callback', function (assert) {
    assert.expect(11);

    var done = assert.async();

    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    var componentContent = function componentContent(data) {

        assert.ok(typeof data === 'object', 'The argument is an object that contains component attributes');
        assert.ok(typeof data.foo === 'string', 'The argument is an object that contains the foo attribute');
        assert.ok(typeof data.repeat === 'string', 'The argument is an object that contains the repeat attribute');

        var content = '';
        var times = parseInt(data.repeat || 0);
        while (times--) {
            content += '<li>' + data.foo + '</li>';
        }
        return '<ul>' + content + '</ul>';
    };

    assert.equal(container.querySelectorAll('f-content ul').length, 0, 'The component does not contain a list');

    (0, _fwc2['default'])('content').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fContent = container.querySelector('f-content');
        assert.deepEqual(fContent, elt, 'The callback elt is the given node');
        assert.equal(fContent.repeat, '2', 'The repeat value is 2');
        assert.equal(fContent.foo, 'moo', 'The foo value is moo');
        assert.equal(elt.querySelectorAll('ul').length, 1, 'The component contains now a list');
        assert.equal(elt.querySelectorAll('li').length, 2, 'The component contains now 2 list items');
        assert.equal(elt.querySelector('li:first-child').textContent, 'moo', 'The list items have the foo value');

        done();
    }).attrs('foo', 'repeat').content(componentContent).register();
});

_qunitjs2['default'].test('Component with dynamic content from a template', function (assert) {
    assert.expect(8);

    var done = assert.async();

    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    var helloTpl = require('./hello.tpl');
    assert.ok(typeof helloTpl === 'function', 'The template function exists');

    assert.equal(container.querySelectorAll('f-dyncontent h1').length, 0, 'The component does not contain an h1');

    (0, _fwc2['default'])('dyncontent').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fDynContent = container.querySelector('f-dyncontent');
        assert.deepEqual(fDynContent, elt, 'The callback elt is the given node');

        assert.equal(fDynContent.who, 'world', 'The attribute who has the world value');
        assert.equal(container.querySelectorAll('f-dyncontent h1').length, 1, 'The component contains an h1');

        assert.equal(fDynContent.textContent.trim(), 'Hello world', 'The element has the content from the who attribute');

        fDynContent.who = "Bertrand";
        setTimeout(function () {
            assert.equal(fDynContent.textContent.trim(), 'Hello Bertrand', 'The element has the updated content');
            done();
        }, 0);
    }).attr('who', { update: true }).content(helloTpl).register();
});

_qunitjs2['default'].test('Component with dynamic content from an HTML template', function (assert) {
    assert.expect(4);

    var done = assert.async();

    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    var htpl = document.getElementById('htpl');

    (0, _fwc2['default'])('hcontent').on('create', function (elt) {

        var fHontent = container.querySelector('f-hcontent');
        assert.deepEqual(fHontent, elt, 'The callback elt is the given node');

        assert.equal(elt.querySelectorAll('p').length, 1, 'The component contains now a paragraph');
        assert.equal(elt.innerHTML, htpl.innerHTML, 'The component content is the same as the template');

        done();
    }).content(htpl).register();
});

_qunitjs2['default'].module('extend');

_qunitjs2['default'].test('Extend an anchor', function (assert) {
    assert.expect(5);

    var done = assert.async();

    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    var link = document.querySelector('a.link');

    (0, _fwc2['default'])('link').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var flink = document.querySelector('.flink');

        assert.ok(flink instanceof HTMLElement, 'The component is an HTMLElement');
        assert.ok(flink instanceof HTMLAnchorElement, 'The component is an HTMLAnchorElement');

        assert.ok(link.href !== '#', "Anchor's href use getter/setter to change the value");
        assert.equal(flink.href, link.href, "The extended component uses base component getter/setter");

        done();
    }).extend('a').register();
});

_qunitjs2['default'].test('Extend another component', function (assert) {
    assert.expect(3);

    var done = assert.async();

    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    (0, _fwc2['default'])('upper').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {
        assert.ok(false, 'the parent element should not be created');
    }).access('bar', {
        get: function get(val) {
            val = val || '';
            return val.toUpperCase();
        }
    }).register();

    (0, _fwc2['default'])('superup').on('create', function (elt) {

        var fsuperup = document.querySelector('.superup');

        assert.deepEqual(fsuperup, elt, 'The callback elt is the given node');
        assert.equal(elt.bar, 'BAR', 'Super element prototype has been extended');

        done();
    }).extend('upper').register();
});

_qunitjs2['default'].module('Native events');

_qunitjs2['default'].test('on click', function (assert) {
    assert.expect(3);

    var done = assert.async();

    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    (0, _fwc2['default'])('native').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fNative = document.querySelector('f-native');
        assert.deepEqual(fNative, elt, 'The callback elt is the given node');

        fNative.click();
    }).on('click', function (elt) {

        var fNative = document.querySelector('f-native');
        assert.deepEqual(fNative, elt, 'The callback elt is the given node');

        done();
    }).register();
});

},{"../../sauce.js":14,"./hello.tpl":12,"fwc":"fwc","qunitjs":10,"webcomponents.js/webcomponents.js":11}],14:[function(require,module,exports){
//expose QUnit results to sauce labs using globals (sad but true)
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _qunitjs = require('qunitjs');

var _qunitjs2 = _interopRequireDefault(_qunitjs);

var testCases = [];

_qunitjs2['default'].done(function (results) {

    var failing = testCases.filter(function (testCase) {
        return testCase.result === false;
    }).map(function (testCase) {
        return {
            name: testCase.module + ' : ' + testCase.name,
            result: testCase.result,
            expected: testCase.expected,
            actual: testCase.actual,
            source: testCase.source
        };
    });

    window.global_test_results = {
        passed: results.passed,
        failed: results.failed,
        total: results.total,
        duration: results.runtime,
        tests: failing
    };
});

_qunitjs2['default'].testStart(function () {
    _qunitjs2['default'].log(function (details) {
        testCases.push(details);
    });
});

},{"qunitjs":10}]},{},[13])
//# sourceMappingURL=test.bundle.js.map
