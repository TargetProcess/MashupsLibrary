tau.mashups
	.addDependency("libs/jquery/jquery")
	.addMashup(function(config) {

        var alertEl = '<br/><div class="alert"><strong>Heads up!</strong> {0} is ending soon!  Be sure to <a href="'+appHostAndPath+'/Project/Planning/Iteration/Finish.aspx?IterationID={1}">finish</a> it properly!</div>';

        function checkForFinishingSprints(data) {
            $.each(data.Items, function(id, sprint) {
                $('div#ctl00_helpPanel').append(alertEl.f(sprint.Name,sprint.Id));
            });
        }

        $(document).ready(function() { 
            if (loggedUser.isAdministrator == true) {
                $('head').append('<style type="text/css" media="screen">.alert{position:relative;left: 100px;padding:8px 35px 8px 14px;margin-top:-35px;text-shadow:0 1px 0 rgba(255, 255, 255, 0.5);border:1px solid #fbeed5;-webkit-border-radius:4px;-moz-border-radius:4px;border-radius:4px;background-color:#d9edf7;border-color:#bce8f1;color:#3a87ad;}</style>');
                $.getJSON(appHostAndPath+"/api/v1/Iterations?include=[Name,Id]&where=(EndDate%20in%20('tomorrow','today'))", checkForFinishingSprints);
            }
        });
    }
);

String.prototype.f = function() {
    var s = this, i = arguments.length;
    while (i--)
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    return s;
};

