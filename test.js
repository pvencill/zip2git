var zip2git = require('../zip2git');
var zippy = new zip2git;
zippy.commit('/Users/sfpurdy/Dev/IRS/wombat2.zip','git@git.irslabs.org:sfpurdy/wombat', function(e){if(e) console.log('error: ',e); else console.log('success');  })
