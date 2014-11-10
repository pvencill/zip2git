'use strict';

var convict = require('convict'),
    path    = require('path');

// define a schema
var conf = convict({
  env: {
    doc: 'The applicaton environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
    arg: 'env'
  },
  remote:{
    doc:'The git remote URL to merge into',
    env:'GIT_REMOTE',
    arg:'remote'
  },
  message:{
    doc:'The commit message',
    default:'Unzipping %s into %s',
    arg:'message'
  }
});

module.exports = conf;