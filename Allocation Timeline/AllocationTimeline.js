tau.mashups
.addDependency('libs/jquery/jquery')
.addMashup(function() {


	$('a:contains("Load by Person")').after($('<a id="allocation-link" href="#">People/Projects Timeline</a>'));

	$('#allocation-link').click(showReport)
	function showReport() {
		$('head').append('<style type="text/css"> '
		+ 'table.board-timeline tr:hover {background: #E3F5D7 !important} '
		+ 'table.board-timeline tr {border-bottom: 1px dotted #eee !important} '
		+ 'table.board-timeline td {height: 20px; border-left: 1px dotted #eee !important} '
		+ 'table.board-timeline {border-collapse: collapse} '
		+ '.timeline-card {background: #ACD473; border: 1px solid #8ACB29; color: white; overflow: hidden; position: absolute; font: 11px Arial; height: 12px; border-radius: 3px; padding: 2px; color: white; font-weight: bold; font-size: 11px;} '
		+ '</style>');
		$("td.col-two").html('').append(
			$('<span class="tableTitle">People allocations on projects</span><br><br><div id="allocation-rep"></div>'));
  		$.getJSON(url + getUrl("People"), generateTimeline);
          	
	}

	var url = Application.baseUrl;
	var allocations = [];
	var users = [];
	var today = new Date();
  	var cardHeight = 20; //px
	
	var months = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  
	function generateTimeline(data) {
              	users = data.Items;
		
		var table = $("<table class='board-timeline' style='width: 100%'>");
		var trh = $("<tr>");	

		for (var j=0; j < months.length+1; j++) {	
                            if (j == 0) {
                              trh.append($("<th style='min-width: 210px'>").append("People"));
                              continue;
                            }
                      	var td = $("<th style='width: 8%'>").append( months[j-1]);
			if (j == today.getMonth()+1) td.css("border-left", "1px solid red").css("color", "red");							
			trh.append(td);
		}
		table.append(trh);

		for (var i = 0; i < users.length; i++) {
                      	var user = users[i];
                      	
                      	allocations[user.Id] = new Array();
                      
			var tr = $("<tr>");	
			for (var j=0; j < months.length+1; j++) {
                                    if (j == 0) {
                                      tr.append($("<td a_user_id='"+user.Id+"'>")
                                                .append("<img style='float: left; margin-right: 10px' src='"+url+"/avatar.ashx?size=30&UserId="+user.Id+"' /> ")
                                                .append(user.FirstName + " " + user.LastName)
                                                .append("<br><span style='color: #BBB'>"+user.Role.Name + "</span>"));
                                      continue;
                                    }
				var td = $("<td x_y='"+j+"_"+user.Id+"'>");
				if (j == today.getMonth()+1) td.css("border-left", "1px solid red !important");
				tr.append(td);
			}
			table.append(tr);
		}

                  $("#allocation-rep").append(table).fadeIn('slow');
              
              
              	$.getJSON(url + getUrl("ProjectAllocation"), generateAllocations);
              
              	return;
	}
                  

	function getUrl(entityType) {
		 return {
		    People  : "/api/v1/Users?take=1000&format=json&where=(IsActive%20eq%20'true')%20and%20(DeleteDate%20is%20null)&callback=?",
		    ProjectAllocation  : "/api/v1/ProjectMembers?take=1000&format=json&callback=?",
		  }[entityType] || null
	}
  
  	function generateAllocations(data) {

          for (i = 0; i < data.Items.length; i++) {
                var a = data.Items[i];
            if (allocations[a.User.Id]) {
	        allocations[a.User.Id].push({Start: fixDate(a.MembershipStartDate), End: fixDate(a.MembershipEndDate), Project: a.Project.Name, Allocation: a.Allocation}); 		
            }
          }
          
          
          for (var i = 0; i < users.length; i++) {
            	var shiftY = 0;
          		var projects = allocations[users[i].Id];
            	if (! projects) continue;
            
            	var totalUserAllocation = 0;
            	for (var p = 0; p < projects.length; p++) {
                       // need some more clever algorithm here
                  	var project = projects[p];
                  
                  	if (!project.End) continue;
                  	if (project.End.getFullYear() < today.getFullYear()) continue;
                  	
                  	
                  
                  	startMonth = 1; // take first month
                  	startDate = 1;
                  	if (project.Start && project.Start.getFullYear() == today.getFullYear()) {
                  		startMonth = project.Start.getMonth() + 1;
                          	startDate = project.Start.getDate();
                        }
                  	var start = getCell(startMonth, users[i].Id);
                 	
                  	endMonth = 12; // take last month
                  	endDate = 30;
                  	if (project.End && project.End.getFullYear() == today.getFullYear()) {
                  		endMonth = project.End.getMonth() + 1;	
                          	endDate = project.End.getDate();
                        }
                  	if (endMonth > 12) {
                    		endMonth = 12; // don't jump next year
                          	endDate = 30; 
                  	}
                  
	                var end = getCell(endMonth, users[i].Id);
                  
                  	
                  
                  	var dayUnit = start.width()/30; // approximation - 30 days in a month
                  
	                var width = end.offset().left - start.offset().left + (endDate - startDate - 1) * dayUnit;
                  	var card = $("<div class='timeline-card'><i style='color: #333'>"+project.Allocation+"%</i> "+project.Project+"</div>")
						.css("left", start.offset().left + dayUnit * (startDate-1) + 3)
						.css("top", start.offset().top + shiftY * cardHeight + 3)
						.css("width", width);
                  	$("#allocation-rep").append(card);
                  	shiftY++;
                  	start.css("height", shiftY * cardHeight);
                  
                  	totalUserAllocation=totalUserAllocation+project.Allocation;
                  
                  	
                }
            
	            var alarma = "#bbb";
	            if (totalUserAllocation > 100) alarma = "red";
	            if (totalUserAllocation == 0) alarma = "orange";
	            if (totalUserAllocation < 100 && totalUserAllocation > 50) alarma = "green";
	            
	            $("td[a_user_id='"+users[i].Id+"']").append(" <span style='color: "+alarma+"' >" + totalUserAllocation + "%</span>");
            
          }          	
	}
  
	function fixDate(d) {
		if (d) {
			return new Date(parseInt(d.substr(6)));
		}
		return null;
	}
  
	function getCell(x, y) {
		return $('td[x_y="'+x+'_'+y+'"]') 
	}

});