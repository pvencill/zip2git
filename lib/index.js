'use strict';

var temp = require('temp'),
      inherits = require('util').inherits,
      fs       = require('fs'),
      config = require('../config'),
      spawn = require('child_process').spawn,
      _          = require('lodash'),
      unzip = require('unzip');

function Zip2Git(options){
  options = _.defaults(options || {}, _.omit(config, 'env', 'remote'));
}

function isNullOrEmpty(value){
  return (value === null || value === undefined) ||
    (_.isString(value) ? value.length === 0 : true);
}

Zip2Git.prototype.commit = function(archive, remote, cb){
  if(isNullOrEmpty(archive) || isNullOrEmpty(remote)){
    return cb(new Error('You must provide both an archive filepath or string and a string URI to a git repository'));
  }

  temp.track();
  temp.mkdir('git-temp', function(e, dir){
    if(e) return cb(e);

    var clone = spawn('git',['clone',remote]);
    clone.on('error', cb);
    clone.on('close', function(code){
      if(code !== 0) return cb(new Error('Process exited with code '+code));

      if(_.isString(archive)){
        archive = fs.createReadStream(archive)
        .on('error', cb);  // this feels naughty; should we really go after any path?
      }
      // todo: actually do the things.
      cb();
    });
  });
};


module.exports = Zip2Git;
