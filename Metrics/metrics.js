tau.mashups
	.addDependency('tp3/mashups/topmenu')
	.addDependency('tp3/mashups/popup')
	.addDependency('tp3/mashups/context')
	.addMashup(function(topmenu, popup, context) {

		require(['http://code.highcharts.com/highcharts.js'], function() {

		var metrics = function() {

			var dateRestFormat = function(date) { return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(); };

			this._popup = null;

			this._getWeekRanges = function(rangeCount, rangeSize) {
				if (typeof rangeSize != "number") {
					rangeSize = 2;
				}
				var currendDate = new Date();
				var weeks = [];
				for (var i = 0; i < rangeCount; i++) {
					var day = currendDate.getDay(); if (day == 0) day = 7;

					var mon = (new Date(currendDate.getFullYear(), currendDate.getMonth(), currendDate.getDate()));
					mon.setDate(currendDate.getDate() - day + 1);

					var sun = (new Date(currendDate.getFullYear(), currendDate.getMonth(), currendDate.getDate()));
					sun.setDate(currendDate.getDate() + (7 * rangeSize - day));

					weeks.push({
						range_name: 'week ' + (rangeCount - i),
						range_start: mon,
						range_end: sun
					});

					currendDate.setDate(currendDate.getDate() - 7 * rangeSize);
				}
				return weeks.reverse();
			};

			this._batchLoad = function(dataArray, buildUrlCallback, dataReadyCallback) {
				var dfr = $.Deferred();
				var dfrs = [];
				$.each(dataArray, function(index, dataItem) {
					var url = buildUrlCallback(dataItem);
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
						dataReadyCallback(dataArray[result.index], result);
					})
					dfr.resolve(dataArray);
				});
				return dfr;
			};

			this._getDateRangeWIP = function() {
				var dfr = $.Deferred();
				var ranges = this._getWeekRanges(12);

				$.when(context.getApplicationPath(), context.getSelectedProjects()).then($.proxy(
					function(appPath, projects) {

						var projectsStr = projects.map(function(p){ return p.id; }).join(',');
						if (projectsStr == '') { projectsStr = '0'; }

						var buildUrl = function(startDate, endDate) {
							var startDateStr = dateRestFormat(startDate);
							var endDateStr = dateRestFormat(endDate);
							var url =
								appPath +
									'/api/v2/assignable?where=' +
									'(' +
										'(' +
											'StartDate < DateTime.Parse("' + startDateStr + '")' +
											' and ' +
											'(EndDate > DateTime.Parse("' + startDateStr + '") or EndDate == null)' +
										')' +
										' or ' +
										'(' +
											'StartDate < DateTime.Parse("' + endDateStr + '")' +
											' and ' +
											'(EndDate   > DateTime.Parse("' + endDateStr + '") or EndDate == null)' +
										')' +
										' or ' +
										'(' +
											'StartDate >= DateTime.Parse("' + startDateStr + '")' +
											' and ' +
											'EndDate <= DateTime.Parse("' + endDateStr + '")' +
										')' +
										' or ' +
										'(' +
											'StartDate == null' +
											' and ' +
											'EndDate >= DateTime.Parse("' + startDateStr + '")' +
											' and ' +
											'EndDate <= DateTime.Parse("' + endDateStr + '")' +
										')' +
									')' +
									' and ' +
									'Project.Id in [' + projectsStr + ']' +
									' and ' +
									'EntityType.Name in ["UserStory", "Bug"]' +
									'&take=1000' +
									'&select={id,name,startDate,endDate,EntityType.Name as type}';
							return url;
						};

						var loaded =
							this._batchLoad(
								ranges,
								// build url
								function(dataItem){
									return buildUrl(dataItem.range_start, dataItem.range_end);
								},
								// data ready
								function(dataItem, result) {
									dataItem.wip = result.data.items;
								});
						$.when(loaded).then(function() { dfr.resolve(ranges); })
					}, this)
				);

				return  dfr;
			};

			this._getVelocity = function(dataType) {
				var dfr = $.Deferred();

				var ranges = this._getWeekRanges(12);

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

				$.when(context.getApplicationPath(), context.getAcid()).then($.proxy(
					function(appPath, acid) {
						var loaded =
							this._batchLoad(
								ranges,
								// build url
								function(dataItem){
									return buildUrl(appPath, dataType, acid, dataItem.range_start, dataItem.range_end);
								},
								// data ready
								function(dataItem, result) {
									dataItem.value = result.data.Items.length;
									dataItem.bugsCount = result.data.Items.reduce(
										function(sum, value) {
											return value['Bugs-Count'] ? sum + value['Bugs-Count'] : sum;
										},
										0
									);
								});
						$.when(loaded).then(function() { dfr.resolve(ranges); })
					}, this)
				);
				return dfr;
			};

			this._renderVelocity = function(container, usData, bugData) {

				var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
				var categories =  usData.map(function(v) { return '' + v.range_start.getDate() + ' ' + month[v.range_start.getMonth()]; });
				var doneStories =  usData.map(function(v) { return v.value; });
				var doneBugs =  bugData.map(function(v) { return v.value; });

				var doneStoriesBugCount =  usData.map(function(v) { return v.bugsCount || 0; });
				var doneStoriesBugCountPerStory =  usData.map(function(v) { return v.value > 0 ? v.bugsCount / v.value : 0; });

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
							return '' + this.y.toFixed(2) + '';
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

			this._renderQuality = function(container, usData) {

				var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
				var categories =  usData.map(function(v) { return '' + v.range_start.getDate() + ' ' + month[v.range_start.getMonth()]; });

				var doneStoriesBugCountPerStory =  usData.map(function(v) { return v.value > 0 ? v.bugsCount / v.value : 0; });

				var chart = new Highcharts.Chart({
					chart: {
						renderTo: container,
						type: 'column'
					},
					title: {
						text: 'Quality'
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
						type: 'spline',
						name: 'Avg Bug Count in Done US',
						data: doneStoriesBugCountPerStory

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

						var $qualityContainer = $('<div></div>');
						$qualityContainer.attr('style', 'height: 200px');
						$qualityContainer.appendTo($container);
						var qualityElement = $qualityContainer.get(0);
						this._renderQuality(qualityElement, usData);

					}, this));
/*
				$.when(this._getDateRangeWIP()).then($.proxy(function(ranges) {
					$.each(ranges, $.proxy(function(index, dateRange) {
						dateRange.doneUs = dateRange.wip.reduce(
							function(us, assignable) {
								if (assignable.type == "UserStory" && assignable.endDate && assignable.endDate >= dateRange.range_start && assignable.endDate <= dateRange.range_end){
									us.push(assignable);
								}
								return us;
							},
							[]
						);
						console.log(dateRange.doneUs);
					}, this));
				},this));
*/
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
