tau.mashups
	.addDependency("libs/jquery/jquery")
	.addModule("tau/mashups/Highlighter", function() {

		function Highlighter() {
        }
        
        Highlighter.prototype = {
            searchBox: null,
            timer: null,
            timeOut : $.browser.msie ? 200 : 100,

            render: function () {
				this.searchBox = $("#ctl00_hdr_txtSearch");
				this.searchBox.keyup({self:this}, this.onSearchTextChange);
            },
            
            onSearchTextChange: function(e) {
            	var self = e.data.self;
            	var str = self.searchBox.val();

            	if (self.timer != null) {
            		clearTimeout(self.timer);
            	}
        		self.timer = setTimeout(function() { self.highlight(str) }, self.timeOut);
            },
            
            highlight: function(str) {
            	var all = this.findAll();
				this.reset(all);
            	
            	if (str === "") {
            		return;
            	}
            	
            	var isHide = true;
            	var txt = str.replace("hide:", "");
            	if (txt === str) {
            		isHide = false;
            	}
            	
            	str = txt;
            	
            	var isByTag = true;
            	txt = str.replace("tag:", "");
	            if (str == txt)
	            	isByTag = false;

				var elements = isByTag ? this.findByTag(txt, all) : this.findByText(txt, all);
	            
		        isHide ? this.hide(elements, all) : this.fade(elements, all);
		        
		        this.timer = null;
            },
            	
            reset: function(all) {
        		all.fadeTo(0, 1);
        		all.filter("tr").removeClass("rowDisabled");
        		
        		all.show();
            },

            findAll: function(str) {
            	return $("tr.dataRow,tr.rowDone,#masterItemTemplate,div.kanban-item,div.taskBox,div.middle-us,div.more-us,div.entityBox,div.x-grid3-row");
            },

            findByText: function(str, all) {
            	return all.filter(":contains('"+str+"')");
            },
            
            findByTag: function(str, all) {
            	return all.filter(":has(div.kanban-tag:contains('"+str+"'))");
            },

            hide: function(elements, all) {
            	all.hide();
            	elements.show();
            },

            fade: function(elements, all) {
            	all.fadeTo(0, 0.2);
            	all.filter("tr").addClass("rowDisabled");
            	
            	elements.fadeTo(0, 1);
            	elements.filter("tr").removeClass("rowDisabled");
            }
        }
        return Highlighter;
});

tau.mashups
	.addDependency("tau/mashups/Highlighter")
	.addMashup(function (Highlighter, config) { new Highlighter().render(); });

