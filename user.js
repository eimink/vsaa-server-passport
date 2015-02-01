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

module.exports.register = function(username,email,password) {
	var random = Math.floor(Math.random() * 100001);
    var timestamp = (new Date()).getTime();
    var salt = random + "DERP" + timestamp; // tweak this
	global.db.user.insert({'username': username, 'email': email,'password':generateToken(password),'salt':salt},function (err, res){
	if (err || !res)
		return false;
	else
		return true;
	});
}

module.exports.delete = function(username,email,password) {
	global.db.user.remove({'username': username, 'email': email,'password':generateToken(password)},function (err, res){
	if (err || !res)
		return false;
	else
		return true;
	});
}

function generateToken(data, salt) {
    var sha256 = crypto.createHmac("sha256", salt);
    return sha256.update(data).digest("base64");
}
