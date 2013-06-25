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
  this.page = null;
  this.phantom = phantom;
  this.phantomInstance = null;
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
        callback.call(self, page);
      });
    });
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
          callback();
        });
      }
      else {
        callback();
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
      jQuery(object.selector).val(object.value);
      return true;
    }, function(error, object) {
      callback();
    }, {
      selector: selector,
      value: value
    });
  });
};

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
      jQuery(selector).click();
      return true;
    }, function() {
      self.loading = true;
      self.wait(callback);
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
      jQuery(selector).attr('checked', 'checked');
      return true;
    }, function(error, object) {
      callback();
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
      jQuery(selector).removeAttr("checked");
      return true;
    }, function(error, object) {
      callback();
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

Zombie.prototype.close = function() {
  if (this.phantomInstance) {
    this.phantomInstance.exit();
  }
};

// Add this class to the exports.
module.exports = Zombie;
