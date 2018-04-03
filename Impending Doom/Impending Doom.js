tau.mashups
    .addDependency('tp/mashups')
    .addDependency('jQuery')
    .addDependency('tp3/mashups/context')
    .addDependency('Underscore')
    .addDependency('tau/core/bus.reg')
    .addDependency('tau/configurator')
    .addMashup(function(m, $, context, _, busRegistry, configurator) {

        /***
         * This is our configuration, an object mapping the name of a process (case insensitive) to
         * another object mapping days due to colors.  Specifying a wildcard (*) for the process
         * name will apply the coloring to all cards who do not match previous process names.
         *
         * IMPORTANT: Your day -> color object should be ordered descending - the mashup will pick
         * the first day color that is applicable, so ordering is important!
         */
        var DoomConfig = {
            'My Sweet Process': {
                0: '#F26C4F',
                1: '#FFF467',
                2: '#3BB878',
                7: '#FBaF5C'
            },
            '*': {
                0: '#F26C4F',
                1: '#FFF467',
                2: '#3BB878',
                7: '#FBaF5C'
            }
        };

        /**
         * No need to edit anything below this line !!!
         */

        var ImpendingDoom = function() {

            this.init = function() {
                var self = this;

                context.onChange(function(ctx) {
                    self.setContext(ctx);
                    self.refresh(ctx);
                });

                busRegistry.on('create', function(eventName, sender) {
                    if (sender.bus.name == 'board_plus') {
                        sender.bus.on('start.lifecycle', _.bind(function() {
                            this.cards = [];
                        }, self));
                        sender.bus.on('view.card.skeleton.built', _.bind(self.cardAdded, self));
                    }
                });

            };

            this.apiCalls = {
                'userstory': 'UserStories',
                'bug': 'Bugs',
                'feature': 'Features',
                'task': 'Tasks'
            };

            this.cards = [];

            this._ctx = {};
            this.setContext = function(ctx) {
                this._ctx = ctx;
            };

            this.refresh = function() {
                this.getCards();
            };

            // Helper function to get API information and deal with paging
            this.apiGet = function(url, callback, _objects) {
                if (_objects === undefined) {
                    _objects = []
                };

                $.ajax({
                    url: url,
                    method: 'GET',
                    context: this
                }).then(function(response) {
                    if (response.hasOwnProperty("Items")) {
                        _objects = $.merge(_objects, response.Items);
                    }
                    if (response.hasOwnProperty("Next")) {
                        this.apiGet(response.Next, callback, _objects);
                    } else {
                        callback(_objects);
                    }
                });
            };

            // get cards
            this.getCards = function() {
                _.each(this.getCardTypes(), function(cardType) {

                    if (!this.apiCalls[cardType]) {
                        return;
                    }
                    var ajaxUrl = configurator.getApplicationPath() + '/api/v1/' + this.apiCalls[cardType] + '?format=json&take=100&include=[PlannedEndDate,Id,Project[Process[Name]]]&where=(PlannedEndDate is not null) and (EntityState.IsFinal eq "false")';

                    this.apiGet(ajaxUrl, _.bind(function(data) {
                        for (var i = 0; i < data.length; i++) {
                            this.colorCard(data[i]);
                        }
                    }, this));
                }, this);
            };

            this.refreshDebounced = _.debounce(this.refresh, 100, false);

            this.getCardTypes = function() {
                return _.uniq(_.reduce(this.cards, function(running, card) {
                    running.push(card.data('entityType'));
                    return running;
                }, []));
            };

            this.cardAdded = function(eventName, sender) {
                this.cards.push(sender.element);
                this.refreshDebounced(this._ctx);
            };

            this.colorCard = function(currentCard) {
                var color = this.getCardColor(currentCard);
                if (color) {
                    $('div[data-entity-id=' + currentCard.Id + ']').attr('style', 'background: ' + color + ';');
                }
            };

            this.convertDate = function(apiDate) {
                return new Date(Number(apiDate.match(/Date\((\d+)[-\+](\d+)\)/)[1]));
            };

            this.getCardColor = function(card) {
                if (card.Project) {
                    var process = card.Project.Process.Name.toLowerCase();
                    var processMap = _.find(DoomConfig, function(v, k) {
                        return k.toLowerCase() == process;
                    });
                }
                /* revert to our catch-all...if we've got one */
                if ((processMap == undefined) && (DoomConfig['*'] != undefined)) {
                    processMap = DoomConfig['*'];
                }
                if (processMap == undefined) return false;
                var dueDate = this.convertDate(card.PlannedEndDate);
                var diff = dueDate.getTime() - (new Date()).getTime();
                var daysToGo = (diff / 86400000);
                return _.find(processMap, function(v, k) {
                    return daysToGo < k;
                });
            };

        };

        new ImpendingDoom().init();

    });
