tau.mashups
	.addDependency("libs/jquery/jquery")
	.addMashup(function() {

   /* an object of tags : colors
     * this determines the colors of your priorities */
	var priorityColors = {
		1:'#ff0000',
	 	2:'#ff9900',
        3:'#ff00ff',
        4:'#00ffff',
        5:'#00ff00'
	}; 
   
    $(document).ready(function() {
        var css = '<style type="text/css" media="all">';
        $.each(priorityColors, function(k,v) {
            css += "div.kanban-item-priority-{0} { background: {1}!important; }\n".f(k,v);
        });
        css += '</style>';
        $('head').append(css);
    });
});

String.prototype.f = function() {
    var s = this, i = arguments.length;
    while (i--)
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    return s;
};
