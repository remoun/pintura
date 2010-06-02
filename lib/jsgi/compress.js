/**
 * JSGI app that GZIPs the response
 */
exports.Compress = function(nextApp){
	return function(request){
		var encoding = 'gzip';
		if ((request.headers['accept-encoding']||'').indexOf(encoding) >= 0) {
			// so far only node.js provides compression module
			var Gzip = require('compress').Gzip;
			if (Gzip) {
				return require('promise').when(nextApp(request), function(response){
					// skip if already encoded
					if (response.headers['content-encoding'] || response.status == 204) return response;
					// substitute the body
					var data = response.body;
					response.body = {
						encoding: 'binary',
						forEach: function(write){
							var zipper = new Gzip;
							zipper.init();
							var s = '';
							data.forEach(function(chunk){
								//write(zipper.deflate(chunk, 'binary'));
								s += zipper.deflate(chunk, 'binary');
							});
							//write(zipper.end());
							s += zipper.end();
							write(s);
						}
					};
					// mark content as encoded
					response.headers['content-encoding'] = encoding;
					return response;
				});
			}
		}
		return nextApp(request);
	};
};