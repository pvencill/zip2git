'use strict';

var temp = require('temp'),
      inherits = require('util').inherits,
      fs       = require('fs'),
      config = require('../config'),
      EventEmitter2 = require('eventemitter2').EventEmitter2,
      spawn = require('child_process').spawn,
      _          = require('lodash'),
      unzip = require('unzip');

function Zip2Git(options){
  options = _.defaults(options || {}, _.omit(config, 'env', 'remote'));
  EventEmitter2.call(this,{wildcard: true});
}
inherits(Zip2Git,EventEmitter2);


Zip2Git.prototype.commit = function(archive, remote, cb){
  var events = this;

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
      if(_.isString(archive)){
        archive = fs.createReadStream(archive)
        .on('error', function(e){
          events.emit('zip.error', e);
        });  // this feels naughty; should we really go after any path?
      }
    });
  });
};


module.exports = Zip2Git;