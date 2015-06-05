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
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    var helper;

  return "<h1>Hello "
    + this.escapeExpression(((helper = (helper = helpers.who || (depth0 != null ? depth0.who : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"who","hash":{},"data":data}) : helper)))
    + "</h1>\n";
},"useData":true});

},{"hbsfy/runtime":9}],11:[function(require,module,exports){
'use strict';

var fwc = require('fwc');

QUnit.module('Register');

QUnit.asyncTest('register and access a component', 4, function (assert) {
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('base').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fBase = container.querySelector('f-base');
        assert.equal(fBase.nodeName, 'F-BASE', 'The f-base component is found');
        assert.equal(fBase.nodeName, elt.nodeName, 'The f-base component is given in parameter');
        assert.deepEqual(fBase, elt, 'The callback elt is the given node');

        QUnit.start();
    }).register();
});

QUnit.asyncTest('register with another namespace', 4, function (assert) {
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('bar', { namespace: 'foo' }).on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fooBar = container.querySelector('foo-bar');
        assert.equal(fooBar.nodeName, 'FOO-BAR', 'The foo-bar component is found');
        assert.equal(fooBar.nodeName, elt.nodeName, 'The foo-bar component is given in parameter');
        assert.deepEqual(fooBar, elt, 'The callback elt is the given node');

        QUnit.start();
    }).register();
});

QUnit.asyncTest('register and multiple component', 7, function (assert) {
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    var sum = 0;

    fwc('multi').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        assert.equal(elt.nodeName, 'F-MULTI', 'The element is a multi');
        var value = parseInt(elt.getAttribute('value'), 10);
        assert.ok(value > 0, 'The  value has an int');
        sum += value;

        if (sum === 7) {

            QUnit.start();
        }
    }).register();
});

QUnit.module('Attributes');

QUnit.asyncTest('define basic attributes', 8, function (assert) {
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('attr').on('error', function (e) {
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

        QUnit.start();
    }).attrs('foo', 'bar').register();
});

QUnit.asyncTest('define attributes with type casting', 16, function (assert) {
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('cast').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fCast = container.querySelector('f-cast');
        assert.deepEqual(fCast, elt, 'The callback elt is the given node');

        assert.equal(fCast.getAttribute('int'), '134.12', 'The attribute exists');
        assert.equal(fCast.int, 134, 'The getter gives you the parsed value');
        fCast.int = '5.77';
        assert.equal(fCast.getAttribute('int'), '5', 'The value is updated once parsed');
        assert.equal(fCast.int, 5, 'The getter gives you the parsed value');

        assert.equal(fCast.getAttribute('float'), 1.23, 'The attribute exists');
        assert.equal(fCast.float, 1.23, 'The getter gives you the parsed value');
        fCast.float = '00.77';
        assert.equal(fCast.getAttribute('float'), '0.77', 'The value is updated once parsed');
        assert.equal(fCast.float, 0.77, 'The getter gives you the parsed value');

        assert.ok(fCast.hasAttribute('bool'), 'The attribute exists');
        assert.equal(fCast.bool, true, 'The attribute has the parsed value');
        fCast.bool = false;
        assert.ok(!fCast.hasAttribute('bool'), 'The attribute doesn\'t exists anymore');
        assert.equal(fCast.bool, false, 'The attribute has the false value');
        fCast.bool = true;
        assert.ok(fCast.hasAttribute('bool'), 'The attribute is again there');
        assert.equal(fCast.bool, true, 'The attribute has the true value');

        QUnit.start();
    }).attr('int', { type: 'integer' }).attr('float', { type: 'float' }).attr('bool', { type: 'boolean' }).register();
});

QUnit.asyncTest('define attributes with accessors', 11, function (assert) {
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('access').on('error', function (e) {
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

        QUnit.start();
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

QUnit.module('Methods');

QUnit.asyncTest('Component with a method', 7, function (assert) {
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    var mTarget = container.querySelector('.mtarget');
    assert.ok(mTarget.style.display !== 'none', 'The mtarget content is displayed');

    fwc('method').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fMethod = container.querySelector('f-method');
        assert.deepEqual(fMethod, elt, 'The callback elt is the given node');

        assert.ok(typeof fMethod.hide === 'function', 'The element has the defined method');

        fMethod.hide();

        assert.equal(mTarget.style.display, 'none', 'The mtarget content isn\'t displayed anymore');

        QUnit.start();
    }).method('hide', function () {

        var fMethod = container.querySelector('f-method');
        assert.deepEqual(fMethod, this, 'This is the given node');

        assert.equal(this.target, '.mtarget', 'The attribute value is correct');

        document.querySelector(this.target).style.display = 'none';
    }).attrs('target').register();
});

QUnit.module('Content');

QUnit.asyncTest('Component with content from a callback', 11, function (assert) {
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

    fwc('content').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fContent = container.querySelector('f-content');
        assert.deepEqual(fContent, elt, 'The callback elt is the given node');
        assert.equal(fContent.repeat, '2', 'The repeat value is 2');
        assert.equal(fContent.foo, 'moo', 'The foo value is moo');
        assert.equal(elt.querySelectorAll('ul').length, 1, 'The component contains now a list');
        assert.equal(elt.querySelectorAll('li').length, 2, 'The component contains now 2 list items');
        assert.equal(elt.querySelector('li:first-child').textContent, 'moo', 'The list items have the foo value');

        QUnit.start();
    }).attrs('foo', 'repeat').content(componentContent).register();
});

QUnit.asyncTest('Component with dynamic content from a template', 8, function (assert) {
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    var helloTpl = require('./hello.tpl');
    assert.ok(typeof helloTpl === 'function', 'The template function exists');

    assert.equal(container.querySelectorAll('f-dyncontent h1').length, 0, 'The component does not contain an h1');

    fwc('dyncontent').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var fDynContent = container.querySelector('f-dyncontent');
        assert.deepEqual(fDynContent, elt, 'The callback elt is the given node');

        assert.equal(fDynContent.who, 'world', 'The attribute who has the world value');
        assert.equal(container.querySelectorAll('f-dyncontent h1').length, 1, 'The component contains an h1');

        assert.equal(fDynContent.textContent.trim(), 'Hello world', 'The element has the content from the who attribute');

        fDynContent.who = 'Bertrand';
        setTimeout(function () {
            assert.equal(fDynContent.textContent.trim(), 'Hello Bertrand', 'The element has the updated content');
            QUnit.start();
        }, 0);
    }).attr('who', { update: true }).content(helloTpl).register();
});

QUnit.module('extend');

QUnit.asyncTest('Extend an anchor', 5, function (assert) {
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    var link = document.querySelector('a.link');

    fwc('link').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {

        var flink = document.querySelector('.flink');

        assert.ok(flink instanceof HTMLElement, 'The component is an HTMLElement');
        assert.ok(flink instanceof HTMLAnchorElement, 'The component is an HTMLAnchorElement');

        assert.ok(link.href !== '#', 'Anchor\'s href use getter/setter to change the value');
        assert.equal(flink.href, link.href, 'The extended component uses base component getter/setter');

        QUnit.start();
    }).extend('a').register();
});

QUnit.asyncTest('Extend another component', 3, function (assert) {
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('upper').on('error', function (e) {
        console.error(e);
    }).on('create', function (elt) {
        assert.ok(false, 'the parent element should not be created');
    }).access('bar', {
        get: function get(val) {
            val = val || '';
            return val.toUpperCase();
        }
    }).register();

    fwc('superup').on('create', function (elt) {

        var fsuperup = document.querySelector('.superup');

        assert.deepEqual(fsuperup, elt, 'The callback elt is the given node');
        assert.equal(elt.bar, 'BAR', 'Super element prototype has been extended');

        QUnit.start();
    }).extend('upper').register();
});

QUnit.module('Native events');

QUnit.test('on click', 3, function (assert) {
    var done = assert.async();
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('native').on('error', function (e) {
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

},{"./hello.tpl":10,"fwc":"fwc"}]},{},[11])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzLnJ1bnRpbWUuanMiLCJub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL2Jhc2UuanMiLCJub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL2V4Y2VwdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMvbm8tY29uZmxpY3QuanMiLCJub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3J1bnRpbWUuanMiLCJub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3NhZmUtc3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL3J1bnRpbWUuanMiLCJub2RlX21vZHVsZXMvaGJzZnkvcnVudGltZS5qcyIsInRlc3QvZndjL2ludGVncmF0aW9uL2hlbGxvLnRwbCIsIi9ob21lL2JlcnRyYW5kL2Rldi9wcm9qZWN0cy9mdXR1cmUuanMvdGVzdC9md2MvaW50ZWdyYXRpb24vdGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FB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VUFBVSxFQUFFLENBQUMsRUFBRSxVQUFTLE1BQU0sRUFBQztBQUN0QyxRQUFJLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDMUIsUUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQzdELFVBQU0sQ0FBQyxFQUFFLENBQUMsU0FBUyxZQUFZLFdBQVcsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDOztBQUVwRSxPQUFHLENBQUMsUUFBUSxDQUFDLENBQ1IsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFTLENBQUMsRUFBQztBQUNwQixlQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3BCLENBQUMsQ0FDRCxFQUFFLENBQUMsUUFBUSxFQUFFLFVBQVMsR0FBRyxFQUFDOztBQUV2QixZQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ2pELGNBQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDOztBQUVyRSxlQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7S0FDbkIsQ0FBQyxDQUNELEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBUyxHQUFHLEVBQUM7O0FBRXRCLFlBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDakQsY0FBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLG9DQUFvQyxDQUFDLENBQUM7O0FBRXJFLFlBQUksRUFBRSxDQUFDO0tBQ1YsQ0FBQyxDQUNELFFBQVEsRUFBRSxDQUFDO0NBQ25CLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCA9IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9pbXBvcnQgPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvYmFzZScpO1xuXG52YXIgYmFzZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9pbXBvcnQpO1xuXG4vLyBFYWNoIG9mIHRoZXNlIGF1Z21lbnQgdGhlIEhhbmRsZWJhcnMgb2JqZWN0LiBObyBuZWVkIHRvIHNldHVwIGhlcmUuXG4vLyAoVGhpcyBpcyBkb25lIHRvIGVhc2lseSBzaGFyZSBjb2RlIGJldHdlZW4gY29tbW9uanMgYW5kIGJyb3dzZSBlbnZzKVxuXG52YXIgX1NhZmVTdHJpbmcgPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvc2FmZS1zdHJpbmcnKTtcblxudmFyIF9TYWZlU3RyaW5nMiA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9TYWZlU3RyaW5nKTtcblxudmFyIF9FeGNlcHRpb24gPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvZXhjZXB0aW9uJyk7XG5cbnZhciBfRXhjZXB0aW9uMiA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9FeGNlcHRpb24pO1xuXG52YXIgX2ltcG9ydDIgPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvdXRpbHMnKTtcblxudmFyIFV0aWxzID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2ltcG9ydDIpO1xuXG52YXIgX2ltcG9ydDMgPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvcnVudGltZScpO1xuXG52YXIgcnVudGltZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9pbXBvcnQzKTtcblxudmFyIF9ub0NvbmZsaWN0ID0gcmVxdWlyZSgnLi9oYW5kbGViYXJzL25vLWNvbmZsaWN0Jyk7XG5cbnZhciBfbm9Db25mbGljdDIgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfbm9Db25mbGljdCk7XG5cbi8vIEZvciBjb21wYXRpYmlsaXR5IGFuZCB1c2FnZSBvdXRzaWRlIG9mIG1vZHVsZSBzeXN0ZW1zLCBtYWtlIHRoZSBIYW5kbGViYXJzIG9iamVjdCBhIG5hbWVzcGFjZVxuZnVuY3Rpb24gY3JlYXRlKCkge1xuICB2YXIgaGIgPSBuZXcgYmFzZS5IYW5kbGViYXJzRW52aXJvbm1lbnQoKTtcblxuICBVdGlscy5leHRlbmQoaGIsIGJhc2UpO1xuICBoYi5TYWZlU3RyaW5nID0gX1NhZmVTdHJpbmcyWydkZWZhdWx0J107XG4gIGhiLkV4Y2VwdGlvbiA9IF9FeGNlcHRpb24yWydkZWZhdWx0J107XG4gIGhiLlV0aWxzID0gVXRpbHM7XG4gIGhiLmVzY2FwZUV4cHJlc3Npb24gPSBVdGlscy5lc2NhcGVFeHByZXNzaW9uO1xuXG4gIGhiLlZNID0gcnVudGltZTtcbiAgaGIudGVtcGxhdGUgPSBmdW5jdGlvbiAoc3BlYykge1xuICAgIHJldHVybiBydW50aW1lLnRlbXBsYXRlKHNwZWMsIGhiKTtcbiAgfTtcblxuICByZXR1cm4gaGI7XG59XG5cbnZhciBpbnN0ID0gY3JlYXRlKCk7XG5pbnN0LmNyZWF0ZSA9IGNyZWF0ZTtcblxuX25vQ29uZmxpY3QyWydkZWZhdWx0J10oaW5zdCk7XG5cbmluc3RbJ2RlZmF1bHQnXSA9IGluc3Q7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGluc3Q7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCA9IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHMuSGFuZGxlYmFyc0Vudmlyb25tZW50ID0gSGFuZGxlYmFyc0Vudmlyb25tZW50O1xuZXhwb3J0cy5jcmVhdGVGcmFtZSA9IGNyZWF0ZUZyYW1lO1xuXG52YXIgX2ltcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxudmFyIFV0aWxzID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2ltcG9ydCk7XG5cbnZhciBfRXhjZXB0aW9uID0gcmVxdWlyZSgnLi9leGNlcHRpb24nKTtcblxudmFyIF9FeGNlcHRpb24yID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX0V4Y2VwdGlvbik7XG5cbnZhciBWRVJTSU9OID0gJzMuMC4xJztcbmV4cG9ydHMuVkVSU0lPTiA9IFZFUlNJT047XG52YXIgQ09NUElMRVJfUkVWSVNJT04gPSA2O1xuXG5leHBvcnRzLkNPTVBJTEVSX1JFVklTSU9OID0gQ09NUElMRVJfUkVWSVNJT047XG52YXIgUkVWSVNJT05fQ0hBTkdFUyA9IHtcbiAgMTogJzw9IDEuMC5yYy4yJywgLy8gMS4wLnJjLjIgaXMgYWN0dWFsbHkgcmV2MiBidXQgZG9lc24ndCByZXBvcnQgaXRcbiAgMjogJz09IDEuMC4wLXJjLjMnLFxuICAzOiAnPT0gMS4wLjAtcmMuNCcsXG4gIDQ6ICc9PSAxLngueCcsXG4gIDU6ICc9PSAyLjAuMC1hbHBoYS54JyxcbiAgNjogJz49IDIuMC4wLWJldGEuMSdcbn07XG5cbmV4cG9ydHMuUkVWSVNJT05fQ0hBTkdFUyA9IFJFVklTSU9OX0NIQU5HRVM7XG52YXIgaXNBcnJheSA9IFV0aWxzLmlzQXJyYXksXG4gICAgaXNGdW5jdGlvbiA9IFV0aWxzLmlzRnVuY3Rpb24sXG4gICAgdG9TdHJpbmcgPSBVdGlscy50b1N0cmluZyxcbiAgICBvYmplY3RUeXBlID0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cbmZ1bmN0aW9uIEhhbmRsZWJhcnNFbnZpcm9ubWVudChoZWxwZXJzLCBwYXJ0aWFscykge1xuICB0aGlzLmhlbHBlcnMgPSBoZWxwZXJzIHx8IHt9O1xuICB0aGlzLnBhcnRpYWxzID0gcGFydGlhbHMgfHwge307XG5cbiAgcmVnaXN0ZXJEZWZhdWx0SGVscGVycyh0aGlzKTtcbn1cblxuSGFuZGxlYmFyc0Vudmlyb25tZW50LnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IEhhbmRsZWJhcnNFbnZpcm9ubWVudCxcblxuICBsb2dnZXI6IGxvZ2dlcixcbiAgbG9nOiBsb2csXG5cbiAgcmVnaXN0ZXJIZWxwZXI6IGZ1bmN0aW9uIHJlZ2lzdGVySGVscGVyKG5hbWUsIGZuKSB7XG4gICAgaWYgKHRvU3RyaW5nLmNhbGwobmFtZSkgPT09IG9iamVjdFR5cGUpIHtcbiAgICAgIGlmIChmbikge1xuICAgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnQXJnIG5vdCBzdXBwb3J0ZWQgd2l0aCBtdWx0aXBsZSBoZWxwZXJzJyk7XG4gICAgICB9XG4gICAgICBVdGlscy5leHRlbmQodGhpcy5oZWxwZXJzLCBuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5oZWxwZXJzW25hbWVdID0gZm47XG4gICAgfVxuICB9LFxuICB1bnJlZ2lzdGVySGVscGVyOiBmdW5jdGlvbiB1bnJlZ2lzdGVySGVscGVyKG5hbWUpIHtcbiAgICBkZWxldGUgdGhpcy5oZWxwZXJzW25hbWVdO1xuICB9LFxuXG4gIHJlZ2lzdGVyUGFydGlhbDogZnVuY3Rpb24gcmVnaXN0ZXJQYXJ0aWFsKG5hbWUsIHBhcnRpYWwpIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgVXRpbHMuZXh0ZW5kKHRoaXMucGFydGlhbHMsIG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodHlwZW9mIHBhcnRpYWwgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdBdHRlbXB0aW5nIHRvIHJlZ2lzdGVyIGEgcGFydGlhbCBhcyB1bmRlZmluZWQnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucGFydGlhbHNbbmFtZV0gPSBwYXJ0aWFsO1xuICAgIH1cbiAgfSxcbiAgdW5yZWdpc3RlclBhcnRpYWw6IGZ1bmN0aW9uIHVucmVnaXN0ZXJQYXJ0aWFsKG5hbWUpIHtcbiAgICBkZWxldGUgdGhpcy5wYXJ0aWFsc1tuYW1lXTtcbiAgfVxufTtcblxuZnVuY3Rpb24gcmVnaXN0ZXJEZWZhdWx0SGVscGVycyhpbnN0YW5jZSkge1xuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignaGVscGVyTWlzc2luZycsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgLy8gQSBtaXNzaW5nIGZpZWxkIGluIGEge3tmb299fSBjb25zdHVjdC5cbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNvbWVvbmUgaXMgYWN0dWFsbHkgdHJ5aW5nIHRvIGNhbGwgc29tZXRoaW5nLCBibG93IHVwLlxuICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ01pc3NpbmcgaGVscGVyOiBcIicgKyBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdLm5hbWUgKyAnXCInKTtcbiAgICB9XG4gIH0pO1xuXG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdibG9ja0hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbiAoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBpbnZlcnNlID0gb3B0aW9ucy5pbnZlcnNlLFxuICAgICAgICBmbiA9IG9wdGlvbnMuZm47XG5cbiAgICBpZiAoY29udGV4dCA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGZuKHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoY29udGV4dCA9PT0gZmFsc2UgfHwgY29udGV4dCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gaW52ZXJzZSh0aGlzKTtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkoY29udGV4dCkpIHtcbiAgICAgIGlmIChjb250ZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaWRzKSB7XG4gICAgICAgICAgb3B0aW9ucy5pZHMgPSBbb3B0aW9ucy5uYW1lXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbnN0YW5jZS5oZWxwZXJzLmVhY2goY29udGV4dCwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW52ZXJzZSh0aGlzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmlkcykge1xuICAgICAgICB2YXIgZGF0YSA9IGNyZWF0ZUZyYW1lKG9wdGlvbnMuZGF0YSk7XG4gICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBVdGlscy5hcHBlbmRDb250ZXh0UGF0aChvcHRpb25zLmRhdGEuY29udGV4dFBhdGgsIG9wdGlvbnMubmFtZSk7XG4gICAgICAgIG9wdGlvbnMgPSB7IGRhdGE6IGRhdGEgfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZuKGNvbnRleHQsIG9wdGlvbnMpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2VhY2gnLCBmdW5jdGlvbiAoY29udGV4dCwgb3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ011c3QgcGFzcyBpdGVyYXRvciB0byAjZWFjaCcpO1xuICAgIH1cblxuICAgIHZhciBmbiA9IG9wdGlvbnMuZm4sXG4gICAgICAgIGludmVyc2UgPSBvcHRpb25zLmludmVyc2UsXG4gICAgICAgIGkgPSAwLFxuICAgICAgICByZXQgPSAnJyxcbiAgICAgICAgZGF0YSA9IHVuZGVmaW5lZCxcbiAgICAgICAgY29udGV4dFBhdGggPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAob3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuaWRzKSB7XG4gICAgICBjb250ZXh0UGF0aCA9IFV0aWxzLmFwcGVuZENvbnRleHRQYXRoKG9wdGlvbnMuZGF0YS5jb250ZXh0UGF0aCwgb3B0aW9ucy5pZHNbMF0pICsgJy4nO1xuICAgIH1cblxuICAgIGlmIChpc0Z1bmN0aW9uKGNvbnRleHQpKSB7XG4gICAgICBjb250ZXh0ID0gY29udGV4dC5jYWxsKHRoaXMpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmRhdGEpIHtcbiAgICAgIGRhdGEgPSBjcmVhdGVGcmFtZShvcHRpb25zLmRhdGEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4ZWNJdGVyYXRpb24oZmllbGQsIGluZGV4LCBsYXN0KSB7XG4gICAgICBpZiAoZGF0YSkge1xuICAgICAgICBkYXRhLmtleSA9IGZpZWxkO1xuICAgICAgICBkYXRhLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIGRhdGEuZmlyc3QgPSBpbmRleCA9PT0gMDtcbiAgICAgICAgZGF0YS5sYXN0ID0gISFsYXN0O1xuXG4gICAgICAgIGlmIChjb250ZXh0UGF0aCkge1xuICAgICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBjb250ZXh0UGF0aCArIGZpZWxkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldCA9IHJldCArIGZuKGNvbnRleHRbZmllbGRdLCB7XG4gICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIGJsb2NrUGFyYW1zOiBVdGlscy5ibG9ja1BhcmFtcyhbY29udGV4dFtmaWVsZF0sIGZpZWxkXSwgW2NvbnRleHRQYXRoICsgZmllbGQsIG51bGxdKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRleHQgJiYgdHlwZW9mIGNvbnRleHQgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZiAoaXNBcnJheShjb250ZXh0KSkge1xuICAgICAgICBmb3IgKHZhciBqID0gY29udGV4dC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICBleGVjSXRlcmF0aW9uKGksIGksIGkgPT09IGNvbnRleHQubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBwcmlvcktleSA9IHVuZGVmaW5lZDtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gY29udGV4dCkge1xuICAgICAgICAgIGlmIChjb250ZXh0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIC8vIFdlJ3JlIHJ1bm5pbmcgdGhlIGl0ZXJhdGlvbnMgb25lIHN0ZXAgb3V0IG9mIHN5bmMgc28gd2UgY2FuIGRldGVjdFxuICAgICAgICAgICAgLy8gdGhlIGxhc3QgaXRlcmF0aW9uIHdpdGhvdXQgaGF2ZSB0byBzY2FuIHRoZSBvYmplY3QgdHdpY2UgYW5kIGNyZWF0ZVxuICAgICAgICAgICAgLy8gYW4gaXRlcm1lZGlhdGUga2V5cyBhcnJheS5cbiAgICAgICAgICAgIGlmIChwcmlvcktleSkge1xuICAgICAgICAgICAgICBleGVjSXRlcmF0aW9uKHByaW9yS2V5LCBpIC0gMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmlvcktleSA9IGtleTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByaW9yS2V5KSB7XG4gICAgICAgICAgZXhlY0l0ZXJhdGlvbihwcmlvcktleSwgaSAtIDEsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGkgPT09IDApIHtcbiAgICAgIHJldCA9IGludmVyc2UodGhpcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2lmJywgZnVuY3Rpb24gKGNvbmRpdGlvbmFsLCBvcHRpb25zKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24oY29uZGl0aW9uYWwpKSB7XG4gICAgICBjb25kaXRpb25hbCA9IGNvbmRpdGlvbmFsLmNhbGwodGhpcyk7XG4gICAgfVxuXG4gICAgLy8gRGVmYXVsdCBiZWhhdmlvciBpcyB0byByZW5kZXIgdGhlIHBvc2l0aXZlIHBhdGggaWYgdGhlIHZhbHVlIGlzIHRydXRoeSBhbmQgbm90IGVtcHR5LlxuICAgIC8vIFRoZSBgaW5jbHVkZVplcm9gIG9wdGlvbiBtYXkgYmUgc2V0IHRvIHRyZWF0IHRoZSBjb25kdGlvbmFsIGFzIHB1cmVseSBub3QgZW1wdHkgYmFzZWQgb24gdGhlXG4gICAgLy8gYmVoYXZpb3Igb2YgaXNFbXB0eS4gRWZmZWN0aXZlbHkgdGhpcyBkZXRlcm1pbmVzIGlmIDAgaXMgaGFuZGxlZCBieSB0aGUgcG9zaXRpdmUgcGF0aCBvciBuZWdhdGl2ZS5cbiAgICBpZiAoIW9wdGlvbnMuaGFzaC5pbmNsdWRlWmVybyAmJiAhY29uZGl0aW9uYWwgfHwgVXRpbHMuaXNFbXB0eShjb25kaXRpb25hbCkpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmZuKHRoaXMpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ3VubGVzcycsIGZ1bmN0aW9uIChjb25kaXRpb25hbCwgb3B0aW9ucykge1xuICAgIHJldHVybiBpbnN0YW5jZS5oZWxwZXJzWydpZiddLmNhbGwodGhpcywgY29uZGl0aW9uYWwsIHsgZm46IG9wdGlvbnMuaW52ZXJzZSwgaW52ZXJzZTogb3B0aW9ucy5mbiwgaGFzaDogb3B0aW9ucy5oYXNoIH0pO1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignd2l0aCcsIGZ1bmN0aW9uIChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24oY29udGV4dCkpIHtcbiAgICAgIGNvbnRleHQgPSBjb250ZXh0LmNhbGwodGhpcyk7XG4gICAgfVxuXG4gICAgdmFyIGZuID0gb3B0aW9ucy5mbjtcblxuICAgIGlmICghVXRpbHMuaXNFbXB0eShjb250ZXh0KSkge1xuICAgICAgaWYgKG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmlkcykge1xuICAgICAgICB2YXIgZGF0YSA9IGNyZWF0ZUZyYW1lKG9wdGlvbnMuZGF0YSk7XG4gICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBVdGlscy5hcHBlbmRDb250ZXh0UGF0aChvcHRpb25zLmRhdGEuY29udGV4dFBhdGgsIG9wdGlvbnMuaWRzWzBdKTtcbiAgICAgICAgb3B0aW9ucyA9IHsgZGF0YTogZGF0YSB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZm4oY29udGV4dCwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG4gICAgfVxuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignbG9nJywgZnVuY3Rpb24gKG1lc3NhZ2UsIG9wdGlvbnMpIHtcbiAgICB2YXIgbGV2ZWwgPSBvcHRpb25zLmRhdGEgJiYgb3B0aW9ucy5kYXRhLmxldmVsICE9IG51bGwgPyBwYXJzZUludChvcHRpb25zLmRhdGEubGV2ZWwsIDEwKSA6IDE7XG4gICAgaW5zdGFuY2UubG9nKGxldmVsLCBtZXNzYWdlKTtcbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2xvb2t1cCcsIGZ1bmN0aW9uIChvYmosIGZpZWxkKSB7XG4gICAgcmV0dXJuIG9iaiAmJiBvYmpbZmllbGRdO1xuICB9KTtcbn1cblxudmFyIGxvZ2dlciA9IHtcbiAgbWV0aG9kTWFwOiB7IDA6ICdkZWJ1ZycsIDE6ICdpbmZvJywgMjogJ3dhcm4nLCAzOiAnZXJyb3InIH0sXG5cbiAgLy8gU3RhdGUgZW51bVxuICBERUJVRzogMCxcbiAgSU5GTzogMSxcbiAgV0FSTjogMixcbiAgRVJST1I6IDMsXG4gIGxldmVsOiAxLFxuXG4gIC8vIENhbiBiZSBvdmVycmlkZGVuIGluIHRoZSBob3N0IGVudmlyb25tZW50XG4gIGxvZzogZnVuY3Rpb24gbG9nKGxldmVsLCBtZXNzYWdlKSB7XG4gICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiBsb2dnZXIubGV2ZWwgPD0gbGV2ZWwpIHtcbiAgICAgIHZhciBtZXRob2QgPSBsb2dnZXIubWV0aG9kTWFwW2xldmVsXTtcbiAgICAgIChjb25zb2xlW21ldGhvZF0gfHwgY29uc29sZS5sb2cpLmNhbGwoY29uc29sZSwgbWVzc2FnZSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0cy5sb2dnZXIgPSBsb2dnZXI7XG52YXIgbG9nID0gbG9nZ2VyLmxvZztcblxuZXhwb3J0cy5sb2cgPSBsb2c7XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyYW1lKG9iamVjdCkge1xuICB2YXIgZnJhbWUgPSBVdGlscy5leHRlbmQoe30sIG9iamVjdCk7XG4gIGZyYW1lLl9wYXJlbnQgPSBvYmplY3Q7XG4gIHJldHVybiBmcmFtZTtcbn1cblxuLyogW2FyZ3MsIF1vcHRpb25zICovIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgZXJyb3JQcm9wcyA9IFsnZGVzY3JpcHRpb24nLCAnZmlsZU5hbWUnLCAnbGluZU51bWJlcicsICdtZXNzYWdlJywgJ25hbWUnLCAnbnVtYmVyJywgJ3N0YWNrJ107XG5cbmZ1bmN0aW9uIEV4Y2VwdGlvbihtZXNzYWdlLCBub2RlKSB7XG4gIHZhciBsb2MgPSBub2RlICYmIG5vZGUubG9jLFxuICAgICAgbGluZSA9IHVuZGVmaW5lZCxcbiAgICAgIGNvbHVtbiA9IHVuZGVmaW5lZDtcbiAgaWYgKGxvYykge1xuICAgIGxpbmUgPSBsb2Muc3RhcnQubGluZTtcbiAgICBjb2x1bW4gPSBsb2Muc3RhcnQuY29sdW1uO1xuXG4gICAgbWVzc2FnZSArPSAnIC0gJyArIGxpbmUgKyAnOicgKyBjb2x1bW47XG4gIH1cblxuICB2YXIgdG1wID0gRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgbWVzc2FnZSk7XG5cbiAgLy8gVW5mb3J0dW5hdGVseSBlcnJvcnMgYXJlIG5vdCBlbnVtZXJhYmxlIGluIENocm9tZSAoYXQgbGVhc3QpLCBzbyBgZm9yIHByb3AgaW4gdG1wYCBkb2Vzbid0IHdvcmsuXG4gIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IGVycm9yUHJvcHMubGVuZ3RoOyBpZHgrKykge1xuICAgIHRoaXNbZXJyb3JQcm9wc1tpZHhdXSA9IHRtcFtlcnJvclByb3BzW2lkeF1dO1xuICB9XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgRXhjZXB0aW9uKTtcbiAgfVxuXG4gIGlmIChsb2MpIHtcbiAgICB0aGlzLmxpbmVOdW1iZXIgPSBsaW5lO1xuICAgIHRoaXMuY29sdW1uID0gY29sdW1uO1xuICB9XG59XG5cbkV4Y2VwdGlvbi5wcm90b3R5cGUgPSBuZXcgRXJyb3IoKTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gRXhjZXB0aW9uO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuLypnbG9iYWwgd2luZG93ICovXG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGZ1bmN0aW9uIChIYW5kbGViYXJzKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIHZhciByb290ID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB3aW5kb3csXG4gICAgICAkSGFuZGxlYmFycyA9IHJvb3QuSGFuZGxlYmFycztcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgSGFuZGxlYmFycy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChyb290LkhhbmRsZWJhcnMgPT09IEhhbmRsZWJhcnMpIHtcbiAgICAgIHJvb3QuSGFuZGxlYmFycyA9ICRIYW5kbGViYXJzO1xuICAgIH1cbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkID0gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9O1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0cy5jaGVja1JldmlzaW9uID0gY2hlY2tSZXZpc2lvbjtcblxuLy8gVE9ETzogUmVtb3ZlIHRoaXMgbGluZSBhbmQgYnJlYWsgdXAgY29tcGlsZVBhcnRpYWxcblxuZXhwb3J0cy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuZXhwb3J0cy53cmFwUHJvZ3JhbSA9IHdyYXBQcm9ncmFtO1xuZXhwb3J0cy5yZXNvbHZlUGFydGlhbCA9IHJlc29sdmVQYXJ0aWFsO1xuZXhwb3J0cy5pbnZva2VQYXJ0aWFsID0gaW52b2tlUGFydGlhbDtcbmV4cG9ydHMubm9vcCA9IG5vb3A7XG5cbnZhciBfaW1wb3J0ID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgVXRpbHMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfaW1wb3J0KTtcblxudmFyIF9FeGNlcHRpb24gPSByZXF1aXJlKCcuL2V4Y2VwdGlvbicpO1xuXG52YXIgX0V4Y2VwdGlvbjIgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfRXhjZXB0aW9uKTtcblxudmFyIF9DT01QSUxFUl9SRVZJU0lPTiRSRVZJU0lPTl9DSEFOR0VTJGNyZWF0ZUZyYW1lID0gcmVxdWlyZSgnLi9iYXNlJyk7XG5cbmZ1bmN0aW9uIGNoZWNrUmV2aXNpb24oY29tcGlsZXJJbmZvKSB7XG4gIHZhciBjb21waWxlclJldmlzaW9uID0gY29tcGlsZXJJbmZvICYmIGNvbXBpbGVySW5mb1swXSB8fCAxLFxuICAgICAgY3VycmVudFJldmlzaW9uID0gX0NPTVBJTEVSX1JFVklTSU9OJFJFVklTSU9OX0NIQU5HRVMkY3JlYXRlRnJhbWUuQ09NUElMRVJfUkVWSVNJT047XG5cbiAgaWYgKGNvbXBpbGVyUmV2aXNpb24gIT09IGN1cnJlbnRSZXZpc2lvbikge1xuICAgIGlmIChjb21waWxlclJldmlzaW9uIDwgY3VycmVudFJldmlzaW9uKSB7XG4gICAgICB2YXIgcnVudGltZVZlcnNpb25zID0gX0NPTVBJTEVSX1JFVklTSU9OJFJFVklTSU9OX0NIQU5HRVMkY3JlYXRlRnJhbWUuUkVWSVNJT05fQ0hBTkdFU1tjdXJyZW50UmV2aXNpb25dLFxuICAgICAgICAgIGNvbXBpbGVyVmVyc2lvbnMgPSBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5SRVZJU0lPTl9DSEFOR0VTW2NvbXBpbGVyUmV2aXNpb25dO1xuICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ1RlbXBsYXRlIHdhcyBwcmVjb21waWxlZCB3aXRoIGFuIG9sZGVyIHZlcnNpb24gb2YgSGFuZGxlYmFycyB0aGFuIHRoZSBjdXJyZW50IHJ1bnRpbWUuICcgKyAnUGxlYXNlIHVwZGF0ZSB5b3VyIHByZWNvbXBpbGVyIHRvIGEgbmV3ZXIgdmVyc2lvbiAoJyArIHJ1bnRpbWVWZXJzaW9ucyArICcpIG9yIGRvd25ncmFkZSB5b3VyIHJ1bnRpbWUgdG8gYW4gb2xkZXIgdmVyc2lvbiAoJyArIGNvbXBpbGVyVmVyc2lvbnMgKyAnKS4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVXNlIHRoZSBlbWJlZGRlZCB2ZXJzaW9uIGluZm8gc2luY2UgdGhlIHJ1bnRpbWUgZG9lc24ndCBrbm93IGFib3V0IHRoaXMgcmV2aXNpb24geWV0XG4gICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVGVtcGxhdGUgd2FzIHByZWNvbXBpbGVkIHdpdGggYSBuZXdlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiAnICsgJ1BsZWFzZSB1cGRhdGUgeW91ciBydW50aW1lIHRvIGEgbmV3ZXIgdmVyc2lvbiAoJyArIGNvbXBpbGVySW5mb1sxXSArICcpLicpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB0ZW1wbGF0ZSh0ZW1wbGF0ZVNwZWMsIGVudikge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBpZiAoIWVudikge1xuICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdObyBlbnZpcm9ubWVudCBwYXNzZWQgdG8gdGVtcGxhdGUnKTtcbiAgfVxuICBpZiAoIXRlbXBsYXRlU3BlYyB8fCAhdGVtcGxhdGVTcGVjLm1haW4pIHtcbiAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVW5rbm93biB0ZW1wbGF0ZSBvYmplY3Q6ICcgKyB0eXBlb2YgdGVtcGxhdGVTcGVjKTtcbiAgfVxuXG4gIC8vIE5vdGU6IFVzaW5nIGVudi5WTSByZWZlcmVuY2VzIHJhdGhlciB0aGFuIGxvY2FsIHZhciByZWZlcmVuY2VzIHRocm91Z2hvdXQgdGhpcyBzZWN0aW9uIHRvIGFsbG93XG4gIC8vIGZvciBleHRlcm5hbCB1c2VycyB0byBvdmVycmlkZSB0aGVzZSBhcyBwc3VlZG8tc3VwcG9ydGVkIEFQSXMuXG4gIGVudi5WTS5jaGVja1JldmlzaW9uKHRlbXBsYXRlU3BlYy5jb21waWxlcik7XG5cbiAgZnVuY3Rpb24gaW52b2tlUGFydGlhbFdyYXBwZXIocGFydGlhbCwgY29udGV4dCwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmhhc2gpIHtcbiAgICAgIGNvbnRleHQgPSBVdGlscy5leHRlbmQoe30sIGNvbnRleHQsIG9wdGlvbnMuaGFzaCk7XG4gICAgfVxuXG4gICAgcGFydGlhbCA9IGVudi5WTS5yZXNvbHZlUGFydGlhbC5jYWxsKHRoaXMsIHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpO1xuICAgIHZhciByZXN1bHQgPSBlbnYuVk0uaW52b2tlUGFydGlhbC5jYWxsKHRoaXMsIHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpO1xuXG4gICAgaWYgKHJlc3VsdCA9PSBudWxsICYmIGVudi5jb21waWxlKSB7XG4gICAgICBvcHRpb25zLnBhcnRpYWxzW29wdGlvbnMubmFtZV0gPSBlbnYuY29tcGlsZShwYXJ0aWFsLCB0ZW1wbGF0ZVNwZWMuY29tcGlsZXJPcHRpb25zLCBlbnYpO1xuICAgICAgcmVzdWx0ID0gb3B0aW9ucy5wYXJ0aWFsc1tvcHRpb25zLm5hbWVdKGNvbnRleHQsIG9wdGlvbnMpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0ICE9IG51bGwpIHtcbiAgICAgIGlmIChvcHRpb25zLmluZGVudCkge1xuICAgICAgICB2YXIgbGluZXMgPSByZXN1bHQuc3BsaXQoJ1xcbicpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpbmVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIGlmICghbGluZXNbaV0gJiYgaSArIDEgPT09IGwpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpbmVzW2ldID0gb3B0aW9ucy5pbmRlbnQgKyBsaW5lc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSBsaW5lcy5qb2luKCdcXG4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdUaGUgcGFydGlhbCAnICsgb3B0aW9ucy5uYW1lICsgJyBjb3VsZCBub3QgYmUgY29tcGlsZWQgd2hlbiBydW5uaW5nIGluIHJ1bnRpbWUtb25seSBtb2RlJyk7XG4gICAgfVxuICB9XG5cbiAgLy8gSnVzdCBhZGQgd2F0ZXJcbiAgdmFyIGNvbnRhaW5lciA9IHtcbiAgICBzdHJpY3Q6IGZ1bmN0aW9uIHN0cmljdChvYmosIG5hbWUpIHtcbiAgICAgIGlmICghKG5hbWUgaW4gb2JqKSkge1xuICAgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnXCInICsgbmFtZSArICdcIiBub3QgZGVmaW5lZCBpbiAnICsgb2JqKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmpbbmFtZV07XG4gICAgfSxcbiAgICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChkZXB0aHMsIG5hbWUpIHtcbiAgICAgIHZhciBsZW4gPSBkZXB0aHMubGVuZ3RoO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAoZGVwdGhzW2ldICYmIGRlcHRoc1tpXVtuYW1lXSAhPSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGRlcHRoc1tpXVtuYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgbGFtYmRhOiBmdW5jdGlvbiBsYW1iZGEoY3VycmVudCwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiBjdXJyZW50ID09PSAnZnVuY3Rpb24nID8gY3VycmVudC5jYWxsKGNvbnRleHQpIDogY3VycmVudDtcbiAgICB9LFxuXG4gICAgZXNjYXBlRXhwcmVzc2lvbjogVXRpbHMuZXNjYXBlRXhwcmVzc2lvbixcbiAgICBpbnZva2VQYXJ0aWFsOiBpbnZva2VQYXJ0aWFsV3JhcHBlcixcblxuICAgIGZuOiBmdW5jdGlvbiBmbihpKSB7XG4gICAgICByZXR1cm4gdGVtcGxhdGVTcGVjW2ldO1xuICAgIH0sXG5cbiAgICBwcm9ncmFtczogW10sXG4gICAgcHJvZ3JhbTogZnVuY3Rpb24gcHJvZ3JhbShpLCBkYXRhLCBkZWNsYXJlZEJsb2NrUGFyYW1zLCBibG9ja1BhcmFtcywgZGVwdGhzKSB7XG4gICAgICB2YXIgcHJvZ3JhbVdyYXBwZXIgPSB0aGlzLnByb2dyYW1zW2ldLFxuICAgICAgICAgIGZuID0gdGhpcy5mbihpKTtcbiAgICAgIGlmIChkYXRhIHx8IGRlcHRocyB8fCBibG9ja1BhcmFtcyB8fCBkZWNsYXJlZEJsb2NrUGFyYW1zKSB7XG4gICAgICAgIHByb2dyYW1XcmFwcGVyID0gd3JhcFByb2dyYW0odGhpcywgaSwgZm4sIGRhdGEsIGRlY2xhcmVkQmxvY2tQYXJhbXMsIGJsb2NrUGFyYW1zLCBkZXB0aHMpO1xuICAgICAgfSBlbHNlIGlmICghcHJvZ3JhbVdyYXBwZXIpIHtcbiAgICAgICAgcHJvZ3JhbVdyYXBwZXIgPSB0aGlzLnByb2dyYW1zW2ldID0gd3JhcFByb2dyYW0odGhpcywgaSwgZm4pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByb2dyYW1XcmFwcGVyO1xuICAgIH0sXG5cbiAgICBkYXRhOiBmdW5jdGlvbiBkYXRhKHZhbHVlLCBkZXB0aCkge1xuICAgICAgd2hpbGUgKHZhbHVlICYmIGRlcHRoLS0pIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5fcGFyZW50O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG4gICAgbWVyZ2U6IGZ1bmN0aW9uIG1lcmdlKHBhcmFtLCBjb21tb24pIHtcbiAgICAgIHZhciBvYmogPSBwYXJhbSB8fCBjb21tb247XG5cbiAgICAgIGlmIChwYXJhbSAmJiBjb21tb24gJiYgcGFyYW0gIT09IGNvbW1vbikge1xuICAgICAgICBvYmogPSBVdGlscy5leHRlbmQoe30sIGNvbW1vbiwgcGFyYW0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gb2JqO1xuICAgIH0sXG5cbiAgICBub29wOiBlbnYuVk0ubm9vcCxcbiAgICBjb21waWxlckluZm86IHRlbXBsYXRlU3BlYy5jb21waWxlclxuICB9O1xuXG4gIGZ1bmN0aW9uIHJldChjb250ZXh0KSB7XG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzFdO1xuXG4gICAgdmFyIGRhdGEgPSBvcHRpb25zLmRhdGE7XG5cbiAgICByZXQuX3NldHVwKG9wdGlvbnMpO1xuICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsICYmIHRlbXBsYXRlU3BlYy51c2VEYXRhKSB7XG4gICAgICBkYXRhID0gaW5pdERhdGEoY29udGV4dCwgZGF0YSk7XG4gICAgfVxuICAgIHZhciBkZXB0aHMgPSB1bmRlZmluZWQsXG4gICAgICAgIGJsb2NrUGFyYW1zID0gdGVtcGxhdGVTcGVjLnVzZUJsb2NrUGFyYW1zID8gW10gOiB1bmRlZmluZWQ7XG4gICAgaWYgKHRlbXBsYXRlU3BlYy51c2VEZXB0aHMpIHtcbiAgICAgIGRlcHRocyA9IG9wdGlvbnMuZGVwdGhzID8gW2NvbnRleHRdLmNvbmNhdChvcHRpb25zLmRlcHRocykgOiBbY29udGV4dF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHRlbXBsYXRlU3BlYy5tYWluLmNhbGwoY29udGFpbmVyLCBjb250ZXh0LCBjb250YWluZXIuaGVscGVycywgY29udGFpbmVyLnBhcnRpYWxzLCBkYXRhLCBibG9ja1BhcmFtcywgZGVwdGhzKTtcbiAgfVxuICByZXQuaXNUb3AgPSB0cnVlO1xuXG4gIHJldC5fc2V0dXAgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsKSB7XG4gICAgICBjb250YWluZXIuaGVscGVycyA9IGNvbnRhaW5lci5tZXJnZShvcHRpb25zLmhlbHBlcnMsIGVudi5oZWxwZXJzKTtcblxuICAgICAgaWYgKHRlbXBsYXRlU3BlYy51c2VQYXJ0aWFsKSB7XG4gICAgICAgIGNvbnRhaW5lci5wYXJ0aWFscyA9IGNvbnRhaW5lci5tZXJnZShvcHRpb25zLnBhcnRpYWxzLCBlbnYucGFydGlhbHMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb250YWluZXIuaGVscGVycyA9IG9wdGlvbnMuaGVscGVycztcbiAgICAgIGNvbnRhaW5lci5wYXJ0aWFscyA9IG9wdGlvbnMucGFydGlhbHM7XG4gICAgfVxuICB9O1xuXG4gIHJldC5fY2hpbGQgPSBmdW5jdGlvbiAoaSwgZGF0YSwgYmxvY2tQYXJhbXMsIGRlcHRocykge1xuICAgIGlmICh0ZW1wbGF0ZVNwZWMudXNlQmxvY2tQYXJhbXMgJiYgIWJsb2NrUGFyYW1zKSB7XG4gICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnbXVzdCBwYXNzIGJsb2NrIHBhcmFtcycpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGVTcGVjLnVzZURlcHRocyAmJiAhZGVwdGhzKSB7XG4gICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnbXVzdCBwYXNzIHBhcmVudCBkZXB0aHMnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gd3JhcFByb2dyYW0oY29udGFpbmVyLCBpLCB0ZW1wbGF0ZVNwZWNbaV0sIGRhdGEsIDAsIGJsb2NrUGFyYW1zLCBkZXB0aHMpO1xuICB9O1xuICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiB3cmFwUHJvZ3JhbShjb250YWluZXIsIGksIGZuLCBkYXRhLCBkZWNsYXJlZEJsb2NrUGFyYW1zLCBibG9ja1BhcmFtcywgZGVwdGhzKSB7XG4gIGZ1bmN0aW9uIHByb2coY29udGV4dCkge1xuICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1sxXTtcblxuICAgIHJldHVybiBmbi5jYWxsKGNvbnRhaW5lciwgY29udGV4dCwgY29udGFpbmVyLmhlbHBlcnMsIGNvbnRhaW5lci5wYXJ0aWFscywgb3B0aW9ucy5kYXRhIHx8IGRhdGEsIGJsb2NrUGFyYW1zICYmIFtvcHRpb25zLmJsb2NrUGFyYW1zXS5jb25jYXQoYmxvY2tQYXJhbXMpLCBkZXB0aHMgJiYgW2NvbnRleHRdLmNvbmNhdChkZXB0aHMpKTtcbiAgfVxuICBwcm9nLnByb2dyYW0gPSBpO1xuICBwcm9nLmRlcHRoID0gZGVwdGhzID8gZGVwdGhzLmxlbmd0aCA6IDA7XG4gIHByb2cuYmxvY2tQYXJhbXMgPSBkZWNsYXJlZEJsb2NrUGFyYW1zIHx8IDA7XG4gIHJldHVybiBwcm9nO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlUGFydGlhbChwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKSB7XG4gIGlmICghcGFydGlhbCkge1xuICAgIHBhcnRpYWwgPSBvcHRpb25zLnBhcnRpYWxzW29wdGlvbnMubmFtZV07XG4gIH0gZWxzZSBpZiAoIXBhcnRpYWwuY2FsbCAmJiAhb3B0aW9ucy5uYW1lKSB7XG4gICAgLy8gVGhpcyBpcyBhIGR5bmFtaWMgcGFydGlhbCB0aGF0IHJldHVybmVkIGEgc3RyaW5nXG4gICAgb3B0aW9ucy5uYW1lID0gcGFydGlhbDtcbiAgICBwYXJ0aWFsID0gb3B0aW9ucy5wYXJ0aWFsc1twYXJ0aWFsXTtcbiAgfVxuICByZXR1cm4gcGFydGlhbDtcbn1cblxuZnVuY3Rpb24gaW52b2tlUGFydGlhbChwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKSB7XG4gIG9wdGlvbnMucGFydGlhbCA9IHRydWU7XG5cbiAgaWYgKHBhcnRpYWwgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdUaGUgcGFydGlhbCAnICsgb3B0aW9ucy5uYW1lICsgJyBjb3VsZCBub3QgYmUgZm91bmQnKTtcbiAgfSBlbHNlIGlmIChwYXJ0aWFsIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICByZXR1cm4gcGFydGlhbChjb250ZXh0LCBvcHRpb25zKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBub29wKCkge1xuICByZXR1cm4gJyc7XG59XG5cbmZ1bmN0aW9uIGluaXREYXRhKGNvbnRleHQsIGRhdGEpIHtcbiAgaWYgKCFkYXRhIHx8ICEoJ3Jvb3QnIGluIGRhdGEpKSB7XG4gICAgZGF0YSA9IGRhdGEgPyBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5jcmVhdGVGcmFtZShkYXRhKSA6IHt9O1xuICAgIGRhdGEucm9vdCA9IGNvbnRleHQ7XG4gIH1cbiAgcmV0dXJuIGRhdGE7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuLy8gQnVpbGQgb3V0IG91ciBiYXNpYyBTYWZlU3RyaW5nIHR5cGVcbmZ1bmN0aW9uIFNhZmVTdHJpbmcoc3RyaW5nKSB7XG4gIHRoaXMuc3RyaW5nID0gc3RyaW5nO1xufVxuXG5TYWZlU3RyaW5nLnByb3RvdHlwZS50b1N0cmluZyA9IFNhZmVTdHJpbmcucHJvdG90eXBlLnRvSFRNTCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICcnICsgdGhpcy5zdHJpbmc7XG59O1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBTYWZlU3RyaW5nO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0cy5leHRlbmQgPSBleHRlbmQ7XG5cbi8vIE9sZGVyIElFIHZlcnNpb25zIGRvIG5vdCBkaXJlY3RseSBzdXBwb3J0IGluZGV4T2Ygc28gd2UgbXVzdCBpbXBsZW1lbnQgb3VyIG93biwgc2FkbHkuXG5leHBvcnRzLmluZGV4T2YgPSBpbmRleE9mO1xuZXhwb3J0cy5lc2NhcGVFeHByZXNzaW9uID0gZXNjYXBlRXhwcmVzc2lvbjtcbmV4cG9ydHMuaXNFbXB0eSA9IGlzRW1wdHk7XG5leHBvcnRzLmJsb2NrUGFyYW1zID0gYmxvY2tQYXJhbXM7XG5leHBvcnRzLmFwcGVuZENvbnRleHRQYXRoID0gYXBwZW5kQ29udGV4dFBhdGg7XG52YXIgZXNjYXBlID0ge1xuICAnJic6ICcmYW1wOycsXG4gICc8JzogJyZsdDsnLFxuICAnPic6ICcmZ3Q7JyxcbiAgJ1wiJzogJyZxdW90OycsXG4gICdcXCcnOiAnJiN4Mjc7JyxcbiAgJ2AnOiAnJiN4NjA7J1xufTtcblxudmFyIGJhZENoYXJzID0gL1smPD5cIidgXS9nLFxuICAgIHBvc3NpYmxlID0gL1smPD5cIidgXS87XG5cbmZ1bmN0aW9uIGVzY2FwZUNoYXIoY2hyKSB7XG4gIHJldHVybiBlc2NhcGVbY2hyXTtcbn1cblxuZnVuY3Rpb24gZXh0ZW5kKG9iaiAvKiAsIC4uLnNvdXJjZSAqLykge1xuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGZvciAodmFyIGtleSBpbiBhcmd1bWVudHNbaV0pIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXJndW1lbnRzW2ldLCBrZXkpKSB7XG4gICAgICAgIG9ialtrZXldID0gYXJndW1lbnRzW2ldW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9iajtcbn1cblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuZXhwb3J0cy50b1N0cmluZyA9IHRvU3RyaW5nO1xuLy8gU291cmNlZCBmcm9tIGxvZGFzaFxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Jlc3RpZWpzL2xvZGFzaC9ibG9iL21hc3Rlci9MSUNFTlNFLnR4dFxuLyplc2xpbnQtZGlzYWJsZSBmdW5jLXN0eWxlLCBuby12YXIgKi9cbnZhciBpc0Z1bmN0aW9uID0gZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufTtcbi8vIGZhbGxiYWNrIGZvciBvbGRlciB2ZXJzaW9ucyBvZiBDaHJvbWUgYW5kIFNhZmFyaVxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmlmIChpc0Z1bmN0aW9uKC94LykpIHtcbiAgZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG4gIH07XG59XG52YXIgaXNGdW5jdGlvbjtcbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG4vKmVzbGludC1lbmFibGUgZnVuYy1zdHlsZSwgbm8tdmFyICovXG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnID8gdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEFycmF5XScgOiBmYWxzZTtcbn07ZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaW5kZXhPZihhcnJheSwgdmFsdWUpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGFycmF5W2ldID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gZXNjYXBlRXhwcmVzc2lvbihzdHJpbmcpIHtcbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgLy8gZG9uJ3QgZXNjYXBlIFNhZmVTdHJpbmdzLCBzaW5jZSB0aGV5J3JlIGFscmVhZHkgc2FmZVxuICAgIGlmIChzdHJpbmcgJiYgc3RyaW5nLnRvSFRNTCkge1xuICAgICAgcmV0dXJuIHN0cmluZy50b0hUTUwoKTtcbiAgICB9IGVsc2UgaWYgKHN0cmluZyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfSBlbHNlIGlmICghc3RyaW5nKSB7XG4gICAgICByZXR1cm4gc3RyaW5nICsgJyc7XG4gICAgfVxuXG4gICAgLy8gRm9yY2UgYSBzdHJpbmcgY29udmVyc2lvbiBhcyB0aGlzIHdpbGwgYmUgZG9uZSBieSB0aGUgYXBwZW5kIHJlZ2FyZGxlc3MgYW5kXG4gICAgLy8gdGhlIHJlZ2V4IHRlc3Qgd2lsbCBkbyB0aGlzIHRyYW5zcGFyZW50bHkgYmVoaW5kIHRoZSBzY2VuZXMsIGNhdXNpbmcgaXNzdWVzIGlmXG4gICAgLy8gYW4gb2JqZWN0J3MgdG8gc3RyaW5nIGhhcyBlc2NhcGVkIGNoYXJhY3RlcnMgaW4gaXQuXG4gICAgc3RyaW5nID0gJycgKyBzdHJpbmc7XG4gIH1cblxuICBpZiAoIXBvc3NpYmxlLnRlc3Qoc3RyaW5nKSkge1xuICAgIHJldHVybiBzdHJpbmc7XG4gIH1cbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKGJhZENoYXJzLCBlc2NhcGVDaGFyKTtcbn1cblxuZnVuY3Rpb24gaXNFbXB0eSh2YWx1ZSkge1xuICBpZiAoIXZhbHVlICYmIHZhbHVlICE9PSAwKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJsb2NrUGFyYW1zKHBhcmFtcywgaWRzKSB7XG4gIHBhcmFtcy5wYXRoID0gaWRzO1xuICByZXR1cm4gcGFyYW1zO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRDb250ZXh0UGF0aChjb250ZXh0UGF0aCwgaWQpIHtcbiAgcmV0dXJuIChjb250ZXh0UGF0aCA/IGNvbnRleHRQYXRoICsgJy4nIDogJycpICsgaWQ7XG59IiwiLy8gQ3JlYXRlIGEgc2ltcGxlIHBhdGggYWxpYXMgdG8gYWxsb3cgYnJvd3NlcmlmeSB0byByZXNvbHZlXG4vLyB0aGUgcnVudGltZSBvbiBhIHN1cHBvcnRlZCBwYXRoLlxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2Rpc3QvY2pzL2hhbmRsZWJhcnMucnVudGltZScpWydkZWZhdWx0J107XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJoYW5kbGViYXJzL3J1bnRpbWVcIilbXCJkZWZhdWx0XCJdO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnNDb21waWxlciA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFyc0NvbXBpbGVyLnRlbXBsYXRlKHtcImNvbXBpbGVyXCI6WzYsXCI+PSAyLjAuMC1iZXRhLjFcIl0sXCJtYWluXCI6ZnVuY3Rpb24oZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBoZWxwZXI7XG5cbiAgcmV0dXJuIFwiPGgxPkhlbGxvIFwiXG4gICAgKyB0aGlzLmVzY2FwZUV4cHJlc3Npb24oKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy53aG8gfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLndobyA6IGRlcHRoMCkpICE9IG51bGwgPyBoZWxwZXIgOiBoZWxwZXJzLmhlbHBlck1pc3NpbmcpLCh0eXBlb2YgaGVscGVyID09PSBcImZ1bmN0aW9uXCIgPyBoZWxwZXIuY2FsbChkZXB0aDAse1wibmFtZVwiOlwid2hvXCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIjwvaDE+XFxuXCI7XG59LFwidXNlRGF0YVwiOnRydWV9KTtcbiIsInZhciBmd2MgPSByZXF1aXJlKCdmd2MnKTtcblxuUVVuaXQubW9kdWxlKCdSZWdpc3RlcicpO1xuXG5RVW5pdC5hc3luY1Rlc3QoJ3JlZ2lzdGVyIGFuZCBhY2Nlc3MgYSBjb21wb25lbnQnLCA0LCBmdW5jdGlvbihhc3NlcnQpe1xuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGVybWFuZW50LWZpeHR1cmUnKTtcbiAgICBhc3NlcnQub2soY29udGFpbmVyIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQsICdUaGUgY29udGFpbmVyIGV4aXN0cycpO1xuXG4gICAgZndjKCdiYXNlJylcbiAgICAgICAgLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjcmVhdGUnLCBmdW5jdGlvbihlbHQpe1xuXG4gICAgICAgICAgICB2YXIgZkJhc2UgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignZi1iYXNlJyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZkJhc2Uubm9kZU5hbWUsICdGLUJBU0UnLCAnVGhlIGYtYmFzZSBjb21wb25lbnQgaXMgZm91bmQnKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmQmFzZS5ub2RlTmFtZSwgZWx0Lm5vZGVOYW1lLCAnVGhlIGYtYmFzZSBjb21wb25lbnQgaXMgZ2l2ZW4gaW4gcGFyYW1ldGVyJyk7XG4gICAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsKGZCYXNlLCBlbHQsICdUaGUgY2FsbGJhY2sgZWx0IGlzIHRoZSBnaXZlbiBub2RlJyk7XG5cbiAgICAgICAgICAgIFFVbml0LnN0YXJ0KCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5yZWdpc3RlcigpO1xufSk7XG5cblxuUVVuaXQuYXN5bmNUZXN0KCdyZWdpc3RlciB3aXRoIGFub3RoZXIgbmFtZXNwYWNlJywgNCwgZnVuY3Rpb24oYXNzZXJ0KXtcbiAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Blcm1hbmVudC1maXh0dXJlJyk7XG4gICAgYXNzZXJ0Lm9rKGNvbnRhaW5lciBpbnN0YW5jZW9mIEhUTUxFbGVtZW50LCAnVGhlIGNvbnRhaW5lciBleGlzdHMnKTtcblxuICAgIGZ3YygnYmFyJywge25hbWVzcGFjZSA6ICdmb28nfSlcbiAgICAgICAgLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjcmVhdGUnLCBmdW5jdGlvbihlbHQpe1xuXG4gICAgICAgICAgICB2YXIgZm9vQmFyID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2Zvby1iYXInKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmb29CYXIubm9kZU5hbWUsICdGT08tQkFSJywgJ1RoZSBmb28tYmFyIGNvbXBvbmVudCBpcyBmb3VuZCcpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZvb0Jhci5ub2RlTmFtZSwgZWx0Lm5vZGVOYW1lLCAnVGhlIGZvby1iYXIgY29tcG9uZW50IGlzIGdpdmVuIGluIHBhcmFtZXRlcicpO1xuICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChmb29CYXIsIGVsdCwgJ1RoZSBjYWxsYmFjayBlbHQgaXMgdGhlIGdpdmVuIG5vZGUnKTtcblxuICAgICAgICAgICAgUVVuaXQuc3RhcnQoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnJlZ2lzdGVyKCk7XG59KTtcblxuUVVuaXQuYXN5bmNUZXN0KCdyZWdpc3RlciBhbmQgbXVsdGlwbGUgY29tcG9uZW50JywgNywgZnVuY3Rpb24oYXNzZXJ0KXtcbiAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Blcm1hbmVudC1maXh0dXJlJyk7XG4gICAgYXNzZXJ0Lm9rKGNvbnRhaW5lciBpbnN0YW5jZW9mIEhUTUxFbGVtZW50LCAnVGhlIGNvbnRhaW5lciBleGlzdHMnKTtcblxuICAgIHZhciBzdW0gPSAwO1xuXG4gICAgZndjKCdtdWx0aScpXG4gICAgICAgIC5vbignZXJyb3InLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignY3JlYXRlJywgZnVuY3Rpb24oZWx0KXtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGVsdC5ub2RlTmFtZSwgJ0YtTVVMVEknLCAnVGhlIGVsZW1lbnQgaXMgYSBtdWx0aScpO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gcGFyc2VJbnQoZWx0LmdldEF0dHJpYnV0ZSgndmFsdWUnKSwgMTApO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZhbHVlID4gMCwgJ1RoZSAgdmFsdWUgaGFzIGFuIGludCcpO1xuICAgICAgICAgICAgc3VtICs9IHZhbHVlO1xuXG4gICAgICAgICAgICBpZihzdW0gPT09IDcpe1xuXG4gICAgICAgICAgICAgICAgUVVuaXQuc3RhcnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLnJlZ2lzdGVyKCk7XG59KTtcblxuUVVuaXQubW9kdWxlKCdBdHRyaWJ1dGVzJyk7XG5cblFVbml0LmFzeW5jVGVzdCgnZGVmaW5lIGJhc2ljIGF0dHJpYnV0ZXMnLCA4LCBmdW5jdGlvbihhc3NlcnQpe1xuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGVybWFuZW50LWZpeHR1cmUnKTtcbiAgICBhc3NlcnQub2soY29udGFpbmVyIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQsICdUaGUgY29udGFpbmVyIGV4aXN0cycpO1xuXG4gICAgZndjKCdhdHRyJylcbiAgICAgICAgLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjcmVhdGUnLCBmdW5jdGlvbihlbHQpe1xuXG4gICAgICAgICAgICB2YXIgZkF0dHIgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignZi1hdHRyJyk7XG4gICAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsKGZBdHRyLCBlbHQsICdUaGUgY2FsbGJhY2sgZWx0IGlzIHRoZSBnaXZlbiBub2RlJyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZkF0dHIuZm9vLCAnJyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZkF0dHIuYmFyLCAncHVyJyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZkF0dHIuZm9vLCBmQXR0ci5nZXRBdHRyaWJ1dGUoJ2ZvbycpKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmQXR0ci5iYXIsIGZBdHRyLmdldEF0dHJpYnV0ZSgnYmFyJykpO1xuXG4gICAgICAgICAgICBmQXR0ci5mb28gPSAnbW9vJztcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmQXR0ci5mb28sICdtb28nKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmQXR0ci5mb28sIGZBdHRyLmdldEF0dHJpYnV0ZSgnZm9vJykpO1xuXG4gICAgICAgICAgICBRVW5pdC5zdGFydCgpO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cnMoJ2ZvbycsICdiYXInKVxuICAgICAgICAucmVnaXN0ZXIoKTtcbn0pO1xuXG5RVW5pdC5hc3luY1Rlc3QoJ2RlZmluZSBhdHRyaWJ1dGVzIHdpdGggdHlwZSBjYXN0aW5nJywgMTYsIGZ1bmN0aW9uKGFzc2VydCl7XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwZXJtYW5lbnQtZml4dHVyZScpO1xuICAgIGFzc2VydC5vayhjb250YWluZXIgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCwgJ1RoZSBjb250YWluZXIgZXhpc3RzJyk7XG5cbiAgICBmd2MoJ2Nhc3QnKVxuICAgICAgICAub24oJ2Vycm9yJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ2NyZWF0ZScsIGZ1bmN0aW9uKGVsdCl7XG5cbiAgICAgICAgICAgIHZhciBmQ2FzdCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdmLWNhc3QnKTtcbiAgICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwoZkNhc3QsIGVsdCwgJ1RoZSBjYWxsYmFjayBlbHQgaXMgdGhlIGdpdmVuIG5vZGUnKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZDYXN0LmdldEF0dHJpYnV0ZSgnaW50JyksICcxMzQuMTInLCBcIlRoZSBhdHRyaWJ1dGUgZXhpc3RzXCIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZDYXN0LmludCwgMTM0LCBcIlRoZSBnZXR0ZXIgZ2l2ZXMgeW91IHRoZSBwYXJzZWQgdmFsdWVcIik7XG4gICAgICAgICAgICBmQ2FzdC5pbnQgPSBcIjUuNzdcIjtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmQ2FzdC5nZXRBdHRyaWJ1dGUoJ2ludCcpLCAnNScsIFwiVGhlIHZhbHVlIGlzIHVwZGF0ZWQgb25jZSBwYXJzZWRcIik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZkNhc3QuaW50LCA1LCBcIlRoZSBnZXR0ZXIgZ2l2ZXMgeW91IHRoZSBwYXJzZWQgdmFsdWVcIik7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmQ2FzdC5nZXRBdHRyaWJ1dGUoJ2Zsb2F0JyksIDEuMjMsIFwiVGhlIGF0dHJpYnV0ZSBleGlzdHNcIik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZkNhc3QuZmxvYXQsIDEuMjMsIFwiVGhlIGdldHRlciBnaXZlcyB5b3UgdGhlIHBhcnNlZCB2YWx1ZVwiKTtcbiAgICAgICAgICAgIGZDYXN0LmZsb2F0ID0gXCIwMC43N1wiO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZDYXN0LmdldEF0dHJpYnV0ZSgnZmxvYXQnKSwgJzAuNzcnLCBcIlRoZSB2YWx1ZSBpcyB1cGRhdGVkIG9uY2UgcGFyc2VkXCIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZDYXN0LmZsb2F0LCAwLjc3LCBcIlRoZSBnZXR0ZXIgZ2l2ZXMgeW91IHRoZSBwYXJzZWQgdmFsdWVcIik7XG5cbiAgICAgICAgICAgIGFzc2VydC5vayhmQ2FzdC5oYXNBdHRyaWJ1dGUoJ2Jvb2wnKSwgXCJUaGUgYXR0cmlidXRlIGV4aXN0c1wiKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmQ2FzdC5ib29sLCB0cnVlLCBcIlRoZSBhdHRyaWJ1dGUgaGFzIHRoZSBwYXJzZWQgdmFsdWVcIik7XG4gICAgICAgICAgICBmQ2FzdC5ib29sID0gZmFsc2U7XG4gICAgICAgICAgICBhc3NlcnQub2soIWZDYXN0Lmhhc0F0dHJpYnV0ZSgnYm9vbCcpLCBcIlRoZSBhdHRyaWJ1dGUgZG9lc24ndCBleGlzdHMgYW55bW9yZVwiKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmQ2FzdC5ib29sLCBmYWxzZSwgXCJUaGUgYXR0cmlidXRlIGhhcyB0aGUgZmFsc2UgdmFsdWVcIik7XG4gICAgICAgICAgICBmQ2FzdC5ib29sID0gdHJ1ZTtcbiAgICAgICAgICAgIGFzc2VydC5vayhmQ2FzdC5oYXNBdHRyaWJ1dGUoJ2Jvb2wnKSwgXCJUaGUgYXR0cmlidXRlIGlzIGFnYWluIHRoZXJlXCIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZDYXN0LmJvb2wsIHRydWUsIFwiVGhlIGF0dHJpYnV0ZSBoYXMgdGhlIHRydWUgdmFsdWVcIik7XG5cbiAgICAgICAgICAgIFFVbml0LnN0YXJ0KCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKCdpbnQnLCAgIHsgdHlwZSA6ICdpbnRlZ2VyJyB9KVxuICAgICAgICAuYXR0cignZmxvYXQnLCB7IHR5cGUgOiAnZmxvYXQnIH0pXG4gICAgICAgIC5hdHRyKCdib29sJywgIHsgdHlwZSA6ICdib29sZWFuJyB9KVxuICAgICAgICAucmVnaXN0ZXIoKTtcbn0pO1xuXG5RVW5pdC5hc3luY1Rlc3QoJ2RlZmluZSBhdHRyaWJ1dGVzIHdpdGggYWNjZXNzb3JzJywgMTEsIGZ1bmN0aW9uKGFzc2VydCl7XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwZXJtYW5lbnQtZml4dHVyZScpO1xuICAgIGFzc2VydC5vayhjb250YWluZXIgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCwgJ1RoZSBjb250YWluZXIgZXhpc3RzJyk7XG5cbiAgICBmd2MoJ2FjY2VzcycpXG4gICAgICAgIC5vbignZXJyb3InLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignY3JlYXRlJywgZnVuY3Rpb24oZWx0KXtcblxuICAgICAgICAgICAgdmFyIGZBY2Nlc3MgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignZi1hY2Nlc3MnKTtcbiAgICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwoZkFjY2VzcywgZWx0LCAnVGhlIGNhbGxiYWNrIGVsdCBpcyB0aGUgZ2l2ZW4gbm9kZScpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZBY2Nlc3MuZ2V0QXR0cmlidXRlKCdudW0nKSwgJzEnLCAnVGhlIG51bSBhdHRyaWJ1dGUgaGFzIHRoZSB2YWx1ZScpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKGZBY2Nlc3MuaGFzQXR0cmlidXRlKCdib29sJyksICdUaGUgYm9vbCBhdHRyaWJ1dGUgZXhpc3RzJyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZkFjY2Vzcy5nZXRBdHRyaWJ1dGUoJ2luYycpLCAnMCcsICdUaGUgaW5jIGF0dHJpYnV0ZSBoYXMgdGhlIHZhbHVlJyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZkFjY2Vzcy5nZXRBdHRyaWJ1dGUoJ2RvdWJsZScpLCAnMCcsICdUaGUgZG91YmxlIGF0dHJpYnV0ZSBoYXMgdGhlIHZhbHVlJyk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmQWNjZXNzLm51bSwgMSwgJ1RoZSBudW0gZ2V0dGVyIGlzIGNhbGxlZCcpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZBY2Nlc3MuYm9vbCwgZmFsc2UsICdUaGUgYm9vbCBnZXR0ZXIgaXMgY2FsbGVkJyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZkFjY2Vzcy5pbmMsIDEsICdUaGUgaW5jIGdldHRlciBpcyBjYWxsZWQnKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmQWNjZXNzLmluYywgMiwgJ1RoZSBpbmMgZ2V0dGVyIGlzIGNhbGxlZCcpO1xuXG4gICAgICAgICAgICBmQWNjZXNzLmRvdWJsZSA9IDI7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZkFjY2Vzcy5kb3VibGUsIDQsICdUaGUgZG91YmxlIHNldHRlciBpcyBjYWxsZWRlJyk7XG5cbiAgICAgICAgICAgIFFVbml0LnN0YXJ0KCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRycygnbnVtJywgJ2Jvb2wnLCAnaW5jJylcbiAgICAgICAgLmFjY2VzcygnbnVtJywge1xuICAgICAgICAgICAgZ2V0KHZhbCl7XG4gICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodmFsLCAxMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5hY2Nlc3MoJ2RvdWJsZScsIHtcbiAgICAgICAgICAgIGdldCh2YWwpe1xuICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KHZhbCwgMTApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldChvbGQsIHZhbCl7XG4gICAgICAgICAgICAgICAgdmFsID0gcGFyc2VJbnQodmFsLCAxMCk7XG4gICAgICAgICAgICAgICAgdmFsID0gdmFsICogMjtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuYWNjZXNzKCdib29sJywge1xuICAgICAgICAgICAgZ2V0KHZhbCl7XG4gICAgICAgICAgICAgICByZXR1cm4gISF2YWw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5hY2Nlc3MoJ2luYycsIHtcbiAgICAgICAgICAgIGdldCh2YWwpe1xuICAgICAgICAgICAgICAgIHZhbCA9IHBhcnNlSW50KHZhbCwgMTApO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKCdpbmMnLCArK3ZhbCk7XG4gICAgICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAucmVnaXN0ZXIoKTtcbn0pO1xuXG5RVW5pdC5tb2R1bGUoJ01ldGhvZHMnKTtcblxuUVVuaXQuYXN5bmNUZXN0KCdDb21wb25lbnQgd2l0aCBhIG1ldGhvZCcsIDcsIGZ1bmN0aW9uKGFzc2VydCl7XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwZXJtYW5lbnQtZml4dHVyZScpO1xuICAgIGFzc2VydC5vayhjb250YWluZXIgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCwgJ1RoZSBjb250YWluZXIgZXhpc3RzJyk7XG5cbiAgICB2YXIgbVRhcmdldCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubXRhcmdldCcpO1xuICAgIGFzc2VydC5vayhtVGFyZ2V0LnN0eWxlLmRpc3BsYXkgIT09ICdub25lJywgXCJUaGUgbXRhcmdldCBjb250ZW50IGlzIGRpc3BsYXllZFwiKTtcblxuICAgIGZ3YygnbWV0aG9kJylcbiAgICAgICAgLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjcmVhdGUnLCBmdW5jdGlvbihlbHQpe1xuXG4gICAgICAgICAgICB2YXIgZk1ldGhvZCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdmLW1ldGhvZCcpO1xuICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChmTWV0aG9kLCBlbHQsICdUaGUgY2FsbGJhY2sgZWx0IGlzIHRoZSBnaXZlbiBub2RlJyk7XG5cbiAgICAgICAgICAgIGFzc2VydC5vayh0eXBlb2YgZk1ldGhvZC5oaWRlID09PSAnZnVuY3Rpb24nLCAnVGhlIGVsZW1lbnQgaGFzIHRoZSBkZWZpbmVkIG1ldGhvZCcpO1xuXG4gICAgICAgICAgICBmTWV0aG9kLmhpZGUoKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1UYXJnZXQuc3R5bGUuZGlzcGxheSwgJ25vbmUnLCBcIlRoZSBtdGFyZ2V0IGNvbnRlbnQgaXNuJ3QgZGlzcGxheWVkIGFueW1vcmVcIik7XG5cbiAgICAgICAgICAgIFFVbml0LnN0YXJ0KCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5tZXRob2QoJ2hpZGUnLCBmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICB2YXIgZk1ldGhvZCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdmLW1ldGhvZCcpO1xuICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChmTWV0aG9kLCB0aGlzLCAnVGhpcyBpcyB0aGUgZ2l2ZW4gbm9kZScpO1xuXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodGhpcy50YXJnZXQsICcubXRhcmdldCcsICdUaGUgYXR0cmlidXRlIHZhbHVlIGlzIGNvcnJlY3QnKTtcblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLnRhcmdldCkuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHJzKCd0YXJnZXQnKVxuICAgICAgICAucmVnaXN0ZXIoKTtcbn0pO1xuXG5RVW5pdC5tb2R1bGUoJ0NvbnRlbnQnKTtcblxuUVVuaXQuYXN5bmNUZXN0KCdDb21wb25lbnQgd2l0aCBjb250ZW50IGZyb20gYSBjYWxsYmFjaycsIDExLCBmdW5jdGlvbihhc3NlcnQpe1xuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGVybWFuZW50LWZpeHR1cmUnKTtcbiAgICBhc3NlcnQub2soY29udGFpbmVyIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQsICdUaGUgY29udGFpbmVyIGV4aXN0cycpO1xuXG4gICAgdmFyIGNvbXBvbmVudENvbnRlbnQgPSBmdW5jdGlvbiBjb21wb25lbnRDb250ZW50KGRhdGEpe1xuXG4gICAgICAgIGFzc2VydC5vayh0eXBlb2YgZGF0YSA9PT0gJ29iamVjdCcsICdUaGUgYXJndW1lbnQgaXMgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgY29tcG9uZW50IGF0dHJpYnV0ZXMnKTtcbiAgICAgICAgYXNzZXJ0Lm9rKHR5cGVvZiBkYXRhLmZvbyA9PT0gJ3N0cmluZycsICdUaGUgYXJndW1lbnQgaXMgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlIGZvbyBhdHRyaWJ1dGUnKTtcbiAgICAgICAgYXNzZXJ0Lm9rKHR5cGVvZiBkYXRhLnJlcGVhdCA9PT0gJ3N0cmluZycsICdUaGUgYXJndW1lbnQgaXMgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlIHJlcGVhdCBhdHRyaWJ1dGUnKTtcblxuICAgICAgICB2YXIgY29udGVudCA9ICcnO1xuICAgICAgICB2YXIgdGltZXMgICA9IHBhcnNlSW50KGRhdGEucmVwZWF0IHx8IDApO1xuICAgICAgICB3aGlsZSh0aW1lcy0tKXtcbiAgICAgICAgICAgIGNvbnRlbnQgKz0gYDxsaT4ke2RhdGEuZm9vfTwvbGk+YDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYDx1bD4ke2NvbnRlbnR9PC91bD5gO1xuICAgIH07XG5cbiAgICBhc3NlcnQuZXF1YWwoY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ2YtY29udGVudCB1bCcpLmxlbmd0aCwgMCwgJ1RoZSBjb21wb25lbnQgZG9lcyBub3QgY29udGFpbiBhIGxpc3QnKTtcblxuICAgIGZ3YygnY29udGVudCcpXG4gICAgICAgIC5vbignZXJyb3InLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignY3JlYXRlJywgZnVuY3Rpb24oZWx0KXtcblxuICAgICAgICAgICAgdmFyIGZDb250ZW50ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2YtY29udGVudCcpO1xuICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChmQ29udGVudCwgZWx0LCAnVGhlIGNhbGxiYWNrIGVsdCBpcyB0aGUgZ2l2ZW4gbm9kZScpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZDb250ZW50LnJlcGVhdCwgJzInLCAnVGhlIHJlcGVhdCB2YWx1ZSBpcyAyJyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZkNvbnRlbnQuZm9vLCAnbW9vJywgJ1RoZSBmb28gdmFsdWUgaXMgbW9vJyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZWx0LnF1ZXJ5U2VsZWN0b3JBbGwoJ3VsJykubGVuZ3RoLCAxLCAnVGhlIGNvbXBvbmVudCBjb250YWlucyBub3cgYSBsaXN0Jyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZWx0LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpJykubGVuZ3RoLCAyLCAnVGhlIGNvbXBvbmVudCBjb250YWlucyBub3cgMiBsaXN0IGl0ZW1zJyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZWx0LnF1ZXJ5U2VsZWN0b3IoJ2xpOmZpcnN0LWNoaWxkJykudGV4dENvbnRlbnQsICdtb28nLCAnVGhlIGxpc3QgaXRlbXMgaGF2ZSB0aGUgZm9vIHZhbHVlJyk7XG5cbiAgICAgICAgICAgIFFVbml0LnN0YXJ0KCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRycygnZm9vJywgJ3JlcGVhdCcpXG4gICAgICAgIC5jb250ZW50KGNvbXBvbmVudENvbnRlbnQpXG4gICAgICAgIC5yZWdpc3RlcigpO1xufSk7XG5cblFVbml0LmFzeW5jVGVzdCgnQ29tcG9uZW50IHdpdGggZHluYW1pYyBjb250ZW50IGZyb20gYSB0ZW1wbGF0ZScsIDgsIGZ1bmN0aW9uKGFzc2VydCl7XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwZXJtYW5lbnQtZml4dHVyZScpO1xuICAgIGFzc2VydC5vayhjb250YWluZXIgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCwgJ1RoZSBjb250YWluZXIgZXhpc3RzJyk7XG5cbiAgICB2YXIgaGVsbG9UcGwgPSByZXF1aXJlKCcuL2hlbGxvLnRwbCcpO1xuICAgIGFzc2VydC5vayh0eXBlb2YgaGVsbG9UcGwgPT09ICdmdW5jdGlvbicsICdUaGUgdGVtcGxhdGUgZnVuY3Rpb24gZXhpc3RzJyk7XG5cbiAgICBhc3NlcnQuZXF1YWwoY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ2YtZHluY29udGVudCBoMScpLmxlbmd0aCwgMCwgJ1RoZSBjb21wb25lbnQgZG9lcyBub3QgY29udGFpbiBhbiBoMScpO1xuXG4gICAgZndjKCdkeW5jb250ZW50JylcbiAgICAgICAgLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjcmVhdGUnLCBmdW5jdGlvbihlbHQpe1xuXG4gICAgICAgICAgICB2YXIgZkR5bkNvbnRlbnQgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignZi1keW5jb250ZW50Jyk7XG4gICAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsKGZEeW5Db250ZW50LCBlbHQsICdUaGUgY2FsbGJhY2sgZWx0IGlzIHRoZSBnaXZlbiBub2RlJyk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmRHluQ29udGVudC53aG8sICd3b3JsZCcsICdUaGUgYXR0cmlidXRlIHdobyBoYXMgdGhlIHdvcmxkIHZhbHVlJyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ2YtZHluY29udGVudCBoMScpLmxlbmd0aCwgMSwgJ1RoZSBjb21wb25lbnQgY29udGFpbnMgYW4gaDEnKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZEeW5Db250ZW50LnRleHRDb250ZW50LnRyaW0oKSwgJ0hlbGxvIHdvcmxkJywgJ1RoZSBlbGVtZW50IGhhcyB0aGUgY29udGVudCBmcm9tIHRoZSB3aG8gYXR0cmlidXRlJyk7XG5cbiAgICAgICAgICAgIGZEeW5Db250ZW50LndobyA9IFwiQmVydHJhbmRcIjtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwoZkR5bkNvbnRlbnQudGV4dENvbnRlbnQudHJpbSgpLCAnSGVsbG8gQmVydHJhbmQnLCAnVGhlIGVsZW1lbnQgaGFzIHRoZSB1cGRhdGVkIGNvbnRlbnQnKTtcbiAgICAgICAgICAgICAgICBRVW5pdC5zdGFydCgpO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKCd3aG8nLCB7IHVwZGF0ZTogdHJ1ZSB9KVxuICAgICAgICAuY29udGVudChoZWxsb1RwbClcbiAgICAgICAgLnJlZ2lzdGVyKCk7XG59KTtcblxuUVVuaXQubW9kdWxlKCdleHRlbmQnKTtcblxuUVVuaXQuYXN5bmNUZXN0KCdFeHRlbmQgYW4gYW5jaG9yJywgNSwgZnVuY3Rpb24oYXNzZXJ0KXtcbiAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Blcm1hbmVudC1maXh0dXJlJyk7XG4gICAgYXNzZXJ0Lm9rKGNvbnRhaW5lciBpbnN0YW5jZW9mIEhUTUxFbGVtZW50LCAnVGhlIGNvbnRhaW5lciBleGlzdHMnKTtcblxuICAgIHZhciBsaW5rID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYS5saW5rJyk7XG5cbiAgICBmd2MoJ2xpbmsnKVxuICAgICAgICAub24oJ2Vycm9yJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ2NyZWF0ZScsIGZ1bmN0aW9uKGVsdCl7XG5cbiAgICAgICAgICAgIHZhciBmbGluayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5mbGluaycpO1xuXG4gICAgICAgICAgICBhc3NlcnQub2soZmxpbmsgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCwgJ1RoZSBjb21wb25lbnQgaXMgYW4gSFRNTEVsZW1lbnQnKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhmbGluayBpbnN0YW5jZW9mIEhUTUxBbmNob3JFbGVtZW50LCAnVGhlIGNvbXBvbmVudCBpcyBhbiBIVE1MQW5jaG9yRWxlbWVudCcpO1xuXG4gICAgICAgICAgICBhc3NlcnQub2sobGluay5ocmVmICE9PSAnIycsIFwiQW5jaG9yJ3MgaHJlZiB1c2UgZ2V0dGVyL3NldHRlciB0byBjaGFuZ2UgdGhlIHZhbHVlXCIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZsaW5rLmhyZWYsIGxpbmsuaHJlZiwgXCJUaGUgZXh0ZW5kZWQgY29tcG9uZW50IHVzZXMgYmFzZSBjb21wb25lbnQgZ2V0dGVyL3NldHRlclwiKTtcblxuICAgICAgICAgICAgUVVuaXQuc3RhcnQoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmV4dGVuZCgnYScpXG4gICAgICAgIC5yZWdpc3RlcigpO1xufSk7XG5cblxuUVVuaXQuYXN5bmNUZXN0KCdFeHRlbmQgYW5vdGhlciBjb21wb25lbnQnLCAzLCBmdW5jdGlvbihhc3NlcnQpe1xuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGVybWFuZW50LWZpeHR1cmUnKTtcbiAgICBhc3NlcnQub2soY29udGFpbmVyIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQsICdUaGUgY29udGFpbmVyIGV4aXN0cycpO1xuXG4gICAgZndjKCd1cHBlcicpXG4gICAgICAgIC5vbignZXJyb3InLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignY3JlYXRlJywgZnVuY3Rpb24oZWx0KXtcbiAgICAgICAgICAgIGFzc2VydC5vayhmYWxzZSwgJ3RoZSBwYXJlbnQgZWxlbWVudCBzaG91bGQgbm90IGJlIGNyZWF0ZWQnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmFjY2VzcygnYmFyJywge1xuICAgICAgICAgICAgZ2V0KHZhbCl7XG4gICAgICAgICAgICAgICAgdmFsID0gdmFsIHx8ICcnO1xuICAgICAgICAgICAgICAgcmV0dXJuIHZhbC50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAucmVnaXN0ZXIoKTtcblxuICAgIGZ3Yygnc3VwZXJ1cCcpXG4gICAgICAgIC5vbignY3JlYXRlJywgZnVuY3Rpb24oZWx0KXtcblxuICAgICAgICAgICAgdmFyIGZzdXBlcnVwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN1cGVydXAnKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChmc3VwZXJ1cCwgZWx0LCAnVGhlIGNhbGxiYWNrIGVsdCBpcyB0aGUgZ2l2ZW4gbm9kZScpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGVsdC5iYXIsICdCQVInLCAnU3VwZXIgZWxlbWVudCBwcm90b3R5cGUgaGFzIGJlZW4gZXh0ZW5kZWQnKTtcblxuICAgICAgICAgICAgUVVuaXQuc3RhcnQoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmV4dGVuZCgndXBwZXInKVxuICAgICAgICAucmVnaXN0ZXIoKTtcbn0pO1xuXG5RVW5pdC5tb2R1bGUoJ05hdGl2ZSBldmVudHMnKTtcblxuUVVuaXQudGVzdCgnb24gY2xpY2snLCAzLCBmdW5jdGlvbihhc3NlcnQpe1xuICAgIHZhciBkb25lID0gYXNzZXJ0LmFzeW5jKCk7XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwZXJtYW5lbnQtZml4dHVyZScpO1xuICAgIGFzc2VydC5vayhjb250YWluZXIgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCwgJ1RoZSBjb250YWluZXIgZXhpc3RzJyk7XG5cbiAgICBmd2MoJ25hdGl2ZScpXG4gICAgICAgIC5vbignZXJyb3InLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignY3JlYXRlJywgZnVuY3Rpb24oZWx0KXtcblxuICAgICAgICAgICAgdmFyIGZOYXRpdmUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdmLW5hdGl2ZScpO1xuICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChmTmF0aXZlLCBlbHQsICdUaGUgY2FsbGJhY2sgZWx0IGlzIHRoZSBnaXZlbiBub2RlJyk7XG5cbiAgICAgICAgICAgIGZOYXRpdmUuY2xpY2soKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uKGVsdCl7XG5cbiAgICAgICAgICAgIHZhciBmTmF0aXZlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZi1uYXRpdmUnKTtcbiAgICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwoZk5hdGl2ZSwgZWx0LCAnVGhlIGNhbGxiYWNrIGVsdCBpcyB0aGUgZ2l2ZW4gbm9kZScpO1xuXG4gICAgICAgICAgICBkb25lKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5yZWdpc3RlcigpO1xufSk7XG4iXX0=
