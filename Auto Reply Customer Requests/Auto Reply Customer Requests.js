tau.mashups
	.addDependency("libs/jquery/jquery")
	.addMashup(function(config) {
        function checkRequestersCheckBoxes() {
            /* old views */
            $('div.notify').find('input.requesters').prop('checked', true);
        };

        $(document).ready(function() {
            /* firing on ready works for old views */
            checkRequestersCheckBoxes();
        });
    }
);

