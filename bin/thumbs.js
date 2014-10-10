var fs = require('fs'),
	path = require('path'),
	events = require('events'),
	emitter = new events.EventEmitter(),
	http = require('http'),
	yaml = require('yaml-front-matter'),

	paths = {
		images: path.normalize(__dirname + '/../images'),
		posts: path.normalize(__dirname + '/../_posts')
	}
;

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

fs.readdir(paths.posts, function(err, files) {

	if (err) return console.log(err);

	files.forEach(function(file) {
		emitter.emit('loadFile', file);
	});

});

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

emitter.on('loadFile', function(file) {

	fs.readFile(path.join(paths.posts, file), 'utf-8', function(err, data) {
		if (err) return console.error(err);

		emitter.emit('requestVideo', yaml.loadFront(data).vimeo);
	});

});

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

emitter.on('requestVideo', function(id) {

	http.get('http://vimeo.com/api/v2/video/' + id + '.json', function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			var data;

			try {
				data = JSON.parse(chunk);
			} catch (err) {
				console.log(err);
				console.log('http://vimeo.com/api/v2/video/' + id + '.json');
				return;
			}

			emitter.emit('saveImage', data[0].thumbnail_large, id + '.jpg');
		});
	});

});

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

emitter.on('saveImage', function(url, filename) {

	http.get(url, function(response) {
		var imagedata = '';

		response.setEncoding('binary');
		response.on('data', function(chunk) {
			imagedata += chunk;
		});

		response.on('end', function() {
			fs.writeFile(path.join(paths.images, filename), imagedata, 'binary', function(err) {
				if (err) return console.error(err);
				console.log(filename + ' was saved.');
			});
		});
	});

});