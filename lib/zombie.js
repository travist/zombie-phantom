var phantom = require('node-phantom');
var _ =       require('underscore');

/**
 * Create the Zombie shim around the PhantomJS browser.
 *
 * @param {type} options
 * @returns {Zombie}
 */
var Zombie = function(options, callback) {

  // Provide some default options.
  options = options || {};
  options = _.extend({
    addJQuery: true,
    jQuery: 'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js',
    site: ''
  }, options);

  this.options = options;
  this.parameters = options.parameters;
  this.page = null;
  this.phantom = phantom;
  this.phantomInstance = null;
};

/**
 * Initialize the page with the node array to manage all the resource ID's.
 *
 * @param {object} page
 *   The page object to initialize.
 * @param {function} callback
 *   A callback function to call once the page is initialized.
 */
Zombie.prototype._initializePage = function(page, callback) {
  page.evaluate(function() {

    // Add an array of DOM nodes for context lookups.
    window.phNodes = [];

    // Returns the jQuery node provided the selector and context.
    window.phQuery = function(selector, context) {
      selector = isNaN(selector) ? selector : window.phNodes[selector];
      context = isNaN(context) ? context : window.phNodes[context];
      var query = jQuery(selector, context);
      query.phNodes = [];
      query.each(function() {
        query.phNodes.push(window.phNodes.length);
        window.phNodes.push(this);
      });
      return query;
    };

    // Return the evaluate.
    return true;
  }, function() {
    callback();
  });
};

/**
 * Private(ish) method to get the current page of PhantomJS.
 *
 * @param {function} callback
 *   Called when the page is retrieved.
 *
 * @returns {object}
 *   The PhantomJS Page.
 */
Zombie.prototype._getPage = function(callback) {
  var self = this;
  if (!this.page) {
    var params = {};
    if (this.parameters) {
      params.parameters = this.parameters;
    }
    phantom.create(function(error, inst) {
      self.phantomInstance = inst;
      inst.createPage(function(error, page) {
        page.onLoadStarted = function() {
          self.loading = true;
        };
        page.onLoadFinished = function() {
          self.loading = false;
        };
        self.page = page;
        self._initializePage(page, function() {
          callback.call(self, page);
        });
      });
    }, params);
  }
  else {
    callback.call(this, this.page);
  }
};

/**
 * Wait for a page to load and callback when it is done.
 *
 * @param {function} callback
 *   Called when the page is done loading.
 */
Zombie.prototype.wait = function(callback) {
  var self = this;
  if (this.loading) {
    setTimeout(function() {
      self.wait(callback);
    }, 100);
  }
  else {
    callback();
  }
  return this;
};

/**
 * Visit a webpge.
 *
 * @param {string} url
 *   The url to visit.
 * @param {function} callback
 *   Called when the browser has visited the url.
 */
Zombie.prototype.visit = function(url, callback) {
  var self = this;
  this._getPage(function(page) {
    page.open(this.options.site + url, function() {
      if (self.options.addJQuery) {
        page.includeJs(self.options.jQuery, function(err) {
          self._initializePage(page, callback);
        });
      }
      else {
        self._initializePage(page, callback);
      }
    });
  });
};

/**
 * Fill an item at a selector with a value.
 *
 * @param {string} selector
 *   A sizzle selector for the element you wish to fill.
 * @param {string} value
 *   The value of the element you wish to fill.
 * @param {function} callback
 *   A callback function to call when it is done.
 */
Zombie.prototype.fill = function(selector, value, callback) {
  this._getPage(function(page) {
    page.evaluate(function(object) {
      return phQuery(object.selector).val(object.value).phNodes;
    }, function(error, nodes) {
      callback(error, nodes);
    }, {
      selector: selector,
      value: value
    });
  });
};

/**
 * Clicks on a link.
 *
 * @param {string} selector
 *   The sizzle selector of what you wish to click.
 * @param {function} callback
 *   Called when the item has been clicked.
 */
Zombie.prototype.clickLink = function(selector, callback) {
  var self = this;
  this._getPage(function(page) {
    page.evaluate(function(selector) {
      window.location.href = phQuery(selector).attr('href');
      return true;
    }, function() {
      self.loading = true;
      self.wait(function() {
        self._initializePage(page, callback);
      });
    }, selector);
  });
}

/**
 * Press a button within the page.
 *
 * @param {string} selector
 *   A sizzle selector of the button you wish to press.
 * @param {function} callback
 *   A callback function to be called when the button is pressed.
 */
Zombie.prototype.pressButton = function(selector, callback) {
  var self = this;
  this._getPage(function(page) {
    page.evaluate(function(selector) {
      return phQuery(selector).click();
    }, function() {
      self.loading = true;
      self.wait(function() {
        self._initializePage(page, callback);
      });
    }, selector);
  });
};

/**
 * Select an option on the page.
 *
 * @param {string} selector
 *   A sizzle selector of what you wish to select on the page.
 * @param {string} value
 *   The value of what you wish to select.
 * @param {function} callback
 *   A function to be called when the item is selected.
 */
Zombie.prototype.select = function(selector, value, callback) {
  this.fill(selector, value, callback);
};

/**
 * Checks a checkbox.
 *
 * @param {string} selector
 *   A sizzle selector of what you wish to check.
 * @param {function} callback
 *   Called when the check has been performed.
 */
Zombie.prototype.check = function(selector, callback) {
  this._getPage(function(page) {
    page.evaluate(function(selector) {
      return phQuery(selector).attr('checked', 'checked').phNodes;
    }, function(error, nodes) {
      callback(error, nodes);
    }, selector);
  });
};

/**
 * Unchecks a checkbox on the page.
 *
 * @param {string} selector
 *   A sizzle selector of what you wish to uncheck.
 * @param {function} callback
 *   Called when the element has been unchecked.
 */
Zombie.prototype.uncheck = function(selector, callback) {
  this._getPage(function(page) {
    page.evaluate(function(selector) {
      return phQuery(selector).removeAttr("checked").phNodes;
    }, function(error, nodes) {
      callback(error, nodes);
    }, selector);
  });
};

/**
 * Chooses a radio element on the page.
 *
 * @param {string} selector
 *   The sizzle selector of what you wish to choose.
 * @param {function} callback
 *   Called when the element has been chosen.
 */
Zombie.prototype.choose = function(selector, callback) {
  this.check(selector, callback);
};

/**
 * Return the html of an item on the page.
 *
 * @param {type} selector
 * @param {type} context
 * @param {type} callback
 * @returns {undefined}
 */
Zombie.prototype.html = function(selector, context, callback) {
  if ((typeof callback === 'undefined') && (typeof context === 'function')) {
    callback = context;
    context = null;
  }

  this._getPage(function(page) {
    page.evaluate(function(item) {
      return phQuery(item.selector, item.context).html();
    }, function(error, html) {
      callback(html);
    }, {
      selector: selector,
      context: context
    });
  });
};

/**
 * Execute a callback within the PhantomJS context.
 *
 * @param {type} expression
 * @param {type} callback
 * @returns {undefined}
 */
Zombie.prototype.execute = function(expression, callback, args) {
  this._getPage(function(page) {
    page.evaluate(expression, callback, args);
  });
};

/**
 * Evaluate an expression and return the result.
 *
 * @param {type} expression
 * @param {type} callback
 * @returns {undefined}
 */
Zombie.prototype.evaluate = function(expression, callback) {
  this._getPage(function(page) {
    page.evaluate(function(expression) {
      return eval(expression);
    }, function(error, result) {
      callback(result);
    }, expression);
  });
};

/**
 * Evaluates the CSS selector against the document (or context node) and return
 * array of nodes.
 *
 * @param {string} selector
 *   The sizzle selector of the nodes to retrieve.
 * @param {object} context
 *   The DOM context object to refine your query against.
 * @param {function} callback
 *   Called when the query has returned the nodes.
 */
Zombie.prototype.queryAll = function(selector, context, callback) {
  if ((typeof callback === 'undefined') && (typeof context === 'function')) {
    callback = context;
    context = null;
  }

  this._getPage(function(page) {
    page.evaluate(function(item) {
      return phQuery(item.selector, item.context).phNodes;
    }, function(error, nodes) {
      callback(nodes);
    }, {
      selector: selector,
      context: context
    });
  });
};

/**
 * Evaluates the CSS selector against the document (or context node) and
 * return an element.
 *
 * @param {type} selector
 * @param {type} context
 * @param {type} callback
 * @returns {undefined}
 */
Zombie.prototype.query = function(selector, context, callback) {
  if ((typeof callback === 'undefined') && (typeof context === 'function')) {
    callback = context;
    context = null;
  }

  this._getPage(function(page) {
    page.evaluate(function(item) {
      return phQuery(item.selector, item.context).phNodes;
    }, function(error, nodes) {
      callback(nodes ? nodes[0] : null);
    }, {
      selector: selector,
      context: context
    });
  });
};

/**
 * Returns the text contents of the selected element.
 *
 * @param {type} selector
 * @param {type} context
 * @param {type} callback
 * @returns {undefined}
 */
Zombie.prototype.text = function(selector, context, callback) {
  if ((typeof callback === 'undefined') && (typeof context === 'function')) {
    callback = context;
    context = null;
  }

  this._getPage(function(page) {
    page.evaluate(function(item) {
      return phQuery(item.selector, item.context).text();
    }, function(error, text) {
      callback(text);
    }, {
      selector: selector,
      context: context
    });
  });
};

/**
 * Evaluates the XPath expression against the document (or context node) and
 * return the XPath result.
 *
 * @param {string} expression
 *   An xpath expression.
 * @param {object} context
 *   The context to perform the xpath evaluate.
 */
Zombie.prototype.xpath = function(expression, context, callback) {
  if ((typeof callback === 'undefined') && (typeof context === 'function')) {
    callback = context;
    context = null;
  }

  this._getPage(function(page) {
    page.evaluate(function(item) {
      var context = isNaN(item.context) ? document : window.phNodes[item.context];
      var result = document.evaluate(item.expression, context);
      var nodes = [], node = null;
      while(node = result.iterateNext()) {
        nodes.push(window.phNodes.length);
        window.phNodes.push(node);
      }
      return nodes;
    }, function(error, nodes) {
      callback(nodes);
    }, {
      expression: expression,
      context: context
    });
  });
};

/**
 * Close the browser.
 */
Zombie.prototype.close = function() {
  if (this.phantomInstance) {
    this.phantomInstance.exit();
  }
};

// Add this class to the exports.
module.exports = Zombie;
