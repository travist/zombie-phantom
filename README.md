Zombie Phantom
-----------------------

This is a Node.js package that provides a Zombie.js shim around the PhantomJS headless
browser.  The motivation behind this package is that when looking for a headless
browser solution, I really liked the API of Zombie.js as well as the full Node.js
support behind it, however it is not a full WebKit browser.  PhantomJS on the other
hand is a better technology in terms of headless browser, but does not have a
native Node.js integration.  The ![Node Phantom](https://github.com/alexscheelmeyer/node-phantom)
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

Usage
=========================
Using this library is going to be 'similar' to using Zombie.js.  The only major
difference is that 1) Not all of the API's have been implemented yet, and also
2.) The promise system in Zombie.js is not implemented.  You can, however, reproduce
the promise system pretty easily using the ASYNC library.

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