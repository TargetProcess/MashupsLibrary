tau.mashups
 .addDependency('libs/jquery/jquery')
 .addMashup(function ($, config) {
   
   // Put states' names that you want to hide here
   var statesToHide = ["In Progress", "Fixed"];
   
   for (var i = 0; i < statesToHide.length; i++) {
    var header = $(".kanban-swimlane-header-wrap span:contains('"+statesToHide[i]+"')").filter(function() {
        return $(this).text().match("^"+statesToHide[i]) != null;
    }).parent();

    //use header Id to construct column Id
    var col = $("#" + header.id().replace("header-", ""));

    //hide everything
    header.hide();
    col.hide();
   }
   
   
});