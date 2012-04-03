tau.mashups
	.addDependency("libs/jquery/jquery")
	.addMashup(function(config) {
        function checkRequestersCheckBoxes() {
            /* old views */
            $('div.notify').find('input.requesters').prop('checked', true);
            /* new views */
            $('div.tau-notification-practices-settings').find('input#requestor').prop('checked', true);
        };

        $(document).ready(function() {
            /* firing on ready works for old views */
            checkRequestersCheckBoxes();
            /* and we need to do this for new views */ 
            $('#main').bind('DOMSubtreeModified', function() { checkRequestersCheckBoxes() }); // TODO: this is super ugly and should probably change
        });
    }
);

