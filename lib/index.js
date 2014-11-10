'use strict';

var temp = require('temp'),
      inherits = require('util').inherits,
      fs       = require('fs'),
      config = require('./config'),
      EventEmitter2 = require('eventemitter2').EventEmitter2,
      spawn = require('child_process').spawn,
      _          = require('lodash'),
      unzip = require('unzip');

function Zip2Git(archive, remote, options, cb){
  var events = this;
  if(_.isFunction(options)){
    cb = options;
    options = null;
  }
  if(!options){
    options = _.omit(config, 'env', 'remote');
  }
  if(_.isString(archive))
    archive = fs.createReadStream(archive);  // this feels naughty; should we really go after any path?

  events.emit('zip.start');
  temp.track();
  temp.mkdir('git-temp', function(e, dir){
    if(e) return events.emit('zip.error', e);

    events.emit('zip.temp', dir);
    var clone = spawn('git',['clone',remote]);
    clone.on('error', function(e){
      events.emit('clone.error', e);
    });
    clone.on('close', function(code){
      if(code !== 0) return events.emit('clone.error', new Error('Process exited with code '+code));
      events.emit('clone.complete');

    });
  });
}

inherits(Zip2Git,EventEmitter2);

module.exports = Zip2Git;