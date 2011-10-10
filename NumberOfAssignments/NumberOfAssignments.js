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
						map[id].count++;
					}
					else {
						map[id]={name:assignment.GeneralUser.FirstName+' '+assignment.GeneralUser.LastName, count:1};
					}
				}
			}
			return map;
		};
	
		var getAssignments = function(projectName, entityName, callback){
			$.ajax({
                type: 'GET',
                url: appHostAndPath+'/api/v1/'+entityName+'?where=(EntityState.IsFinal eq "false") and (EntityState.IsInitial eq "false") and (EntityState.Name ne "Planned") and (EntityState.Name ne "Merged") and (Project.Name eq "'+escape(projectName)+'")&include=[Assignments[GeneralUser[id,FirstName,LastName]]]&take=1000&format=json',
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
//name, count
	
						joined[key].name = join[key].name;
						joined[key][propertyName] = join[key].count;
					}
				}
		};
		

		var createAssignmentsList= function(index, element){
		var projectName = jQuery.trim($(element).find('.x-panel-kanban-header-link').text());
		var userStories = {};
		var bugs = {};
		getAssignments(projectName, 'UserStories', function(resp){
				userStories = processResponse(resp);
				getAssignments(projectName, 'Bugs', function(resp){
					bugs = processResponse(resp);
	
					var joined = {};
					merge(joined,userStories,'usCount');
					merge(joined,bugs,'bugsCount');
					
					var test=['<div><div style="text-align: center;">'];
					for (var key in joined)
					{
						if (joined.hasOwnProperty(key)){
							test.push('<span style="display: inline-block; position: relative; width: 80px;">');
							test.push('<img src="../../../avatar.ashx?size=30&UserId='+key+'" title="'+joined[key].name+'"></img>')
							test.push('<span style="position: absolute; top: 0pt; right: 0pt;"><img src="../../../img/BugS.gif"/>'+(joined[key].bugsCount || 0)+'</span>');
							test.push('<span style="position: absolute; bottom: 0pt; right: 0pt;"><img src="../../../img/UserStoryS.gif"/>'+(joined[key].usCount || 0)+'</span>');
							test.push('</span>');
						}
					}
					test.push('</div></div>');
					var output=test.join('');
					$(element).append(output);
				});
		});
		};
		$('.x-panel-kanban-header').each(createAssignmentsList);
	});
