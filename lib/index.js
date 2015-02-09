'use strict';

var _ = require('lodash');
var async = require('async');
var chdir = require('chdir');
var config = require('../config');
var fs = require('fs');
var fse = require('fs-extra');
var inherits = require('util').inherits;
var spawn = require('child_process').spawn;
var temp = require('temp');
var unzip = require('unzip');

function Zip2Git(options){
  options = _.defaults(options || {}, _.omit(config, 'env', 'remote'));
}

function isNullOrEmpty(value){
  return (value === null || value === undefined) ||
    (_.isString(value) ? value.length === 0 : true);
}

function mvContents(srcDir, destDir, cb) {
    fse.copy(srcDir, destDir, function(e){
        if(e) return cb(e);
        return cb();
    })
}

function findRootDir(srcDir, cb){
    fs.readdir(srcDir, function(err, files){
        if(files.length === 1){
            fs.lstat(srcDir+'/'+files[0], function(e, stats){
                if(e) return cb(e);
                if(stats.isDirectory()) return cb(null, srcDir+'/'+files[0]);
                return cb(null, srcDir);
            })
        }
        else {
            var dirCount = 0;
            var rootDir = srcDir;
            async.each(files, function(file, callback){
                if(_.indexOf(config.excludeFiles, file)!==-1) return callback(); //This excludes hidden files from normal OS
                fs.lstat(srcDir+'/'+file, function(e, stats){
                    if(!stats.isDirectory()) return callback('Root Not Directory');
                    else{
                        dirCount += 1;
                        if (dirCount > 1) return callback('Root Not Directory');
                        else {
                            rootDir = srcDir+'/'+file;
                            return callback();
                        }
                    }
                });
            }, function(err){
                if(err==='Root Not Directory') return cb(null, srcDir);
                if(err) return cb(err);
                return cb(null, rootDir);
            });
        }
    });
}

function unzipArchive(archive, destDir, cb) {
    temp.track();
    temp.mkdir('zip-temp', function(e, zipDir){
        if(e) return cb(e);
        var unzipper = unzip.Extract({path: zipDir});
        unzipper.on('error', function(e){return cb(e)});
        unzipper.on('close', function(code){
            findRootDir(zipDir, function(e, rootDir){
                if(e) return cb(e);
                return mvContents(rootDir, destDir, cb);
            });
        });

        if(_.isString(archive)){
            fs.createReadStream(archive).pipe(unzipper);
        }
        else archive.pipe(unzipper);
    });

}

/*
*   updateRepo completes the following workflow:
*        1) changes directory to the provided dir
*        2) git add --all
*        3) git commit -am <commit message> <--this can be the options.commitMsg or the default
*        4) git push
*/
function updateRepo(dir, remote, options, cb){
    var debugOn = process.env.DEBUG_ZIP2GIT;
    if(isNullOrEmpty(remote)){
      return cb(new Error('You must provide both directory and a string URI to a git repository'));
    }
    var gitAdd = spawn('git',['--git-dir='+dir+'/.git','--work-tree='+dir,'add', '.']);
    gitAdd.on('error', cb);
    if(debugOn) gitAdd.stdout.on('data', function(data) {console.log('gitAdd.stdout: ' + data);});
    if(debugOn) gitAdd.stderr.on('data', function(data) {console.log('gitAdd.stderr: ' + data);});
    gitAdd.on('close', function(code){
        if(code !== 0) return cb(new Error('gitAdd process exited with code '+code));

        // git add successfully complete, now commit
        console.log('gitAdd complete, now commiting');
        var commitMsg = options.commitMsg ? options.commitMsg : 'Zippadee Doo Da Zip2Git';
        var gitCommit = spawn('git',['--git-dir='+dir+'/.git','--work-tree='+dir,'commit','-am '+commitMsg]);
        gitCommit.on('error', cb);
        if(debugOn) gitCommit.stdout.on('data', function(data) {console.log('gitCommit.stdout: ' + data);});
        if(debugOn) gitCommit.stderr.on('data', function(data) {console.log('gitCommit.stderr: ' + data);});
        gitCommit.on('close', function(code){
            if(code !== 0) return cb(new Error('gitCommit process exited with code '+code));
            //git commit successfully complete, now push
            console.log('gitCommit complete, now pushing');
            var gitPush= spawn('git',['--git-dir='+dir+'/.git','--work-tree='+dir,'push','origin',(options.branch || 'master')]);
            gitPush.on('error', cb);
            if(debugOn) gitPush.stdout.on('data', function(data) {console.log('gitPush.stdout: ' + data);});
            if(debugOn) gitPush.stderr.on('data', function(data) {console.log('gitPush.stderr: ' + data);});
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
*            -Defaults to 'Zippadee Doo Da Zip2Git'
*       branch [String]- Git branch to target for the zip
*            -Defaults to 'master'
*/
Zip2Git.prototype.commit = function(archive, remote, options, callback){
    var debugOn = process.env.DEBUG_ZIP2GIT;
    if(isNullOrEmpty(archive) || isNullOrEmpty(remote)){
        return callback(new Error('You must provide both an archive filepath or string and a string URI to a git repository'));
    }
    if(typeof(options)==='function' && !callback) {
        callback=options;
        options = {};
    }
    temp.track();
    temp.mkdir('git-temp', function(e, dir){
        if(e) return callback(e);
        async.series([
            function(cb){
                //clone the repo
                var clone = spawn('git',['clone','-b'+(options.branch || 'master'),remote, dir]);
                if(debugOn) clone.stderr.on('data', function (data) { console.log('clone.stderr: ' + data); });
                if(debugOn) clone.stdout.on('data', function (data) { console.log('clone.stdout: ' + data); });
                clone.on('error', function(err){console.log('err', err); return cb('error')});
                clone.on('close', function(code){
                    //clone complete
                    if(code !== 0) return cb(new Error('Git clone process exited with code '+code));
                    return cb();
                });
            },
            function(cb){
                //unzip the file and copy to the dir
                unzipArchive(archive, dir, function(err){
                    if(err) return cb(err);
                    return cb();
                });
            },
            function(cb){ updateRepo(dir, remote, options, cb); }],
            function(e, results){ return callback(e); }
        );
    });
};

module.exports = Zip2Git;
