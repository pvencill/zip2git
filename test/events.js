var Zip2Git = require('../');

describe('#commit', function(){
  describe('with null inputs', function(){
    var z2g = new Zip2Git();
    it('should emit a standard error event', function(done){
      z2g.on('error', function(e){
        done();
      });

      z2g.commit();
    });
  });

  describe('with empty string inputs', function(){
    var z2g = new Zip2Git();
    it('should emit a standard error event', function(done){
      z2g.on('error', function(e){
        done();
      });

      z2g.commit('', '');
    });
  });
});