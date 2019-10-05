(function(window, undefined) {
	var GraphPaper = function(canvas, scale, originX, originY) {
		this.context = (this.canvas = canvas).getContext('2d');
		this.scale = scale;
		this.originX = originX;
		this.originY = originY;
		render(this.context, canvas.width, canvas.height, scale, originX, originY, this.equations = []);
	};

	var parse = function(expr) {
		var lHS = (expr = expr.replace(/\s/g, '').match(/^(x|y)([<>]?=|<|>)(.+)$/i))[1], rHS = expr[3];

		var callback = function(unknown) {
			var expr = rHS.replace(lHS == 'x' ? /y/g : /x/g, '(' + unknown + ')').replace(/[+-](?=\()/g, '$&1').replace(/[)0-9](?=\()/g, '$&*');

			while (expr.indexOf('(') > -1) {
				expr = expr.replace(/\(([^()]+)(?:\)|$)/g, function(str, expr) {
					return calc(expr);
				});
			}

			return calc(expr);
		};

		callback.subject = lHS;
		callback.operator = expr[2];

		return callback;
	};

	var calc = function(expr) {
		if (isFinite(expr))
			return expr * 1;

		var terms = ( expr = expr.replace(/([0-9])([a-z])/gi, '$0*$1').replace(/([+-]?\d*\.?\d+)\^([+-]?\d*\.?\d+)/g, function(str, base, index) {
			return Math.pow(base, index);
		}).replace(/(a?(?:sin|cos|tan)|log)([+-]?\d*\.?\d+)/g, function(str, type, value) {
			return type == 'log' ? Math.log(value) / Math.log(10) : type[0] == 'a' ? Math[type](value) / Math.PI * 180 : Math[type](value * Math.PI / 180);
		})).match(/(?:[+-]|^)\d*\.?\d+(?:[*/][+-]?\d*\.?\d+)*/g);

		if (!terms)
			return NaN;

		for (var i = terms.length, result = 0; i > 0; ) {
			var term = terms[--i].match(/([*/]|^)([^*/]+)/g), value = 1;
			for (var c = term.length; c > 0; ) {
				var num = term[--c];
				value = num[0] == '/' ? value / num.slice(1) : value * (num[0] == '*' ? num.slice(1) : num);
			}
			result += value;
		}

		return result;
	};

	var render = function(context, width, height, scale, originX, originY, equations) {
		var top = -originY, left = -originX, bottom = top + height, right = left + width;

		var str = scale + '';
		var index = str.indexOf('.');
		var decimal = index == -1 ? 0 : str.length - index - 1;

		context.font = '12px Segoe UI';

		var size = ~~(Math.max(context.measureText((left * scale).toFixed(decimal)).width, context.measureText((right * scale).toFixed(decimal)).width) / 10) * 10 + 10;

		var offsetX = right - ~~(right / size) * size;
		var offsetY = bottom - ~~(bottom / 30) * 30;

		context.save();

		context.clearRect(0, 0, width, height);
		context.translate(.5, .5);

		context.textBaseline = 'middle';

		var x = originX <= 0 ? 0 : originX >= width ? width - 1 : originX;
		context.beginPath();
		context.moveTo(x, 0);
		context.lineTo(x, height);
		context.stroke();

		if (x > width / 2)
			context.textAlign = 'right';

		var start = x - 3, end = x + 3, textPos = x + (x <= width / 2 ? 6 : -6);
		for (var y = height - offsetY + 30; y >= 0; y -= 30) {
			context.beginPath();
			context.moveTo(start, y);
			context.lineTo(end, y);
			context.fillText(((originY - y) * scale).toFixed(decimal) * 1, textPos, y - .5);
			context.stroke();
		}

		context.textAlign = 'center';

		var y = originY <= 0 ? 0 : originY >= height ? height : originY;
		context.beginPath();
		context.moveTo(0, y);
		context.lineTo(width, y);
		context.stroke();

		var start = y - 3, end = y + 3, textPos = y + (y <= height / 2 ? 12 : -12);
		for (var x = width - offsetX + size; x >= 0; x -= size) {
			context.beginPath();
			context.moveTo(x, start);
			context.lineTo(x, end);
			context.fillText(((x - originX) * scale).toFixed(decimal) * 1, x, textPos);
			context.stroke();
		}

		for (var i = 0, len = equations.length; i < len; i++) {
			var equation = equations[i];
			context.beginPath();
			if (equation.subject == 'x')
				for (var y = 0; y < height; y++) {
					context[y==0?'moveTo':'lineTo'](equation((top + y) * scale) / scale + originX, y);
				}
			else
				for (var x = 0; x < width; x++) {
					context[x==0?'moveTo':'lineTo'](x, originY - equation((left + x) * scale) / scale);
				}
			context.stroke();
		}

		context.restore();
	};

	var GraphPaper_prototype = GraphPaper.prototype;

	GraphPaper_prototype.add = function(expr) {
		this.equations.push(parse(expr));
		return this;
	};

	GraphPaper_prototype.render = function() {
		render(this.context, this.canvas.width, this.canvas.height, this.scale, this.originX, this.originY, this.equations);
		return this;
	};

	window.GraphPaper = GraphPaper;

})(window, undefined);

//interact Module
var interact = function(type, element, callback) {
	if (type === 'drag') {
		var listener = function(event, state) {
			var offsetX = event.offsetX, offsetY = event.offsetY;
			callback(state === 1 ? {
				type : type,
				state : state,
				initialX : initialX = offsetX,
				initialY : initialY = offsetY,
				distanceX : 0,
				distanceY : 0
			} : {
				type : type,
				state : state,
				initialX : initialX,
				initialY : initialY,
				distanceX : offsetX - initialX,
				distanceY : offsetY - initialY
			}, event, element);
		}, initialX, initialY, isEnabled;
		document.addEventListener('mouseup', function(event) {
			isEnabled && listener(event, isEnabled = 0);
		});
		element.addEventListener('mousedown', function(event) {
			listener(event, isEnabled = 1);
		});
		element.addEventListener('mousemove', function(event) {
			isEnabled && listener(event, 2);
		});
	}
};

var bind = function(object, key, callback) {
	var isCallable = typeof callback === 'function', initialValue, initialY;
	return function(data, event, element) {
		var type = data.type;
		if (type === 'drag') {
			var state = data.state, keyX = key.x, keyY = key.y;
			if (state === 1) {
				initialValue = object[keyX];
				initialY = object[keyY];
			}
			if (state === 2) {
				object[keyX] = initialValue + data.distanceX;
				object[keyY] = initialY + data.distanceY;
			}
		}
		isCallable && callback(data, event, element);
	};
};

window.addEventListener('load', function(event) {
	var g = new GraphPaper(document.getElementById('canvas1'), .02, 300, 200);
	console.log(g.add('y=2x^2-4x').add('y=-x').render());
	interact('drag', document.getElementById('canvas1'), bind(g, {
		x : 'originX',
		y : 'originY'
	}, function() {
		g.render();
	}));
});
