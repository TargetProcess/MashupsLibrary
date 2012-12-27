tau.mashups
    .addDependency('tp/mashups')
    .addDependency('user/mashups')
    .addDependency('jQuery')
    .addDependency('tau/core/bus.reg')
    .addDependency('tau/configurator')
    .addDependency('tp/date.utils')
    .addMashup(function (m, um, $, busRegistry, configurator, dateUtils) {

        var colorer = function() {
            this.init = function() {

                var self = this;

                this.cfToShow = {
                  'cf11': true,
                  'cf22': false,
                  'cf date': true,
                  'cf dd': true,
                };

                this.cardsData = {};
                this.cards = [];

                busRegistry.getByName('globalBus', $.proxy(function(bus) {
                    bus.on('overview.board.ready', $.proxy(function(eventName, sender) {
                        console.log('overview.board.ready');
                        this.loadData();
                    }, this));

                    bus.on('view.cell.skeleton.updated', $.proxy(function(eventName, sender) {
                        console.log('view.cell.skeleton.updated');
                        this.loadData();
                    }, this));

                    bus.on('start.lifecycle', $.proxy(function() { this.cards = []; }, this));
                    bus.on('view.card.skeleton.built', $.proxy(this.cardAdded, this));
                }, this));
            };

            this.cardAdded = function(eventName, sender) {
                var id = sender.element.attr('data-entity-id');
                this.cardsData[id] = {};
                this.cards.push(sender.element);
                this.refreshCard(sender.element);
            };

            this.loadData = function(acid) {

                var ids = [0];
                $.each(this.cardsData, function(id, data) {
                    ids.push(id);
                });

                var requestUrl = configurator.getApplicationPath() + '/api/v1/Assignables.asmx?take=1000&where=id in ('+ ids.join(',') +')&include=[CustomFields]&format=json';
                $.ajax({
                    url: requestUrl,
                    context: this
                }).done(function(data) {
                        for(var i = 0; i < data.Items.length; i++) {
                            var id = data.Items[i].Id;
                            var cfs = data.Items[i].CustomFields;
                            var cardData = this.cardsData[id] || {};
                            var cfToShow = this.cfToShow;
                            $.each(cfs, function(i, v) {
                                if (cfToShow[v.Name.toLowerCase()] && v.Name && v.Value) {
                                    if (v.Type == 'Date'){
                                        v.Value = dateUtils.parseFromJSON(v.Value).toString('yyyy-MM-dd');
                                    }
                                    cardData[v.Name] = v.Value;
                                }
                            });
                            this.cardsData[id] = cardData;
                        }
                        this.refreshAll();
                    });
            };

            this.refreshCard = function(card) {
                card.find(".x-custom-data").remove();

                var appendTo = card.children().eq(3);
                if (appendTo.length == 0) {
                    appendTo = $('<div></div>');
                    appendTo.appendTo(card);
                }

                var self = this;
                var id = card.attr('data-entity-id');
                var cardData = this.cardsData[id];

                if (cardData) {
                    $.each(cardData, function(name, value){
                        $('<div class="tau-severity x-custom-data">' + name + ' : ' + value + '</div>').appendTo(appendTo);
                    });
                }
            };

            this.refreshAll = function() {
                var self = this;
                $.each(this.cards, function(index, card) {
                    self.refreshCard(card);
                });
            };
        }

        new colorer().init();

    });
