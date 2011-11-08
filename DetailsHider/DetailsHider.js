tau.mashups
	.addDependency("libs/jquery/jquery")
	.addMashup(function(config) {

		function DetailsHider() {}
        $(document).ready(function() { 
            /* Hide the page generation time */
            $('#copy').find('div').first().hide();
            /* Hide the "You're using the free version" text
             * (this is such a terrible hack, but the text isn't wrapped in its own <div> or anything */
            $('#copy').parent().css('font-size','0');
            /* And hide the "what's new" and "check for updates" line */
            $('#ctl00_footer_notLoginPage').hide()
        });
    }
);
