// created by Michael Dubakov. I still (slightly) remember how to code
// @mdubakov

tau.mashups
.addDependency('libs/jquery/jquery')
.addMashup(function ($, config) {
	$('#main').prepend("<div id='m_quickAddBlock' style='margin-left:10px'><a href='#' id='m_quickAddLink'>Quick Add</a></div>");

	function getQueryParams(qs) {
		qs = qs.split("+").join(" ");
		var params = {},
			tokens,
			re = /[?&]?([^=]+)=([^&]*)/g;
		while (tokens = re.exec(qs)) {
			params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
		}
		return params;
	}	
 
	function getResourceName(entityType) {
		return {
			Feature  : "Features",
			Story  : "UserStories",
			Bug  : "Bugs",	   		
		}[entityType] || null
	}
	         
	function parseEntities(text) {
		var items = [];
		var lines = text.split("\n");
		for (var i = 0; i < lines.length; i++) {
			var typeArr = $.trim(lines[i]).match(/^.+:/); // search for Story:
			if (typeArr == null) continue;
			var type = typeArr[0];
			var name = lines[i].slice(type.length);
			type = type.slice(0, -1); // remove :
			
			//TODO: implement algorithm that will recognize data and add it hiearchically and by type
			items.push({"Type" : getResourceName(type), "Name": name});
		}
		return items;
	}
	          
	// quick add
	$("#m_quickAddLink").live("click", function(){
		
		var addAction = $("<a id='m_addEntityAction' href='#' class='btn small primary' style='margin: 0 10px; float: left'>Add</a> <a href='#' class='btn small' id='cancelAdd'>Cancel</a>");
		var addText = $('<textarea id="addText" rows="3" cols="60" style="float: left; margin-bottom: 10px"></textarea><br style="clear:both">');
		addText.val("Story: ");
		
		
		$("#cancelAdd").live("click", function(e) {
			cleanUpAfterAdd();
		});
		
		
		$("#m_addEntityAction").live("click", function(e) {
                  
			var $_GET = getQueryParams(document.location.search); // extract acid      
			var stories = parseEntities($("#addText").val());
			
	        $.ajax({
				// get list of selected projects first
				type: 'GET',
				url: appHostAndPath+'/api/v1/Context/?acid='+$_GET["acid"],
				contentType: 'application/json',
				dataType: 'json',
				success: function(data){
					var projectId = parseInt(data.SelectedProjects[0].Id);
					//add entities
					$.each(stories, function(index, value) {                   
						$.ajax({
							type: 'POST',
							url: appHostAndPath+'/api/v1/' + value.Type,                            
							dataType: 'json',
							processData: false, //otherwise wrong content-type
							contentType: 'application/json',
							data: JSON.stringify({Name:value.Name, Project:{Id:projectId}})
						}).done(function( msg ) {
							$("#m_quickAddBlock").prepend("<div id='savedOK' style='background: yellow'>Entity saved: "+msg.Name+"</div>");
							$("#savedOK").fadeOut(2000)
						});
					});
					                            
				}
			});        
			
			cleanUpAfterAdd();
		
		});
		
		// append Story: every new line to save typing time
		
		$("#addText").live("keyup", function(e) {
			var code = (e.keyCode ? e.keyCode : e.which);
			if(code == 13) { //Enter keycode
			   	$(this).val($(this).val() + "Story: " )
			}
		});
		
		$(this).parent().append(addText).append(addAction);
		
		$(this).hide();
		
		// set cursor after Story:
		//addText.autoGrow().tabby().focus().setCursorPosition(7);
	});
	
	function cleanUpAfterAdd() {		
		$("#m_quickAddBlock").html("");
		$("#m_quickAddBlock").append("<a id='m_quickAddLink' href='#'>Quick Add</a>");
		$("#m_addEntityAction").die();
		$("#addText").die();
	}
});