tau.mashups.addDependency('jQuery')
    .addDependency('Underscore')
    .addDependency('tp3/mashups/topmenu')
    .addDependency('tp3/mashups/popup')
    .addDependency('app.bus')
    .addDependency('app.path')
    .addDependency('all.components')
    .addMashup(function ($, _, topmenu, popup, $deferred, path) {
        var boards = {
            userstory: [
                { type: 'bug', name: 'Bugs Board' },
                { type: 'task', name: 'Tasks Board' }
            ],

            feature: [
                { type: 'userstory', name: 'Stories Board' }
            ],

            testplan: [
                { type: 'testplanrun', name: 'View Plan Runs' }
            ],

            iteration: [
                { type: 'bug', name: 'Iteration Bugs' },
                { type: 'userstory', name: 'Iteration Stories' }
            ],

            release: [
                { type: 'bug', name: 'Release Bugs' },
                { type: 'userstory', name: 'Release Stories' }
            ],

            teamiteration: [
                { type: 'bug', name: 'Bugs Board (TI)' },
                { type: 'userstory', name: 'Stories Board (TI)' }
            ]

        };

        var acid = '';
        var isInnerBoard = document.location.href.indexOf('boardlink_inner_board') > 0;

        var getParameterByName = function (name) {
            var match = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
            return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
        };

        var toggleFullScreen = function (data, element) {
            $('.tau-app-header', element).hide();
            $('.tau-board-header', element).hide();
            $('.tau-app-secondary-pane', element).hide();
            $('.tau-app-main-pane', element).css({ position: 'static' }); //absolute
            $('.tau-app-body', element).css({ position: 'static'}); //absolute
            $('.tau-board', element).css({ position: 'static'}); //absolute
            $('.tau-boardclipboard', element).hide();
            $('.tau-boardtools', element).hide();
            $('.i-role-axis-mark-selector').hide();
            $('.tau-board-view-switch', element).hide();
            $('.tau-board-body-wrapper', element).css({ top: 0 });
            $('body').css({ background: '#e5e9ee' });
        };


        var onLoadLibs = function (registry, eventHelper, storeapi, sliceapi) {
            var loadBoard = function () {
                var cardsArray = $(this).data().cards;
                var activityPopup = new popup();
                activityPopup.show();
                activityPopup.showLoading();

                var $container = activityPopup.$container;

                var ids = [];

                _.each(cardsArray, function (card) {
                    ids.push(card.entityId);
                });

                var url = path.get() + "/restui/board.aspx?boardlink_inner_board=true&acid="
                    + acid + "&ids=" + ids.join("_")
                    + "&parent=" + $(this).data().parent
                    + "&child=" + $(this).data().child;
                var $frame = $('<iframe id="inner-board" style="width:100%; height:100%;margin:0;border:0;" src="'
                    + url + '"></iframe>');

                $frame.load(function () {
                    activityPopup.hideLoading();
                });

                $container.append($frame);
                $container.css({ padding: 0 });
            };


            if (isInnerBoard) {

                var lane = getParameterByName('parent');
                var card = getParameterByName('child');

                var prevY = sliceapi.prototype.axis;

                sliceapi.prototype.axis = function () {
                    return prevY.apply(this, arguments).done(function (r) {

                        _.each(r.data.items.concat([]), function (v, i) {
                            if (v.y && v.dynamic && v.dynamic.items
                                && v.dynamic.items.length > 0
                                && v.dynamic.items[0].data.empty === true) {
                                r.data.items.splice(i, 1);

                            }
                        });

                    });
                };


                var prevFn = storeapi.prototype._makeServiceCall;

                storeapi.prototype._makeServiceCall = function (ajaxConfig) {
                    ajaxConfig.url = ajaxConfig.url.replace('/boards', '/boards_private_' + lane + "_" + card + '_boardlink');
                    return prevFn.apply(this, arguments);
                };

                registry.getByName('board_plus', function (boardBus) {

                    var listener = {
                        bus: boardBus,

                        "bus before_board.configuration.ready": function (evt, data) {

                            var ids = getParameterByName("ids").split("_");
                            var query = [];
                            var cardsQuery = [];


                            _.each(ids, function (id) {
                                cardsQuery.push(lane + '.id == ' + id);
                                query.push("id == " + id);
                            });


                            data.cells = {
                                filter: "?" + cardsQuery.join(" or "),
                                types: [card]
                            };
                            delete data.focus;
                            delete data.selectedMarks;
                            data.x = { types: ['entitystate'] };
                            data.y = {
                                filter: "?" + query.join(" or "),
                                types: [lane]
                            };

                        }
                    };

                    eventHelper.subscribeOn(listener);

                });
            }

            var processCards = function (data, type, boards) {
                var cardsSelector = '.tau-' + type;
                var $cards = $(cardsSelector, data);

                _.each(boards, function(innerBoard) {
                    var buttonClass = type + "_" + innerBoard.type + '-inner-board-btn';
                    var buttonSelector = '.' + buttonClass;

                    if ($cards.length > 0) {

                        var cardsData = [];

                        if ($(buttonSelector, data).length === 0) {
                            var $title = $('.tau-boardclipboard__title', data);
                            var $button = $('<button class="tau-btn ' + buttonClass + '">' + innerBoard.name + '</button>');
                            $button.appendTo($title);
                            $button.click(loadBoard);
                        }

                        $cards.each(function (i, card) {
                            cardsData.push($(card).data());
                        });

                        $(buttonSelector, data).data({ cards: cardsData, parent: type, child: innerBoard.type });
                    } else {
                        $(buttonSelector, data).remove();
                    }
                });
            };

            var startMashup = function (bus) {
                if (isInnerBoard) {
                    bus.on('overview.board.ready', function (evt, data) {
                        toggleFullScreen(data.element);
                    });

                    bus.on('contentRendered', function (evt, data) {
                        toggleFullScreen(data.element);
                    });
                    return;
                }

                bus.on('acid.ready', function (evt, data) {
                    acid = data;
                });

                bus.on('$el.readyToLayout', function (evt, data) {
                    if (evt.caller.name !== 'board.clipboard') {
                        return;
                    }

                    _.each(_.keys(boards), function (key) {
                        processCards(data, key, boards[key]);
                    });

                });
            };

            $deferred.done(startMashup);
        };

        require(['tau/core/bus.reg',
            'tau/core/event',
            'tau/storage/api.nocache',
            'tau/slice/api'
        ], onLoadLibs);
    });
