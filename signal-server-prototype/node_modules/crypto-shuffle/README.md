# crypto-shuffle
[![Travis build status](https://travis-ci.org/richardschneider/crypto-shuffle.svg)](https://travis-ci.org/richardschneider/crypto-shuffle)
[![Coverage Status](https://coveralls.io/repos/github/richardschneider/crypto-shuffle/badge.svg?branch=master)](https://coveralls.io/github/richardschneider/crypto-shuffle?branch=master)
[![npm version](https://badge.fury.io/js/crypto-shuffle.svg)](https://www.npmjs.com/package/crypto-shuffle) 


A cryptographically secure shuffle using the modern [Fisher-Yates algorithm](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle).  The browser's (or Node.js) crypto services are used to generate strong random numbers;  see [get-random-values](https://github.com/KenanY/get-random-values) for more details. 

## Getting started

**crypto-shuffle** is available for both Node.js and the browser.  Most modern browsers are supported.  If you want to know if your browser is compatible, run the [online test suite](https://rawgit.com/richardschneider/crypto-shuffle/master/test/index.html).

Install with [npm](http://blog.npmjs.org/post/85484771375/how-to-install-npm)

    > npm install crypto-shuffle --save

### Node

Include the package and the shuffle a deck of cards

    var shuffle = require('crypto-shuffle')
    
    var deck = ["AS", "KS", "QS", "JS", "TS", "9S"]
    shuffle(deck)
    console.log(deck)

### Browser

Include the package from your project

    <script src="./node_modules/crypto-shuffle/dist/crypto-shuffle.min.js" type="text/javascript"></script>

Or better yet, from the [unpkg CDN](https://unpkg.com)

    <script src="https://unpkg.com/crypto-shuffle/dist/crypto-shuffle"></script>

This will provide `shuffle` as a global object, or `define` it if you are using [AMD](https://en.wikipedia.org/wiki/Asynchronous_module_definition).

    <script>
        var deck = ["AS", "KS", "QS", "JS", "TS", "9S"]
        shuffle(deck)
        alert(deck)
    </script>
