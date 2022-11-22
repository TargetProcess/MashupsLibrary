tau.mashups
    .addDependency('jQuery')
    .addDependency('Underscore')
    .addDependency('libs/parseUri')
    .addDependency('tau/core/class')
    .addDependency('tau/configurator')
    .addMashup(function($, _, parseUri, Class, configurator) {

        'use strict';

        var reg = configurator.getBusRegistry();

        var appConfigurator;

        configurator.getGlobalBus().on('configurator.ready', function(e) {
            var configurator_ = e.data;
            if (configurator_._id && !configurator_._id.match(/global/) && !appConfigurator) {
                appConfigurator = configurator_;
            }
        });

        var addBusListener = function(busName, eventName, listener) {

            reg.on('create', function(e, data) {

                var bus = data.bus;
                if (bus.name === busName) {
                    bus.on(eventName, listener);
                }
            });

            reg.on('destroy', function(e, data) {

                var bus = data.bus;
                if (bus.name === busName) {
                    bus.removeListener(eventName, listener);
                }
            });

            reg.getByName(busName).done(function(bus) {
                bus.on(eventName, listener);
            });
        };

        var CardFocus = Class.extend({

            init: function() {
                var uri = parseUri(window.location.href);
                this.request = uri.queryKey;

                addBusListener('application board', 'boardSettings.ready', function(e, eventArgs) {
                    this.boardSettings = eventArgs.boardSettings;
                }.bind(this));

                addBusListener('board.clipboard', '$el.readyToLayout', function(e, $el) {
                    this.renderClipboardButton($el);
                }.bind(this));
            },

            renderClipboardButton: function($el) {

                var $toolbar = $el.find('.i-role-clipboardfilter');

                if (!$toolbar.length) {
                    $toolbar = $('<div class="tau-inline-group-clipboardfilter i-role-clipboardfilter" style="vertical-align: middle; display: inline-flex; display: -ms-flexbox; display: inline-flex; -ms-flex-align: center; align-items: center;"></div>')
                        .appendTo($el.find('.tau-select-block'));
                }

                $toolbar.children('.i-role-mashup-focus').remove();

                var $button = $('<button class="tau-btn mashup-focus" style="margin: 0;">Card Focus</button>')
                    .on('click', this.focusOnCards.bind(this));

                $('<div class="i-role-mashup-focus" style="margin-right: 4px;">').append($button).appendTo($toolbar);
            },

            focusOnCards: function() {
                var clipboardManager = appConfigurator.getClipboardManager();

                var cards = _.values(clipboardManager._cache);

                var ids = _.reduce(cards, function(ids, c) {
                    if (c.isSelected) {
                        ids.push(c.data.id);
                    }
                    return ids;
                }, []);

                if (ids.length === 0) {
                    return;
                }

                var filter = _.map(ids, function(id) {
                    return 'Id is ' + id;
                }).join(' or ');

                this.boardSettings.set({
                    set: {
                        user: {
                            cardFilter: '?' + filter
                        },
                        viewMode: "list"
                    }
                });

                $('.tau-resetable-input>input').val(filter)
                $('.tau-resetable-input>button').css('visibility', 'visible');
                $('.tau-role-filter-input').blur();
            }

        });

        return new CardFocus();

    });
