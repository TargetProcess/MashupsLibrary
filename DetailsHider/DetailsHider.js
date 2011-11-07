tau.mashups
	.addDependency("libs/jquery/jquery")
	.addMashup(function(config) {

		function DetailsHider() {}
        $(document).ready(function() { 
            $('#copy').find('div').first().hide();
            $('#copy').parent().css('font-size','0'); /* such a terrible hack */
            $('#ctl00_footer_notLoginPage').hide()
        });
    }
);
