var zip = require('../');
var zippy = new zip();


var firefly = function(err) { if(err) console.log('err=',err); else console.log('success');}
var remote = process.env.ZIP_TEST_REMOTE;

console.log('cwd=', process.cwd());
zippy.commit('../testzip.zip', remote,{commitMsg:'third'},firefly);
