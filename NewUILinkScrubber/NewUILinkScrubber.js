tau.mashups
	.addDependency("libs/jquery/jquery")
	.addMashup(function(config) {

		function NewUILinkScrubber() {}
        
        NewUILinkScrubber.prototype = {
            render: function () {
                var CAPTURE_REGEXP = /View\.aspx\?([A-Za-z]+)ID=([0-9]+)/;
                var URL_BASE = appHostAndPath + '/RestUI/TpView.aspx#';
				$('a').each(function() {
                    var capture = CAPTURE_REGEXP.exec($(this).attr('href'));
                    if (capture != null) {
                        $(this).attr('href',URL_BASE+capture[1].toLowerCase()+'/'+capture[2]);
                    }
                });
            }
        }
        
        Sys.WebForms.PageRequestManager.getInstance().add_pageLoaded(function() { new NewUILinkScrubber().render(); });
        $(document).ready(function() { new NewUILinkScrubber().render(); });
    }
);
