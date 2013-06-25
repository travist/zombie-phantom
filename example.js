var Browser = require('./lib/zombie.js');
var async = require('async');

var browser = new Browser({
  site: 'http://localhost:8888',
  addJQuery: false  // The page I am navigating already has jQuery.  Don't include your own version.
});

// Current this library does not support promises, but you can use async.series
// to get something similar...

async.series([
  function(done) { browser.visit('/user/login', done); },
  function(done) { browser.fill('#edit-name', 'admin', done); },
  function(done) { browser.fill('#edit-pass', '123password', done); },
  function(done) { browser.pressButton('#edit-submit', done); },
  function(done) { browser.visit('/node/add/article', done); },
  function(done) { browser.fill('#edit-title', 'This is a test!', done); },
  function(done) { browser.pressButton('#edit-submit', done) }
], function() {
  console.log('Content Created!');
  browser.close();
});
