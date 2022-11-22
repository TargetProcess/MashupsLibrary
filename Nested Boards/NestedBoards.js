/*global tau,tauFeatures*/
/*eslint max-len: 0, no-underscore-dangle: 0 */

if (window.location.search.indexOf('isNestedBoard=1') >= 0) {
    tauFeatures['comet.notifications'] = false;
}

tau.mashups
    .addDependency('jQuery')
    .addDependency('Underscore')
    .addDependency('libs/parseUri')
    .addDependency('tau/core/class')
    .addDependency('tau/configurator')
    .addDependency('tp3/mashups/popup')
    .addCSS('NestedBoards.css')
    .addMashup(function($, _, parseUri, Class, configurator, Popup) {

        'use strict';

        var appConfigurator;

        configurator.getGlobalBus().on('configurator.ready', function(e) {
            var configurator_ = e.data;
            if (configurator_._id && !configurator_._id.match(/global/) && !appConfigurator) {
                appConfigurator = configurator_;
            }
        });

        var reg = configurator.getBusRegistry();

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
        };

        var nestedBoardsConfig = {
            userstory: [{
                type: 'bug',
                name: 'Bugs Board'
            }, {
                type: 'task',
                name: 'Tasks Board'
            }],

            feature: [{
                type: 'userstory',
                name: 'Stories Board'
            }, {
                type: 'bug',
                name: 'Bugs Board'
            }],

            testplan: [{
                type: 'testplanrun',
                name: 'View Plan Runs'
            }],

            iteration: [{
                type: 'bug',
                name: 'Iteration Bugs'
            }, {
                type: 'userstory',
                name: 'Iteration Stories'
            }],

            release: [{
                type: 'bug',
                name: 'Release Bugs'
            }, {
                type: 'feature',
                name: 'Release Features'
            }, {
                type: 'userstory',
                name: 'Release Stories'
            }],

            teamiteration: [{
                type: 'bug',
                name: 'Bugs Board (TI)'
            }, {
                type: 'userstory',
                name: 'Stories Board (TI)'
            }]
        };

        var typesByParent = _.reduce(nestedBoardsConfig, function(res, v, k) {
            v.forEach(function(type) {
                res[type.type] = res[type.type] || [];
                res[type.type].push(k);
                return res;
            });

            return res;
        }, {});

        var boardSettings;

        var Mashup = Class.extend({
            init: function() {
                var uri = parseUri(window.location.href);
                this.request = uri.queryKey;

                addBusListener('board_plus', 'boardSettings.ready', function(e, bs) {
                    boardSettings = bs.boardSettings;
                }.bind(this));

                if (this.request.isNestedBoard) {
                    $('body').addClass('fullscreen');
                    addBusListener('board_plus', 'board.configuration.ready', function(e, boardConfig) {
                        this.updateConfiguration(boardConfig);
                    }.bind(this));
                } else {
                    addBusListener('board.clipboard', '$el.readyToLayout', function(e, $el) {
                        this.renderToolbar($el);
                    }.bind(this));
                }
            },

            renderToolbar: function($el) {
                var $toolbar = $el.find('.i-role-nestedboardstoolbar');
                if (!$toolbar.length) {
                    $toolbar = $('<div class="tau-inline-group-nestedboardstoolbar i-role-nestedboardstoolbar"></div>')
                        .appendTo($el.find('.tau-select-block'));
                }

                $toolbar.children().remove();

                var renderButton = this.renderButton.bind(this);

                _.forEach(nestedBoardsConfig, function(config, entityTypeName) {
                    var $cards = $el.find('.tau-card-v2_type_' + entityTypeName);
                    if ($cards.length) {
                        _.forEach(config, function(subEntityConfig) {
                            $('<div class="tau-inline-group-nestedboardstoolbar__control">').append(renderButton(entityTypeName, subEntityConfig))
                                .appendTo($toolbar);
                        });
                    }
                });
            },

            renderButton: function(entityTypeName, subEntityConfig) {
                return $('<button class="tau-btn ' + '">' + subEntityConfig.name + '</button>')
                    .on('click', this.handleButton.bind(this, entityTypeName, subEntityConfig.type));
            },

            handleButton: function(entityTypeName, type) {
                var activityPopup = new Popup();
                activityPopup.show();
                activityPopup.showLoading();
                var $container = activityPopup.$container;

                var clipboardManager = appConfigurator.getClipboardManager();
                var acidStore = appConfigurator.getAppStateStore();

                acidStore.get({
                    fields: ['acid']
                }).then(function(data) {
                    var acid = data.acid;
                    var cards = _.values(clipboardManager._cache);

                    var clipboardData = cards.reduce(function(res, item) {
                        res[item.data.type] = res[item.data.type] || [];
                        res[item.data.type].push(item.data.id);
                        return res;
                    }, {});

                    var url = configurator.getApplicationPath() + "/restui/board.aspx?" +
                        "isNestedBoard=1" +
                        "&acid=" + acid +
                        "&clipboardData=" + encodeURIComponent(JSON.stringify(clipboardData)) +
                        "&axisType=" + entityTypeName +
                        "&cellType=" + type +
                        '#page=board/' + boardSettings.settings.id;

                    var $frame = $('<iframe class="nestedboardsframe" src="' + url + '"></iframe>');
                    $frame.load(function() {
                        activityPopup.hideLoading();
                    });

                    $container.append($frame);
                    $container.css({padding: 0});
                });
            },

            updateConfiguration: function(boardConfig) {
                var clipboardData = JSON.parse(decodeURIComponent(this.request.clipboardData));
                var cellType = this.request.cellType;
                var axisType = this.request.axisType;

                var axisIds = [];
                var cellIds = [];

                _.forEach(clipboardData, function(ids, entityType) {
                    if (axisType === entityType) {
                        axisIds = axisIds.concat(ids);
                    }

                    // if in clipboard entities, which should be shown in cells on nested board, then
                    // we show no-specified axis and ask cards in cells by this ids
                    if (typesByParent[entityType] && typesByParent[entityType].indexOf(axisType) >= 0) {
                        axisIds = axisIds.concat(null);
                        cellIds = cellIds.concat(ids);
                    }
                });

                var cellFilter = '?' + _.compact(axisIds.map(function(v) {
                    if (v) {
                        return axisType + '.Id == ' + v;
                    }
                })).concat(cellIds.map(function(v) {
                    return 'Id == ' + v;
                })).join(' or ');

                var axisFilter = _.compact(axisIds.map(function(v) {
                    if (v) {
                        return 'Id == ' + v;
                    }
                })).join(' or ');

                if (axisIds.indexOf(null) >= 0) {
                    axisFilter += ' or Id is None';
                } else {
                    axisFilter = '(' + axisFilter + ') and It is not None';
                }
                axisFilter = '?' + axisFilter;

                delete boardConfig.focus;
                delete boardConfig.selectedMarks;

                boardConfig.cells = {
                    filter: cellFilter,
                    types: [cellType]
                };

                boardConfig.x = {
                    types: ['entitystate']
                };

                boardConfig.y = {
                    filter: axisFilter,
                    types: [axisType]
                };

                if (boardConfig.user) {
                    boardConfig.user.cardFilter = '';
                }

                if (boardConfig.colorSettings && boardConfig.colorSettings.customEncoding) {
                    boardConfig.colorSettings.customEncoding = [];
                }
            }
        });

        return new Mashup();
    });
