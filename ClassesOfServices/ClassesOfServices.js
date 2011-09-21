tau.mashups
	.addDependency("libs/jquery/jquery")
	.addMashup(function() {
		
	var colors = {
		'urgent':'#f25350',
	 	'sup':'#ffecb3'
	};
	
	var colorItems = function() {
		$("div.kanban-item").css("cssText",  "-moz-user-select: none; background: #E0E8D1 !important;").filter(":has(div.kanban-tag)").each(function(){
			var item = $(this);
			var itemTag = item.find("div.kanban-tag:first").text().toLowerCase();
			for(var tag in colors) {
				if (itemTag == tag) {
					
					item.css("cssText",  "-moz-user-select: none; background: "+colors[tag]+" !important;")
				}
			}
	 	});
	 	setTimeout(colorItems, 1000);
	};
	colorItems();		
});