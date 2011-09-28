tau.mashups
	.addDependency("libs/jquery/jquery.tmpl")
	.addModule("tp/TopMenu", function() {
		function TopMenu() {
			
		};
		
		TopMenu.prototype = {
			linkTmpl: "<td class='tabPlace'><div class='tab'><a href='${linkHref}'>${linkTitle}</a></div></td>",
			
			add: function(title, href) {
				var lastLink = $(".tabPlace:last");
				$($.tmpl(this.linkTmpl, {linkHref:href, linkTitle:title})).insertAfter(lastLink);
			}
		}
		
		return TopMenu;
	});