tau.mashups
    .addDependency('tp/mashups')
    .addDependency('jQuery')
    .addDependency('Underscore')
    .addDependency('tau/core/bus.reg')
    .addDependency('tau/configurator')
    .addMashup(function(m, $, _, busRegistry, configurator) {

        /* the number of days a card is allowed to "rot" before we throw feedback and the color of the card*/
        var rottingDaysAllowed = 2;
        var rottingDaysAllowedColor = '#F3FF35';

        /* the number of days a card is getting critical and the color of the card */
        var rottingDaysCriticalAllowed = 5;
        var rottingDaysCriticalAllowedColor = '#FFD20F';

        /* the number of days a card is allowed to "rot" before we create some panic and the color */
        var rottingDaysMaximumAllowed = 8;
        var rottingDaysMaximumAllowedColor = '#FF0000';

        /**
         * No need to edit anything below this line !!!
         */

        var ScrumRottingCards = function() {

            this.init = function() {

                var self = this;

                busRegistry.on('create', function(eventName, sender) {
                    if (sender.bus.name == 'board_plus') {
                        sender.bus.on('start.lifecycle', _.bind(function() {
                            this.cards = [];
                            this.taskCards = [];
                            this.taskCards.isResolved = false;
                        }, self));
                        sender.bus.on('view.card.skeleton.built', _.bind(self.cardAdded, self));
                        sender.bus.on('cardsFullyLoaded', _.bind(self.refreshDebounced, self));
                    }
                });

            };

            this.cards = [];
            this.taskCards = [];
            this.taskCards.isResolved = false;

            this.refresh = function() {
                this.getCards().done(function(taskCards) {
                    _.each(taskCards,this.colorCard,this);
                }.bind(this));
            };

            // get cards
            this.getCards = function() {
                var ajaxUrl = configurator.getApplicationPath() + '/api/v1/Tasks?format=json&include=[StartDate,Id]&where=(StartDate is not null) and (EntityState.Name eq "In Progress")&take=1000';
                var result = $.Deferred();

                if (this.taskCards.isResolved) {
                    result.resolve(this.taskCards);
                } else {
                    result = $.ajax({
                        url: ajaxUrl,
                        context: this
                    }).then(function(data) {
                            this.taskCards = data.Items;
                            this.taskCards.isResolved = true;
                            return this.taskCards;
                        }.bind(this));

                }
                return result;
            };

            this.refreshDebounced = _.debounce(this.refresh, 100, false);

            this.cardAdded = function(eventName, sender) {
                this.cards.push(sender.element);
                this.refreshDebounced();
            };

            this.colorCard = function(currentCard) {
                var startDate;
                try {
                    startDate = new Date(Number(currentCard.StartDate.match(/Date\((\d+)[-\+](\d+)\)/)[1]));
                } catch (e) {
                    return;
                }
                var timeInProgress = new Date().getTime() - startDate.getTime();

                var color = this.getCardColor(timeInProgress);
                if (color) {
                    $('.tau-task[data-entity-id="' + currentCard.Id + '"] .tau-card-header-container').css('background', color);
                    $('.tau-task[data-entity-id="' + currentCard.Id + '"] .tau-card-header-container a.tau-id').css('cssText', "color: #000000 !important");

                    $('.tau-card-v2_type_task[data-entity-id="' + currentCard.Id + '"] .tau-card-v2__section:first').css('background', color);
                }
            };

            /**
             *
             * @param timeInProgress
             * @returns {string}
             */
            this.getCardColor = function(timeInProgress) {
                var daysInProgress = timeInProgress / 86400000;

                if (daysInProgress > rottingDaysMaximumAllowed) {
                    return rottingDaysMaximumAllowedColor;
                } else if (daysInProgress > rottingDaysCriticalAllowed) {
                    return rottingDaysCriticalAllowedColor;
                } else if (daysInProgress > rottingDaysAllowed && daysInProgress < rottingDaysCriticalAllowed) {
                    return rottingDaysAllowedColor;
                } else {
                    return false;
                }
            };

        };

        new ScrumRottingCards().init();

    });