tau.mashups
.addDependency('libs/jquery/jquery')
.addMashup(function() {


	$('a:contains("Planning")').after($('<a id="done_by_month" href="#">Done Entities By Month</a>'));

	$('#done_by_month').click(showReport)
	function showReport() {
		$('head').append('<style type="text/css">table.u-done-entities td {width: 100px !important; vertical-align: top; font: 12px Arial; padding: 3px 2px !important} '
		+ 'table.u-done-entities tr:hover {background: #E3F5D7 !important} '
		+ 'table.u-done-entities tr {border-bottom: 1px solid #eee !important} '
		+ 'table.u-done-entities th {padding: 5px 10px} '
		+ 'table.u-done-entities {border-collapse: collapse} '
		+ '.done {margin-left: 1px; margin-top: 1px; width: 8px; height: 8px; float: left;-moz-border-radius: 4px; '
		+ '-webkit-border-radius: 4px; '
		+ '-khtml-border-radius: 4px; '
		+ 'border-radius: 4px;} '
		+ '.UserStory {background: #507CB6 !important; } '
		+ '.Bug {background: #C30 !important; } '
		+ '.Issue {background: orange !important; } '
		+ '.Feature {background: green !important; }</style>');

		$("td.col-two").html('').append(
			$('<h1>Completed Entities by projects by months in 2011</h1><select id="rep-entityType">' 
				+ '<option value="">- Select Entity -</option><option value="UserStory"> User Stories</option><option value="Bug">Bugs</option>' 
				+ '<option value="Issue">Issues</option><option value="Feature">Features</option></select><br><br><div id="entities-by-month-rep"></div>'));

		$("#rep-entityType").die();
		$("#rep-entityType").live("change", function() {
			currentEntity = $("#rep-entityType").val();
			buildReport();
		});

	}

	var url = Application.baseUrl;

	var currentEntity = "UserStory"; // I don't like this global var, but don't know how to pass it via callback
	var projects = [];
	var projectNames = [];
	var months = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];

	//initialize matrix
	var matrix = [];
	var year = '2011';
	function getUrl(entityType) {
		 return {
			Project:  "/api/v1/projects?take=1000&where=IsActive eq 'true'&format=json&callback=?",
		    UserStory  : "/api/v1/userstories?take=1000&where=(EntityState.Name eq 'Done') and (EndDate gt '"+year+"-01-01')&include=[Name,EndDate,Project[Id,Name]]&format=json&callback=?",
		    Bug  : "/api/v1/bugs?take=1000&where=(EntityState.Name eq 'Closed') and (EndDate gt '"+year+"-01-01')&format=json&include=[Name,EndDate,Project[Id,Name]]&callback=?",
		    Issue : "/api/v1/requests?take=1000&where=(EntityState.Name eq 'Closed') and (EndDate gt '"+year+"-01-01') and (RequestType.Name eq 'Issue')&format=json&include=[Name,EndDate,Project[Id,Name]]&callback=?",
			Feature  : "/api/v1/features?take=1000&where=(EntityState.Name eq 'Done') and (EndDate gt '"+year+"-01-01')&include=[Name,EndDate,Project[Id,Name]]&format=json&callback=?",
		  }[entityType] || null
	}

	$.getJSON(url + getUrl("Project"), initProjects);

	function initProjects(data) {

		for (i = 0; i < data.Items.length; i++) {
			if (data.Items[i]) {
				proj = data.Items[i];
				projects.push(proj.Id);
				projectNames.push(proj.Name);
			}
		}
	}

	function initEmptyMatrix() {
		//init matrix. X - months, Y - projects, Cell - Array of items (stories, bugs, issues)
		for (p = 0; p < projects.length; p++) {
			matrix[p] = [];
			for (m = 0; m < 12; m++) {
				matrix[p][m] = new Array();
			}
		}
	}

	function buildReport() {
		$("#entities-by-month-rep").html("<img src='https://github.com/TargetProcess/MashupsLibrary/raw/master/DoneEntitiesByMonthReport/totoro.gif'> Small Totoro is collecting the data...").fadeIn('slow');
		initEmptyMatrix();
		loadData();
	}

	var callsCount = 0;
	function loadData(data) {	
		if (data) {
			fillMatrix(data);
			if (data.Next) {
				callsCount++;
				$.getJSON(url + getUrl(currentEntity) + "&skip="+callsCount+"000", loadData);	
			} else { // we have all data, so print it with god help
				printData();
				callsCount = 0;
			}
		} else { // first load
			$.getJSON(url + getUrl(currentEntity), loadData);	
		}	
	}

	function fillMatrix(data) {
		for (i = 0; i < data.Items.length; i++) {
			if (data.Items[i]) {
				//	"/Date(1301575494000-0700)/"
				var date = new Date(parseInt(data.Items[i].EndDate.substr(6)));
				var m = date.getMonth();
				var id = data.Items[i].Project.Id;
				if ($.inArray(id, projects) > -1) {
					p = projects.indexOf(id);
					matrix[p][m].push(data.Items[i]);
				}
			}
		}
	}

	function printData() {
		// clear report
		$("#entities-by-month-rep").html("").hide();

		var table = $("<table class='u-done-entities' style='width: 1500px'>");

		//build header
		var tr = $("<tr>").append($("<th>"));
		for (m = 0; m < 12; m ++) {
			tr.append($("<th>").text(months[m]));
		}

		table.append(tr);

		// build data
		for (i = 0; i < projects.length; i++) {
			tr = $("<tr>").append($("<td>").text(projectNames[i]));
			for (m = 0; m < 12; m ++) {
				var doneItems = matrix[i][m];
				var vis = ""
				for (c = 0; c < doneItems.length; c++) {
					vis = vis + "<div rel='twipsy' title='" + doneItems[c].Name + "' class='done " + currentEntity + "'></div>"
				}
				tr.append($("<td>").append(vis))				
			}
			table.append(tr);
		}		
		$("#entities-by-month-rep").append(table).fadeIn('slow');
	}

});