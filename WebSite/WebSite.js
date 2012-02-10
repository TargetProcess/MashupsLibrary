tau.mashups
 .addDependency('libs/jquery/jquery')
 .addMashup(function ($, config) {
   
   var appended;
   var appendFrame = function() {
     if (appended) return appended;
     appended = $('<iframe style="width:100%; height:6000px; display: none; border:0" src="http://www.targetprocess.com"></iframe>')
         .insertAfter($('#main'));
     return appended;
   }
       
   var toggleWebSite = function() {
     appendFrame().toggle();
     
     $('#main').toggle();
   }
   
 $('<li><a href="#">www.targetprocess.com</a></li>')
   .click(function() {toggleWebSite();})
   .insertBefore($('li.avatar'));
   
   
   
  });