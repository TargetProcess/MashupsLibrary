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
                table.board-efforts-inner {float: right; width: 90%;} \
                </style> \
            ');
            $('td.col-two > div:first').fadeOut('slow', 
                function() { 
                    $(this).html('').append(
                        $('<span class="tableTitle">Total effort assigned to users</span><br/><br/><div id="assigned-effort-report"><div class="ui-wait-icon"></div></div>')
                    ).fadeIn('slow', loadData);
                }
            );
        }

        var api_base = appHostAndPath+"/api/v1/";

        function loadData() {
            $.getJSON(api_base+"Assignables?include=[Assignments[GeneralUser[FirstName,LastName,Role],Role],RoleEfforts[Effort,EffortToDo,TimeSpent,TimeRemain,Role],EntityType,EntityState,Name]&where=(EntityState.IsFinal%20eq%20'false')%20and%20(Effort%20gt%200)&format=json&take=1000", formatResult);
        }

        function formatResult(data) {
            var fmtData = {'users': {}, 'overallEffort': 0};
            $.each(data.Items, function(k,item) {
                $.each(item.Assignments.Items, function(l,asmt) {
                    /* check to see if this user is in our fmtData object */
                    if (fmtData.users[asmt.GeneralUser.Id] == null) {
                        /* create the first record */
                        fmtData.users[asmt.GeneralUser.Id] = {
                            'FirstName'     : asmt.GeneralUser.FirstName,
                            'LastName'      : asmt.GeneralUser.LastName,
                            'DefaultRole'   : asmt.GeneralUser.Role.Name,
                            'TotalEffort'   : 0,
                            'TotalToDo'     : 0,
                            'TotalTimeSpt'  : 0,
                            'TotalTimeRem'  : 0,
                            'Items'         : []
                        }
                    }
                    var roleEffortItem = getRoleEffortItem(item, asmt.Role.Id);
                    console.log(roleEffortItem);
                    fmtData.users[asmt.GeneralUser.Id].TotalEffort += roleEffortItem.Effort;
                    fmtData.users[asmt.GeneralUser.Id].TotalToDo += roleEffortItem.EffortToDo;
                    fmtData.users[asmt.GeneralUser.Id].TotalTimeSpt += roleEffortItem.TimeSpent;
                    fmtData.users[asmt.GeneralUser.Id].TotalTimeRem += roleEffortItem.TimeRemain;
                    fmtData.overallEffort += roleEffortItem.Effort;
                    fmtData.users[asmt.GeneralUser.Id].Items.push({
                        'EntityId'      : item.Id,
                        'Name'          : item.Name,
                        'EntityType'    : item.EntityType.Name,
                        'EntityState'   : item.EntityState.Name,
                        'Role'          : asmt.Role.Name,
                        'Effort'        : roleEffortItem.Effort,
                        'TimeSpent'     : roleEffortItem.TimeSpent,
                        'TimeRemain'    : roleEffortItem.TimeRemain
                    });
                });
            });
            console.log(fmtData);
            drawChart(fmtData);
        }

        function getRoleEffortItem(item, roleId) {
            for (var i = 0; i < item.RoleEfforts.Items.length; ++i) {
                if (item.RoleEfforts.Items[i].Role.Id == roleId)
                    return item.RoleEfforts.Items[i];
            }
        }

        function drawChart(data) {
            var table = $('<table class="board-efforts" style="width: 100%;"></table>');
            table.append($('<tr><th colspan="2" style="width: 25%;">User</th><th style="width: 75%;">Total Effort</th></tr>'));
            $.each(data.users, function(k,user) {
                var tr = $('<tr class="hoverHi"></tr>');
                tr.append($('<td class="more"></td>').click(function() {
                    /* this should open the "more information thing */
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
                /* build the expanded data row */
                tr = $('<tr class="innerData"></tr>');
                var inner = $('<td></td>').attr('colspan','3');
                var innerTable = $('<table class="board-efforts-inner"></table>');
                innerTable.append($('<tr><th style="width: 33%;" colspan="2">Assignable</th><th style="width: 10%">State</th><th style="width: 10%">Role</th><th>Effort</th><th>Time Spent</th><th>Remaining</th></tr>'));
                $.each(user.Items, function(k,item) {
                    innerTable.append('<tr><td><img src="{0}/img/{1}.gif"></td><td>{2}</td><td>{3}</td><td>{4}</td><td>{5}</td><td>{6}</td><td>{7}</td>'.f(appHostAndPath, item.EntityType, item.Name, item.EntityState, item.Role, item.Effort, item.TimeSpent, item.TimeRemain));
                });
                innerTable.append('<tr style="border-top: 1px solid #66666;"><th colspan="4" style="text-align: right;">Totals:</td><td>{0}</td><td>{1}</td><td>{2}</td></tr>'.f(user.TotalEffort, user.TotalTimeSpt, user.TotalTimeRem));
                inner.append(innerTable);
                tr.append(inner);
                table.append(tr);
            });
            $('div#assigned-effort-report').html('').append(table);
        }

        /* add the link */
        $(document).ready(function() {
            $('a:contains("Time By Person")').after($('<a id="allocation-link" href="#">Assigned Effort</a>').click(showReport));
        });
    }
);

String.prototype.f = function() {
    var s = this, i = arguments.length;
    while (i--)
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    return s;
};
