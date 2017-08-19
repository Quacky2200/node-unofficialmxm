const HOST = 'https://www.musixmatch.com';
var request = require('request');

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
	"%a %t"
];


/*
 * Get's lyrics to a song from MusixMatch using the title and artist name
 * param {String} title
 * param {String} artists
 * param {Function} callback(err, lyrics)
 */
function getLyrics(title, artists, callback){

	if (!title && !artists) {
		return callback(new Error('Unable to search without title and artist!'), null);
	}

	var format = search_format[getRandomInt(0, search_format.length)];
	/* Remove anything typically at the end, for example '- 1984 version', '(feat. Kelly)'
	 * Then only get anything that's a word or apostrophe in the string
	 * Finally join the word array into a sentence
	 * Examples: 
	 * Fairytale of New York (feat. Kirsty MacColl) -> Fairytale of New York
	 * Hark! The Herald Angels Sing/Gloria (In Excelsis Deo) -> Hark The Herald Angels Sing
	 * Grinch Introduction/ The Grinch/ “You’re a Mean One, Mr. Grinch” -> Grinch Introduction
	 * Hey Ya! - Radio Mix / Club Mix -> Hey Ya
	 * 5, 6, 7, 8 -> 5 6 7 8
	 * (I've Got A) Golden Ticket -> I've Got A Golden Ticket
	 */
	var trackName = (title ? title.replace(/( \- | \(|\/)(.*)/, '').match(/[\w\'\-\.\*]+/g).join(' ') : '');
	var artistName = artists.split(', ')[0].match(/(?:(?![^\w ]).)*/)[0];
	
	format = '/search/' + encodeURIComponent(format.replace('%t', trackName).replace('%a', artistName));

	var url = HOST + format + '#';
	var j = request.jar();
	var headers = {url: url, jar: j, headers: {'User-Agent': user_agents[getRandomInt(0, user_agents.length)]}};

	setTimeout(() => {
		request(headers, (err, resp, html) => {
			if (err || resp.statusCode !== 200) return callback((err ? err : new Error(resp.statusCode, resp)));

			// Search for JS results that uses promises instead of just JSON.
			var results = html.match(/<script>var __mxmProps = {[^\b]+(?:"allResults":({[^\b]+})}<\/script>)/)[1];

			if (!results) {
				return callback(new Error('Search results could not be parsed due to a change in the regex format'));
			}

			// I hate eval just as much as you do
			var searchResults;
			try {
				searchResults = eval(`(function() {return ${results}}())`);
			} catch (e) {
				return callback(new Error('The search results parsed contain a format error: ' + e + '\n' + html + '\n'));
			}
			if (!searchResults) {
				return callback(new Error('The search results parsed were empty'));
			}
			searchResults = searchResults.tracks.attributes;

			// Only grab relevent search results by our title name
			results = searchResults.filter((current) => {
				var ctitle = (current.track.track_name || '').toLowerCase().replace(/(\’|\`)/g, '\'');
				var cartist = (current.track.artist_name || '').toLowerCase();
				var stitle = title.toLowerCase().replace(/(\’|\`)/g, '\'');
				var strackname = trackName.toLowerCase().replace(/(\’|\`)/g, '\'');
				var sartist = artistName.toLowerCase().replace(/(\’|\`)/g, '\'');

				/*
				 * Allow for short searches, for example...
				 * 'Pyro' and 'Casc' -> Pyromania by CASCADA
				 * 'Edge of Glory' and 'Gaga' -> The Edge Of Glory by Lady Gaga
				 * 
				 */
				var isRelevantTrack = ctitle.indexOf(stitle) > -1 || ctitle.indexOf(strackname) > -1;
				return (isRelevantTrack && cartist.indexOf(sartist) > -1) || isRelevantTrack;
			});


			if(!results || results.length < 1) return callback(new Error('No result could be found'));

			headers.url = results[0].track.track_share_url; 
			setTimeout(() => {
				request(headers, (err, resp, html) => {

					var mxmResult = JSON.parse(html.match(/var __mxmState = ({.*});/m)[1]);

					if (!!mxmResult.page.track.restricted || !!mxmResult.page.lyrics.lyrics.restricted) {
						return callback(new Error('Lyrics are restricted'))
					} else if (!mxmResult.page.track.hasLyrics && !mxmResult.page.lyrics.lyrics.body){
						return callback(new Error('No lyrics have been assigned to this song'))
					} else {
						return callback(null, {
							name: mxmResult.page.track.name, 
							artists: mxmResult.page.track.artistName, 
							lyrics: mxmResult.page.lyrics.lyrics.body,
							url: mxmResult.page.track.shareUrl,
							updatedTime: mxmResult.page.track.updatedTime
						});
					}
				});
			}, getRandomInt(100, 500));
		});
	}, getRandomInt(100, 500));
	// Look like a human by delaying the final choice - 5 seconds is not good but needs to be done :/
	// Look like a human by using cookies inbetween pages
	// Look like a human by using a user agent similar to normal user
	// Look human by inputing different strings?
}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
module.exports = getLyrics;
