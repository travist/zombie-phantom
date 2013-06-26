Zombie Phantom
-----------------------

This is a Node.js package that provides a Zombie.js shim around the PhantomJS headless
browser.  The motivation behind this package is that when looking for a headless
browser solution, I really liked the API of Zombie.js as well as the full Node.js
support behind it, however it is not a full WebKit browser.  PhantomJS on the other
hand is a better technology in terms of headless browser, but does not have a
native Node.js integration.  The <a href="https://github.com/alexscheelmeyer/node-phantom">Node Phantom</a>
package integrates the PhantomJS into the Node.js framework, but what it doesn't
do, and likely so, is provide a better API like the Zombie.js framework.

This package simply attempts to act as a drop-in replacement for Zombie.js but
using the PhantomJS headless browser.

<strong>NOTE: THIS PACKAGE IS STILL INCOMPLETE AND IS NOT A FULL DROP-IN REPLACEMENT
FOR ZOMBIE.JS</strong>

Installation
========================

Step 1
============
Install node.js by going to http://nodejs.org

Step 2
============
Install PhantomJS by going to http://phantomjs.org/download.html

Step 3
============
Install this package using Node Package Manager (npm)

```
npm install zombie-phantom
```

Differences between Zombie.js
=========================
Using this library is going to be 'similar' to using Zombie.js.  I couldn't make
it an exact replica of Zombie.js due to the nature of the asynchronous behavior
of interacting with any API within PhantomJS.  For example, to get the text of
an element on the page looks like the following in both Zombie.js and this module.

<strong>Zombie.js</strong>
```
var Browser = require('zombie');
var browser = new Browser({
  site: 'http://localhost:8888'
});

browser.visit('/user/login', function() {
  var text = browser.text('h1');
  console.log(text);
});
```

Whereas in Zombie-Phantom, everything is asynchronous... like so.

<strong>Zombie-Phantom</strong>
```
var Browser = require('zombie');
var browser = new Browser({
  site: 'http://localhost:8888'
});

browser.visit('/user/login', function() {
  browser.text('h1', function(text) {
    console.log(text);
  });
});
```

Using query, queryAll, and xpath
=================================
Another big difference is that this library does not return actual DOM elements
which you can use to manipulate.  It does however, return an index into a DOM
array within the PhantomJS browser which you can use to perform the same actions
as you would with Zombie.js.  It is easier to think of this index as a DOM element
ID which you return back to the library to do stuff... Here is an example.

```
var _ = require('underscore');
var async = require('async');
var Browser = require('zombie');
var browser = new Browser({
  site: 'http://localhost:8888'
});

browser.visit('/user/login', function() {
  browser.query('h1.title', function(title) {

    // title is actually an ID to a DOM element here, not an actual element.
    // But, I can still pass it along to the browser API like I would and it
    // will still work by referencing the DOM element within PhantomJS.
    browser.xpath('..//label', title, function(labels) {

      // labels is actually just an array of ID's here, but I can still use them
      _.each(labels, function(label) {
        drupal.browser.text(label, function(text) {
          console.log(text);
        });
      });
    });
  });
});
```

Promises using Async.js
==========================
As you can tell, the promise system from Zombie.js has not been implemented,
however, you can replicate this functionality using the <a href="https://github.com/caolan/async">Async.js</a>
library.  Here is an example of using the promises from async to turn what
was once callback hell into an easy to follow series of executions.

<strong>example.js</strong>
```
var Browser = require('zombie-phantom');
var async = require('async');

var browser = new Browser({
  site: 'http://localhost:8888'
});

// Current this library does not support promises, but you can use async.series
// to get something similar...

async.series([
  function(done) { browser.visit('/user/login', done); },
  function(done) { browser.fill('#user-name', 'admin', done); },
  function(done) { browser.fill('#user-pass', '123password', done); },
  function(done) { browser.pressButton('#edit-submit', done); },
  function(done) { browser.visit('/node/add/article', done); },
  function(done) { browser.fill('#edit-title', 'This is a test!', done); },
  function(done) { browser.pressButton('#edit-submit', done) }
], function() {
  console.log('Content Created!');
  browser.close();
});

```
Please contribute to make this project better.
