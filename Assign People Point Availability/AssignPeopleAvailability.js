tau.mashups.addDependency('libs/jquery/jquery').addMashup(
function ($, config) {
    function assignPeopleAvailabilityInfo() {}
    assignPeopleAvailabilityInfo.prototype = {
        render: function () {
			this.gatherAvailabilities();
			/* set up our mutation observer */
			var userAgent = navigator.userAgent || navigator.vendor;
			if (typeof MutationObserver !== 'undefined')
				this.observer = new MutationObserver(this.handleHourChange);
			else if (typeof WebKitMutationObserver !== 'undefined')
				this.observer = new WebKitMutationObserver(this.handleHourChange);
			if (this.observer) {
				this.observer.observe(document.getElementById('ctl00_mainArea_updPanel'),
					{ subtree: true, childList: true, attribute: false, characterData: true });
			} else {
				$('#ctl00_mainArea_updPanel').bind('DOMSubtreeModified', this.handleHourChange);
			}
        },

		observer: null,
		
		gatherAvailabilities: function () {
			var acid = window.location.search.match(/acid=([0-9A-F]{32})/)[1];
			$.ajax({
				dataType: 'json',
				data: {format: 'json'},
				url: appHostAndPath+'/api/v1/Context'+(acid)?'?acid='+acid:'',
				success: function(context_data) {
					console.log(context_data);
					if (context_data.SelectedProjects.Items.length != 1) return;
					var project_id = context_data.SelectedProjects.Items[0].Id;
		            $('table#ctl00_mainArea_userGrid > tbody > tr > td > div[id*="_pnlUserNamePanel"]').each(function(i,panel) {
						var userName = $(panel).parent('td:first').find('div:first > b').html().trim();	
						$.ajax({
							dataType: 'json',
							context: panel,
							data: {
								format: 'json',
								where: "(User.LastName eq '"+userName.match(/\w+\s(\w+)/)[1]+"') and (Project.Id eq "+project_id+")"
							},
							url: appHostAndPath+'/api/v1/ProjectMembers',
							success: function(data) {
								var availability = data.Items[0].WeeklyAvailableHours;
								PersonalAvailabilityData[userName] = availability;
								var allocatedPanel = $(panel).parent('td:first').find('div:nth(1)');
								var hours = $(allocatedPanel).find('b:contains("h")');
								if (!hours) return;
								hours = hours.html().match(/(\d+).*/)[1];
								console.log('User '+userName+' has '+hours+'h assigned of '+availability);
								var span = $('<span></span>');
								span.css({'background': (hours > availability) ? 'red' : 'green', 'padding': '1px 2px', 'color': 'white'});
								span.html('<b>'+Math.abs(Math.round(availability-hours,2)).toString()+'h</b> '+((hours > availability) ? 'should be removed' : 'still available'));
								allocatedPanel.append(span);
							}
						});
					});
					
				}
			});
		},
		
		handleHourChange: function (e) {
			/* make sure we dont' endlessly loop */
			if (typeof e === 'object') {
				for (var i = 0; i < e.length; ++i) {
					if ((typeof e[i].addedNodes !== 'undefined') && (e[i].addedNodes.length == 1)) {
						if (e[i].addedNodes[0].tagName === 'SPAN')
							return;
					}
				}
			} else {
				if ((typeof e.addedNodes !== 'undefined') && (e.addedNodes.length == 1)) {
					if (e.addedNodes[0].tagName === 'SPAN')
						return;
				}
			}
			/* and do it */
			$('table#ctl00_mainArea_userGrid > tbody > tr > td > div[id*="_pnlUserNamePanel"]').each(function(i,panel) {
				var userName = $(panel).parent('td:first').find('div:first > b').html().trim();	
				var hours = $(panel).parent('td:first').find('div:nth(1) > b:contains("h")');
				var availability = PersonalAvailabilityData[userName];
				if ((!hours) && (!availability)) return;
				hours = hours.html().match(/(\d+).*/)[1];
				console.log('User '+$(panel).parent('td:first').find('div:first > b').html().trim()+' now has '+hours+'h assigned of '+availability);
				/* remove a span if we have it already */
				$(panel).parent('td:first').find('div:nth(1)').find('span').remove();
				var span = $('<span></span>');
				span.css({'background': (hours > availability) ? 'red' : 'green', 'padding': '1px 2px', 'color': 'white'});
				span.html('<b>'+Math.abs(Math.round(availability-hours,2)).toString()+'h</b> '+((hours > availability) ? 'should be removed' : 'still available'));
				$(panel).parent('td:first').find('div:nth(1)').append(span);
			});
		},
    }
    /* make it happen! */
    $(document).ready(function() {
		new assignPeopleAvailabilityInfo().render();
    });
});
Math._round = Math.round;
Math.round = function(number, precision)
{
	precision = Math.abs(parseInt(precision)) || 0;
	var coefficient = Math.pow(10, precision);
	return Math._round(number*coefficient)/coefficient;
}
var PersonalAvailabilityData = {};