require([
    'app.bus'
    , 'Underscore'
    , "libs/jquery/jquery.fileupload"
    , "libs/jquery/jquery.iframe-transport"
], function (appBusDeferred, _) {

    appBusDeferred.then(function (bus) {
        var popupName = 'board.cell.quick.add';
        var addedItems = [];
        var queue = [];
        var $quickAdd = null;

        $("<style type='text/css'> .file-upload-item { padding-bottom: 5px; white-space: nowrap; text-overflow: ellipsis; font-size: 12px; } </style>").appendTo("head");
        $("<style type='text/css'> .file-upload-container { overflow-x: hidden ; overflow-y: auto; max-height: 200px; } </style>").appendTo("head");
        $("<style type='text/css'> .file-added-cell { background-color: #2ca02c; opacity: 0.2; } </style>").appendTo("head");

        bus.on('model.data.item.did.add', function (evt, data) {
            if (evt.caller.name != popupName) {
                return;
            }

            if (queue.length) {
                if (queue.shift) {
                    queue.shift();

                    setTimeout(function () {
                        queue.processNextItem();
                    }, 10);

                }
            }
        });

        bus.on('model.data.item.did.fail.add', function (evt, data) {
            if (evt.caller.name != popupName) {
                return;
            }

            if (queue.length) {
                queue.showImportButton();
            }
        });

        bus.on('blur', function (evt, data) {
            if (evt.caller.name != popupName) {
                return;
            }

            queue = [];
            addedItems = [];
            $quickAdd = $('<div ></div>');
        });

        bus.on('afterRender', function (evt, data) {
            if (evt.caller.name != popupName) {
                return;
            }

            $quickAdd = data.element;

            if (addedItems.length > 0) {

                $('.tau-entity-fields', $quickAdd).each(function () {
                    var $form = $(this);

                    var $name = $('.Name', $form);
                    var $parent = $name.hide().parent();

                    var $container = $('<div class="file-upload-container" ></div>');

                    _.each(addedItems, function (item, index) {
                        var $item = $('<div class="file-upload-item"></div>').text((index + 1) + ". " + item)
                        $container.append($item);
                    });

                    $container.appendTo($parent);

                    var $tauButton = $('.tau-add-item', $form);
                    $tauButton.hide();

                    var $importButton = $('<div class="tau-success tau-btn" style="height: 15px; font-size: 14px;">Add ' + addedItems.length + ' item(s)</div>');
                    $importButton.appendTo($tauButton.parent());

                    var items = addedItems.concat([]);

                    $importButton.click(function () {
                        $importButton.hide();

                        queue = items;
                        var $messagePool = $('.tau-message-pool', $quickAdd).hide();

                        queue.showImportButton = function () {
                            $importButton.show();
                            $messagePool.show();
                        };

                        queue.processNextItem = function () {

                            var countToImport = this.length;

                            var $items = $('.file-upload-item', $container);
                            var countOfDone = $items.length - countToImport;

                            $items = $('.file-upload-item:lt(' + countOfDone + ')', $container)
                                .css({'text-decoration': 'line-through'});

                            if ($items.length) {
                                $container.scrollTop($container.scrollTop() + $($items[$items.length - 1]).position().top);
                            }

                            var item = this[0];

                            if (item) {
                                $name.val(item);
                                $tauButton.click();
                            }
                        };

                        queue.processNextItem();
                    });
                });

                addedItems = [];
            }
        });

        var noDrop = false;

        bus.on('board.configuration.ready', function (evt, data) {
            console.log(data);
             if (!data.cells) {
                noDrop = true;
                return;
             }

             if (!data.cells.types) {
                noDrop = true;
                return;
             }

             if (data.cells.types.length === 0) {
                noDrop = true;
                return;
             }

             if (!data.cells.types[0]) {
                noDrop = true;
                return;
             }

             if (data.cells.types[0].indexOf('iteration') >= 0
                    || data.cells.types[0].indexOf('release') >= 0
                    || data.cells.types[0].indexOf('user') >= 0
                ) {
                noDrop = true;
                return;
             }
              
             noDrop = false;
        });

        bus.on('overview.board.ready', function (evt, data) {
            
            if (noDrop) {
                return;
            }

            var url = "drop2board.aws.af.cm/lines";
            var isSSL = "https:" === document.location.protocol;

            url = (isSSL ? 'https://' : 'http://') + url;

            var processItems = function ($cell, r) {
                if ($cell.hasClass('i-role-ch-quickadd-target')) {
                    addedItems = (r || { items: [] }).items || [];
                    $('.i-role-cell', $cell).trigger('dblclick');
                }

                $cell.removeClass('file-added-cell');
            };


            var $grid = $(".i-role-grid", data.element);
            var $cells = $(".i-role-cellholder", $grid);

            $cells.each(function () {
                $(this).fileupload({
                    sequentialUploads: true,
                    dropZone: $(this),
                    pastZone: null,  
                    url: url,

                    add: function (e, data) {
                        $(e.target).addClass('file-added-cell');

                        data.submit().success(function (r) {
                            if (_.isString(r)) {
                                r = $.parseJSON(r);
                            }
                            processItems($(e.target), r);
                        });
                    }
                });

            });

        });
    });
});
