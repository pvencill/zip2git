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
    subDir = dir + '/' + subDir;
        if(isNullOrEmpty(remote)){
          return cb(new Error('You must provide both directory and a string URI to a git repository'));
        }
        var gitAdd = spawn('git',['add', '.']);
        gitAdd.on('error', cb);
        gitAdd.stdout.on('data', function(data) {console.log('gitAdd.stdout: ' + data);});
        gitAdd.stderr.on('data', function(data) {console.log('gitAdd.stderr: ' + data);});
        gitAdd.on('close', function(code){
            if(code !== 0) return cb(new Error('gitAdd process exited with code '+code));

            // git add successfully complete, now commit
            console.log('gitAdd complete, now commiting');
            var commitMsg = options.commitMsg ? options.commitMsg : 'Zippadee Doo Da Zip2Git';
            var gitCommit = spawn('git',['commit','-am '+commitMsg]);
            gitCommit.on('error', cb);
            gitCommit.stdout.on('data', function(data) {console.log('gitCommit.stdout: ' + data);});
            gitCommit.stderr.on('data', function(data) {console.log('gitCommit.stderr: ' + data);});
            gitCommit.on('close', function(code){
                if(code !== 0) return cb(new Error('gitCommit process exited with code '+code));
                //git commit successfully complete, now push
                console.log('gitCommit complete, now pushing');
                var gitPush= spawn('git',['push']);
                gitPush.on('error', cb);
                gitPush.stdout.on('data', function(data) {console.log('gitPush.stdout: ' + data);});
                gitPush.stderr.on('data', function(data) {console.log('gitPush.stderr: ' + data);});
                gitPush.on('close', function(code){
                    if(code !== 0) return cb(new Error('gitPush process exited with code '+code));
                    //git push complete successfully, now return callback
                    console.log('gitPush complete, now calling cb');
                    return cb();
                })

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
    temp.track();
    temp.mkdir('git-temp', function(e, dir){
        if(e) return cb(e);
        chdir(dir, function(){
            console.log('************ temp dir =', dir);
            var clone = spawn('git',['clone',remote,'./']);
            clone.stderr.on('data', function (data) { console.log('clone.stderr: ' + data); });
            clone.stdout.on('data', function (data) { console.log('clone.stdout: ' + data); });
            clone.on('error', function(err){console.log('err', err); cb('error')});
            clone.on('close', function(code){
                //clone complete
                if(code !== 0)
                    return cb(new Error('Git clone process exited with code '+code));
                console.log('clone complete');
                var unzipper = unzip.Extract({path: dir});
                unzipper.on('error', cb);
                unzipper.on('close', function(code){
                    //unzip complete, now call updateRepo to do git operations
                    updateRepo(dir, remote, options, cb);
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
