tau.mashups
   .addDependency('app.bus')
   .addMashup(function (gb) {
       gb.done(function (bus) {
           bus.on('$editorHolder.ready', function (evt, $element) {
               setTimeout(function () {
                   $element.find('input[value=Requesters]').prop('checked', true);
                  //$element.find('input[value=Owner]').prop('checked', true);
                  //$element.find('input[value=Assigned]').prop('checked', true);
                  //$element.find('input[value=Team]').prop('checked', true);
               }, 0);
           })
       })
   });
