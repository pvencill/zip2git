'use strict';

var temp = require('temp'),
      inherits = require('util').inherits,
      fs       = require('fs'),
      config = require('../config'),
      spawn = require('child_process').spawn,
      _          = require('lodash'),
      chdir = require('chdir'),
      unzip = require('unzip');

function Zip2Git(options){
  options = _.defaults(options || {}, _.omit(config, 'env', 'remote'));
}

function isNullOrEmpty(value){
  return (value === null || value === undefined) ||
    (_.isString(value) ? value.length === 0 : true);
}

/*
*   updateRepo completes the following workflow:
*        1) changes directory to the provided dir
*        2) git add --all
*        3) git commit -am <commit message> <--this can be the options.commitMsg or the default
*        4) git push
*/
function updateRepo(dir, remote, options, cb){
    var subDir = remote[remote.length-1]==='/' ? remote.split('/')[remote.split('/').length-2] : remote.split('/')[remote.split('/').length-1];
    debugger;
    chdir(dir+'/'+subDir, function(){
        if(isNullOrEmpty(remote)){
          return cb(new Error('You must provide both directory and a string URI to a git repository'));
        }
        debugger;
        var gitAdd = spawn('git',['add'],['.']);
        gitAdd.on('error', cb);
        gitAdd.stdout.on('data', function(data) {console.log('stdout: ' + data);});
        gitAdd.stderr.on('data', function(data) {console.log('stdout: ' + data);});
        gitAdd.on('close', function(code){
            if(code !== 0) return cb(new Error('gitAdd process exited with code '+code));

            // git add successfully complete, now commit
            debugger;
            var commitMsg = options.commitMsg ? options.commitMsg : 'Zippadee Doo Da Zip2Git';
            var gitCommit = spawn('git',['commit','-am '+commitMsg]);
            gitCommit.on('error', cb);
            gitCommit.on('close', function(code){
                if(code !== 0) return cb(new Error('gitCommit process exited with code '+code));

                //git commit successfully complete, now push
                debugger;
                var gitPush= spawn('git',['push']);
                gitPush.on('error', cb);
                gitPush.on('close', function(code){
                    if(code !== 0) return cb(new Error('gitPush process exited with code '+code));
                    //git push complete successfully, now return callback
                    return cb();
                })

            });
        });
    });
}

/*
*   Zip2Git.commit options:
*       commitMsg [String]- A custom message to include as the git commit message
            -Defaults to 'Zippadee Doo Da Zip2Git'
*/
Zip2Git.prototype.commit = function(archive, remote, options, cb){
    if(isNullOrEmpty(archive) || isNullOrEmpty(remote)){
        return cb(new Error('You must provide both an archive filepath or string and a string URI to a git repository'));
    }
    if(typeof(options)==='function' && !cb) {
        cb=options;
        options = {};
    }
    debugger;

    temp.track();
    temp.mkdir('git-temp', function(e, dir){
        if(e) return cb(e);
        console.log('************ temp dir =', dir);
        chdir(dir, function(){
            debugger;
            var clone = spawn('git',['clone',remote]);
            clone.on('error', cb);
            clone.on('close', function(code){
                //clone complete
                if(code !== 0) return cb(new Error('Git clone process exited with code '+code));
                var unzipper = unzip.Extract({path: dir});
                unzipper.on('error', cb);
                unzipper.on('close', function(code){
                    //if(code !== 0) return cb(new Error('Unzip process exited with code '+code));
                    //unzip complete
                    //todo: git add and commit
                    updateRepo(dir, remote, options, cb);
                    console.log('unzip complete!!!');
                });

                if(_.isString(archive)){
                    fs.createReadStream(archive).pipe(unzipper);
                }
                else archive.pipe(unzipper);
            });
        });
    });
};


module.exports = Zip2Git;
