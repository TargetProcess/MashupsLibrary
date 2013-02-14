tau.mashups
	.addDependency('tp3/mashups/topmenu')
	.addDependency('tp3/mashups/popup')
	.addDependency('tp3/mashups/context')
	.addDependency('libs/d3/d3')
	.addDependency('libs/nvd3/nvd3')
	.addMashup(function(topmenu, popup, context, d3, nvd3) {

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
					sun.setDate(currendDate.getDate() + (7 - day));

					weeks.push({
						range_name: 'week ' + (weeksCount - i),
						range_start: mon,
						range_end: sun
					});

					currendDate.setDate(currendDate.getDate() - 7);
				}
				return weeks.reverse();
			};

			this._getVelocity = function(dataType) {
				var dfr = $.Deferred();

				var ranges = this._getWeeks(25);
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
						'&include=[Name,EndDate]' +
						'&format=json' +
						'&take=1000';
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
							})
							dfr.resolve(ranges);
						});
					}
				);

				return dfr;

			};

			this._renderVelocity = function(container, usData, bugData) {
				nvd3.addGraph(function() {
					var chart = nvd3.models.multiBarChart()
						.x(function(d) { return d.range_start.toDateString()
							.replace("Mon ", "")
							.replace(" 2012", "")
							.replace(" 2013", ""); })
						.y(function(d) { return d.value; })
						.tooltips(true)
						.color(['#6498d8', '#d86464']);

						chart.yAxis
							.tickFormat(d3.format(',f'));

						d3.select(container)
							.append('svg')
							.attr('class', 'nv-svg')
							.datum([{key: "US" ,values: usData},{key: "Bug", values: bugData}])
							.transition().duration(500)
							.call(chart);

						nvd3.utils.windowResize(chart.update);

						return chart;
				});
			};

			this._render = function() {
				var mertricsPopup = new popup();
				mertricsPopup.showLoading();
				var $container = mertricsPopup.$container;

				var $velocityContainer = $('<div><div><b>Velocity per week</b></div></div>');
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
