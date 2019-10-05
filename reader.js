/*
 * [{src:<url>,type:0}]
 */

var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

var execKeyFrame = function(properties, options, callback) {

	properties[0] = properties.from || properties[0];
	properties[1] = properties.to || properties[1];

	var duration = options.duration || 0;
	var delay = options.delay || 0;
	var timingFunction = options.timingFunction;

	var keys = Object.keys(properties).sort(), length = keys.length;

	var start;
	requestAnimationFrame(function process(timestamp) {

		var progress = !start && ( start = timestamp) ? 0 : Math.min((timestamp - start) / duration, 1);

		var range = progress == 1 ? length - 2 : 0;

		if (progress !== 0 && progress !== 1)
			for (var i = 0; i < length; i++)
				keys[i] <= progress && keys[i + 1] > progress && ( range = i);

		var from = properties[keys[range]], to = properties[keys[range + 1]];
		var subKeys = Object.keys(from), subLength = subKeys.length;

		var rate = timingFunction ? cubicBezier(timingFunction[0], timingFunction[1], timingFunction[2], timingFunction[3], progress) : progress;

		var returnMap = {};
		for (var i = 0; i < subLength; i++) {
			var key = subKeys[i];
			var originalValue = from[key];
			returnMap[key] = originalValue + (to[key] - originalValue) * (rate - keys[range]) / (keys[range + 1] - keys[range]);
		}

		callback(returnMap, progress, progress < 1 ? requestAnimationFrame(process) : null);
	});
};

var cubicBezier = function(x1, y1, x2, y2, x) {
	if (x == 1 || x == 0)
		return x;
	var error, t = x;
	do {
		error = 3 * t * x1 * Math.pow(1 - t, 2) + 3 * x2 * (1 - t) * Math.pow(t, 2) + Math.pow(t, 3) - x;
		t -= error / (3 * x1 * Math.pow(1 - t, 2) + 6 * t * (1 - t) * (x2 - x1) + 3 * t * t * (1 - x2));
	} while (Math.abs(error) > 1e-3);
	return 3 * t * y1 * Math.pow(1 - t, 2) + 3 * y2 * (1 - t) * Math.pow(t, 2) + Math.pow(t, 3);
};

execKeyFrame({
	0 : {
		width : 0
	},
	1 : {
		width : 1
	}
}, {
	duration : 100,
	timingFunction : [.06, .92, .95, .03]
}, function(returnMap, progress) {
	console.log(progress + ':' + returnMap.width);
});

var precedence = {
	'(' : -1,
	'sin' : 0,
	'^' : 0,
	'*' : 1,
	'/' : 1,
	'+' : 2,
	'-' : 2
};

var toPostfix = function(input) {
	var output = [], stack = [];
	for (var index = 0, length = input.length; index < length; index++) {
		var token = input[index];
		if (isFinite(token))
			output.push(token);
		else {
			var last = stack[stack.length - 1];
			if (stack.length == 0 || precedence[token] < precedence[last]) {
				stack.push(token);
			} else {
				output.push(stack.pop());
			}
		}
	}
};

var toPostfix = function(input) {
	var stack = [], output = [];
	for (var index = 0, length = input.length; index < length; index++) {
		var token = input[index];
		if (isFinite(token))
			output.push(token);
		else if (token === ')') {
			for (var stackIndex = stack.length; stackIndex--; ) {
				var stackToken = stack[stackIndex];
				if (stackToken == '(') {
					stack.pop();
					if (stack[stackIndex - 1] === 'sin')
						output.push(stack.pop());
					break;
				}
				output.push(stack.pop());
			}
		} else if (token === '^' || token === 'sin') {
			stack.push(token);
		} else {
			var stackLength = stack.length;
			if (stack[stackLength - 1] == '(' || !stackLength || precedence[token] < precedence[stack[stackLength - 1]]) {
				stack.push(token);
			} else {
				for (var i = stack.length; i--; ) {
					if (stack[i] === '(') {
						break;
					}
					if (precedence[token] >= precedence[stack[i]])
						output.push(stack.pop());
				}
				stack.push(token);
			}
		}
	}
	for (var index = stack.length, length = output.length; index--; output[length++] = stack[index]);
	return output;
};

console.log('test start;');
console.log(toPostfix('( 5 + 5 * sin ( 5 - 2 ) / 8 ) * 3'.split(' ')).join(''));
console.log('test over;');

var WorldBuilder = function(canvas) {
	this.data = [];
	this.properties = {
		gravity : 10
	};
	this.canvas = canvas;
};

var getPlanePosition = function(c, o, e, xAxis, yAxis, zAxis) {
	var a = {
		x : xAxis,
		y : yAxis,
		z : zAxis
	}, d = {
		x : Math.cos(o.y * Math.PI / 180) * (Math.sin(o.z * Math.PI / 180) * (a.y - c.y) + Math.cos(o.z * Math.PI / 180) * (a.x - c.x)) - Math.sin(o.y * Math.PI / 180) * (a.z - c.z),
		y : Math.sin(o.x * Math.PI / 180) * (Math.cos(o.y * Math.PI / 180) * (a.z - c.z) + Math.sin(o.y * Math.PI / 180) * (Math.sin(o.z * Math.PI / 180) * (a.y - c.y) + Math.cos(o.z * Math.PI / 180) * (a.x - c.x))) + Math.cos(o.x * Math.PI / 180) * (Math.cos(o.z * Math.PI / 180) * (a.y - c.y) - Math.sin(o.z * Math.PI / 180) * (a.x - c.x)),
		z : Math.cos(o.x * Math.PI / 180) * (Math.cos(o.y * Math.PI / 180) * (a.z - c.z) + Math.sin(o.y * Math.PI / 180) * (Math.sin(o.z * Math.PI / 180) * (a.y - c.y) + Math.cos(o.z * Math.PI / 180) * (a.x - c.x))) - Math.sin(o.x * Math.PI / 180) * (Math.cos(o.z * Math.PI / 180) * (a.y - c.y) - Math.sin(o.z * Math.PI / 180) * (a.x - c.x))
	};
	return {
		x : (d.x - e.x) * (e.z / d.z),
		y : (d.y - e.y) * (e.z / d.z)
	};
}
var render = function(context, data, current) {
	var instant = {};
	for (var i = 0, len = data.length; i < len; i++) {
		instant[Math.sqrt(Math.pow(Math.sqrt(Math.pow(data[i].x - current.x, 2) + Math.pow(data[i].y - current.y, 2)), 2) + Math.pow(data[i].z, 2))] = data[i];
	}
	var precedence = Object.keys(instant).sort().reverse();
	var returnValue = [];
	for (var i = len; i--; ) {
		returnValue.push(getPlanePosition({
			x : 0,
			y : 0,
			z : 0
		}, {
			x : 180,
			y : 180,
			z : 180
		}, {
			x : 0,
			y : 0,
			z : 100
		}, instant[precedence[i]].x, instant[precedence[i]].y, instant[precedence[i]].z));
	}
	return returnValue;
};

window.addEventListener('load', function() {
	var w = new WorldBuilder();
	w.data.push({
		x : 10,
		y : 10,
		z : 10,
		type : '222'
	});
	w.data.push({
		x : 10,
		y : 10,
		z : 20,
		type : 'aaa'
	});
	w.data.push({
		x : 10,
		y : 10,
		z : 30,
		type : '050'
	});
	console.log(render(document.getElementById('a').getContext('2d'), w.data, {
		x : 0,
		y : 0,
		z : 100
	}));
});
