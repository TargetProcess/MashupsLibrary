var listAccessDenied = {
 roles: [],
 ids: []
};
tau.mashups
 .addDependency('tau/core/bus.reg')
 .addMashup(function(reg) {
 
  var loggedUser = window.loggedUser || {};
    var isAccessDenied = false;
    isAccessDenied = (_.indexOf(listAccessDenied.roles, loggedUser.role) !== -1);
    isAccessDenied = isAccessDenied || (_.indexOf(listAccessDenied.ids, loggedUser.id) !== -1);
  
  var hideElement = function(bus) {   
   bus.on('afterRender', function(evt, data) {    
    if (isAccessDenied) {
     var $element = data.element;
     if(bus.name === 'board.editor.container') {
      $element.find('.i-role-tabheader[data-label=templates]').hide();
     } else {
      $element.hide();
     }     
    }    
   });
  };
 
  reg.getByName('board.add').done(hideElement);
  reg.getByName('board.clone').done(hideElement);
  reg.getByName('board.editor.container').done(hideElement);
 
  reg.getByName('application board').done(function(bus){
    bus.on('boardSettings.ready',function(){
     reg.getByName('board.clone').done(hideElement);
     reg.getByName('board.editor.container').done(hideElement);
    });
  }); 
});