tau.mashups
   .addDependency('app.bus')
   .addMashup(function (appBus) {
       function subscribe(bus) {
           bus.on('$editorHolder.ready', function (evt, $element) {
               setTimeout(function () {
                   $element.find('input[value=Requesters]').prop('checked', true);
                   //$element.find('input[value=Owner]').prop('checked', true);
                   //$element.find('input[value=Assigned]').prop('checked', true);
                   //$element.find('input[value=Team]').prop('checked', true);
               }, 0);
           })
       }

       if (appBus.then) {
           appBus.then(subscribe);
       } else {
           subscribe(appBus);
       }
   });
