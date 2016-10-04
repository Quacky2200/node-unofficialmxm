var request = require('request');
var cheerio = require('cheerio');
var user_agents = [
	"Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:48.0) Gecko/20100101 Firefox/48.0", //Ubuntu Firefox
	"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36", //Windows 10 Chrome Generic
	"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36", //Windows 7 Chrome Generic
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36", //Chrome OS X Generic
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/601.7.7 (KHTML, like Gecko) Version/9.1.2 Safari/601.7.7", //Safari OS X Generic
	"Mozilla/5.0 (Windows NT 10.0; WOW64; rv:48.0) Gecko/20100101 Firefox/48.0", //Firefox Windows 10
	"Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko", //IE 11 Windows 7
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36", //Chrome Linux
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586", //Edge Windows 10
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/51.0.2704.79 Chrome/51.0.2704.79 Safari/537.36", //Chromium Ubuntu
	"Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0; Trident/5.0)", //IE 9 Windows 7
	"Opera/9.80 (Windows NT 6.1; WOW64) Presto/2.12.388 Version/12.16" //Opera Windows 7
];
var search_format = [
	"%t - %a",
	"%t %a",
	"%a %t",
    "%a \"%t\""
];
const HOST = 'https://www.musixmatch.com';
/*
 * Get's lyrics to a song from MusixMatch using the title and artist name
 * param {String} title
 * param {String} artists
 * param {Function} callback(err, lyrics)
 */
function getLyrics(title, artists, callback){
	var format = search_format[getRandomInt(0, search_format.length)];
	var trackName = title.replace(/(\'| - .*| \(.*)/i, '');
	var artistName = artists.split(', ')[0];
	format = '/search/' + format.replace('%t', trackName).replace('%a', artistName);
	var url = HOST + format + '#';
	var j = request.jar();
	var headers = {url: url, jar: j, headers: {'User-Agent': user_agents[getRandomInt(0, user_agents.length)]}};
	setTimeout(() => {
		request(headers, (err, resp, html) => {
			if (err || resp.statusCode !== 200) return callback((err ? err : new Error(resp.statusCode, resp)));
			var $ = cheerio.load(html);
			var result = $('.tracks.list .track-card:not(.has-add-lyrics) a.title:first-child');
			if (!result || result.length < 1) return callback(new Error('No result could be found'));
			headers.url = HOST + $(result[0]).attr('href');
			setTimeout(() => {
				request(headers, (err, resp, html) => {
					var lyrics = '';
					$ = cheerio.load(html);
					$('.mxm-lyrics__content').each(function(){
						lyrics += $(this).text() + '\n';
					});
					//Get a gramatically correct artist list and title from the meta description (normally provided for SEO)
					//Description example: Lyrics for I Love to Laugh by Edwynn, Julie Andrews & Dick Van Dyke. I love to laugh...
					//Match: Lyrics for {song title} by {song artist(s) (seperated by comma's and finally an ampersand)}.
					if($('.mxm-lyrics-not-available')) return callback(new Error('Lyrics are not available for this song'));
					var songInfo = $('meta[name=\'description\']').attr('content').match(/(?:Lyrics for )([\w \.\'\-\(\)]+) by ([\w \,\&\'\-\(\)]+)\./)
					callback(null, {
						title: songInfo[1],
						artist: songInfo[2],
						lyrics: lyrics
					});
				});
			}, getRandomInt(100, 500));
		});
	}, getRandomInt(100, 500));
	//Look like a human by delaying the final choice - 5 seconds is not good but needs to be done :/
	//Look like a human by using cookies inbetween pages
	//Look like a human by using a user agent similar to normal user
	//Look human by inputing different strings?
}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
module.exports = getLyrics;
