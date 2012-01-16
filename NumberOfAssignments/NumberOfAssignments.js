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
                url: appHostAndPath+'/api/v1/'+entityName+'?where=(EntityState.IsFinal eq "false") and (EntityState.IsInitial eq "false") and (EntityState.Name ne "Tested") and (EntityState.Name ne "Planned") and (EntityState.Name ne "Release branch") and (Project.Name eq "'+escape(projectName)+'")&include=[Assignments[GeneralUser[id,FirstName,LastName]]]&take=1000&format=json',
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
							test.push('<span style="display: inline-block; position: relative; width: 60px;">');
							test.push('<img src="../../../avatar.ashx?size=30&UserId='+key+'" title="'+joined[key].name+'"></img>')
                            test.push('<span style="background: none repeat scroll 0 0 #CC060D; border-radius: 3px 3px 3px 3px; color: #FFFFFF; font-size: 11px; font-weight:bold; height: 10px; line-height: 10px; padding: 2px; position: absolute; left: 48px; top: 0;    width: 16px;">'+(joined[key].bugsCount || 0)+'</span>');
							test.push('<span style="background: none repeat scroll 0 0 #507cb6; border-radius: 3px 3px 3px 3px; color: #FFFFFF; font-size: 11px; font-weight:bold; height: 10px; line-height: 10px; padding: 2px; position: absolute; left: 48px; bottom: 0; width: 16px;">'+(joined[key].usCount || 0)+'</span>');
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
