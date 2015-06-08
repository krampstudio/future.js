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

QUnit.asyncTest('Component with dynamic content from an HTML template', 4, function (assert) {
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    var htpl = document.getElementById('htpl');

    fwc('hcontent').on('create', function (elt) {

        var fHontent = container.querySelector('f-hcontent');
        assert.deepEqual(fHontent, elt, 'The callback elt is the given node');

        assert.equal(elt.querySelectorAll('p').length, 1, 'The component contains now a paragraph');
        assert.equal(elt.innerHTML, htpl.innerHTML, 'The component content is the same as the template');

        QUnit.start();
    }).content(htpl).register();
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
//# sourceMappingURL=test.bundle.js.map
