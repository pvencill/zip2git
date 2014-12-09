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
    env: 'ZIP_GIT_MSG'
    arg:'message'
  },
  username:{
    doc:'The username to use for git tranactions',
    default: '',
    env: 'ZIP_GIT_USER',
    arg: 'zip-git-user'
  },
  password:{
      doc:'The password to use for git tranactions',
      default: '',
      env: 'ZIP_GIT_PWD',
      arg: 'zip-git-pwd'
  },
});

module.exports = conf;
