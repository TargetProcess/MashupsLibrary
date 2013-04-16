tau.mashups
    .addDependency('tp/mashups')
    .addDependency('user/mashups')
    .addDependency('jQuery')
    .addDependency('tau/core/bus.reg')
    .addDependency('tau/configurator')
    .addMashup(function (m, um, $, busRegistry, configurator) {

        var colorer = function() {
            this.init = function() {

                var self = this;

                this.tagMapping = {
                 'PIT Web CEPAL':'background: #fdfadb',
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

                busRegistry.on('create', function(eventName, sender) {
                    if (sender.bus.name == 'application board') {
                        var acidStore = configurator.getAppStateStore();
                        acidStore.get({
                            fields:['acid'],
                            callback: function (r) {
                                self.getTaggedCards(r.acid);
                            }
                        });
                        acidStore.bind({
                            fields:['acid'],
                            listener:self,
                            callback:function (r) {
                                window.console.log('acid changed=' + r.acid);
                                self.getTaggedCards(r.acid);
                            }
                        });
                    }

                    if (sender.bus.name == 'board_plus')
                    {
                        sender.bus.on('start.lifecycle', _.bind(function(e) { this.cards = []; }, self));
                        sender.bus.on('view.card.skeleton.built', _.bind(self.cardAdded, self));
                    }

                });
            };

            this.cardAdded = function(eventName, sender) {
                this.cards.push(sender.element);
                this.refreshCard(sender.element);
            };

            this.getTaggedCards = function(acid) {
                var whereStr = this.getFilter(this.tagMapping);

                //var requestUrl = configurator.getApplicationPath() + '/api/v1/Assignables.asmx?where=(tags contains \'urgent\') and (EntityState.IsFinal eq \'false\')&include=[Id,Tags]&format=json&acid=' + acid;
                var requestUrl = configurator.getApplicationPath() + '/api/v2/Assignable?take=1000&where=TagObjects.Count('+whereStr+')>0&select={id,Tags}&acid=' + acid;
                $.ajax({
                    url: requestUrl,
                    context: this
                }).done(function(data) {
                        this.taggedCards = {};
                        for(var i = 0; i < data.items.length; i++) {
                            var id = data.items[i].id;
                            var tags = data.items[i].tags.split(',');
                            $.each(tags, function(i, v) { tags[i] = $.trim(tags[i].toLowerCase()); })
                            this.taggedCards[id] = tags;
                        }
                        this.refreshAll();
                    });
            };

            this.refreshCard = function(card) {
                var self = this;
                var id = card.attr('data-entity-id');
                var cardData = this.taggedCards[id];
             
                if (cardData) {
                    $.each(self.tagMapping, function(tag, color){
                        if($.inArray(tag, cardData) > -1) {
                            card.attr('style', self.tagMapping[tag]);
                        }
                    });
                }
            };

            this.refreshAll = function() {
                var self = this;
                $.each(this.cards, function(index, card) {
                    self.refreshCard(card);
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
