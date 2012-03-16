tau.mashups
 .addDependency('libs/jquery/jquery')
 .addMashup(function ($, config) {
   
   // Put states' names that you want to hide here
   var statesToHide = ["In Progress", "Fixed"];
   
   for (var i = 0; i < statesToHide.length; i++) {
    var header = $(".kanban-swimlane-header-wrap span:contains('"+statesToHide[i]+"')").parent();
    
    //use header Id to construct column Id
    var colId = header.id().replace("header-", ""); 
    var col = $("#" + colId);

    //hide everything
    header.hide();
    col.hide();
   }
   
   
});