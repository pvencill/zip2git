var Zip2Git = require('../');
var should = require('should');

// TODO: need a test archive
// Need a test git repo
// Need to reset the git repo to the initial commit before the successful commit tests kick off

function expectError(done){
  return function(e){
    should.exist(e);
    done();
  };
}

describe('#commit', function(){
  var z2g = new Zip2Git();
  describe('with null inputs', function(){
    it('should emit a standard error event', function(done){
      z2g.commit(null, null, expectError(done));
    });
  });

  describe('with empty string inputs', function(){
    it('should emit a standard error event', function(done){
      z2g.commit('', '', expectError(done));
    });
  });

  describe('with good inputs', function(){
    it('should put nonexistent files from the zip archive into the repository');
    it('should modify existing files to match what is in the zip archive');
  });
});