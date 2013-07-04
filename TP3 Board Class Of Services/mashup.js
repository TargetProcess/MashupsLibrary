tau.mashups
    .addDependency('tp/mashups')
    .addDependency('user/mashups')
    .addDependency('jQuery')
    .addDependency('Underscore')
    .addDependency('tp3/mashups/context')
    .addDependency('tau/core/bus.reg')
    .addDependency('tau/configurator')
    .addMashup(function (m, um, $, _, context, busRegistry, configurator) {

        var colorer = function() {
            this.init = function() {

                var self = this;

                this.tagMapping = {
					'PIT Web CEPAL':'background: #fdfadb',
					'in progress':'background: #fdfadb', // you can use state name
					'urgent':'background: #f9d9d1',
					'.net':'background: #d2e0ef;',
					'regression':'background: #ffe1b3;',
					'today':'background: #d2e0ef;',
					'mb_wip':'background: #d2e0ef;',
					'performance' : 'background: #e2eece',
					'1week': 'background: #f9f5bd',
					'when have time': 'background: #A1D9D6'
                };
                this.taggedCards = {};
                this.cards = [];

				context.onChange(function(ctx) {
					self.setContext(ctx);
					self.refresh(ctx);
				});

				busRegistry.on('create', function(eventName, sender) {
                    if (sender.bus.name == 'board_plus')
                    {
                        sender.bus.on('start.lifecycle', _.bind(function(e) { this.cards = []; }, self));
                        sender.bus.on('view.card.skeleton.built', _.bind(self.cardAdded, self));
                    }
                });
            };

			this._ctx = {};
			this.setContext = function(ctx) {
				this._ctx = ctx;
			};

			this.refresh = function(ctx) {

				var acid = ctx.acid;
                var whereTagStr = this.getFilter(this.tagMapping);
				var whereIdsStr = this.cards.map($.proxy(function(c){ return this._getCardId(c); }, this)).join(',');

				if (whereIdsStr == '') {
					whereIdsStr = '0';
				}

                var requestUrl = configurator.getApplicationPath() + '/api/v2/Assignable?take=1000&where=TagObjects.Count('+whereTagStr+')>0 or (id in ['+whereIdsStr+'] and EntityState.isFinal==false)&select={id,Tags,EntityState.Name as state}&acid=' + acid;
                $.ajax({
                    url: requestUrl,
                    context: this
                }).done(function(data) {
                        this.taggedCards = {};
                        for(var i = 0; i < data.items.length; i++) {
                            var id = data.items[i].id;
                            var tags = data.items[i].tags.split(',');
							tags.push(data.items[i].state)
                            $.each(tags, function(i, v) { tags[i] = $.trim(tags[i].toLowerCase()); })
                            this.taggedCards[id] = tags;
                        }
                        this.renderAll();
                    });
            };

			this.refreshDebounced = _.debounce(this.refresh, 100, false);

			this.cardAdded = function(eventName, sender) {
				this.cards.push(sender.element);
				this.refreshDebounced(this._ctx);
			};

			this._getCardId = function (card) {
				return card.attr('data-entity-id');
			};

            this.renderCard = function(card) {
                var self = this;
                var id = this._getCardId(card);
                var cardData = this.taggedCards[id];
             
                if (cardData) {
                    $.each(self.tagMapping, function(tag, color){
                        if($.inArray(tag, cardData) > -1) {
                            card.attr('style', self.tagMapping[tag]);
                        }
                    });
                }
            };

            this.renderAll = function() {
                var self = this;
                $.each(this.cards, function(index, card) {
                    self.renderCard(card);
                });
            };

            this.getFilter = function(mapping){
                var where = [];
                $.each(mapping, function(tag, color){
                    where.push('Name=="'+ tag +'"');
                });
                return where.join(" or ");
            };
        }

        new colorer().init();

    });
