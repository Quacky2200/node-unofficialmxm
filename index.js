var request = require('request');
var cheerio = require('cheerio');
var user_agent = 'Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:48.0) Gecko/20100101 Firefox/48.0';
const HOST = 'https://www.musixmatch.com';
/*
 * Get's lyrics to a song from MusixMatch using the title and artist name
 * param {String} title
 * param {String} artists
 * param {Function} callback(err, lyrics)
 */
module.exports = function(title, artists, callback){
	var url = HOST + '/search/' + title.replace(/(\'| - .*| \(.*)/i, '') + ' ' + artists.split(', ')[0] + '#';
	req(
		url, 
		function(err, $){
			if (err) return callback(err);
			var result = $('.tracks.list .track-card:not(.has-add-lyrics) a.title:first-child');
			if (!result || result.length < 1) {
				callback(new Error('No result could be found'));
				return;
			}
			req(HOST + $(result[0]).attr('href'), function(err, $){
				var lyrics = '';
				$('.mxm-lyrics__content').each(function(){
					lyrics += $(this).text() + '\n';
				});
				callback(null, {
					title: $('.mxm-track-title__track').text(),
					artist: $('.mxm-track-title__artist').text(),
					lyrics: lyrics
				});
			});
		}
	);
};
//Request function with the user-agent and status code 'protection'
req = function(url, callback){
	request(
		{
			url: url,
			headers: {
				'User-Agent': user_agent
			}
		},
		function(err, resp, html){
			if (err || resp.statusCode !== 200){
				callback((err ? err : new Error(resp.statusCode, resp)));
				return;
			}
			callback(null, cheerio.load(html));
		}
	);
};