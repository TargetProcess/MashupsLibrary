// created by Michael Dubakov. I still (slightly) remember how to code
// @mdubakov

require(['tau/configurator'], function(c) {
	c.setApplicationPath(window.appHostAndPath);
	// we will use fancy store API from tau.js
	var store = c.getStore();


tau.mashups
.addDependency('libs/jquery/jquery')
.addMashup(function ($, config) {
	$('#main').prepend("<div id='m_quickAddBlock' style='width: 400px;'><a href='#' id='m_quickAddLink'>Quick Add</a></div><br style='clear:both'>");

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
			
			//TODO: implement algorithm that will recognize data and add it hierarchically
			items.push({"Type" : getResourceName(type), "Name": name});
		}
		return items;
	}
	          
	// quick add
	$("#m_quickAddLink").live("click", function(){
		
		var addAction = $("<div class='main-controls left'><button type='button' class='button' id='m_addEntityAction' style='margin-right: 10px'>Add</button> <a href='#' style='margin-top: 5px' id='cancelAdd'>Cancel</a></div>");
		var addText = $('<span class="secondaryInfo">You can add several Stories, Features and Bugs at once. For example:<br>Feature: super search<br>Bug: something wrong<br>Story: As a bee I want to fly</span><br><textarea id="addText" rows="4" cols="120" style="margin-bottom: 10px"></textarea>');
		addText.val("Story: ");
		
		
		$("#cancelAdd").live("click", function(e) {
			cleanUpAfterAdd();
		});
		
		
		$("#m_addEntityAction").live("click", function(e) {
                  
			var $_GET = getQueryParams(document.location.search); // extract acid      
			var entities = parseEntities($("#addText").val());
			
	        $.ajax({
				// get list of selected projects first
				type: 'GET',
				url: appHostAndPath+'/api/v1/Context/?acid='+$_GET["acid"],
				contentType: 'application/json',
				dataType: 'json',
				success: function(data){
					var projectId = parseInt(data.SelectedProjects[0].Id);
					//add entities
					$.each(entities, function(index, entity) {     
						store.save(entity.Type, { $set: {name:entity.Name, project:{id:projectId}}}).done({ 
							success: function() {
								$("#m_quickAddBlock").prepend("<div id='savedOK' style='color: #000; text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5); padding: 3px; background: #A5C956; border: 1px solid #A5C956;'>Entity saved: "+entity.Name+"</div>");
								$("#savedOK").fadeOut(3000)
							} 
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

});