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
'use strict';

var fwc = require('fwc');

QUnit.module('Module');

QUnit.test('factory', 3, function (assert) {
    assert.ok(typeof fwc === 'function', 'The module expose a function');
    assert.ok(typeof fwc('foo') === 'object', 'The module creates an object');
    assert.notEqual(fwc('foo'), fwc('foo'), 'The factory creates a new object at each call');
});

QUnit.module('Options');

QUnit.test('namespace', 3, function (assert) {

    assert.throws(function () {
        fwc('foo', { namespace: '12' });
    }, TypeError, 'The namespace is not valid');

    assert.throws(function () {
        fwc('foo', { namespace: 't-' });
    }, TypeError, 'The namespace is not valid');

    assert.throws(function () {
        fwc('foo', { namespace: 't.' });
    }, TypeError, 'The namespace is not valid');

    fwc('foo', { namespace: 'bar' });
});

QUnit.module('Events');

QUnit.asyncTest('emitter', 8, function (assert) {

    var comp = fwc('foo');

    assert.ok(typeof comp === 'object', 'the component definition is an object');
    assert.ok(typeof comp.on === 'function', 'the component defintion holds the method on');
    assert.ok(typeof comp.trigger === 'function', 'the component defintion holds the method trigger');
    assert.ok(typeof comp.off === 'function', 'the component defintion holds the method off');
    assert.ok(typeof comp.events === 'function', 'the component defintion holds the method events');

    comp.on('error', function (e) {
        assert.ok(e instanceof Error, 'An error is emitted');
        assert.equal(e.message, 'test error', 'The message is given in the error');

        QUnit.start();
    });
    assert.equal(comp.events('error').length, 1, 'The component has on listener registered');
    comp.trigger('error', new Error('test error'));
});

QUnit.module('Attributes');

QUnit.test('definition', 5, function (assert) {

    var comp = fwc('foo');

    assert.ok(typeof comp.attr === 'function', 'the component definition holds the method attr');
    assert.equal(comp.attr('id', {}), comp, 'The method chains with arguments');
    assert.ok(typeof comp.attr('id') === 'object', 'the method returns the attribute definition');
    assert.ok(typeof comp.attr('id').set === 'function', 'the attribute definition has a setter');
    assert.ok(typeof comp.attr('id').get === 'function', 'the attribute definition has a getter');
});

QUnit.test('definition polymorphism', 3, function (assert) {

    var comp = fwc('foo');

    comp.attr({ name: 'id' });
    assert.ok(typeof comp.attr('id') === 'object', 'the method returns the attribute definition');
    assert.ok(typeof comp.attr('id').set === 'function', 'the attribute definition has a setter');
    assert.ok(typeof comp.attr('id').get === 'function', 'the attribute definition has a getter');
});

QUnit.test('definition type casting', 6, function (assert) {

    var comp = fwc('foo');

    var mock = {
        getAttribute: function getAttribute(name) {
            return this[name];
        },
        setAttribute: function setAttribute(name, val) {
            this[name] = val;
            return val;
        },
        hasAttribute: function hasAttribute(name) {
            return this.hasOwnProperty(name);
        }
    };

    comp.attr('int', { type: 'integer' });
    comp.attr('float', { type: 'float' });
    comp.attr('bool', { type: 'boolean' });

    assert.equal(comp.attr('int').set.call(mock, '12.5'), 12, 'the attribute setter set the parsed value');
    assert.equal(comp.attr('int').get.call(mock), 12, 'the int getter returns the parsed value');

    assert.equal(comp.attr('float').set.call(mock, '12.5'), 12.5, 'the attribute setter set the parsed value');
    assert.equal(comp.attr('float').get.call(mock), 12.5, 'the int getter returns the parsed value');

    assert.equal(comp.attr('bool').set.call(mock, 'a'), true, 'the attribute setter set the parsed value');
    assert.equal(comp.attr('bool').get.call(mock), true, 'the int getter returns the parsed value');
});

QUnit.test('multiple declarations', 3, function (assert) {

    var comp = fwc('foo');

    assert.ok(typeof comp.attrs === 'function', 'the component definition holds the method attrs');
    assert.equal(comp.attrs('id', 'selected'), comp, 'The method chains with arguments');
    assert.deepEqual(comp.attrs(), ['id', 'selected'], 'the method returns values without arguments');
});

QUnit.test('accessors', 13, function (assert) {

    var comp = fwc('foo');

    var mock = {
        getAttribute: function getAttribute(name) {
            return this[name];
        },
        setAttribute: function setAttribute(name, val) {
            this[name] = val;
            return val;
        }
    };

    var testAccessors = {
        get: function get() {
            return 'foo';
        },
        set: function set(old, val) {
            return val + 'bar';
        }
    };

    assert.ok(typeof comp.access === 'function', 'the component definition holds the method access');
    assert.equal(comp.access('test', testAccessors), comp, 'The method set and chains with arguments');

    assert.ok(typeof comp.access('test') === 'object', 'The method returns the accessors without arguments');
    assert.ok(typeof comp.access('test').get === 'function', 'The method returns the accessors without arguments');
    assert.ok(typeof comp.access('test').set === 'function', 'The method returns the accessors without arguments');

    assert.equal(comp.access('test').get.call(mock), 'foo', 'The getter returns the defined value');
    assert.equal(comp.access('test').set.call(mock, 'foo'), 'foobar', 'The setter returns the defined value');

    comp.attrs('id');
    assert.ok(typeof comp.access('id') === 'object', 'Attributes have default accessors');
    assert.ok(typeof comp.access('foo') === 'undefined', 'Only attributes have default accessors');
    assert.ok(typeof comp.access('id').get === 'function', 'The method returns the accessors without arguments');
    assert.ok(typeof comp.access('id').set === 'function', 'The method returns the accessors without arguments');

    assert.equal(comp.access('id').set.call(mock, 'bee'), 'bee', 'The setter returns the defined value');
    assert.equal(comp.access('id').get.call(mock), 'bee', 'The getter returns the defined value');
});

QUnit.module('Methods');

QUnit.test('declaration', 5, function (assert) {

    var comp = fwc('foo');

    var foo = function foo() {
        for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
            params[_key] = arguments[_key];
        }

        return params;
    };

    assert.ok(typeof comp.method === 'function', 'the component definition holds the method method');

    assert.equal(comp.method('foo', foo), comp, 'The method set and chains with arguments');
    assert.ok(typeof comp.method('foo') === 'object', 'The method returns an object with the name arguments');
    assert.ok(typeof comp.method('foo').value === 'function', 'The method returns the function without arguments');
    assert.deepEqual(comp.method('foo').value.call(null, 'bar', 'baz'), ['bar', 'baz'], 'The content function returns the arguments');
});

QUnit.module('Content');

QUnit.test('callback', 6, function (assert) {

    var comp = fwc('foo');

    assert.ok(typeof comp.content === 'function', 'the component definition holds the method content');

    assert.equal(comp.content('test'), comp, 'The method set and chains with arguments');
    assert.ok(typeof comp.content() === 'function', 'The method returns the function without arguments');
    assert.equal(comp.content().call(), 'test', 'The content function returns the string set');

    comp.content(function template(data) {
        return '<p>' + data.foo + '</p>';
    });
    var content = comp.content();
    assert.ok(typeof content === 'function', 'The method return the set function without arguments');
    assert.equal(content({ foo: 'bar' }), '<p>bar</p>', 'The function replace the content data');
});

QUnit.test('handlebar template', 2, function (assert) {

    var comp = fwc('foo');

    //template is handled externally, by browserify
    comp.content(require('./test.tpl'));

    var content = comp.content();

    assert.ok(typeof content === 'function', 'The method return the set function without arguments');
    assert.equal(content({ foo: 'bar' }).trim(), '<span>bar</span>', 'The function replace the content data');
});

QUnit.module('Extend');

QUnit.test('element name', 4, function (assert) {

    assert.throws(function () {
        fwc('foo').extend(12);
    }, TypeError, 'The element name is not valid');

    assert.throws(function () {
        fwc('foo').extend('t-');
    }, TypeError, 'The element name is not valid');

    assert.throws(function () {
        fwc('foo').extend('t.');
    }, TypeError, 'The element name is not valid');

    assert.throws(function () {
        fwc('foo').extend('_12');
    }, TypeError, 'The element name is not valid');

    fwc('foo').extend('bar');
});

QUnit.test('api', 5, function (assert) {

    var comp = fwc('foo');

    assert.ok(typeof comp.extend === 'function', 'the component definition holds the method extend');

    assert.equal(comp.extend('a'), comp, 'The method set and chains with arguments');

    var baseProto = comp.extend();
    assert.ok(typeof baseProto === 'object', 'The method returns an object without arguments');
    assert.ok(Object.prototype.isPrototypeOf(baseProto), 'The method returns an prototype');
    assert.ok(HTMLElement.prototype.isPrototypeOf(baseProto), 'The method returns an HTMLElement prototype');
});

QUnit.test('extend an html element', 2, function (assert) {

    var comp = fwc('foo');

    comp.extend('a');

    var baseProto = comp.extend();
    assert.ok(HTMLElement.prototype.isPrototypeOf(baseProto), 'Extending the a tag set the base prototype to HTMLElement');
    assert.ok(Object.is(baseProto, HTMLAnchorElement.prototype), 'Extending the a tag set the base prototype to HTMLAnchorElement');
});

},{"./test.tpl":11,"fwc":"fwc"}],11:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    var helper;

  return "<span>"
    + this.escapeExpression(((helper = (helper = helpers.foo || (depth0 != null ? depth0.foo : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"foo","hash":{},"data":data}) : helper)))
    + "</span>\n";
},"useData":true});

},{"hbsfy/runtime":9}]},{},[10])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzLnJ1bnRpbWUuanMiLCJub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL2Jhc2UuanMiLCJub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL2V4Y2VwdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMvbm8tY29uZmxpY3QuanMiLCJub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3J1bnRpbWUuanMiLCJub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3NhZmUtc3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL3J1bnRpbWUuanMiLCJub2RlX21vZHVsZXMvaGJzZnkvcnVudGltZS5qcyIsIi9ob21lL2JlcnRyYW5kL2Rldi9wcm9qZWN0cy9mdXR1cmUuanMvdGVzdC9md2MvYXBpL3Rlc3QuanMiLCJ0ZXN0L2Z3Yy9hcGkvdGVzdC50cGwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7Ozs7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QzNGLFVBQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztBQUN4RixVQUFNLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFLDZDQUE2QyxDQUFDLENBQUM7Q0FDNUcsQ0FBQyxDQUFDOztBQUdILEtBQUssQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxFQUFFLFVBQVMsTUFBTSxFQUFDOztBQUVwRCxRQUFJLElBQUksR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBRXRCLFFBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7O0FBRWpCLFFBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUM5QixVQUFNLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFLDJEQUEyRCxDQUFDLENBQUM7QUFDdkgsVUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsRUFBRSxpRUFBaUUsQ0FBQyxDQUFDO0NBQ25JLENBQUMsQ0FBQzs7O0FDclFIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkID0gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9O1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2ltcG9ydCA9IHJlcXVpcmUoJy4vaGFuZGxlYmFycy9iYXNlJyk7XG5cbnZhciBiYXNlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2ltcG9ydCk7XG5cbi8vIEVhY2ggb2YgdGhlc2UgYXVnbWVudCB0aGUgSGFuZGxlYmFycyBvYmplY3QuIE5vIG5lZWQgdG8gc2V0dXAgaGVyZS5cbi8vIChUaGlzIGlzIGRvbmUgdG8gZWFzaWx5IHNoYXJlIGNvZGUgYmV0d2VlbiBjb21tb25qcyBhbmQgYnJvd3NlIGVudnMpXG5cbnZhciBfU2FmZVN0cmluZyA9IHJlcXVpcmUoJy4vaGFuZGxlYmFycy9zYWZlLXN0cmluZycpO1xuXG52YXIgX1NhZmVTdHJpbmcyID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX1NhZmVTdHJpbmcpO1xuXG52YXIgX0V4Y2VwdGlvbiA9IHJlcXVpcmUoJy4vaGFuZGxlYmFycy9leGNlcHRpb24nKTtcblxudmFyIF9FeGNlcHRpb24yID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX0V4Y2VwdGlvbik7XG5cbnZhciBfaW1wb3J0MiA9IHJlcXVpcmUoJy4vaGFuZGxlYmFycy91dGlscycpO1xuXG52YXIgVXRpbHMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfaW1wb3J0Mik7XG5cbnZhciBfaW1wb3J0MyA9IHJlcXVpcmUoJy4vaGFuZGxlYmFycy9ydW50aW1lJyk7XG5cbnZhciBydW50aW1lID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2ltcG9ydDMpO1xuXG52YXIgX25vQ29uZmxpY3QgPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvbm8tY29uZmxpY3QnKTtcblxudmFyIF9ub0NvbmZsaWN0MiA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9ub0NvbmZsaWN0KTtcblxuLy8gRm9yIGNvbXBhdGliaWxpdHkgYW5kIHVzYWdlIG91dHNpZGUgb2YgbW9kdWxlIHN5c3RlbXMsIG1ha2UgdGhlIEhhbmRsZWJhcnMgb2JqZWN0IGEgbmFtZXNwYWNlXG5mdW5jdGlvbiBjcmVhdGUoKSB7XG4gIHZhciBoYiA9IG5ldyBiYXNlLkhhbmRsZWJhcnNFbnZpcm9ubWVudCgpO1xuXG4gIFV0aWxzLmV4dGVuZChoYiwgYmFzZSk7XG4gIGhiLlNhZmVTdHJpbmcgPSBfU2FmZVN0cmluZzJbJ2RlZmF1bHQnXTtcbiAgaGIuRXhjZXB0aW9uID0gX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXTtcbiAgaGIuVXRpbHMgPSBVdGlscztcbiAgaGIuZXNjYXBlRXhwcmVzc2lvbiA9IFV0aWxzLmVzY2FwZUV4cHJlc3Npb247XG5cbiAgaGIuVk0gPSBydW50aW1lO1xuICBoYi50ZW1wbGF0ZSA9IGZ1bmN0aW9uIChzcGVjKSB7XG4gICAgcmV0dXJuIHJ1bnRpbWUudGVtcGxhdGUoc3BlYywgaGIpO1xuICB9O1xuXG4gIHJldHVybiBoYjtcbn1cblxudmFyIGluc3QgPSBjcmVhdGUoKTtcbmluc3QuY3JlYXRlID0gY3JlYXRlO1xuXG5fbm9Db25mbGljdDJbJ2RlZmF1bHQnXShpbnN0KTtcblxuaW5zdFsnZGVmYXVsdCddID0gaW5zdDtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gaW5zdDtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkID0gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9O1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0cy5IYW5kbGViYXJzRW52aXJvbm1lbnQgPSBIYW5kbGViYXJzRW52aXJvbm1lbnQ7XG5leHBvcnRzLmNyZWF0ZUZyYW1lID0gY3JlYXRlRnJhbWU7XG5cbnZhciBfaW1wb3J0ID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgVXRpbHMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfaW1wb3J0KTtcblxudmFyIF9FeGNlcHRpb24gPSByZXF1aXJlKCcuL2V4Y2VwdGlvbicpO1xuXG52YXIgX0V4Y2VwdGlvbjIgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfRXhjZXB0aW9uKTtcblxudmFyIFZFUlNJT04gPSAnMy4wLjEnO1xuZXhwb3J0cy5WRVJTSU9OID0gVkVSU0lPTjtcbnZhciBDT01QSUxFUl9SRVZJU0lPTiA9IDY7XG5cbmV4cG9ydHMuQ09NUElMRVJfUkVWSVNJT04gPSBDT01QSUxFUl9SRVZJU0lPTjtcbnZhciBSRVZJU0lPTl9DSEFOR0VTID0ge1xuICAxOiAnPD0gMS4wLnJjLjInLCAvLyAxLjAucmMuMiBpcyBhY3R1YWxseSByZXYyIGJ1dCBkb2Vzbid0IHJlcG9ydCBpdFxuICAyOiAnPT0gMS4wLjAtcmMuMycsXG4gIDM6ICc9PSAxLjAuMC1yYy40JyxcbiAgNDogJz09IDEueC54JyxcbiAgNTogJz09IDIuMC4wLWFscGhhLngnLFxuICA2OiAnPj0gMi4wLjAtYmV0YS4xJ1xufTtcblxuZXhwb3J0cy5SRVZJU0lPTl9DSEFOR0VTID0gUkVWSVNJT05fQ0hBTkdFUztcbnZhciBpc0FycmF5ID0gVXRpbHMuaXNBcnJheSxcbiAgICBpc0Z1bmN0aW9uID0gVXRpbHMuaXNGdW5jdGlvbixcbiAgICB0b1N0cmluZyA9IFV0aWxzLnRvU3RyaW5nLFxuICAgIG9iamVjdFR5cGUgPSAnW29iamVjdCBPYmplY3RdJztcblxuZnVuY3Rpb24gSGFuZGxlYmFyc0Vudmlyb25tZW50KGhlbHBlcnMsIHBhcnRpYWxzKSB7XG4gIHRoaXMuaGVscGVycyA9IGhlbHBlcnMgfHwge307XG4gIHRoaXMucGFydGlhbHMgPSBwYXJ0aWFscyB8fCB7fTtcblxuICByZWdpc3RlckRlZmF1bHRIZWxwZXJzKHRoaXMpO1xufVxuXG5IYW5kbGViYXJzRW52aXJvbm1lbnQucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogSGFuZGxlYmFyc0Vudmlyb25tZW50LFxuXG4gIGxvZ2dlcjogbG9nZ2VyLFxuICBsb2c6IGxvZyxcblxuICByZWdpc3RlckhlbHBlcjogZnVuY3Rpb24gcmVnaXN0ZXJIZWxwZXIobmFtZSwgZm4pIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgaWYgKGZuKSB7XG4gICAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdBcmcgbm90IHN1cHBvcnRlZCB3aXRoIG11bHRpcGxlIGhlbHBlcnMnKTtcbiAgICAgIH1cbiAgICAgIFV0aWxzLmV4dGVuZCh0aGlzLmhlbHBlcnMsIG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhlbHBlcnNbbmFtZV0gPSBmbjtcbiAgICB9XG4gIH0sXG4gIHVucmVnaXN0ZXJIZWxwZXI6IGZ1bmN0aW9uIHVucmVnaXN0ZXJIZWxwZXIobmFtZSkge1xuICAgIGRlbGV0ZSB0aGlzLmhlbHBlcnNbbmFtZV07XG4gIH0sXG5cbiAgcmVnaXN0ZXJQYXJ0aWFsOiBmdW5jdGlvbiByZWdpc3RlclBhcnRpYWwobmFtZSwgcGFydGlhbCkge1xuICAgIGlmICh0b1N0cmluZy5jYWxsKG5hbWUpID09PSBvYmplY3RUeXBlKSB7XG4gICAgICBVdGlscy5leHRlbmQodGhpcy5wYXJ0aWFscywgbmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0eXBlb2YgcGFydGlhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ0F0dGVtcHRpbmcgdG8gcmVnaXN0ZXIgYSBwYXJ0aWFsIGFzIHVuZGVmaW5lZCcpO1xuICAgICAgfVxuICAgICAgdGhpcy5wYXJ0aWFsc1tuYW1lXSA9IHBhcnRpYWw7XG4gICAgfVxuICB9LFxuICB1bnJlZ2lzdGVyUGFydGlhbDogZnVuY3Rpb24gdW5yZWdpc3RlclBhcnRpYWwobmFtZSkge1xuICAgIGRlbGV0ZSB0aGlzLnBhcnRpYWxzW25hbWVdO1xuICB9XG59O1xuXG5mdW5jdGlvbiByZWdpc3RlckRlZmF1bHRIZWxwZXJzKGluc3RhbmNlKSB7XG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdoZWxwZXJNaXNzaW5nJywgZnVuY3Rpb24gKCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAvLyBBIG1pc3NpbmcgZmllbGQgaW4gYSB7e2Zvb319IGNvbnN0dWN0LlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU29tZW9uZSBpcyBhY3R1YWxseSB0cnlpbmcgdG8gY2FsbCBzb21ldGhpbmcsIGJsb3cgdXAuXG4gICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnTWlzc2luZyBoZWxwZXI6IFwiJyArIGFyZ3VtZW50c1thcmd1bWVudHMubGVuZ3RoIC0gMV0ubmFtZSArICdcIicpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2Jsb2NrSGVscGVyTWlzc2luZycsIGZ1bmN0aW9uIChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGludmVyc2UgPSBvcHRpb25zLmludmVyc2UsXG4gICAgICAgIGZuID0gb3B0aW9ucy5mbjtcblxuICAgIGlmIChjb250ZXh0ID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gZm4odGhpcyk7XG4gICAgfSBlbHNlIGlmIChjb250ZXh0ID09PSBmYWxzZSB8fCBjb250ZXh0ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBpbnZlcnNlKHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShjb250ZXh0KSkge1xuICAgICAgaWYgKGNvbnRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICBpZiAob3B0aW9ucy5pZHMpIHtcbiAgICAgICAgICBvcHRpb25zLmlkcyA9IFtvcHRpb25zLm5hbWVdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLmhlbHBlcnMuZWFjaChjb250ZXh0LCBvcHRpb25zKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbnZlcnNlKHRoaXMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAob3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuaWRzKSB7XG4gICAgICAgIHZhciBkYXRhID0gY3JlYXRlRnJhbWUob3B0aW9ucy5kYXRhKTtcbiAgICAgICAgZGF0YS5jb250ZXh0UGF0aCA9IFV0aWxzLmFwcGVuZENvbnRleHRQYXRoKG9wdGlvbnMuZGF0YS5jb250ZXh0UGF0aCwgb3B0aW9ucy5uYW1lKTtcbiAgICAgICAgb3B0aW9ucyA9IHsgZGF0YTogZGF0YSB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZm4oY29udGV4dCwgb3B0aW9ucyk7XG4gICAgfVxuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignZWFjaCcsIGZ1bmN0aW9uIChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnTXVzdCBwYXNzIGl0ZXJhdG9yIHRvICNlYWNoJyk7XG4gICAgfVxuXG4gICAgdmFyIGZuID0gb3B0aW9ucy5mbixcbiAgICAgICAgaW52ZXJzZSA9IG9wdGlvbnMuaW52ZXJzZSxcbiAgICAgICAgaSA9IDAsXG4gICAgICAgIHJldCA9ICcnLFxuICAgICAgICBkYXRhID0gdW5kZWZpbmVkLFxuICAgICAgICBjb250ZXh0UGF0aCA9IHVuZGVmaW5lZDtcblxuICAgIGlmIChvcHRpb25zLmRhdGEgJiYgb3B0aW9ucy5pZHMpIHtcbiAgICAgIGNvbnRleHRQYXRoID0gVXRpbHMuYXBwZW5kQ29udGV4dFBhdGgob3B0aW9ucy5kYXRhLmNvbnRleHRQYXRoLCBvcHRpb25zLmlkc1swXSkgKyAnLic7XG4gICAgfVxuXG4gICAgaWYgKGlzRnVuY3Rpb24oY29udGV4dCkpIHtcbiAgICAgIGNvbnRleHQgPSBjb250ZXh0LmNhbGwodGhpcyk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuZGF0YSkge1xuICAgICAgZGF0YSA9IGNyZWF0ZUZyYW1lKG9wdGlvbnMuZGF0YSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXhlY0l0ZXJhdGlvbihmaWVsZCwgaW5kZXgsIGxhc3QpIHtcbiAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgIGRhdGEua2V5ID0gZmllbGQ7XG4gICAgICAgIGRhdGEuaW5kZXggPSBpbmRleDtcbiAgICAgICAgZGF0YS5maXJzdCA9IGluZGV4ID09PSAwO1xuICAgICAgICBkYXRhLmxhc3QgPSAhIWxhc3Q7XG5cbiAgICAgICAgaWYgKGNvbnRleHRQYXRoKSB7XG4gICAgICAgICAgZGF0YS5jb250ZXh0UGF0aCA9IGNvbnRleHRQYXRoICsgZmllbGQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0ID0gcmV0ICsgZm4oY29udGV4dFtmaWVsZF0sIHtcbiAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgYmxvY2tQYXJhbXM6IFV0aWxzLmJsb2NrUGFyYW1zKFtjb250ZXh0W2ZpZWxkXSwgZmllbGRdLCBbY29udGV4dFBhdGggKyBmaWVsZCwgbnVsbF0pXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoY29udGV4dCAmJiB0eXBlb2YgY29udGV4dCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGlmIChpc0FycmF5KGNvbnRleHQpKSB7XG4gICAgICAgIGZvciAodmFyIGogPSBjb250ZXh0Lmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgICAgIGV4ZWNJdGVyYXRpb24oaSwgaSwgaSA9PT0gY29udGV4dC5sZW5ndGggLSAxKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHByaW9yS2V5ID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBjb250ZXh0KSB7XG4gICAgICAgICAgaWYgKGNvbnRleHQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgLy8gV2UncmUgcnVubmluZyB0aGUgaXRlcmF0aW9ucyBvbmUgc3RlcCBvdXQgb2Ygc3luYyBzbyB3ZSBjYW4gZGV0ZWN0XG4gICAgICAgICAgICAvLyB0aGUgbGFzdCBpdGVyYXRpb24gd2l0aG91dCBoYXZlIHRvIHNjYW4gdGhlIG9iamVjdCB0d2ljZSBhbmQgY3JlYXRlXG4gICAgICAgICAgICAvLyBhbiBpdGVybWVkaWF0ZSBrZXlzIGFycmF5LlxuICAgICAgICAgICAgaWYgKHByaW9yS2V5KSB7XG4gICAgICAgICAgICAgIGV4ZWNJdGVyYXRpb24ocHJpb3JLZXksIGkgLSAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByaW9yS2V5ID0ga2V5O1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocHJpb3JLZXkpIHtcbiAgICAgICAgICBleGVjSXRlcmF0aW9uKHByaW9yS2V5LCBpIC0gMSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgcmV0ID0gaW52ZXJzZSh0aGlzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignaWYnLCBmdW5jdGlvbiAoY29uZGl0aW9uYWwsIG9wdGlvbnMpIHtcbiAgICBpZiAoaXNGdW5jdGlvbihjb25kaXRpb25hbCkpIHtcbiAgICAgIGNvbmRpdGlvbmFsID0gY29uZGl0aW9uYWwuY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBEZWZhdWx0IGJlaGF2aW9yIGlzIHRvIHJlbmRlciB0aGUgcG9zaXRpdmUgcGF0aCBpZiB0aGUgdmFsdWUgaXMgdHJ1dGh5IGFuZCBub3QgZW1wdHkuXG4gICAgLy8gVGhlIGBpbmNsdWRlWmVyb2Agb3B0aW9uIG1heSBiZSBzZXQgdG8gdHJlYXQgdGhlIGNvbmR0aW9uYWwgYXMgcHVyZWx5IG5vdCBlbXB0eSBiYXNlZCBvbiB0aGVcbiAgICAvLyBiZWhhdmlvciBvZiBpc0VtcHR5LiBFZmZlY3RpdmVseSB0aGlzIGRldGVybWluZXMgaWYgMCBpcyBoYW5kbGVkIGJ5IHRoZSBwb3NpdGl2ZSBwYXRoIG9yIG5lZ2F0aXZlLlxuICAgIGlmICghb3B0aW9ucy5oYXNoLmluY2x1ZGVaZXJvICYmICFjb25kaXRpb25hbCB8fCBVdGlscy5pc0VtcHR5KGNvbmRpdGlvbmFsKSkge1xuICAgICAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG4gICAgfVxuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcigndW5sZXNzJywgZnVuY3Rpb24gKGNvbmRpdGlvbmFsLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIGluc3RhbmNlLmhlbHBlcnNbJ2lmJ10uY2FsbCh0aGlzLCBjb25kaXRpb25hbCwgeyBmbjogb3B0aW9ucy5pbnZlcnNlLCBpbnZlcnNlOiBvcHRpb25zLmZuLCBoYXNoOiBvcHRpb25zLmhhc2ggfSk7XG4gIH0pO1xuXG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCd3aXRoJywgZnVuY3Rpb24gKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBpZiAoaXNGdW5jdGlvbihjb250ZXh0KSkge1xuICAgICAgY29udGV4dCA9IGNvbnRleHQuY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgICB2YXIgZm4gPSBvcHRpb25zLmZuO1xuXG4gICAgaWYgKCFVdGlscy5pc0VtcHR5KGNvbnRleHQpKSB7XG4gICAgICBpZiAob3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuaWRzKSB7XG4gICAgICAgIHZhciBkYXRhID0gY3JlYXRlRnJhbWUob3B0aW9ucy5kYXRhKTtcbiAgICAgICAgZGF0YS5jb250ZXh0UGF0aCA9IFV0aWxzLmFwcGVuZENvbnRleHRQYXRoKG9wdGlvbnMuZGF0YS5jb250ZXh0UGF0aCwgb3B0aW9ucy5pZHNbMF0pO1xuICAgICAgICBvcHRpb25zID0geyBkYXRhOiBkYXRhIH07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmbihjb250ZXh0LCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZSh0aGlzKTtcbiAgICB9XG4gIH0pO1xuXG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdsb2cnLCBmdW5jdGlvbiAobWVzc2FnZSwgb3B0aW9ucykge1xuICAgIHZhciBsZXZlbCA9IG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmRhdGEubGV2ZWwgIT0gbnVsbCA/IHBhcnNlSW50KG9wdGlvbnMuZGF0YS5sZXZlbCwgMTApIDogMTtcbiAgICBpbnN0YW5jZS5sb2cobGV2ZWwsIG1lc3NhZ2UpO1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignbG9va3VwJywgZnVuY3Rpb24gKG9iaiwgZmllbGQpIHtcbiAgICByZXR1cm4gb2JqICYmIG9ialtmaWVsZF07XG4gIH0pO1xufVxuXG52YXIgbG9nZ2VyID0ge1xuICBtZXRob2RNYXA6IHsgMDogJ2RlYnVnJywgMTogJ2luZm8nLCAyOiAnd2FybicsIDM6ICdlcnJvcicgfSxcblxuICAvLyBTdGF0ZSBlbnVtXG4gIERFQlVHOiAwLFxuICBJTkZPOiAxLFxuICBXQVJOOiAyLFxuICBFUlJPUjogMyxcbiAgbGV2ZWw6IDEsXG5cbiAgLy8gQ2FuIGJlIG92ZXJyaWRkZW4gaW4gdGhlIGhvc3QgZW52aXJvbm1lbnRcbiAgbG9nOiBmdW5jdGlvbiBsb2cobGV2ZWwsIG1lc3NhZ2UpIHtcbiAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmIGxvZ2dlci5sZXZlbCA8PSBsZXZlbCkge1xuICAgICAgdmFyIG1ldGhvZCA9IGxvZ2dlci5tZXRob2RNYXBbbGV2ZWxdO1xuICAgICAgKGNvbnNvbGVbbWV0aG9kXSB8fCBjb25zb2xlLmxvZykuY2FsbChjb25zb2xlLCBtZXNzYWdlKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgfVxuICB9XG59O1xuXG5leHBvcnRzLmxvZ2dlciA9IGxvZ2dlcjtcbnZhciBsb2cgPSBsb2dnZXIubG9nO1xuXG5leHBvcnRzLmxvZyA9IGxvZztcblxuZnVuY3Rpb24gY3JlYXRlRnJhbWUob2JqZWN0KSB7XG4gIHZhciBmcmFtZSA9IFV0aWxzLmV4dGVuZCh7fSwgb2JqZWN0KTtcbiAgZnJhbWUuX3BhcmVudCA9IG9iamVjdDtcbiAgcmV0dXJuIGZyYW1lO1xufVxuXG4vKiBbYXJncywgXW9wdGlvbnMgKi8iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBlcnJvclByb3BzID0gWydkZXNjcmlwdGlvbicsICdmaWxlTmFtZScsICdsaW5lTnVtYmVyJywgJ21lc3NhZ2UnLCAnbmFtZScsICdudW1iZXInLCAnc3RhY2snXTtcblxuZnVuY3Rpb24gRXhjZXB0aW9uKG1lc3NhZ2UsIG5vZGUpIHtcbiAgdmFyIGxvYyA9IG5vZGUgJiYgbm9kZS5sb2MsXG4gICAgICBsaW5lID0gdW5kZWZpbmVkLFxuICAgICAgY29sdW1uID0gdW5kZWZpbmVkO1xuICBpZiAobG9jKSB7XG4gICAgbGluZSA9IGxvYy5zdGFydC5saW5lO1xuICAgIGNvbHVtbiA9IGxvYy5zdGFydC5jb2x1bW47XG5cbiAgICBtZXNzYWdlICs9ICcgLSAnICsgbGluZSArICc6JyArIGNvbHVtbjtcbiAgfVxuXG4gIHZhciB0bXAgPSBFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBtZXNzYWdlKTtcblxuICAvLyBVbmZvcnR1bmF0ZWx5IGVycm9ycyBhcmUgbm90IGVudW1lcmFibGUgaW4gQ2hyb21lIChhdCBsZWFzdCksIHNvIGBmb3IgcHJvcCBpbiB0bXBgIGRvZXNuJ3Qgd29yay5cbiAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgZXJyb3JQcm9wcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgdGhpc1tlcnJvclByb3BzW2lkeF1dID0gdG1wW2Vycm9yUHJvcHNbaWR4XV07XG4gIH1cblxuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBFeGNlcHRpb24pO1xuICB9XG5cbiAgaWYgKGxvYykge1xuICAgIHRoaXMubGluZU51bWJlciA9IGxpbmU7XG4gICAgdGhpcy5jb2x1bW4gPSBjb2x1bW47XG4gIH1cbn1cblxuRXhjZXB0aW9uLnByb3RvdHlwZSA9IG5ldyBFcnJvcigpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBFeGNlcHRpb247XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG4vKmdsb2JhbCB3aW5kb3cgKi9cblxuZXhwb3J0c1snZGVmYXVsdCddID0gZnVuY3Rpb24gKEhhbmRsZWJhcnMpIHtcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgdmFyIHJvb3QgPSB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHdpbmRvdyxcbiAgICAgICRIYW5kbGViYXJzID0gcm9vdC5IYW5kbGViYXJzO1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBIYW5kbGViYXJzLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHJvb3QuSGFuZGxlYmFycyA9PT0gSGFuZGxlYmFycykge1xuICAgICAgcm9vdC5IYW5kbGViYXJzID0gJEhhbmRsZWJhcnM7XG4gICAgfVxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQgPSBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH07XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzLmNoZWNrUmV2aXNpb24gPSBjaGVja1JldmlzaW9uO1xuXG4vLyBUT0RPOiBSZW1vdmUgdGhpcyBsaW5lIGFuZCBicmVhayB1cCBjb21waWxlUGFydGlhbFxuXG5leHBvcnRzLnRlbXBsYXRlID0gdGVtcGxhdGU7XG5leHBvcnRzLndyYXBQcm9ncmFtID0gd3JhcFByb2dyYW07XG5leHBvcnRzLnJlc29sdmVQYXJ0aWFsID0gcmVzb2x2ZVBhcnRpYWw7XG5leHBvcnRzLmludm9rZVBhcnRpYWwgPSBpbnZva2VQYXJ0aWFsO1xuZXhwb3J0cy5ub29wID0gbm9vcDtcblxudmFyIF9pbXBvcnQgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbnZhciBVdGlscyA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9pbXBvcnQpO1xuXG52YXIgX0V4Y2VwdGlvbiA9IHJlcXVpcmUoJy4vZXhjZXB0aW9uJyk7XG5cbnZhciBfRXhjZXB0aW9uMiA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9FeGNlcHRpb24pO1xuXG52YXIgX0NPTVBJTEVSX1JFVklTSU9OJFJFVklTSU9OX0NIQU5HRVMkY3JlYXRlRnJhbWUgPSByZXF1aXJlKCcuL2Jhc2UnKTtcblxuZnVuY3Rpb24gY2hlY2tSZXZpc2lvbihjb21waWxlckluZm8pIHtcbiAgdmFyIGNvbXBpbGVyUmV2aXNpb24gPSBjb21waWxlckluZm8gJiYgY29tcGlsZXJJbmZvWzBdIHx8IDEsXG4gICAgICBjdXJyZW50UmV2aXNpb24gPSBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5DT01QSUxFUl9SRVZJU0lPTjtcblxuICBpZiAoY29tcGlsZXJSZXZpc2lvbiAhPT0gY3VycmVudFJldmlzaW9uKSB7XG4gICAgaWYgKGNvbXBpbGVyUmV2aXNpb24gPCBjdXJyZW50UmV2aXNpb24pIHtcbiAgICAgIHZhciBydW50aW1lVmVyc2lvbnMgPSBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5SRVZJU0lPTl9DSEFOR0VTW2N1cnJlbnRSZXZpc2lvbl0sXG4gICAgICAgICAgY29tcGlsZXJWZXJzaW9ucyA9IF9DT01QSUxFUl9SRVZJU0lPTiRSRVZJU0lPTl9DSEFOR0VTJGNyZWF0ZUZyYW1lLlJFVklTSU9OX0NIQU5HRVNbY29tcGlsZXJSZXZpc2lvbl07XG4gICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVGVtcGxhdGUgd2FzIHByZWNvbXBpbGVkIHdpdGggYW4gb2xkZXIgdmVyc2lvbiBvZiBIYW5kbGViYXJzIHRoYW4gdGhlIGN1cnJlbnQgcnVudGltZS4gJyArICdQbGVhc2UgdXBkYXRlIHlvdXIgcHJlY29tcGlsZXIgdG8gYSBuZXdlciB2ZXJzaW9uICgnICsgcnVudGltZVZlcnNpb25zICsgJykgb3IgZG93bmdyYWRlIHlvdXIgcnVudGltZSB0byBhbiBvbGRlciB2ZXJzaW9uICgnICsgY29tcGlsZXJWZXJzaW9ucyArICcpLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBVc2UgdGhlIGVtYmVkZGVkIHZlcnNpb24gaW5mbyBzaW5jZSB0aGUgcnVudGltZSBkb2Vzbid0IGtub3cgYWJvdXQgdGhpcyByZXZpc2lvbiB5ZXRcbiAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdUZW1wbGF0ZSB3YXMgcHJlY29tcGlsZWQgd2l0aCBhIG5ld2VyIHZlcnNpb24gb2YgSGFuZGxlYmFycyB0aGFuIHRoZSBjdXJyZW50IHJ1bnRpbWUuICcgKyAnUGxlYXNlIHVwZGF0ZSB5b3VyIHJ1bnRpbWUgdG8gYSBuZXdlciB2ZXJzaW9uICgnICsgY29tcGlsZXJJbmZvWzFdICsgJykuJyk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHRlbXBsYXRlKHRlbXBsYXRlU3BlYywgZW52KSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGlmICghZW52KSB7XG4gICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ05vIGVudmlyb25tZW50IHBhc3NlZCB0byB0ZW1wbGF0ZScpO1xuICB9XG4gIGlmICghdGVtcGxhdGVTcGVjIHx8ICF0ZW1wbGF0ZVNwZWMubWFpbikge1xuICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdVbmtub3duIHRlbXBsYXRlIG9iamVjdDogJyArIHR5cGVvZiB0ZW1wbGF0ZVNwZWMpO1xuICB9XG5cbiAgLy8gTm90ZTogVXNpbmcgZW52LlZNIHJlZmVyZW5jZXMgcmF0aGVyIHRoYW4gbG9jYWwgdmFyIHJlZmVyZW5jZXMgdGhyb3VnaG91dCB0aGlzIHNlY3Rpb24gdG8gYWxsb3dcbiAgLy8gZm9yIGV4dGVybmFsIHVzZXJzIHRvIG92ZXJyaWRlIHRoZXNlIGFzIHBzdWVkby1zdXBwb3J0ZWQgQVBJcy5cbiAgZW52LlZNLmNoZWNrUmV2aXNpb24odGVtcGxhdGVTcGVjLmNvbXBpbGVyKTtcblxuICBmdW5jdGlvbiBpbnZva2VQYXJ0aWFsV3JhcHBlcihwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuaGFzaCkge1xuICAgICAgY29udGV4dCA9IFV0aWxzLmV4dGVuZCh7fSwgY29udGV4dCwgb3B0aW9ucy5oYXNoKTtcbiAgICB9XG5cbiAgICBwYXJ0aWFsID0gZW52LlZNLnJlc29sdmVQYXJ0aWFsLmNhbGwodGhpcywgcGFydGlhbCwgY29udGV4dCwgb3B0aW9ucyk7XG4gICAgdmFyIHJlc3VsdCA9IGVudi5WTS5pbnZva2VQYXJ0aWFsLmNhbGwodGhpcywgcGFydGlhbCwgY29udGV4dCwgb3B0aW9ucyk7XG5cbiAgICBpZiAocmVzdWx0ID09IG51bGwgJiYgZW52LmNvbXBpbGUpIHtcbiAgICAgIG9wdGlvbnMucGFydGlhbHNbb3B0aW9ucy5uYW1lXSA9IGVudi5jb21waWxlKHBhcnRpYWwsIHRlbXBsYXRlU3BlYy5jb21waWxlck9wdGlvbnMsIGVudik7XG4gICAgICByZXN1bHQgPSBvcHRpb25zLnBhcnRpYWxzW29wdGlvbnMubmFtZV0oY29udGV4dCwgb3B0aW9ucyk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQgIT0gbnVsbCkge1xuICAgICAgaWYgKG9wdGlvbnMuaW5kZW50KSB7XG4gICAgICAgIHZhciBsaW5lcyA9IHJlc3VsdC5zcGxpdCgnXFxuJyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGluZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgaWYgKCFsaW5lc1tpXSAmJiBpICsgMSA9PT0gbCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGluZXNbaV0gPSBvcHRpb25zLmluZGVudCArIGxpbmVzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9IGxpbmVzLmpvaW4oJ1xcbicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ1RoZSBwYXJ0aWFsICcgKyBvcHRpb25zLm5hbWUgKyAnIGNvdWxkIG5vdCBiZSBjb21waWxlZCB3aGVuIHJ1bm5pbmcgaW4gcnVudGltZS1vbmx5IG1vZGUnKTtcbiAgICB9XG4gIH1cblxuICAvLyBKdXN0IGFkZCB3YXRlclxuICB2YXIgY29udGFpbmVyID0ge1xuICAgIHN0cmljdDogZnVuY3Rpb24gc3RyaWN0KG9iaiwgbmFtZSkge1xuICAgICAgaWYgKCEobmFtZSBpbiBvYmopKSB7XG4gICAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdcIicgKyBuYW1lICsgJ1wiIG5vdCBkZWZpbmVkIGluICcgKyBvYmopO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG9ialtuYW1lXTtcbiAgICB9LFxuICAgIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKGRlcHRocywgbmFtZSkge1xuICAgICAgdmFyIGxlbiA9IGRlcHRocy5sZW5ndGg7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGlmIChkZXB0aHNbaV0gJiYgZGVwdGhzW2ldW25hbWVdICE9IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gZGVwdGhzW2ldW25hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBsYW1iZGE6IGZ1bmN0aW9uIGxhbWJkYShjdXJyZW50LCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gdHlwZW9mIGN1cnJlbnQgPT09ICdmdW5jdGlvbicgPyBjdXJyZW50LmNhbGwoY29udGV4dCkgOiBjdXJyZW50O1xuICAgIH0sXG5cbiAgICBlc2NhcGVFeHByZXNzaW9uOiBVdGlscy5lc2NhcGVFeHByZXNzaW9uLFxuICAgIGludm9rZVBhcnRpYWw6IGludm9rZVBhcnRpYWxXcmFwcGVyLFxuXG4gICAgZm46IGZ1bmN0aW9uIGZuKGkpIHtcbiAgICAgIHJldHVybiB0ZW1wbGF0ZVNwZWNbaV07XG4gICAgfSxcblxuICAgIHByb2dyYW1zOiBbXSxcbiAgICBwcm9ncmFtOiBmdW5jdGlvbiBwcm9ncmFtKGksIGRhdGEsIGRlY2xhcmVkQmxvY2tQYXJhbXMsIGJsb2NrUGFyYW1zLCBkZXB0aHMpIHtcbiAgICAgIHZhciBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV0sXG4gICAgICAgICAgZm4gPSB0aGlzLmZuKGkpO1xuICAgICAgaWYgKGRhdGEgfHwgZGVwdGhzIHx8IGJsb2NrUGFyYW1zIHx8IGRlY2xhcmVkQmxvY2tQYXJhbXMpIHtcbiAgICAgICAgcHJvZ3JhbVdyYXBwZXIgPSB3cmFwUHJvZ3JhbSh0aGlzLCBpLCBmbiwgZGF0YSwgZGVjbGFyZWRCbG9ja1BhcmFtcywgYmxvY2tQYXJhbXMsIGRlcHRocyk7XG4gICAgICB9IGVsc2UgaWYgKCFwcm9ncmFtV3JhcHBlcikge1xuICAgICAgICBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV0gPSB3cmFwUHJvZ3JhbSh0aGlzLCBpLCBmbik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcHJvZ3JhbVdyYXBwZXI7XG4gICAgfSxcblxuICAgIGRhdGE6IGZ1bmN0aW9uIGRhdGEodmFsdWUsIGRlcHRoKSB7XG4gICAgICB3aGlsZSAodmFsdWUgJiYgZGVwdGgtLSkge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLl9wYXJlbnQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSxcbiAgICBtZXJnZTogZnVuY3Rpb24gbWVyZ2UocGFyYW0sIGNvbW1vbikge1xuICAgICAgdmFyIG9iaiA9IHBhcmFtIHx8IGNvbW1vbjtcblxuICAgICAgaWYgKHBhcmFtICYmIGNvbW1vbiAmJiBwYXJhbSAhPT0gY29tbW9uKSB7XG4gICAgICAgIG9iaiA9IFV0aWxzLmV4dGVuZCh7fSwgY29tbW9uLCBwYXJhbSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBvYmo7XG4gICAgfSxcblxuICAgIG5vb3A6IGVudi5WTS5ub29wLFxuICAgIGNvbXBpbGVySW5mbzogdGVtcGxhdGVTcGVjLmNvbXBpbGVyXG4gIH07XG5cbiAgZnVuY3Rpb24gcmV0KGNvbnRleHQpIHtcbiAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMV07XG5cbiAgICB2YXIgZGF0YSA9IG9wdGlvbnMuZGF0YTtcblxuICAgIHJldC5fc2V0dXAob3B0aW9ucyk7XG4gICAgaWYgKCFvcHRpb25zLnBhcnRpYWwgJiYgdGVtcGxhdGVTcGVjLnVzZURhdGEpIHtcbiAgICAgIGRhdGEgPSBpbml0RGF0YShjb250ZXh0LCBkYXRhKTtcbiAgICB9XG4gICAgdmFyIGRlcHRocyA9IHVuZGVmaW5lZCxcbiAgICAgICAgYmxvY2tQYXJhbXMgPSB0ZW1wbGF0ZVNwZWMudXNlQmxvY2tQYXJhbXMgPyBbXSA6IHVuZGVmaW5lZDtcbiAgICBpZiAodGVtcGxhdGVTcGVjLnVzZURlcHRocykge1xuICAgICAgZGVwdGhzID0gb3B0aW9ucy5kZXB0aHMgPyBbY29udGV4dF0uY29uY2F0KG9wdGlvbnMuZGVwdGhzKSA6IFtjb250ZXh0XTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGVtcGxhdGVTcGVjLm1haW4uY2FsbChjb250YWluZXIsIGNvbnRleHQsIGNvbnRhaW5lci5oZWxwZXJzLCBjb250YWluZXIucGFydGlhbHMsIGRhdGEsIGJsb2NrUGFyYW1zLCBkZXB0aHMpO1xuICB9XG4gIHJldC5pc1RvcCA9IHRydWU7XG5cbiAgcmV0Ll9zZXR1cCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zLnBhcnRpYWwpIHtcbiAgICAgIGNvbnRhaW5lci5oZWxwZXJzID0gY29udGFpbmVyLm1lcmdlKG9wdGlvbnMuaGVscGVycywgZW52LmhlbHBlcnMpO1xuXG4gICAgICBpZiAodGVtcGxhdGVTcGVjLnVzZVBhcnRpYWwpIHtcbiAgICAgICAgY29udGFpbmVyLnBhcnRpYWxzID0gY29udGFpbmVyLm1lcmdlKG9wdGlvbnMucGFydGlhbHMsIGVudi5wYXJ0aWFscyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRhaW5lci5oZWxwZXJzID0gb3B0aW9ucy5oZWxwZXJzO1xuICAgICAgY29udGFpbmVyLnBhcnRpYWxzID0gb3B0aW9ucy5wYXJ0aWFscztcbiAgICB9XG4gIH07XG5cbiAgcmV0Ll9jaGlsZCA9IGZ1bmN0aW9uIChpLCBkYXRhLCBibG9ja1BhcmFtcywgZGVwdGhzKSB7XG4gICAgaWYgKHRlbXBsYXRlU3BlYy51c2VCbG9ja1BhcmFtcyAmJiAhYmxvY2tQYXJhbXMpIHtcbiAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdtdXN0IHBhc3MgYmxvY2sgcGFyYW1zJyk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZVNwZWMudXNlRGVwdGhzICYmICFkZXB0aHMpIHtcbiAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdtdXN0IHBhc3MgcGFyZW50IGRlcHRocycpO1xuICAgIH1cblxuICAgIHJldHVybiB3cmFwUHJvZ3JhbShjb250YWluZXIsIGksIHRlbXBsYXRlU3BlY1tpXSwgZGF0YSwgMCwgYmxvY2tQYXJhbXMsIGRlcHRocyk7XG4gIH07XG4gIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIHdyYXBQcm9ncmFtKGNvbnRhaW5lciwgaSwgZm4sIGRhdGEsIGRlY2xhcmVkQmxvY2tQYXJhbXMsIGJsb2NrUGFyYW1zLCBkZXB0aHMpIHtcbiAgZnVuY3Rpb24gcHJvZyhjb250ZXh0KSB7XG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzFdO1xuXG4gICAgcmV0dXJuIGZuLmNhbGwoY29udGFpbmVyLCBjb250ZXh0LCBjb250YWluZXIuaGVscGVycywgY29udGFpbmVyLnBhcnRpYWxzLCBvcHRpb25zLmRhdGEgfHwgZGF0YSwgYmxvY2tQYXJhbXMgJiYgW29wdGlvbnMuYmxvY2tQYXJhbXNdLmNvbmNhdChibG9ja1BhcmFtcyksIGRlcHRocyAmJiBbY29udGV4dF0uY29uY2F0KGRlcHRocykpO1xuICB9XG4gIHByb2cucHJvZ3JhbSA9IGk7XG4gIHByb2cuZGVwdGggPSBkZXB0aHMgPyBkZXB0aHMubGVuZ3RoIDogMDtcbiAgcHJvZy5ibG9ja1BhcmFtcyA9IGRlY2xhcmVkQmxvY2tQYXJhbXMgfHwgMDtcbiAgcmV0dXJuIHByb2c7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVQYXJ0aWFsKHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgaWYgKCFwYXJ0aWFsKSB7XG4gICAgcGFydGlhbCA9IG9wdGlvbnMucGFydGlhbHNbb3B0aW9ucy5uYW1lXTtcbiAgfSBlbHNlIGlmICghcGFydGlhbC5jYWxsICYmICFvcHRpb25zLm5hbWUpIHtcbiAgICAvLyBUaGlzIGlzIGEgZHluYW1pYyBwYXJ0aWFsIHRoYXQgcmV0dXJuZWQgYSBzdHJpbmdcbiAgICBvcHRpb25zLm5hbWUgPSBwYXJ0aWFsO1xuICAgIHBhcnRpYWwgPSBvcHRpb25zLnBhcnRpYWxzW3BhcnRpYWxdO1xuICB9XG4gIHJldHVybiBwYXJ0aWFsO1xufVxuXG5mdW5jdGlvbiBpbnZva2VQYXJ0aWFsKHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucy5wYXJ0aWFsID0gdHJ1ZTtcblxuICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ1RoZSBwYXJ0aWFsICcgKyBvcHRpb25zLm5hbWUgKyAnIGNvdWxkIG5vdCBiZSBmb3VuZCcpO1xuICB9IGVsc2UgaWYgKHBhcnRpYWwgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIHJldHVybiBwYXJ0aWFsKGNvbnRleHQsIG9wdGlvbnMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5vb3AoKSB7XG4gIHJldHVybiAnJztcbn1cblxuZnVuY3Rpb24gaW5pdERhdGEoY29udGV4dCwgZGF0YSkge1xuICBpZiAoIWRhdGEgfHwgISgncm9vdCcgaW4gZGF0YSkpIHtcbiAgICBkYXRhID0gZGF0YSA/IF9DT01QSUxFUl9SRVZJU0lPTiRSRVZJU0lPTl9DSEFOR0VTJGNyZWF0ZUZyYW1lLmNyZWF0ZUZyYW1lKGRhdGEpIDoge307XG4gICAgZGF0YS5yb290ID0gY29udGV4dDtcbiAgfVxuICByZXR1cm4gZGF0YTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG4vLyBCdWlsZCBvdXQgb3VyIGJhc2ljIFNhZmVTdHJpbmcgdHlwZVxuZnVuY3Rpb24gU2FmZVN0cmluZyhzdHJpbmcpIHtcbiAgdGhpcy5zdHJpbmcgPSBzdHJpbmc7XG59XG5cblNhZmVTdHJpbmcucHJvdG90eXBlLnRvU3RyaW5nID0gU2FmZVN0cmluZy5wcm90b3R5cGUudG9IVE1MID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gJycgKyB0aGlzLnN0cmluZztcbn07XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IFNhZmVTdHJpbmc7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzLmV4dGVuZCA9IGV4dGVuZDtcblxuLy8gT2xkZXIgSUUgdmVyc2lvbnMgZG8gbm90IGRpcmVjdGx5IHN1cHBvcnQgaW5kZXhPZiBzbyB3ZSBtdXN0IGltcGxlbWVudCBvdXIgb3duLCBzYWRseS5cbmV4cG9ydHMuaW5kZXhPZiA9IGluZGV4T2Y7XG5leHBvcnRzLmVzY2FwZUV4cHJlc3Npb24gPSBlc2NhcGVFeHByZXNzaW9uO1xuZXhwb3J0cy5pc0VtcHR5ID0gaXNFbXB0eTtcbmV4cG9ydHMuYmxvY2tQYXJhbXMgPSBibG9ja1BhcmFtcztcbmV4cG9ydHMuYXBwZW5kQ29udGV4dFBhdGggPSBhcHBlbmRDb250ZXh0UGF0aDtcbnZhciBlc2NhcGUgPSB7XG4gICcmJzogJyZhbXA7JyxcbiAgJzwnOiAnJmx0OycsXG4gICc+JzogJyZndDsnLFxuICAnXCInOiAnJnF1b3Q7JyxcbiAgJ1xcJyc6ICcmI3gyNzsnLFxuICAnYCc6ICcmI3g2MDsnXG59O1xuXG52YXIgYmFkQ2hhcnMgPSAvWyY8PlwiJ2BdL2csXG4gICAgcG9zc2libGUgPSAvWyY8PlwiJ2BdLztcblxuZnVuY3Rpb24gZXNjYXBlQ2hhcihjaHIpIHtcbiAgcmV0dXJuIGVzY2FwZVtjaHJdO1xufVxuXG5mdW5jdGlvbiBleHRlbmQob2JqIC8qICwgLi4uc291cmNlICovKSB7XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgZm9yICh2YXIga2V5IGluIGFyZ3VtZW50c1tpXSkge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChhcmd1bWVudHNbaV0sIGtleSkpIHtcbiAgICAgICAgb2JqW2tleV0gPSBhcmd1bWVudHNbaV1ba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufVxuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5leHBvcnRzLnRvU3RyaW5nID0gdG9TdHJpbmc7XG4vLyBTb3VyY2VkIGZyb20gbG9kYXNoXG4vLyBodHRwczovL2dpdGh1Yi5jb20vYmVzdGllanMvbG9kYXNoL2Jsb2IvbWFzdGVyL0xJQ0VOU0UudHh0XG4vKmVzbGludC1kaXNhYmxlIGZ1bmMtc3R5bGUsIG5vLXZhciAqL1xudmFyIGlzRnVuY3Rpb24gPSBmdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XG59O1xuLy8gZmFsbGJhY2sgZm9yIG9sZGVyIHZlcnNpb25zIG9mIENocm9tZSBhbmQgU2FmYXJpXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuaWYgKGlzRnVuY3Rpb24oL3gvKSkge1xuICBleHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbiAgfTtcbn1cbnZhciBpc0Z1bmN0aW9uO1xuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcbi8qZXNsaW50LWVuYWJsZSBmdW5jLXN0eWxlLCBuby12YXIgKi9cblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgPyB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgQXJyYXldJyA6IGZhbHNlO1xufTtleHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpbmRleE9mKGFycmF5LCB2YWx1ZSkge1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoYXJyYXlbaV0gPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBlc2NhcGVFeHByZXNzaW9uKHN0cmluZykge1xuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAvLyBkb24ndCBlc2NhcGUgU2FmZVN0cmluZ3MsIHNpbmNlIHRoZXkncmUgYWxyZWFkeSBzYWZlXG4gICAgaWYgKHN0cmluZyAmJiBzdHJpbmcudG9IVE1MKSB7XG4gICAgICByZXR1cm4gc3RyaW5nLnRvSFRNTCgpO1xuICAgIH0gZWxzZSBpZiAoc3RyaW5nID09IG51bGwpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9IGVsc2UgaWYgKCFzdHJpbmcpIHtcbiAgICAgIHJldHVybiBzdHJpbmcgKyAnJztcbiAgICB9XG5cbiAgICAvLyBGb3JjZSBhIHN0cmluZyBjb252ZXJzaW9uIGFzIHRoaXMgd2lsbCBiZSBkb25lIGJ5IHRoZSBhcHBlbmQgcmVnYXJkbGVzcyBhbmRcbiAgICAvLyB0aGUgcmVnZXggdGVzdCB3aWxsIGRvIHRoaXMgdHJhbnNwYXJlbnRseSBiZWhpbmQgdGhlIHNjZW5lcywgY2F1c2luZyBpc3N1ZXMgaWZcbiAgICAvLyBhbiBvYmplY3QncyB0byBzdHJpbmcgaGFzIGVzY2FwZWQgY2hhcmFjdGVycyBpbiBpdC5cbiAgICBzdHJpbmcgPSAnJyArIHN0cmluZztcbiAgfVxuXG4gIGlmICghcG9zc2libGUudGVzdChzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxuICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoYmFkQ2hhcnMsIGVzY2FwZUNoYXIpO1xufVxuXG5mdW5jdGlvbiBpc0VtcHR5KHZhbHVlKSB7XG4gIGlmICghdmFsdWUgJiYgdmFsdWUgIT09IDApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChpc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gYmxvY2tQYXJhbXMocGFyYW1zLCBpZHMpIHtcbiAgcGFyYW1zLnBhdGggPSBpZHM7XG4gIHJldHVybiBwYXJhbXM7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZENvbnRleHRQYXRoKGNvbnRleHRQYXRoLCBpZCkge1xuICByZXR1cm4gKGNvbnRleHRQYXRoID8gY29udGV4dFBhdGggKyAnLicgOiAnJykgKyBpZDtcbn0iLCIvLyBDcmVhdGUgYSBzaW1wbGUgcGF0aCBhbGlhcyB0byBhbGxvdyBicm93c2VyaWZ5IHRvIHJlc29sdmVcbi8vIHRoZSBydW50aW1lIG9uIGEgc3VwcG9ydGVkIHBhdGguXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGlzdC9janMvaGFuZGxlYmFycy5ydW50aW1lJylbJ2RlZmF1bHQnXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImhhbmRsZWJhcnMvcnVudGltZVwiKVtcImRlZmF1bHRcIl07XG4iLCJ2YXIgZndjID0gcmVxdWlyZSgnZndjJyk7XG5cblFVbml0Lm1vZHVsZSgnTW9kdWxlJyk7XG5cblFVbml0LnRlc3QoJ2ZhY3RvcnknLCAzLCBmdW5jdGlvbihhc3NlcnQpIHtcbiAgICBhc3NlcnQub2sodHlwZW9mIGZ3YyA9PT0gJ2Z1bmN0aW9uJywgXCJUaGUgbW9kdWxlIGV4cG9zZSBhIGZ1bmN0aW9uXCIpO1xuICAgIGFzc2VydC5vayh0eXBlb2YgZndjKCdmb28nKSA9PT0gJ29iamVjdCcsIFwiVGhlIG1vZHVsZSBjcmVhdGVzIGFuIG9iamVjdFwiKTtcbiAgICBhc3NlcnQubm90RXF1YWwoZndjKCdmb28nKSwgZndjKCdmb28nKSwgXCJUaGUgZmFjdG9yeSBjcmVhdGVzIGEgbmV3IG9iamVjdCBhdCBlYWNoIGNhbGxcIik7XG59KTtcblxuUVVuaXQubW9kdWxlKCdPcHRpb25zJyk7XG5cblFVbml0LnRlc3QoJ25hbWVzcGFjZScsIDMsIGZ1bmN0aW9uKGFzc2VydCkge1xuXG4gICAgYXNzZXJ0LnRocm93cyhmdW5jdGlvbigpe1xuICAgICAgICBmd2MoJ2ZvbycsIHsgbmFtZXNwYWNlIDogJzEyJyB9KTtcbiAgICB9LCBUeXBlRXJyb3IsICdUaGUgbmFtZXNwYWNlIGlzIG5vdCB2YWxpZCcpO1xuXG4gICAgYXNzZXJ0LnRocm93cyhmdW5jdGlvbigpe1xuICAgICAgICBmd2MoJ2ZvbycsIHsgbmFtZXNwYWNlIDogJ3QtJyB9KTtcbiAgICB9LCBUeXBlRXJyb3IsICdUaGUgbmFtZXNwYWNlIGlzIG5vdCB2YWxpZCcpO1xuXG4gICAgYXNzZXJ0LnRocm93cyhmdW5jdGlvbigpe1xuICAgICAgICBmd2MoJ2ZvbycsIHsgbmFtZXNwYWNlIDogJ3QuJyB9KTtcbiAgICB9LCBUeXBlRXJyb3IsICdUaGUgbmFtZXNwYWNlIGlzIG5vdCB2YWxpZCcpO1xuXG4gICAgZndjKCdmb28nLCB7IG5hbWVzcGFjZSA6ICdiYXInIH0pO1xufSk7XG5cblFVbml0Lm1vZHVsZSgnRXZlbnRzJyk7XG5cblFVbml0LmFzeW5jVGVzdChcImVtaXR0ZXJcIiwgOCwgZnVuY3Rpb24oYXNzZXJ0KXtcblxuICAgIHZhciBjb21wID0gZndjKCdmb28nKTtcblxuICAgIGFzc2VydC5vayh0eXBlb2YgY29tcCA9PT0gJ29iamVjdCcsIFwidGhlIGNvbXBvbmVudCBkZWZpbml0aW9uIGlzIGFuIG9iamVjdFwiKTtcbiAgICBhc3NlcnQub2sodHlwZW9mIGNvbXAub24gPT09ICdmdW5jdGlvbicsIFwidGhlIGNvbXBvbmVudCBkZWZpbnRpb24gaG9sZHMgdGhlIG1ldGhvZCBvblwiKTtcbiAgICBhc3NlcnQub2sodHlwZW9mIGNvbXAudHJpZ2dlciA9PT0gJ2Z1bmN0aW9uJywgXCJ0aGUgY29tcG9uZW50IGRlZmludGlvbiBob2xkcyB0aGUgbWV0aG9kIHRyaWdnZXJcIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBjb21wLm9mZiA9PT0gJ2Z1bmN0aW9uJywgXCJ0aGUgY29tcG9uZW50IGRlZmludGlvbiBob2xkcyB0aGUgbWV0aG9kIG9mZlwiKTtcbiAgICBhc3NlcnQub2sodHlwZW9mIGNvbXAuZXZlbnRzID09PSAnZnVuY3Rpb24nLCBcInRoZSBjb21wb25lbnQgZGVmaW50aW9uIGhvbGRzIHRoZSBtZXRob2QgZXZlbnRzXCIpO1xuXG4gICAgY29tcC5vbignZXJyb3InLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGFzc2VydC5vayhlIGluc3RhbmNlb2YgRXJyb3IsICdBbiBlcnJvciBpcyBlbWl0dGVkJyk7XG4gICAgICAgIGFzc2VydC5lcXVhbChlLm1lc3NhZ2UsICd0ZXN0IGVycm9yJywgJ1RoZSBtZXNzYWdlIGlzIGdpdmVuIGluIHRoZSBlcnJvcicpO1xuXG4gICAgICAgIFFVbml0LnN0YXJ0KCk7XG4gICAgfSk7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbXAuZXZlbnRzKCdlcnJvcicpLmxlbmd0aCwgMSwgXCJUaGUgY29tcG9uZW50IGhhcyBvbiBsaXN0ZW5lciByZWdpc3RlcmVkXCIpO1xuICAgIGNvbXAudHJpZ2dlcignZXJyb3InLCBuZXcgRXJyb3IoJ3Rlc3QgZXJyb3InKSk7XG59KTtcblxuXG5RVW5pdC5tb2R1bGUoJ0F0dHJpYnV0ZXMnKTtcblxuXG5RVW5pdC50ZXN0KCdkZWZpbml0aW9uJywgNSwgZnVuY3Rpb24oYXNzZXJ0KXtcblxuICAgIHZhciBjb21wID0gZndjKCdmb28nKTtcblxuICAgIGFzc2VydC5vayh0eXBlb2YgY29tcC5hdHRyID09PSAnZnVuY3Rpb24nLCBcInRoZSBjb21wb25lbnQgZGVmaW5pdGlvbiBob2xkcyB0aGUgbWV0aG9kIGF0dHJcIik7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbXAuYXR0cignaWQnLCB7fSksIGNvbXAsIFwiVGhlIG1ldGhvZCBjaGFpbnMgd2l0aCBhcmd1bWVudHNcIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBjb21wLmF0dHIoJ2lkJykgPT09ICdvYmplY3QnLCBcInRoZSBtZXRob2QgcmV0dXJucyB0aGUgYXR0cmlidXRlIGRlZmluaXRpb25cIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBjb21wLmF0dHIoJ2lkJykuc2V0ID09PSAnZnVuY3Rpb24nLCBcInRoZSBhdHRyaWJ1dGUgZGVmaW5pdGlvbiBoYXMgYSBzZXR0ZXJcIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBjb21wLmF0dHIoJ2lkJykuZ2V0ID09PSAnZnVuY3Rpb24nLCBcInRoZSBhdHRyaWJ1dGUgZGVmaW5pdGlvbiBoYXMgYSBnZXR0ZXJcIik7XG59KTtcblxuXG5RVW5pdC50ZXN0KCdkZWZpbml0aW9uIHBvbHltb3JwaGlzbScsIDMsIGZ1bmN0aW9uKGFzc2VydCl7XG5cbiAgICB2YXIgY29tcCA9IGZ3YygnZm9vJyk7XG5cbiAgICBjb21wLmF0dHIoe25hbWUgOiAnaWQnfSk7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBjb21wLmF0dHIoJ2lkJykgPT09ICdvYmplY3QnLCBcInRoZSBtZXRob2QgcmV0dXJucyB0aGUgYXR0cmlidXRlIGRlZmluaXRpb25cIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBjb21wLmF0dHIoJ2lkJykuc2V0ID09PSAnZnVuY3Rpb24nLCBcInRoZSBhdHRyaWJ1dGUgZGVmaW5pdGlvbiBoYXMgYSBzZXR0ZXJcIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBjb21wLmF0dHIoJ2lkJykuZ2V0ID09PSAnZnVuY3Rpb24nLCBcInRoZSBhdHRyaWJ1dGUgZGVmaW5pdGlvbiBoYXMgYSBnZXR0ZXJcIik7XG59KTtcblxuUVVuaXQudGVzdCgnZGVmaW5pdGlvbiB0eXBlIGNhc3RpbmcnLCA2LCBmdW5jdGlvbihhc3NlcnQpe1xuXG4gICAgdmFyIGNvbXAgPSBmd2MoJ2ZvbycpO1xuXG4gICAgdmFyIG1vY2sgPSB7XG4gICAgICAgIGdldEF0dHJpYnV0ZShuYW1lKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBzZXRBdHRyaWJ1dGUobmFtZSwgdmFsKXtcbiAgICAgICAgICAgIHRoaXNbbmFtZV0gPSB2YWw7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9LFxuICAgICAgICBoYXNBdHRyaWJ1dGUobmFtZSl7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oYXNPd25Qcm9wZXJ0eShuYW1lKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb21wLmF0dHIoJ2ludCcsIHt0eXBlIDogJ2ludGVnZXInfSk7XG4gICAgY29tcC5hdHRyKCdmbG9hdCcsIHt0eXBlIDogJ2Zsb2F0J30pO1xuICAgIGNvbXAuYXR0cignYm9vbCcsIHt0eXBlIDogJ2Jvb2xlYW4nfSk7XG5cbiAgICBhc3NlcnQuZXF1YWwoY29tcC5hdHRyKCdpbnQnKS5zZXQuY2FsbChtb2NrLCBcIjEyLjVcIiksIDEyLFwidGhlIGF0dHJpYnV0ZSBzZXR0ZXIgc2V0IHRoZSBwYXJzZWQgdmFsdWVcIik7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbXAuYXR0cignaW50JykuZ2V0LmNhbGwobW9jayksIDEyLCBcInRoZSBpbnQgZ2V0dGVyIHJldHVybnMgdGhlIHBhcnNlZCB2YWx1ZVwiKTtcblxuICAgIGFzc2VydC5lcXVhbChjb21wLmF0dHIoJ2Zsb2F0Jykuc2V0LmNhbGwobW9jaywgXCIxMi41XCIpLCAxMi41LFwidGhlIGF0dHJpYnV0ZSBzZXR0ZXIgc2V0IHRoZSBwYXJzZWQgdmFsdWVcIik7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbXAuYXR0cignZmxvYXQnKS5nZXQuY2FsbChtb2NrKSwgMTIuNSwgXCJ0aGUgaW50IGdldHRlciByZXR1cm5zIHRoZSBwYXJzZWQgdmFsdWVcIik7XG5cbiAgICBhc3NlcnQuZXF1YWwoY29tcC5hdHRyKCdib29sJykuc2V0LmNhbGwobW9jaywgXCJhXCIpLCB0cnVlLFwidGhlIGF0dHJpYnV0ZSBzZXR0ZXIgc2V0IHRoZSBwYXJzZWQgdmFsdWVcIik7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbXAuYXR0cignYm9vbCcpLmdldC5jYWxsKG1vY2spLCB0cnVlLCBcInRoZSBpbnQgZ2V0dGVyIHJldHVybnMgdGhlIHBhcnNlZCB2YWx1ZVwiKTtcbn0pO1xuXG5RVW5pdC50ZXN0KCdtdWx0aXBsZSBkZWNsYXJhdGlvbnMnLCAzLCBmdW5jdGlvbihhc3NlcnQpe1xuXG4gICAgdmFyIGNvbXAgPSBmd2MoJ2ZvbycpO1xuXG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBjb21wLmF0dHJzID09PSAnZnVuY3Rpb24nLCBcInRoZSBjb21wb25lbnQgZGVmaW5pdGlvbiBob2xkcyB0aGUgbWV0aG9kIGF0dHJzXCIpO1xuICAgIGFzc2VydC5lcXVhbChjb21wLmF0dHJzKCdpZCcsICdzZWxlY3RlZCcpLCBjb21wLCBcIlRoZSBtZXRob2QgY2hhaW5zIHdpdGggYXJndW1lbnRzXCIpO1xuICAgIGFzc2VydC5kZWVwRXF1YWwoY29tcC5hdHRycygpLCBbJ2lkJywgJ3NlbGVjdGVkJ10sIFwidGhlIG1ldGhvZCByZXR1cm5zIHZhbHVlcyB3aXRob3V0IGFyZ3VtZW50c1wiKTtcbn0pO1xuXG5RVW5pdC50ZXN0KCdhY2Nlc3NvcnMnLCAxMywgZnVuY3Rpb24oYXNzZXJ0KXtcblxuICAgIHZhciBjb21wID0gZndjKCdmb28nKTtcblxuICAgIHZhciBtb2NrID0ge1xuICAgICAgICBnZXRBdHRyaWJ1dGUobmFtZSl7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1tuYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0QXR0cmlidXRlKG5hbWUsIHZhbCl7XG4gICAgICAgICAgICB0aGlzW25hbWVdID0gdmFsO1xuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdGVzdEFjY2Vzc29ycyA9IHtcbiAgICAgICAgZ2V0KCl7XG4gICAgICAgICAgICByZXR1cm4gXCJmb29cIjtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0KG9sZCwgdmFsKXtcbiAgICAgICAgICAgIHJldHVybiB2YWwgKyBcImJhclwiO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzc2VydC5vayh0eXBlb2YgY29tcC5hY2Nlc3MgPT09ICdmdW5jdGlvbicsIFwidGhlIGNvbXBvbmVudCBkZWZpbml0aW9uIGhvbGRzIHRoZSBtZXRob2QgYWNjZXNzXCIpO1xuICAgIGFzc2VydC5lcXVhbChjb21wLmFjY2VzcygndGVzdCcsIHRlc3RBY2Nlc3NvcnMpLCBjb21wLCBcIlRoZSBtZXRob2Qgc2V0IGFuZCBjaGFpbnMgd2l0aCBhcmd1bWVudHNcIik7XG5cbiAgICBhc3NlcnQub2sodHlwZW9mIGNvbXAuYWNjZXNzKCd0ZXN0JykgPT09ICdvYmplY3QnLCBcIlRoZSBtZXRob2QgcmV0dXJucyB0aGUgYWNjZXNzb3JzIHdpdGhvdXQgYXJndW1lbnRzXCIpO1xuICAgIGFzc2VydC5vayh0eXBlb2YgY29tcC5hY2Nlc3MoJ3Rlc3QnKS5nZXQgPT09ICdmdW5jdGlvbicsIFwiVGhlIG1ldGhvZCByZXR1cm5zIHRoZSBhY2Nlc3NvcnMgd2l0aG91dCBhcmd1bWVudHNcIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBjb21wLmFjY2VzcygndGVzdCcpLnNldCA9PT0gJ2Z1bmN0aW9uJywgXCJUaGUgbWV0aG9kIHJldHVybnMgdGhlIGFjY2Vzc29ycyB3aXRob3V0IGFyZ3VtZW50c1wiKTtcblxuICAgIGFzc2VydC5lcXVhbChjb21wLmFjY2VzcygndGVzdCcpLmdldC5jYWxsKG1vY2spLCAnZm9vJywgXCJUaGUgZ2V0dGVyIHJldHVybnMgdGhlIGRlZmluZWQgdmFsdWVcIik7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbXAuYWNjZXNzKCd0ZXN0Jykuc2V0LmNhbGwobW9jaywgJ2ZvbycpLCAnZm9vYmFyJywgXCJUaGUgc2V0dGVyIHJldHVybnMgdGhlIGRlZmluZWQgdmFsdWVcIik7XG5cbiAgICBjb21wLmF0dHJzKCdpZCcpO1xuICAgIGFzc2VydC5vayh0eXBlb2YgY29tcC5hY2Nlc3MoJ2lkJykgPT09ICdvYmplY3QnLCBcIkF0dHJpYnV0ZXMgaGF2ZSBkZWZhdWx0IGFjY2Vzc29yc1wiKTtcbiAgICBhc3NlcnQub2sodHlwZW9mIGNvbXAuYWNjZXNzKCdmb28nKSA9PT0gJ3VuZGVmaW5lZCcsIFwiT25seSBhdHRyaWJ1dGVzIGhhdmUgZGVmYXVsdCBhY2Nlc3NvcnNcIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBjb21wLmFjY2VzcygnaWQnKS5nZXQgPT09ICdmdW5jdGlvbicsIFwiVGhlIG1ldGhvZCByZXR1cm5zIHRoZSBhY2Nlc3NvcnMgd2l0aG91dCBhcmd1bWVudHNcIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBjb21wLmFjY2VzcygnaWQnKS5zZXQgPT09ICdmdW5jdGlvbicsIFwiVGhlIG1ldGhvZCByZXR1cm5zIHRoZSBhY2Nlc3NvcnMgd2l0aG91dCBhcmd1bWVudHNcIik7XG5cbiAgICBhc3NlcnQuZXF1YWwoY29tcC5hY2Nlc3MoJ2lkJykuc2V0LmNhbGwobW9jaywgJ2JlZScpLCAnYmVlJywgXCJUaGUgc2V0dGVyIHJldHVybnMgdGhlIGRlZmluZWQgdmFsdWVcIik7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbXAuYWNjZXNzKCdpZCcpLmdldC5jYWxsKG1vY2spLCAnYmVlJywgXCJUaGUgZ2V0dGVyIHJldHVybnMgdGhlIGRlZmluZWQgdmFsdWVcIik7XG59KTtcblxuUVVuaXQubW9kdWxlKCdNZXRob2RzJyk7XG5cblxuUVVuaXQudGVzdCgnZGVjbGFyYXRpb24nLCA1LCBmdW5jdGlvbihhc3NlcnQpe1xuXG4gICAgdmFyIGNvbXAgPSBmd2MoJ2ZvbycpO1xuXG4gICAgdmFyIGZvbyA9IGZ1bmN0aW9uIGZvbyguLi5wYXJhbXMpe1xuICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgIH07XG5cbiAgICBhc3NlcnQub2sodHlwZW9mIGNvbXAubWV0aG9kID09PSAnZnVuY3Rpb24nLCBcInRoZSBjb21wb25lbnQgZGVmaW5pdGlvbiBob2xkcyB0aGUgbWV0aG9kIG1ldGhvZFwiKTtcblxuICAgIGFzc2VydC5lcXVhbChjb21wLm1ldGhvZCgnZm9vJywgZm9vKSwgY29tcCwgXCJUaGUgbWV0aG9kIHNldCBhbmQgY2hhaW5zIHdpdGggYXJndW1lbnRzXCIpO1xuICAgIGFzc2VydC5vayh0eXBlb2YgY29tcC5tZXRob2QoJ2ZvbycpID09PSAnb2JqZWN0JywgXCJUaGUgbWV0aG9kIHJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIG5hbWUgYXJndW1lbnRzXCIpO1xuICAgIGFzc2VydC5vayh0eXBlb2YgY29tcC5tZXRob2QoJ2ZvbycpLnZhbHVlID09PSAnZnVuY3Rpb24nLCBcIlRoZSBtZXRob2QgcmV0dXJucyB0aGUgZnVuY3Rpb24gd2l0aG91dCBhcmd1bWVudHNcIik7XG4gICAgYXNzZXJ0LmRlZXBFcXVhbChjb21wLm1ldGhvZCgnZm9vJykudmFsdWUuY2FsbChudWxsLCAnYmFyJywgJ2JheicpLCBbJ2JhcicsICdiYXonXSwgXCJUaGUgY29udGVudCBmdW5jdGlvbiByZXR1cm5zIHRoZSBhcmd1bWVudHNcIik7XG59KTtcblxuUVVuaXQubW9kdWxlKCdDb250ZW50Jyk7XG5cblFVbml0LnRlc3QoJ2NhbGxiYWNrJywgNiwgZnVuY3Rpb24oYXNzZXJ0KXtcblxuICAgIHZhciBjb21wID0gZndjKCdmb28nKTtcblxuICAgIGFzc2VydC5vayh0eXBlb2YgY29tcC5jb250ZW50ID09PSAnZnVuY3Rpb24nLCBcInRoZSBjb21wb25lbnQgZGVmaW5pdGlvbiBob2xkcyB0aGUgbWV0aG9kIGNvbnRlbnRcIik7XG5cbiAgICBhc3NlcnQuZXF1YWwoY29tcC5jb250ZW50KCd0ZXN0JyksIGNvbXAsIFwiVGhlIG1ldGhvZCBzZXQgYW5kIGNoYWlucyB3aXRoIGFyZ3VtZW50c1wiKTtcbiAgICBhc3NlcnQub2sodHlwZW9mIGNvbXAuY29udGVudCgpID09PSAnZnVuY3Rpb24nLCBcIlRoZSBtZXRob2QgcmV0dXJucyB0aGUgZnVuY3Rpb24gd2l0aG91dCBhcmd1bWVudHNcIik7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbXAuY29udGVudCgpLmNhbGwoKSwgJ3Rlc3QnLCBcIlRoZSBjb250ZW50IGZ1bmN0aW9uIHJldHVybnMgdGhlIHN0cmluZyBzZXRcIik7XG5cbiAgICBjb21wLmNvbnRlbnQoZnVuY3Rpb24gdGVtcGxhdGUoZGF0YSl7XG4gICAgICAgIHJldHVybiBgPHA+JHtkYXRhLmZvb308L3A+YDtcbiAgICB9KTtcbiAgICB2YXIgY29udGVudCA9IGNvbXAuY29udGVudCgpO1xuICAgIGFzc2VydC5vayh0eXBlb2YgY29udGVudCA9PT0gJ2Z1bmN0aW9uJywgXCJUaGUgbWV0aG9kIHJldHVybiB0aGUgc2V0IGZ1bmN0aW9uIHdpdGhvdXQgYXJndW1lbnRzXCIpO1xuICAgIGFzc2VydC5lcXVhbChjb250ZW50KHsgZm9vOiAnYmFyJ30pLCAnPHA+YmFyPC9wPicsIFwiVGhlIGZ1bmN0aW9uIHJlcGxhY2UgdGhlIGNvbnRlbnQgZGF0YVwiKTtcbn0pO1xuXG5cblFVbml0LnRlc3QoJ2hhbmRsZWJhciB0ZW1wbGF0ZScsIDIsIGZ1bmN0aW9uKGFzc2VydCl7XG5cbiAgICB2YXIgY29tcCA9IGZ3YygnZm9vJyk7XG5cbiAgICAvL3RlbXBsYXRlIGlzIGhhbmRsZWQgZXh0ZXJuYWxseSwgYnkgYnJvd3NlcmlmeVxuICAgIGNvbXAuY29udGVudChyZXF1aXJlKCcuL3Rlc3QudHBsJykpO1xuXG4gICAgdmFyIGNvbnRlbnQgPSBjb21wLmNvbnRlbnQoKTtcblxuICAgIGFzc2VydC5vayh0eXBlb2YgY29udGVudCA9PT0gJ2Z1bmN0aW9uJywgXCJUaGUgbWV0aG9kIHJldHVybiB0aGUgc2V0IGZ1bmN0aW9uIHdpdGhvdXQgYXJndW1lbnRzXCIpO1xuICAgIGFzc2VydC5lcXVhbChjb250ZW50KHsgZm9vOiAnYmFyJ30pLnRyaW0oKSwgJzxzcGFuPmJhcjwvc3Bhbj4nLCBcIlRoZSBmdW5jdGlvbiByZXBsYWNlIHRoZSBjb250ZW50IGRhdGFcIik7XG59KTtcblxuUVVuaXQubW9kdWxlKCdFeHRlbmQnKTtcblxuXG5RVW5pdC50ZXN0KCdlbGVtZW50IG5hbWUnLCA0LCBmdW5jdGlvbihhc3NlcnQpIHtcblxuICAgIGFzc2VydC50aHJvd3MoZnVuY3Rpb24oKXtcbiAgICAgICAgZndjKCdmb28nKS5leHRlbmQoMTIpO1xuICAgIH0sIFR5cGVFcnJvciwgJ1RoZSBlbGVtZW50IG5hbWUgaXMgbm90IHZhbGlkJyk7XG5cbiAgICBhc3NlcnQudGhyb3dzKGZ1bmN0aW9uKCl7XG4gICAgICAgIGZ3YygnZm9vJykuZXh0ZW5kKCd0LScpO1xuICAgIH0sIFR5cGVFcnJvciwgJ1RoZSBlbGVtZW50IG5hbWUgaXMgbm90IHZhbGlkJyk7XG5cbiAgICBhc3NlcnQudGhyb3dzKGZ1bmN0aW9uKCl7XG4gICAgICAgIGZ3YygnZm9vJykuZXh0ZW5kKCd0LicpO1xuICAgIH0sIFR5cGVFcnJvciwgJ1RoZSBlbGVtZW50IG5hbWUgaXMgbm90IHZhbGlkJyk7XG5cbiAgICBhc3NlcnQudGhyb3dzKGZ1bmN0aW9uKCl7XG4gICAgICAgIGZ3YygnZm9vJykuZXh0ZW5kKCdfMTInKTtcbiAgICB9LCBUeXBlRXJyb3IsICdUaGUgZWxlbWVudCBuYW1lIGlzIG5vdCB2YWxpZCcpO1xuXG4gICAgZndjKCdmb28nKS5leHRlbmQoJ2JhcicpO1xufSk7XG5cblFVbml0LnRlc3QoJ2FwaScsIDUsIGZ1bmN0aW9uKGFzc2VydCl7XG5cbiAgICB2YXIgY29tcCA9IGZ3YygnZm9vJyk7XG5cbiAgICBhc3NlcnQub2sodHlwZW9mIGNvbXAuZXh0ZW5kID09PSAnZnVuY3Rpb24nLCBcInRoZSBjb21wb25lbnQgZGVmaW5pdGlvbiBob2xkcyB0aGUgbWV0aG9kIGV4dGVuZFwiKTtcblxuICAgIGFzc2VydC5lcXVhbChjb21wLmV4dGVuZCgnYScpLCBjb21wLCBcIlRoZSBtZXRob2Qgc2V0IGFuZCBjaGFpbnMgd2l0aCBhcmd1bWVudHNcIik7XG5cbiAgICB2YXIgYmFzZVByb3RvID0gY29tcC5leHRlbmQoKTtcbiAgICBhc3NlcnQub2sodHlwZW9mIGJhc2VQcm90byA9PT0gJ29iamVjdCcsIFwiVGhlIG1ldGhvZCByZXR1cm5zIGFuIG9iamVjdCB3aXRob3V0IGFyZ3VtZW50c1wiKTtcbiAgICBhc3NlcnQub2soT2JqZWN0LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJhc2VQcm90byksIFwiVGhlIG1ldGhvZCByZXR1cm5zIGFuIHByb3RvdHlwZVwiKTtcbiAgICBhc3NlcnQub2soSFRNTEVsZW1lbnQucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYmFzZVByb3RvKSwgXCJUaGUgbWV0aG9kIHJldHVybnMgYW4gSFRNTEVsZW1lbnQgcHJvdG90eXBlXCIpO1xufSk7XG5cblxuUVVuaXQudGVzdCgnZXh0ZW5kIGFuIGh0bWwgZWxlbWVudCcsIDIsIGZ1bmN0aW9uKGFzc2VydCl7XG5cbiAgICB2YXIgY29tcCA9IGZ3YygnZm9vJyk7XG5cbiAgICBjb21wLmV4dGVuZCgnYScpO1xuXG4gICAgdmFyIGJhc2VQcm90byA9IGNvbXAuZXh0ZW5kKCk7XG4gICAgYXNzZXJ0Lm9rKEhUTUxFbGVtZW50LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJhc2VQcm90byksIFwiRXh0ZW5kaW5nIHRoZSBhIHRhZyBzZXQgdGhlIGJhc2UgcHJvdG90eXBlIHRvIEhUTUxFbGVtZW50XCIpO1xuICAgIGFzc2VydC5vayhPYmplY3QuaXMoYmFzZVByb3RvLCBIVE1MQW5jaG9yRWxlbWVudC5wcm90b3R5cGUpLCBcIkV4dGVuZGluZyB0aGUgYSB0YWcgc2V0IHRoZSBiYXNlIHByb3RvdHlwZSB0byBIVE1MQW5jaG9yRWxlbWVudFwiKTtcbn0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnNDb21waWxlciA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFyc0NvbXBpbGVyLnRlbXBsYXRlKHtcImNvbXBpbGVyXCI6WzYsXCI+PSAyLjAuMC1iZXRhLjFcIl0sXCJtYWluXCI6ZnVuY3Rpb24oZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBoZWxwZXI7XG5cbiAgcmV0dXJuIFwiPHNwYW4+XCJcbiAgICArIHRoaXMuZXNjYXBlRXhwcmVzc2lvbigoKGhlbHBlciA9IChoZWxwZXIgPSBoZWxwZXJzLmZvbyB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZm9vIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGhlbHBlcnMuaGVscGVyTWlzc2luZyksKHR5cGVvZiBoZWxwZXIgPT09IFwiZnVuY3Rpb25cIiA/IGhlbHBlci5jYWxsKGRlcHRoMCx7XCJuYW1lXCI6XCJmb29cIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiPC9zcGFuPlxcblwiO1xufSxcInVzZURhdGFcIjp0cnVlfSk7XG4iXX0=
