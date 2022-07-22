var getRandomValues = require('get-random-values');

function shuffle(a) {
   var n = a.length,                   // The number of items left to shuffle (loop invariant)
       r = new Uint8Array(n),          // Some random values
        k, t;
    getRandomValues(r);
    while (n > 1) {
        k = r[n-1] % n;                 // 0 <= k < n
        t = a[--n];                     // swap elements n and k
        a[n] = a[k];
        a[k] = t;
    }
    return a;                           // for a fluent API
}

module.exports = shuffle;