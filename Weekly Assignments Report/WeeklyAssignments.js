tau.mashups
    .addDependency('libs/jquery/jquery').addMashup(function() {

        function showReport() {
            $('head').append('<style type="text/css"> \
table.board-efforts tr.hoverHi:hover {background: #E3F5D7 !important} \
table.board-efforts tr {border-bottom: 1px dotted #eee !important} \
table.board-efforts td {height: 20px; } \
table.board-efforts td em {font-size: smaller;} \
table.board-efforts {border-collapse: collapse} \
table.board-efforts td.more {background: url("'+appHostAndPath+'/img/icons/plus-small.png") center center no-repeat; width: 10px; } \
table.board-efforts td.more.less {background: url("'+appHostAndPath+'/img/icons/minus-small.png") center center no-repeat !important;} \
table.board-efforts td.bar {background: #819f56; margin-top: 2px; border: 1px solid #8ACB29; color: white; overflow: hidden; position: absolute; font: 11px Arial; height: 12px; border-radius: 3px; padding: 0; color: white; font-weight: bold; font-size: 11px;} \
table.board-efforts td.bar div.innerBar {background: #ACD473; height: 100%; overflow: visible; padding: 0 0 0 2px;} \
table.board-efforts tr.innerData {height: 0px; overflow: hidden; display: none;} \
table.board-iterations-inner {float: right; width: 97%;} \
table.board-states-inner {float: right; width: 93%;} \
table.board-efforts-inner {float: right; width: 90%;} \
</style> \
');
            $('td.col-two > div:first').fadeOut('slow',
                function() {
                    $(this).html('').append(
                        $('<span class="tableTitle">Total effort assigned to users</span><br/><!--select id="iteration-select"></select--><br/><div id="assigned-effort-report"><div class="ui-wait-icon"></div></div>')
                    ).fadeIn('slow', loadData);
                }
            );
        }

        var api_base = appHostAndPath+"/api/v1/";

        function loadData() {
            $.getJSON(api_base+"Assignables?include=[Assignments[GeneralUser[FirstName,LastName,Role],Role],RoleEfforts[Effort,EffortToDo,TimeSpent,TimeRemain,Role],EntityType,EntityState,Name,Iteration[Name,StartDate,EndDate]]&where=(EntityState.IsFinal%20eq%20'false')%20and%20(Iteration%20is%20not%20null)%20and%20(Effort%20gt%200)&format=json&take=1000", formatResult);
        }

        // build a structure that can be used for iteration / building the tables
        function formatResult(data) {
            var minDate = getMinDate();
    				          	
            var fmtData = {'users': {}, 'overallEffort': 0};
            $.each(data.Items, function(k,item) {
              	var startDate = new Date(parseInt(/\/Date\((\d+).*/.exec(item.Iteration.StartDate)[1]));
                if(startDate > minDate){
                  $.each(item.Assignments.Items, function(l,asmt) {
                      /* check to see if this user is in our fmtData object */
                      if (fmtData.users[asmt.GeneralUser.Id] == null) {
                          /* create the first record */
                          fmtData.users[asmt.GeneralUser.Id] = {
                              'FirstName' : asmt.GeneralUser.FirstName,
                              'LastName' : asmt.GeneralUser.LastName,
                              'DefaultRole' : asmt.GeneralUser.Role.Name,
                              'TotalEffort' : 0,
                              'TotalToDo' : 0,
                              'TotalTimeSpt' : 0,
                              'TotalTimeRem' : 0,
                              'Items' : [],
                              'Iterations' : {}
                          }
                      }
                      // assignables are ordered by iteration
                      if(fmtData.users[asmt.GeneralUser.Id].Iterations[item.Iteration.Id] == null){
                        fmtData.users[asmt.GeneralUser.Id].Iterations[item.Iteration.Id] = {
                          'Name' : item.Iteration.Name,
                          'StartDate' : startDate,
                          'EndDate' : new Date(parseInt(/\/Date\((\d+).*/.exec(item.Iteration.EndDate)[1])),
                          'TotalEffort' : 0,
                          'TotalToDo' : 0,
                          'TotalTimeSpt' : 0,
                          'TotalTimeRem' : 0,
                          'States' : {}
                        }
	                fmtData.users[asmt.GeneralUser.Id].Items.push(item.Iteration.Id);
                      }
                      // and by state
                      if(fmtData.users[asmt.GeneralUser.Id].Iterations[item.Iteration.Id].States[item.EntityState.Name] == null){
                        fmtData.users[asmt.GeneralUser.Id].Iterations[item.Iteration.Id].States[item.EntityState.Name] = {
                          'Name' : item.EntityState.Name,
                          'TotalEffort' : 0,
                          'TotalToDo' : 0,
                          'TotalTimeSpt' : 0,
                          'TotalTimeRem' : 0,
                          'Items' : []
                        }
                      }
                      var roleEffortItem = getRoleEffortItem(item, asmt.Role.Id);
                      console.log(roleEffortItem);
                      // sum up efforts for user
                      fmtData.users[asmt.GeneralUser.Id].TotalEffort += roleEffortItem.Effort;
                      fmtData.users[asmt.GeneralUser.Id].TotalToDo += roleEffortItem.EffortToDo;
                      fmtData.users[asmt.GeneralUser.Id].TotalTimeSpt += roleEffortItem.TimeSpent;
                      fmtData.users[asmt.GeneralUser.Id].TotalTimeRem += roleEffortItem.TimeRemain;
                      fmtData.overallEffort += roleEffortItem.Effort;
                      // sum up efforts for iteration
                      fmtData.users[asmt.GeneralUser.Id].Iterations[item.Iteration.Id].TotalEffort += roleEffortItem.Effort;
                      fmtData.users[asmt.GeneralUser.Id].Iterations[item.Iteration.Id].TotalToDo += roleEffortItem.EffortToDo;
                      fmtData.users[asmt.GeneralUser.Id].Iterations[item.Iteration.Id].TotalTimeSpt += roleEffortItem.TimeSpent;
                      fmtData.users[asmt.GeneralUser.Id].Iterations[item.Iteration.Id].TotalTimeRem += roleEffortItem.TimeRemain;
                      // sum up efforts for state
                      fmtData.users[asmt.GeneralUser.Id].Iterations[item.Iteration.Id].States[item.EntityState.Name].TotalEffort += roleEffortItem.Effort;
                      fmtData.users[asmt.GeneralUser.Id].Iterations[item.Iteration.Id].States[item.EntityState.Name].TotalToDo += roleEffortItem.EffortToDo;
                      fmtData.users[asmt.GeneralUser.Id].Iterations[item.Iteration.Id].States[item.EntityState.Name].TotalTimeSpt += roleEffortItem.TimeSpent;
                      fmtData.users[asmt.GeneralUser.Id].Iterations[item.Iteration.Id].States[item.EntityState.Name].TotalTimeRem += roleEffortItem.TimeRemain;
                      // add the assignable to the state
                      fmtData.users[asmt.GeneralUser.Id].Iterations[item.Iteration.Id].States[item.EntityState.Name].Items.push({
                          'EntityId' : item.Id,
                          'Name' : item.Name,
                          'EntityType' : item.EntityType.Name,
                          'EntityState' : item.EntityState.Name,
                          'Role' : asmt.Role.Name,
                          'Effort' : roleEffortItem.Effort,
                          'TimeSpent' : roleEffortItem.TimeSpent,
                          'TimeRemain' : roleEffortItem.TimeRemain
                      });
                  });
                }
            });
            console.log(fmtData);
            drawIterationChart(fmtData);
        }

        // get the effort of the given role from the given item
        function getRoleEffortItem(item, roleId) {
            for (var i = 0; i < item.RoleEfforts.Items.length; ++i) {
                if (item.RoleEfforts.Items[i].Role.Id == roleId)
                    return item.RoleEfforts.Items[i];
            }
        }

        // parse the data and draw the tables for all users / iterations / states
        function drawIterationChart(data){
            var table = $('<table class="board-efforts" style="width: 100%;"></table>');
            table.append($('<tr><th colspan="2" style="width: 25%;">User</th><th style="width: 75%;">Total Effort</th></tr>'));
            $.each(data.users, function(k,user) {
              	user.Items.sort(Numsort);
                var tr = $('<tr class="hoverHi"></tr>');
                tr.append($('<td class="more"></td>').click(function() {
                    /* this should open the user details (iterations) */
                    $(this).toggleClass('less');
                    $(this).parent().next().slideToggle('slow');
                }));
                tr.append("<td>{0}, {1} <em>({2})</em></td>".f(user.FirstName, user.LastName, user.DefaultRole));
                var width = (user.TotalEffort / data.overallEffort) * 100;
                var innerWidth = (user.TotalToDo / user.TotalEffort) * 100;
                console.log(innerWidth);
                var innerBar = $('<div></div>').addClass('innerBar').css('width', innerWidth+"%").html(user.TotalEffort);
                tr.append($('<td></td>').addClass('bar').css('width', width+"%").append(innerBar));
                table.append(tr);
                // we need a single td for the open / close button
                var iterTr = $('<tr class="innerData"></tr>');
                var iter = $('<td></td>').attr('colspan','3');
                // table for all iterations
                var iterTable = $('<table class="board-iterations-inner"></table>');
                /* iterate through all iterations :) */
                iterTable.append($('<tr><th style="width: 20;"></th><th>Iteration</th><th>StartDate</th><th>EndDate</th><th>Total Effort</th><th>Total Time Spent</th><th>Total Remaining</th></tr>'));
		for (var ia = 0; ia < user.Items.length; ia++) {
                  var iteration = user.Iterations[user.Items[ia]]
                  tr = $('<tr class="hoverHi"></tr>');
                  tr.append($('<td class="more"></td>').click(function() {
                      /* this should open the iteration details (entity states including all assignables */
                      $(this).toggleClass('less');
                      $(this).parent().next().slideToggle('slow');
                  }));
                  tr.append("<td>{0}</td><td>{1}</td><td>{2}</td><td>{3}</td><td>{4}</td><td>{5}</td></tr>".f(iteration.Name, getDateString(iteration.StartDate), getDateString(iteration.EndDate), iteration.TotalEffort, iteration.TotalTimeSpt, iteration.TotalTimeRem));
                  iterTable.append(tr);

                  // table for all states
                  var stateTr = $('<tr class="innerData"></tr>');
                  var stateTd = $('<td></td>').attr('colspan','7');
                  var stateTable = $('<table class="board-states-inner"></table>');
                  for (var id in iteration.States){
                    var state = iteration.States[id];
                    tr = $('<tr></tr>');
                    tr.append("<td></td><td colspan='6'>State: {0}</td>".f(state.Name));
                    stateTable.append(tr);

		    tr = $('<tr></tr>');
                    var inner = $('<td></td>').attr('colspan','7');
                    var innerTable = $('<table class="board-efforts-inner"></table>');
                    innerTable.append($('<tr><th style="width: 33%;" colspan="2">Assignable</th><th style="width: 10%">State</th><th style="width: 10%">Role</th><th>Effort</th><th>Time Spent</th><th>Remaining</th></tr>'));
                    $.each(state.Items, function(k,item) {
                      innerTable.append('<tr><td><img src="{0}/img/{1}.gif"></td><td><a href="{8}">#{9} {2}</a></td><td>{3}</td><td>{4}</td><td>{5}</td><td>{6}</td><td>{7}</td>'.f(appHostAndPath, item.EntityType, item.Name, item.EntityState, item.Role, item.Effort, item.TimeSpent, item.TimeRemain, getTypeLink(item.EntityType,item.EntityId), item.EntityId));
                    });
                    innerTable.append('<tr style="border-top: 1px solid #66666;"><th colspan="4" style="text-align: right;">Totals:</td><td>{0}</td><td>{1}</td><td>{2}</td></tr>'.f(state.TotalEffort, state.TotalTimeSpt, state.TotalTimeRem));
                    inner.append(innerTable);
                    tr.append(inner);
                    stateTable.append(tr);
                  };
                  stateTd.append(stateTable);
                  stateTr.append(stateTd);
                  iterTable.append(stateTr);
                };
                iter.append(iterTable);
                iterTr.append(iter);
                table.append(iterTr);
//                tr = $('<tr style="border-top: 1px solid #66666;"></tr>');
//                tr.append("<td colspan='2'></td><td>Effort:{0}  Time Spent:{1}  Remaining:{2}</td>".f(user.TotalEffort, user.TotalTimeSpt, user.TotalTimeRem));
//                table.append(tr);
            });
            $('div#assigned-effort-report').html('').append(table);
        }
      
        // Build a link to open User Story, Task or Bug with the given id
      	function getTypeLink(entityType, entityID){
          var myLink = appHostAndPath+"/Project/";
          if(entityType == "UserStory")
            myLink += "Planning/UserStory/View.aspx?UserStoryID=";
          if(entityType == "Task")
            myLink += "Planning/Task/View.aspx?TaskID=";
          if(entityType == "Bug")
            myLink += "QA/Bug/View.aspx?BugID=";
	  
          myLink += entityID;
          
          return myLink;
	}
      
        // Simple date formatter
      	function getDateString(date){
          return date.getDate()+"."+(date.getMonth()+1)+"."+date.getFullYear();
      	}
      
        // Numeric sort function
        function Numsort (a, b) {
  	  return a - b;
	}
      
      	// calculate start date of last iteration 
        function getMinDate(){
          var now = new Date();
	  var subMilliSeconds = (now.getDay()+7) * 86400000;
          subMilliSeconds += now.getHours() * 3600000;
          subMilliSeconds += now.getMinutes() * 60000;
          subMilliSeconds += now.getSeconds() * 1000;
          subMilliSeconds += now.getMilliseconds();
          return new Date(now.getTime() - subMilliSeconds);
        }
      
        /* add the link */
        $(document).ready(function() {
            $('a:contains("Time By Person")').after($('<a id="allocation-link" href="#">Filtered Assigned Effort</a>').click(showReport));
        });
    }
);

String.prototype.f = function() {
    var s = this, i = arguments.length;
    while (i--)
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    return s;
};