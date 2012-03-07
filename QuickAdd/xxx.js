var str = "Story: create something cool > state: Open > Effort: 8 > tags: rest, rest";
var operators = buildOperators(str);
for (var i = 0; i < operators.length; i++) {
	operators[i]
};


function buildOperators(str) {
	var operators = [];
	var commands = str.split('>');
	for (var i = commands.length - 1; i >= 0; i--) {
		s = $.trim(commands[i]);
		var operator = s.match(/^.+:/);
		if (operator == null) continue;
		var val = $.trim(s.substr(operator[0].length));
		operator = operator[0].slice(0, -1); // remove :
		operators.push({operator: operator, value: val});
		
	};

	return operators;
}
