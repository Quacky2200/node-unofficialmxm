# node-unofficialmxm
An unofficial MusixMatch scraper to get lyrics with only the title and artist metadata
##Usage
```
var mxm = require('node-unofficialmxm');

mxm('Bring Me To Life', 'Evanescence', function(err, result){
  if(err) return console.log(err);
  
  var maxLines = result.lyrics.split('\n').length;
  
  console.log('Found lyrics for:\n\tSong Name: ' + result.title + '\n\tSong Artist: ' + result.artist + '\n\tRandom line: "' + result.lyrics.split('\n')[getRandomInt(0, maxLines)] + '"');
});

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

```

##Expected Result:
![Result](https://cloud.githubusercontent.com/assets/4623599/18055152/a2a8b10e-6dfe-11e6-99a6-b35d0a9c4c4d.png)
