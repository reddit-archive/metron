funnel
======

[![travis-ci status](https://travis-ci.org/ajacksified/funnel.svg)](http://travis-ci.org/ajacksified/funnel)

Simple configuration-based web server. Data goes into the funnel, and out to
a data store. As simple as can be.

See [./sample](./sample) for example usage.

The Longer Description
======================

I needed a simple web server that I could send metrics to from the frontend (or
backend, or whatever). For example, you might want to track browser performance
data to track page load times, or you might want to store the results of
experiments in your own data center.

This allows you to write a simple javascript config file to set up a whitelist
of stats, and set up a data storage adapter for those stats. (For browser perf
data, you might just have it go to statsd; for experiments, you might use
Hive or something else.)

How to Use Funnel
=================

Create a configuration file.

If my `config.js` looked like:

```javascript
/* pseudocode for creating a statsd connection */
var statsd = require('statsd');
var statsdConnection = statsd({ })

var statsdStore = function(name, val, config){
  statsd.send(config.dataType, name, val);
}
/* end statsd pseudocode */

var config = {
  // The port to run the funnel server on
  port: 8000,

  // The list of data segments to store. A segment is way to categorize
  // individual parameters.
  segments: {
    // You can specify a datastore at the segment or at the parameter level.
    dataStore: statsdStore,

    // Our first segment, `rum`.
    rum: {
      // This is a sample definition for the `pageLoadTime` parameter in the
      // `rum` segment.
      //
      // You can specify a number of options to format and filter the values
      // before they hit your data store. You can also add any arbitrary keys
      // you might want sent to your datastore or validation, such as a statsd
      // data type.
      pageLoadTime: {
        type: 'integer', // string, float, date
        min: 0,
        max: 10000,
        format: function(val){ },
        validate: function(val){ },

        // datastore: dataStoreOverride

        /* options useful for strings: */
        // length: 10,
        // truncate: 10,
        // format: function(val, config){ }

        // Example custom paramete:
        dataType: 'timer'
      }
    }
  }
}

module.exports = config;
```

I could write a `server.js` like:

```javascript
var Funnel = require('funnel');
var funnel = new Funnel(require('./config'));

funnel.start();

console.log('server started at ' + funnel.get('port'));
```

I could then POST json data (or GET, using a `?data=<json>` querystring) to
`localhost:8000`. For example:

```
POST localhost:8000
  Content-Type: application/json

  { "rum" : { "pageLoadTime" : 600 } }
```

Which would then, in our example, use our `statsdStore` to send data.

Notes
=====

Funnel doesn't currently deal with rate limiting, so you may want to stick an
nginx in front to handle being hammered. You're also on your own for
implementing data adapters; you may want to batch multiple stat requests from a
single request as well.

License
=======
[MIT](./LICENSE). Copyright 2014 Jack Lawson.

