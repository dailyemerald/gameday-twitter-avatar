var express = require('express')
  , cheerio = require('cheerio')
  , request = require('request')
  , memjs = require('memjs')
  , client = memjs.Client.create()
  , app = express();

var time_since = function(init_time) {
	return (new Date()).getTime() - init_time;
}

app.get('/twitter/:nickname', function(req, res) {	
	var start_time = (new Date()).getTime();
	var nickname = req.params.nickname;
	client.get(nickname, function(err, value) {
		if (value) {
			console.log("HIT: ", nickname, "in", time_since(start_time), "ms");
			res.redirect(value.toString());
		} else {
			get_avatar_url(nickname, function(err, url) {
				if (!err) {
					console.log("MISS: ", nickname, "in", time_since(start_time), "ms");					
					res.redirect(url);
					client.set(nickname, url);
				} else {
					console.log("err in get_avatar_url:", err, "in", time_since(start_time), "ms");
					res.send(500, err);
				}
			});
		}
	});
});

app.get('/twitter/:nickname/clear', function(req, res) {
	client.delete(req.params.nickname, function(err, val) {
		res.json({err: err, val: val});
	})
});

var get_avatar_url = function(nickname, callback) {
	var url = "https://twitter.com/" + nickname; // TODO: is this safe?
	request(url, function(err, resp, body) {
		if (!err) {
			var $ = cheerio.load(body);
			var images = $('.profile-header-inner img');
			var image_url = images[0].attribs.src; // TODO: robust?
			callback(null, image_url);
		} else {
			callback(err, null);
		} 
	});
}

app.listen(process.env.PORT || 3000);