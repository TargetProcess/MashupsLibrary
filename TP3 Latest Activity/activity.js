tau.mashups.addDependency('jQuery')
  .addDependency('Underscore')
  .addDependency('tp3/mashups/topmenu')
  .addDependency('tp3/mashups/popup')
  .addDependency('tp3/mashups/context')
  .addMashup(function($, _, topmenu, popup, context) {

  // add new link to the top header  
  var link = topmenu.addItem({
    title: 'Activity'
  });

  if (!String.prototype.format) {
    String.prototype.format = function() {
      var args = arguments;
      return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
      });
    };
  }

  require(['https://raw.github.com/timrwood/moment/2.0.0/min/moment.min.js'], function() {

    var acid = "";
    var selectedProjects = [];

    context.onChange(function(ctx) { 
      acid = ctx.acid;
      selectedProjects = ctx.selectedProjects;
    });

    link.onClick(function() {

      var activityPopup = new popup();
      activityPopup.show();
      activityPopup.showLoading();
      var $container = activityPopup.$container;
      
      $.when(context.getApplicationPath(), context.getAcid()).then(

      function(appPath, tempAcid) {
       
        // appPath like "http://plan.tpondemand.com";

        var DAY_AGO = 2;

        var eventTypes = ["add", "comment", "state"];
        var activity = [];
        var callsCount = 0;
       
        var stateQuery = appPath + "/api/v1/{0}Histories?where={1}and({0}.{2})&orderbyDesc=Date&include=[Date,EntityState[Name,EntityType],{0}[Name,Project[Color,Abbreviation]],Modifier]&format=json&take=100&callback=?";

        var addQuery = appPath + "/api/v1/Generals?where={0}&acid={1}&include=[Name,Owner,EntityType[Name],CreateDate,Project[Color,Abbreviation]]&format=json&take=300&callback=?";

        var commentQuery = appPath + "/api/v1/Comments?where={0}and(General.{1})&include=[Description,Owner,CreateDate,General[EntityType,Project[Color,Abbreviation],Name]]&format=json&take=100&callback=?";


       
        var projectFilter = getProjectFilter();

        var entities = ["UserStory", "Bug", "Task"];

        var requests = [];
        requests["state"] = function() {
          _.each(entities, function(entity) {
            callsCount++;
            $.getJSON(stateQuery.toString().format(entity, getDateFilter("Date"), projectFilter), buildStateChangesData);
          });
        }
        requests["comment"] = function() {
          callsCount++;
          $.getJSON(commentQuery.toString().format(getDateFilter("CreateDate"), projectFilter), buildCommentsData);
        }
        requests["add"] = function() {
          callsCount++;
          $.getJSON(addQuery.toString().format(getDateFilter("CreateDate"), acid), buildAddedData);
        }

        function fireRequests() {
          callsCount = 0;
          // reset activity array
          activity.length = 0;

          // fire required requests based on selected chedkboxes
          _.each(eventTypes, function(e) {
            requests[e]();
          })
        }

        fireRequests();



        function buildStateChangesData(data) {
          //debugger;
          for (i = 0; i < data.Items.length; i++) {
            if (data.Items[i]) {

              var history = data.Items[i];
              var entityType = history.EntityState.EntityType.Name.toString();

              activity.push({
                EntityType: entityType,
                EventDate: extractDate(history.Date),
                State: history.EntityState.Name,
                EntityName: history[entityType].Name,
                User: extractFullName(history.Modifier),
                UserId: history.Modifier.Id,
                ProjectAbbreviation: history[entityType].Project.Abbreviation,
                Color: history[entityType].Project.Color,
                Id: history[entityType].Id
              });
            }
          }

          assembleActivity();
        }

        function buildCommentsData(data) {
          //debugger;
          for (i = 0; i < data.Items.length; i++) {
            if (data.Items[i]) {

              var comment = data.Items[i];

              activity.push({
                EntityType: comment.General.EntityType.Name,
                EventDate: extractDate(comment.CreateDate),
                State: "Comment",
                EntityName: comment.General.Name,
                User: extractFullName(comment.Owner),
                UserId: comment.Owner.Id,
                ProjectAbbreviation: (comment.General.Project) ? comment.General.Project.Abbreviation : "",
                Color: (comment.General.Project) ? comment.General.Project.Color : "",
                Id: comment.General.Id
              });
            }
          }

          assembleActivity();
        }

        function buildAddedData(data) {
          //debugger;
          for (i = 0; i < data.Items.length; i++) {
            if (data.Items[i]) {

              var general = data.Items[i];

              activity.push({
                EntityType: general.EntityType.Name,
                EventDate: extractDate(general.CreateDate),
                State: "Added",
                EntityName: general.Name,
                User: extractFullName(general.Owner),
                UserId: general.Owner.Id,
                ProjectAbbreviation: (general.Project) ? general.Project.Abbreviation : "",
                Color: (general.Project) ? general.Project.Color : "",
                Id: general.Id
              });
            }
          }

          assembleActivity();
        }

        // combine data into HTML
        var assembleActivity = _.after(callsCount, function() {

          // Sort unified history data by date
          activity = _(activity).sortBy(function(item) {
            return item.EventDate;
          });

          activity.reverse();

          var groupedActivity = _.groupBy(activity, function(item) {
            return moment(item.EventDate).format('MMM-DD')
          });

          //$container.html("");

          $("#ac_filter").remove();
          $("#ac_main").remove();

          var html = '<div id="ac_filter" style="font-size: 12px"><input type="checkbox" ' + isEventChecked("add") + ' class="ac_event_filter" value="add"> Add <input type="checkbox"  ' + isEventChecked("comment") + '  class="ac_event_filter" value="comment"> Comment <input class="ac_event_filter"  ' + isEventChecked("state") + '  type="checkbox" value="state"> State Change</div>';

          html += "<div id='ac_main' style='height: 100%; overflow: scroll'><table style='font-size: 11px !important'>";
          var template = "<tr><td><img width='16' height='16' src='{3}/avatar.ashx?size=16&UserId={9}'> <b>{0}</b></td><td>{1}</td><td><span class='delimeter'>—</span> <span style='background:{7}'>{8}</span> {2} <a href='{3}/View.aspx?id={4}'>{5}</a> by {6}</td></tr>";


          _.each(groupedActivity, function(val, key) {
            html += "<tr><td colspan='3'><h2>Day " + key + "</h2></td></tr>";
            _.each(val, function(item) {
              html += template.format(moment(item.EventDate).format('HH:mm'), item.State, item.EntityType.toString(), appPath, item.Id, item.EntityName, item.User, item.Color, item.ProjectAbbreviation, item.UserId)
            })
          })

          html += "</table></div>";
          $container.append(html);
          
          activityPopup.hideLoading();
          
        });


        $('.ac_event_filter').live("change", function() {
          
          eventTypes.length = 0;

          // do your staff here. It will fire any checkbox change
          var boxes = $(".ac_event_filter:checked");
          _.each(boxes, function(box) {
            eventTypes.push(box.value);
          })
          fireRequests();
        });

        function isEventChecked(e) {
          return _.indexOf(eventTypes, e) == -1 ? "" : "checked";
        }

        function extractDate(date) {
          return new Date(parseInt(date.substr(6)));
        }

        function getProjectFilter() {
          var ids = "(<%_.each(p, function(project) { %>'<%= project.id %>',<%});%>";
          var projectIds = _.template(ids, {p: selectedProjects});
          projectIds = projectIds.slice(0, -1); 
          projectIds += ")";
          return "Project.Id%20in%20{0}".format(projectIds);
        }

         function getDateFilter(fieldName) {
          var daysAgo = moment().subtract('days', DAY_AGO).format("YYYY-MM-DD");
          var today = moment().format("YYYY-MM-DD");
          return "({0}%20gte%20'{1}')and({0}%20lte%20'{2}')".format(fieldName, daysAgo, today);
        }


        function extractFullName(user) {
          var userName = "";
          if (user.FirstName) {
            userName += user.FirstName;
          }
          if (user.LastName) {
            userName += " " + user.LastName;
          }
          return (userName) ? userName : "Anonymous";
        }

      });
    });
  });
});