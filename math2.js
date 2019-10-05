(function() {

	var object_keys = Object.keys;

	var PI = Math.PI, LN10 = Math.LN10;
	var pow = Math.pow, sin = Math.sin, cos = Math.cos, tan = Math.tan, asin = Math.asin, acos = Math.acos, atan = Math.atan, log = Math.log;
	var toRadian = PI / 180;

	var predefined = {
		PI : PI,
		E : Math.E,
		sin : function(x) {
			return sin(x * toRadian);
		},
		cos : function(x) {
			return cos(x * toRadian);
		},
		tan : function(x) {
			return tan(x * toRadian);
		},
		asin : function(x) {
			return asin(x) / toRadian;
		},
		acos : function(x) {
			return acos(x) / toRadian;
		},
		atan : function(x) {
			return atan(x) / toRadian;
		},
		log : function(x) {
			return log(x) / LN10;
		},
		ln : log,
		sqrt : Math.sqrt
	};

	var keys = object_keys(predefined), length = keys.length, index = 0, pattern = '';

	while (index < length) {
		pattern += keys[index++] + '|';
	}

	var regexp = new RegExp(pattern + '\\d*\\.?\\d+|\\S', 'g');

	var precedenceOf = function(token) {
		switch(token) {
		case '+':
		case '-':
			return 4;
		case '*':
		case '/':
			return 3;
		case '^':
			return 2;
		case '!':
			return 1;
		}
	}, isRightToLeft = function(token) {
		switch(token) {
		case '^':
		case '!':
			return true;
		}
	};

	var toArray = function(expression) {
		var output = [], outputIndex = 0, input = expression.match(regexp), index = 0, length = input.length, token, previous, isNegative, isOperation = true;
		while (index < length) {
			token = input[index++];
			if (isOperation) {
				switch(token) {
				case '-':
					if (previous === '+') {
						output[outputIndex - 1] = '-';
					} else if (previous === '-') {
						output[outputIndex - 1] = '+';
					} else {
						isNegative = isNegative ? false : true;
					}
					continue;
				case '+':
					continue;
				}
			}
			if (!isOperation && (isFinite(previous) || previous === ')') && token !== ',' && token !== ')' && !precedenceOf(token)) {
				output[outputIndex++] = '*';
			}
			if (isFinite(token)) {
				output[outputIndex] = isNegative ? -token : +token;
				isOperation = false;
			} else {
				if (isNegative) {
					output[outputIndex] = -1;
					output[outputIndex + 1] = '*';
					outputIndex += 2;
				}
				output[outputIndex] = token;
				switch(token) {
				case '(':
				case ',':
					isOperation = true;
					break;
				default:
					isOperation = precedenceOf(token);
				}
			}
			outputIndex++;
			isNegative = false;
			previous = token;
		}
		return output;
	};

	var computeRPN = function(input) {
		var index = 0, length = input.length, output = [], outputIndex = 0, token, defined, functionLength, value;
		while (index < length) {
			token = input[index];
			defined = predefined[token];
			if ( typeof defined === 'number') {
				token = defined;
			}
			switch(token) {
			case '+':
				output[outputIndex - 2] += output[--outputIndex];
				break;
			case '-':
				output[outputIndex - 2] -= output[--outputIndex];
				break;
			case '*':
				output[outputIndex - 2] *= output[--outputIndex];
				break;
			case '/':
				output[outputIndex - 2] /= output[--outputIndex];
				break;
			case '^':
				output[outputIndex - 2] = pow(output[outputIndex - 2], output[--outputIndex]);
				break;
			case '!':
				token = output[outputIndex - 1];
				value = 1;
				while (token > 1) {
					value *= token--;
				}
				output[outputIndex - 1] = value;
				break;
			default:
				if ( typeof defined === 'function') {
					functionLength = defined.length;
					outputIndex -= functionLength - 1;
					output[outputIndex - 1] = defined.apply(null, output.slice(outputIndex - 1, outputIndex + functionLength));
				} else {
					output[outputIndex++] = token;
				}
			}
			index++;
		}
		return output[0];
	};

	var toRPN = function(input) {
		var index = 0, length = input.length, stack = [], output = [], outputLength = 0, stackLength = 0, token, stackToken, precedence, stackPrecedence;
		while (index < length) {
			token = input[index++];
			switch(token) {
			case ',':
				while (stackLength) {
					stackToken = stack[stackLength - 1];
					if (stackToken === '(') {
						break;
					}
					output[outputLength++] = stackToken;
					stackLength--;
				}
				break;
			case '(':
				stack[stackLength++] = token;
				break;
			case ')':
				while (stackLength) {
					stackToken = stack[--stackLength];
					if (stackToken === '(') {
						break;
					}
					output[outputLength++] = stackToken;
				}
				if (stackLength) {
					stackToken = stack[stackLength - 1];
					if ( typeof predefined[stackToken] === 'function') {
						output[outputLength++] = stackToken;
						stackLength--;
					}
				}
				break;
			default:
				if ( typeof predefined[token] === 'function') {
					stack[stackLength++] = token;
				} else {
					precedence = precedenceOf(token);
					if (precedence) {
						while (stackLength) {
							stackToken = stack[stackLength - 1];
							stackPrecedence = precedenceOf(stackToken);
							if (!stackPrecedence || (isRightToLeft(token) ? precedence <= stackPrecedence : precedence < stackPrecedence)) {
								break;
							}
							output[outputLength++] = stackToken;
							stackLength--;
						}
						stack[stackLength++] = token;
					} else {
						output[outputLength++] = token;
					}
				}
			}
		}
		while (stackLength) {
			output[outputLength++] = stack[--stackLength];
		}
		return output;
	};

	console.log(toArray('-1.5+5^(+-(1))--sin(-+-5)+2E-9PI'));
	console.log(regexp);
	console.log(computeRPN(toRPN(toArray('sin(90)*5+2^cos(45)+5!/2'))));

	window.cx = function(s) {
		return computeRPN(toRPN(toArray(s)));
	};
	window.sin = sin;
	window.cos = cos
	
	console.log(performance.now()-performance.now())
})();

