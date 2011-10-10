tau.mashups
	.addDependency("libs/jquery/jquery")
	.addMashup(function () {
	
		var processResponse = function(resp){
			var map = {};
			for(var x=0,len=resp.Items.length; x<len;x++) {
				for(var y=0,len1=resp.Items[x].Assignments.length;y<len1;y++) {
					var assignment = resp.Items[x].Assignments[y];
					var id = assignment.GeneralUser.Id;
					if (map[id]) {
						map[id]++;
					}
					else {
						map[id]=1;
					}
				}
			}
			return map;
		};
	
		var getAssignments = function(projectName, entityName, callback){
			$.ajax({
                type: 'GET',
                url: appHostAndPath+'/api/v1/'+entityName+'?where=(EntityState.IsFinal eq "false") and (EntityState.IsInitial eq "false") and (EntityState.Name ne "Planned") and (EntityState.Name ne "Merged") and (Project.Name eq "'+projectName+'")&include=[Assignments[GeneralUser[id]]]&take=1000&format=json',
                contentType: 'application/json',
                dataType: 'json',
                success: callback
			});
		};

		var merge = function(joined, join, propertyName){
				for (var key in join)
				{
					if (join.hasOwnProperty(key))
					{
						joined[key]= joined[key] || {};
						joined[key][propertyName] = join[key];
					}
				}
		};
		
		var projectName = jQuery.trim($('.x-panel-kanban-header-link')[0].text);
		var userStories = {};
		var bugs = {};

		getAssignments(projectName, 'UserStories', function(resp){
			userStories = processResponse(resp);
			getAssignments(projectName, 'Bugs', function(resp){
				bugs = processResponse(resp);

				var joined = {};
				merge(joined,userStories,'usCount');
				merge(joined,bugs,'bugsCount');
				
				debugger;
				var test=['<div><div style="text-align: center;">'];
				for (var key in joined)
				{
					if (joined.hasOwnProperty(key)){
						test.push('<span style="display: inline-block; position: relative; width: 80px;">');
						test.push('<img src="../../../avatar.ashx?size=30&UserId='+key+'"/>')
						test.push('<span style="position: absolute; top: 0pt; right: 0pt;"><img src="../../../img/BugS.gif"/>'+(joined[key].bugsCount || 0)+'</span>');
						test.push('<span style="position: absolute; bottom: 0pt; right: 0pt;"><img src="../../../img/UserStoryS.gif"/>'+(joined[key].usCount || 0)+'</span>');
						test.push('</span>');
					}
				}
				test.push('</div></div>');
				var output=test.join('');
				$('.x-panel-kanban-header').append(output);
			});
		});
	});
