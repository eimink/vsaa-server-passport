"use strict";

module.exports.findOne = function(username, done) {
	// get user from db
	global.db.user.findOne({"name":username}, function (err, res){
		if(err || !res)
			return done(err,false);
		else {
			res.verifyPassword = function(password) {
					if (this.password == password)
						return true;
					else
						return false;
			};
			return done(err, res);
		}
	});
}

