
//! tau module for highcharts
tau.mashups
	.addDependency('libs/jquery/jquery')
	.addModule('highcharts', function($) {
		try {
			// provide a mechanism to ensure highcharts is loaded
			var promise = $.Deferred();
			$.highchartsIsLoaded = function() { return promise; }

			// add highcharts to the page
			$.getScript('https://code.highcharts.com/highcharts.js', function() {
				$.getScript('https://code.highcharts.com/modules/data.js', function() {
					promise.resolve();
				});
			});
		}
		catch (e) {
			console.log('exception caught in highcharts module: ' + e);
		}
	});

//! tau module for jquery-initialize
tau.mashups
	.addDependency('libs/jquery/jquery')
	.addModule('jquery_initialize', function($) {
		try {
			// jquery.initialize plugin by Adam Pietrasiak ( https://github.com/AdamPietrasiak/jquery.initialize )

			$.fn.initialize = function(init, firstInit) {
				var $t = this; //reference for deeper functions
				var selector = $t.selector; //get called selector for inits in future

				if ( typeof init !== "function" || !selector ) return $($t); //if no initialization function, no sense to continue

				// select the target node to observe
				var target = $('body')[0];

				$t.firstInitsCalled = $t.firstInitsCalled || []; //we need to collect info about firstInits that can be called only once

				//if proper firstInit and was never called before
				if ( typeof firstInit == "function" && $t.firstInitsCalled.indexOf(firstInit) == -1 ) {
					$t.firstInitsCalled.push(firstInit); //add to called list
					firstInit(); //call
				}


				$t.initData = $t.initData || {}; //we will collect inits for selectors here
				$t.initData[selector] = $t.initData[selector] || []; //if no inits yet for this selector, add empty array
				$t.initData[selector].push(init); //and add given init


				//firstly normally call it on given set as .each do, but add init function to each element called inits list
				$(this).each(function(){
					this.initsCalled = this.initsCalled || []; //if no list, add empty arrat
					if ( this.initsCalled.indexOf(init) == -1 ) { //if havent been called before
						this.initsCalled.push(init); //add to called list
						$(this).each(init); //call
					}
				});


				//only once initialize observer
				if ( !this.initializedObserver ) {
					this.initializedObserver = true; //dont initialize again

					window.MutationObserver = window.MutationObserver || window.WebKitMutationObserver; //unify mutation obj

					// create an observer instance
					var observer = new MutationObserver(function(mutations) {
						//foreach mutation
						$.each(mutations , function(i, mutation) {
							//lets get mutation target basing of mutation type
							var target = $();
							if ( mutation.type == "attributes" ) target = $(mutation.target); //if attr changed, single target always
							//if child list, lets add all addedNodes
							if ( mutation.type == "childList" && mutation.addedNodes.length ) {
								$.each(mutation.addedNodes, function(i, addedNode){
									target = target.add(addedNode);
								});
							}

							//for each watched selector
							for ( selector in $t.initData ) {
								var inits = $t.initData[selector]; //get functions that this selector has to initialize

								//check children of elem if they match current selector
								var toInit = target.find(selector);
								//also check item itself, if it's good, add to set
								if ( target.is(selector) ) toInit = toInit.add(target);

								//for each item that match selector and is in mutated area
								toInit.each(function(){

									var toInitSingle = this;
									//create list of called inits if no list yet
									toInitSingle.initsCalled = toInitSingle.initsCalled || [];

									//foreach function for this selector
									$.each(inits, function(i, init){
										//if it's not yet called on this element
										if ( toInitSingle.initsCalled.indexOf(init) == -1 ) {
											toInitSingle.initsCalled.push(init); //add it to called list
											$(toInitSingle).each(init); //initialize it
										}
									});
								});
							}
						});
					});

					// configuration of the observer to be sure we dont miss possible way of adding wanted element
					var config = { attributes: true, childList: true, characterData: false, subtree : true };

					//start the observer
					observer.observe(target, config);
				}

				return $(this);
			}
		}
		catch (e) {
			console.log('exception caught in jquery_initialize module: ' + e);
		}
	});

//! tau module for jquery-cfd
tau.mashups
	.addDependency('libs/jquery/jquery')
	.addDependency('jquery_initialize')
	.addDependency('highcharts')
	.addModule('jquery_cfd', function($) {
		try {
			(function($) {
				$.fn.cfd = function(options) {
					var element = $(this).first().get();
					var settings = $.extend(true, {
						type: 'UserStory',
						start: new Date(2015, 0, 1),
						end: new Date(),
						filter: null,
						ignore: [],
						chart: {
							title: 'Cumulative Flow Diagram',
						}
					}, options);

					Date.prototype.format = function(format) {
						return this.getFullYear() + '-' + ((this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1)) + '-' + ((this.getDate() < 10 ? '0' : '') + this.getDate());
					};

					var slurp = function(url, callback, entities) {
						entities = entities || [];
						$.ajax(url, {
							success: function(response) {
								$.merge(entities, response.Items);
								if (response.Next) {
									slurp(response.Next, callback, entities);
								}
								else {
									callback(entities);
								}
							},
							error: function(xhr, status, error) {
								console.log('error fetching history: ' + error);
							}
						});
					};

					var url = '/api/v1/' + settings.type + 'Histories?format=json&take=1000&include=[Date,EntityState,' + settings.type + ']';
					if (settings.filter) {
						url += ('&where=' + settings.filter);
					};

					slurp(url, function(entities) {
						// produce a sorted list of entity states we care about
						var entityStates = entities.map(function(entity, index, self) { return entity.EntityState.NumericPriority.toFixed(5) + '#' + entity.EntityState.Name; })
											.sort()
											.filter(function(value, index, self) { return self.indexOf(value) === index; })
											.map(function(value) { return value.replace(/^.+?#/, ''); });

						// create a map of {entityId}->{date} = state
						var states = entities.reduce(function(map, entity) {
							var id = entity[settings.type].Id;
							map[id] = map[id] || {};
							map[id][new Date(parseInt(entity.Date.substr(6), 10)).format()] = entity.EntityState.Name; return map;
							return map;
						}, {});

						// the timeframe we are interested in
						var period = [];
						var date = new Date(settings.start.getTime());
						while (date.getTime() < settings.end.getTime()) {
							period.push(date.format());
							date.setDate(date.getDate() + 1);
						}

						// the initial state of entities
						var initial = entityStates[0];

						// generate state for all stories, on all dates
						$.each(states, function(entityId, stateOnDate) {
							var state = initial;
							// foreach date in the period we care about
							$.each(period, function(index, date) {
								// if a state is already known for this date, then it becomes the 'current' state
								// the only way a state would be known already is if it was provided in the response from the API
								if (stateOnDate[date]) {
									state = stateOnDate[date];
								}
								else {
									states[entityId][date] = state;
								}
							});
						});

						// summarise data into count of stories in each state on each day
						// $summary == {date}->{state} = <count>
						var summary = [];
						$.each(states, function(entityId, stateOnDate) {
							$.each(stateOnDate, function(date, state) {
								if (settings.ignore.indexOf(state) > -1) { return; }

								summary[date] = summary[date] || {};
								if (!(date in summary)) { summary[date] = {}; }
								if (!(state in summary[date])) { summary[date][state] = 0; }
								summary[date][state]++;
							});
						});

						// remove ignored states
						entityStates = entityStates.filter(function(state) { return settings.ignore.indexOf(state) == -1; });

						// get a set of sorted dates in the summary
						var rows = [ $.merge(['Date'], entityStates).join(',') ];
						$.each(period, function(index, date) {
							var row = [ date ];
							$.each(entityStates, function(index, state) {
								var x = summary[date] || {};
								var y = x[state] || 0;
								row.push(y);
							});
							rows.push(row.join(','));
						});

						$.when( $.highchartsIsLoaded() ).then(function() {
							try {
								$(element).highcharts({
									chart: {
										type: 'areaspline',
										zoomType: 'xy'
									},
									title: {
										text: settings.chart.title || 'CFD'
									},
									yAxis: {
										title: {
											text: '# of ' + settings.type
										}
									},
									tooltip: {
										shared: true,
										positioner: function() {
											return { x: 80, y: 50 };
										}
									},
									colors: ['#8d0032', '#4b3793', '#2473b2', '#53ba95', '#9cda91', '#e2f882', '#ffffb0', '#fda049', '#f2572d', '#cc253c', '#8d0032'],
									plotOptions: {
										series: {
											animation: false,
											stacking: 'normal',
											lineColor: '#666666',
											lineWidth: 0,
											states: {
												hover: {
													enabled: false
												}
											},
											marker: {
												enabled: false,
												states: {
													hover: {
														enabled: false
													}
												}
											}
										}
									},
									data: {
										csv: rows.join("\n"),
										dateFormat: 'YYYY-mm-dd',
										itemDelimiter: ','
									}
								});
							}
							catch (e) {
								console.log('caught exception rendering chart: ' + e);
								console.log(e);
							}
						});
					});

					return $(this);
				};

			})( jQuery );
		}
		catch (e) {
			console.log('caught exception in jquery_cfd: ' + e);
		}
	});

//! tau mashup to add a cfd to somewhere...
tau.mashups
	.addDependency('libs/jquery/jquery')
	.addDependency('jquery_cfd')
	.addMashup(function($, config) {

		try {
			$('.tau-dashboard-page').initialize(function() {
				$('<div>').prependTo($(this).find('#dashboard-column-1 .tau-dashboard-widgets')).cfd({
					chart: { title: 'Team 1 CFD' },
					filter: "UserStory.Team.Name eq 'Team 1'",
					start: new Date(2015, 0, 1),
					ignore: ['Backlog'],
				});
			});
		}
		catch (e) {
			console.log('caught exception in cfd mashup: ' + e);
		}
});