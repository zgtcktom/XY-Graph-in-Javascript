window.addEventListener('load', function() {

});

/*	Postfix function start
 *
 */

var isFunction = function(token) {
	switch(token) {
	case 'sin':
	case 'cos':
	case 'tan':
	case 'log':
		return true;
	}
	return false;
}, precedenceOf = function(token) {
	switch(token) {
	case '+':
	case '-':
		return 3;
	case '*':
	case '/':
		return 2;
	case '^':
		return 1;
	}
	return false;
}, isRightToLeft = function(token) {
	switch(token) {
	case '^':
		return true;
	}
	return false;
}, toRPN = function(input) {
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
				if (isFunction(stackToken)) {
					output[outputLength++] = stackToken;
					stackLength--;
				}
			}
			break;
		default:
			if (isFunction(token)) {
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

var functions = {
	sin : function(d) {
		return Math.sin(Math.PI * d / 180);
	},
	cos : function(d) {
		return Math.cos(Math.PI * d / 180);
	},
	tan : function(d) {
		return Math.tan(Math.PI * d / 180);
	}
};
var regexp = /[(,)^*/+-]|[a-z]+|\d+|\d*\.\d+/g;
var calculate = function(expression) {
	var input = [], match = expression.match(regexp), inputIndex = 0, index = 0, length = match.length, output = [], outputLength = 0, mathFunction, functionLength, outputIndex, previous, isNotOperation;
	while (index < length) {
		token = match[index];
		if (isFinite(token)) {
			if (isNotOperation) {
				input[inputIndex] = previous === '-' ? -token : +token;
			} else
				input[inputIndex++] = +token;
		} else {
			input[inputIndex++] = token;
			if (precedenceOf(previous) && precedenceOf(token)) {
				if (isNotOperation) {
					input[inputIndex - 1] = token = previous === '+' ? token : token === '+' ? '-' : '+';
				}
				inputIndex--;
			}
		}
		isNotOperation = precedenceOf(previous) && precedenceOf(token);
		previous = token;
		index++;
	}
	input = toRPN(input);
	index = 0;
	length = input.length;
	while (index < length) {
		token = input[index++];
		outputIndex = outputLength - 2;
		switch(token) {
		case '+':
			output[outputIndex] += output[--outputLength];
			break;
		case '-':
			output[outputIndex] -= output[--outputLength];
			break;
		case '*':
			output[outputIndex] *= output[--outputLength];
			break;
		case '/':
			output[outputIndex] /= output[--outputLength];
			break;
		case '^':
			output[outputIndex] = Math.pow(output[outputIndex], output[--outputLength]);
			break;
		default:
			mathFunction = functions[token];
			if (mathFunction) {
				functionLength = mathFunction.length;
				outputIndex = outputLength - functionLength;
				outputLength = outputIndex + 1;
				output[outputIndex] = mathFunction.apply(null, output.slice(outputIndex, outputIndex + functionLength));
			} else {
				output[outputLength++] = token;
			}
		}
	}
	return output[0];
};

console.log(toRPN('3 + 4 * 2 / ( 1 - 5 ) ^ 2 ^ 3'.split(' ')).join(' '));
console.log(toRPN('(a+b)*(c+d)'.split('')).join(' '));

console.log(calculate('3 + 4 * 2 / ( 1 - 5 ) ^ 2 ^ 3'));
console.log(calculate('3 + 4 * 2 / ( 1 - 5 ) ^ 2 ^ 3'));
console.log(calculate('sin(90)*5+2^cos(45)+5!/2'));