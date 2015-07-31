tau.mashups
    .addDependency('jQuery')
    .addDependency('app.path')
    .addDependency('tau/core/global.bus')
    .addDependency('tau/configurator')
    .addMashup(
    function($, appPath, gb, c) {
        var store = c.getStore();
        var typeById = {};

        gb.get().on('beforeInit', function(e) {
            var config = e.data.config;
            if (config && config.action === 'show') {
                var type, id;
                if (typeof config.entity === 'object' && config.entity.type) {
                    type = config.entity.type.toLowerCase();
                    id = config.entity.id;
                } else if (typeof config.entity === 'string') {
                    type = config.entity.toLowerCase();
                    id = config.id;
                }
                if (type && id && !typeById[id]) {
                    for (var prop in typeById) {
                        if (typeById.hasOwnProperty(prop)) {
                            delete typeById[prop]; //WTF?
                        }
                    }
                    typeById[id] = type;
                }
            }
        });

        var requestAddCommentHook = {
            question: 'Leave Request in Queue?',
            answers: [
                //unique id, css class, text
                ['keep-in-queue', 'primary', 'Keep in queue'],
                ['remove-and-close', '', 'Remove and close, as usual'],
                ['remove-keep-open', 'danger', 'Remove but keep open']
            ],
            skipedTypes: ['Idea'],
            requestViewUrl: appPath.get() + '/Project/HelpDesk/Request/View.aspx',
            soapCommentUrl: (appPath.get() + '/Services/CommentsControl.asmx/Create').replace(location.protocol + '//' + location.host, ''),
            restCommentUrl: appPath.get() + '/api/v1/comments.asmx/?',

            render: function() {
            },

            _isRestCommentCreatedForRequest: function(jqXHROptions) {
                if (jqXHROptions.url && jqXHROptions.url.indexOf(this.restCommentUrl) === 0) {
                    var data = JSON.parse(jqXHROptions.data);
                    return data.general && (typeById[data.general.id] === 'request' ||
                        location.hash && location.hash.indexOf('#request/' + data.general.id) === 0);
                }
                return false;
            },

            _isSoapCommentCreatedForRequest: function(jqXHROptions) {
                if (jqXHROptions.url && jqXHROptions.url.indexOf(this.soapCommentUrl) === 0 &&
                    (location.protocol + '//' + location.host + location.pathname).indexOf(this.requestViewUrl) === 0) {
                    var data = JSON.parse(jqXHROptions.data);
                    return data.comment && location.search.indexOf('RequestID=' + data.comment.GeneralID) > 0;
                }
                return false;
            },

            updateRequest: function(generalId, data) {
                $.ajax({
                    url: appPath.get() + '/api/v1/Requests/' + generalId,
                    data: data,
                    headers: {'Content-Type': 'application/json'},
                    success: $.noop,
                    error: $.noop,
                    dataType: 'json',
                    type: 'POST'
                });
            }
        };

        $.ajaxTransport('+', $.proxy(function(options, originalOptions, jqXHR) {
            if (options.postponed === true) {
                var questionHolder, isRestComment, isSoapComment, d;
                if (isRestComment = requestAddCommentHook._isRestCommentCreatedForRequest(options)) {
                    d = JSON.parse(options.data);
                    questionHolder = $($('div.updating')[0]).children('div.ui-comment-body');
                } else if (isSoapComment = requestAddCommentHook._isSoapCommentCreatedForRequest(options)) {
                    d = JSON.parse(options.data);
                    questionHolder = d.comment.ParentID ? $('button:contains("Reply").ui-add-comment') : $('button:contains("Comment").ui-add-comment');
                }

                if (questionHolder && questionHolder.length === 1) {
                    var successCallback, errorCallback, showQuestion = $.proxy(function(q) {
                        if (q.next('.tau-bubble').length <= 0) {
                            var layout = '<div class="tau-bubble" style="z-index: 1; display: block;">' +
                                '<div class="tau-bubble__inner" style="margin: -2px 1px -2px 1px !important;"><div style="padding: 10px;">' +
                                '<p style="margin:0px !important">' + this.question + '</p><div class="button-group">';
                            for (var i = 0; i < this.answers.length; i++) {
                                layout += '<button id="' + this.answers[i][0] + '" class="button ' +
                                    this.answers[i][1] + '" type="button">' + this.answers[i][2] + '</button>';
                            }
                            layout += '</div></div></div><div class="tau-bubble__arrow" data-orientation="bottom" style="display: block;"></div></div>';
                            q.after(layout);
                            var b = q.next('.tau-bubble');

                            var removeAssignments = function(generalId, close) {
                                $.ajax({
                                    url: appPath.get() + '/api/v1/Requests/' + generalId + '?include=[Project[Process[Id]],Assignments]&resultFormat=json',
                                    headers: {'Content-Type': 'application/json'},
                                    success: function(result) {
                                        //close request
                                        if (close == true) {
                                            var processId = result.Project.Process.Id;
                                            $.ajax({
                                                url: appPath.get() + '/api/v1/processes/' + processId + '/entitystates?where=(IsFinal eq 1)and(EntityType.Name eq %27Request%27)&include=[Id]&resultFormat=json',
                                                headers: {'Content-Type': 'application/json'},
                                                success: function(stateId) {
                                                    requestAddCommentHook.updateRequest(generalId, JSON.stringify({
                                                        IsReplied: true,
                                                        EntityState: {Id: stateId.Items[0].Id, Name: 'Closed'}
                                                    }));
                                                },
                                                error: $.noop,
                                                dataType: 'json',
                                                type: 'GET'
                                            });
                                        }
                                        //remove all assignments
                                        result.Assignments.Items.forEach(function(id) {
                                            $.ajax({
                                                url: appPath.get() + '/api/v1/Requests/' + generalId + '/Assignments/' + id.Id,
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'x-http-method-override': 'DELETE'
                                                },
                                                success: $.noop,
                                                error: $.noop,
                                                dataType: 'json',
                                                type: 'POST'
                                            });
                                        });
                                    },
                                    error: $.noop,
                                    dataType: 'json',
                                    type: 'GET'
                                });
                            };

                            var onAjaxSuccess = function(e, xhr, settings) {
                                $(document).off('ajaxSuccess', onAjaxSuccess);
                                var generalId, d;
                                if (requestAddCommentHook._isRestCommentCreatedForRequest(settings)) {
                                    d = JSON.parse(settings.data);
                                    generalId = d.general.id;
                                } else if (requestAddCommentHook._isSoapCommentCreatedForRequest(settings)) {
                                    d = JSON.parse(settings.data);
                                    generalId = d.comment.GeneralID;
                                }
                                switch (settings.selectedChoise) {
                                    case 'keep-in-queue':
                                        requestAddCommentHook.updateRequest(generalId, JSON.stringify({IsReplied: false}));
                                        break;
                                    case 'remove-and-close':
                                        removeAssignments(generalId, true);
                                        break;
                                    case 'remove-keep-open':
                                        requestAddCommentHook.updateRequest(generalId, JSON.stringify({IsReplied: true}));
                                        removeAssignments(generalId, false);
                                        break;
                                }
                            };

                            if (isRestComment) {
                                var c = $('div.ui-all-comments');
                                if (c.children().length === 1) {
                                    var h = c.height();
                                    c.height(b.height() + h);
                                    questionHolder.css('top', h + 10);
                                }
                            }
                            var p = q.position();
                            b.css({
                                top: (p.top - b.height() - ((isRestComment && d.parentId) ? $('div.ui-richeditor').height() : 0)) + 'px',
                                left: p.left + 'px'
                            });
                            b.find('button').bind('click', $.proxy(function(e) {
                                options.postponed = false;
                                options.selectedChoise = e.target.id;
                                $(document).ajaxSuccess(onAjaxSuccess);
                                $.ajax(options).success(successCallback).error(errorCallback);
                                this.fadeOut(300, function() {
                                    $(this).remove();
                                });
                            }, b));
                            q.next('.tau-bubble').css('visibility', 'visible').animate({opacity: 1}, 300);
                        }
                    }, this);
                    if (isRestComment) {
                        store.evictProperties(d.general.id, 'request', ['requestType']);
                        store.get('request', {id: d.general.id, fields: [{'requestType': ['id', 'name']}]}, {
                            success: function(res) {
                                if ($.inArray(res.data.requestType.name, requestAddCommentHook.skipedTypes) === -1) {
                                    showQuestion($(questionHolder[0]));
                                } else {
                                    options.postponed = false;
                                    $.ajax(options).success(successCallback).error(errorCallback);
                                }
                            }
                        }).done();
                    } else if (isSoapComment) {
                        showQuestion($(questionHolder[0]));
                    }
                    jqXHR.success = function(callback) {
                        if (options.postponed) {
                            successCallback = callback;
                            return this;
                        } else {
                            $.ajax(options).success(callback);
                        }
                    };
                    jqXHR.error = function(callback) {
                        if (options.postponed) {
                            errorCallback = callback;
                            return this;
                        } else {
                            $.ajax(options).error(callback);
                        }
                    };
                    return {
                        send: $.noop,
                        abort: $.noop
                    };
                }
            }
        }, requestAddCommentHook));

        $.ajaxPrefilter('json', function(options, originalOptions, jqXHR) {
            if (options.data && options.hasOwnProperty('postponed') === false) {
                if (
                    requestAddCommentHook._isRestCommentCreatedForRequest(options) ||
                    requestAddCommentHook._isSoapCommentCreatedForRequest(options)
                ) {
                    options.postponed = true;
                }
            }
        });

        requestAddCommentHook.render();
    });
