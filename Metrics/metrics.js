tau.mashups
	.addDependency('tp3/mashups/topmenu')
	.addDependency('tp3/mashups/popup')
	.addDependency('tp3/mashups/context')
	.addMashup(function(topmenu, popup, context) {

		require(['http://code.highcharts.com/highcharts.js'], function() {

			var metrics = function() {

			this._popup = null;

			this._getWeeks = function(weeksCount) {
				var currendDate = new Date();
				var weeks = [];
				for (var i = 0; i < weeksCount; i++) {
					var day = currendDate.getDay(); if (day == 0) day = 7;

					var mon = (new Date(currendDate.getFullYear(), currendDate.getMonth(), currendDate.getDate()));
					mon.setDate(currendDate.getDate() - day + 1);

					var sun = (new Date(currendDate.getFullYear(), currendDate.getMonth(), currendDate.getDate()));
					sun.setDate(currendDate.getDate() + (14 - day));

					weeks.push({
						range_name: 'week ' + (weeksCount - i),
						range_start: mon,
						range_end: sun
					});

					currendDate.setDate(currendDate.getDate() - 14);
				}
				return weeks.reverse();
			};

			this._getVelocity = function(dataType) {
				var dfr = $.Deferred();

				var ranges = this._getWeeks(12);
				var buildUrl = function(appPath, type, acid, start, end) {
					var searchGTthan = new Date(start.getTime());
					searchGTthan.setDate(searchGTthan.getDate() - 1);
					var searchLTthan = new Date(end.getTime());
					searchLTthan.setDate(searchLTthan.getDate() + 1);
					var url =
						appPath +
						'/api/v1/' + type + '?where=(' +
						"EndDate gt '" + searchGTthan.getFullYear() + '-' + (searchGTthan.getMonth() + 1) + '-' + searchGTthan.getDate()  + "') " +
						'and (' +
						"EndDate lt '" + searchLTthan.getFullYear() + '-' + (searchLTthan.getMonth() + 1) + '-' + searchLTthan.getDate() + "')" +
						'&acid=' + acid +
						'&format=json' +
						'&take=1000';

					if (type == 'UserStories') {
						url += '&include=[Name,EndDate,Bugs-Count]';
					}
					else {
						url += '&include=[Name,EndDate]';
					}
					return url;
				};

				$.when(context.getApplicationPath(), context.getAcid()).then(
					function(appPath, acid) {
						var dfrs = [];
						$.each(ranges, function(index, range) {
							var url = buildUrl(appPath, dataType, acid, range.range_start, range.range_end);
							var dfr_ajax_call = $.Deferred();
							dfrs.push(dfr_ajax_call);
							$.ajax({
								'url': url,
								context: {'dfr': dfr_ajax_call, 'index': index}
							}).success(function(data) {
									this.dfr.resolve({'index': index, 'data': data});
								});
						});

						$.when.apply(null, dfrs).then(function() {
							$.each(arguments, function(index, result) {

								ranges[result.index].value = result.data.Items.length;
								ranges[result.index].bugsCount = result.data.Items.reduce(
									function(sum, value) {
										return value['Bugs-Count'] ? sum + value['Bugs-Count'] : sum;
									},
									0
								);
							})
							dfr.resolve(ranges);
						});
					}
				);

				return dfr;

			};

			this._renderVelocity = function(container, usData, bugData) {

				var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
				var categories =  usData.map(function(v) { return '' + v.range_start.getDate() + ' ' + month[v.range_start.getMonth()]; });
				var doneStories =  usData.map(function(v) { return v.value; });
				var doneBugs =  bugData.map(function(v) { return v.value; });

				var doneStoriesBugCount =  usData.map(function(v) { return v.bugsCount || 0; });

				var chart = new Highcharts.Chart({
					chart: {
						renderTo: container,
						type: 'column'
					},
					title: {
						text: 'Done US/Bug per 2 weeks'
					},
					xAxis: {
						'categories': categories,
						//type: 'datetime',

					},
					yAxis: {
						min: 0,
							title: {
							text: '(count)'
						}
					},
					legend: {
						layout: 'vertical',
							backgroundColor: '#FFFFFF',
							align: 'left',
							verticalAlign: 'top',
							x: 50,
							y: 0,
							floating: true,
							shadow: true
					},
					tooltip: {
						formatter: function() {
							return '' + this.y + '';
						}
					},
					plotOptions: {
						column: {
							pointPadding: 0.2,
								borderWidth: 0
						}
					},
					series: [{
						name: 'UserStories',
						data: doneStories

					},{
						name: 'Bugs',
						data: doneBugs

					},{
						type: 'spline',
						name: 'Bug Count in Done US',
						data: doneStoriesBugCount

					}]
				});
			};

			this._render = function() {
				var mertricsPopup = new popup();
				mertricsPopup.showLoading();
				var $container = mertricsPopup.$container;

				var $velocityContainer = $('<div></div>');
				$velocityContainer.attr('style', 'height: 200px');
				$velocityContainer.appendTo($container);

				var velocityElement = $velocityContainer.get(0);

				$.when(this._getVelocity('UserStories'), this._getVelocity('Bugs')).then($.proxy(
					function(usData, bugData) {
						mertricsPopup.hideLoading();
						this._renderVelocity(velocityElement, usData, bugData);
					}, this));

				return mertricsPopup;
			};

			this._show = function() {
				if (this._popup == null) {
					this._popup = this._render();
				}
				this._popup.show();
			};

			topmenu
				.addItem('Metrics')
				.onClick($.proxy(this._show, this));

			context.onChange($.proxy(function(d) {
				this._popup = null;
			}, this));
		};
			new metrics();
		});

	});
