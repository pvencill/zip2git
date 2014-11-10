'use strict';
var schema = require('./schema'),
      _ = require('lodash');

module.exports = _.transform(schema._def,
  function(result,  num, key){
    result[key] = schema.get(key);
  });