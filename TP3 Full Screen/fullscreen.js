var signUp = function (appBus, eventHelper, $) {
    var isFullScreen = false;
    var wrapperTop = null;	

    var fullScreenIcon = '<div style="-webkit-transform: rotate(45deg);-moz-transform: rotate(45deg);-ms-transform: rotate(45deg);">↕</div>'; 	
  
    var toggleFullScreen = function() {
        isFullScreen = !isFullScreen;    

        var element = $('body');

        if (isFullScreen) {
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
            $('.tau-settings-active').removeClass('tau-settings-active');
        } 

        require(['tau/core/bus.reg'], function(r) { 
            r.getByName('board_plus', function(bus) { 
                 bus.fire('resize.executed', { onlyHeaders: false });
            }); 
        });
    };

    var turboListener = {
        bus: appBus,

        
        "bus overview.board.ready": function (evt,  data) {
            if (isFullScreen) {
                toggleFullScreen();
            }
        },

      	"bus afterRender": function (evt,  data) {
            if (evt.caller.name !== 'board.toolbar') {
                return;
            }

            console.log(data.element);

            var self = this;    

            var $button = $('<button id="btnFullScreen" data-title="Enter full screen" class="tau-extension-board-tooltip tau-btn" ' 
                + 'style="float: right; width: 24px; padding: 0; text-align: center; background: url(\'../javascript/tau/css.board/images/icons-general.svg?v=2.15.0.15001\') no-repeat -815px -155px;" alt="Toggle full screen" ' 
                + '></button>');

            $button.click(function () {
                toggleFullScreen();
            });

            $button.insertBefore($('.tau-board-name', data.element));
        }
        
    };

    eventHelper.subscribeOn(turboListener);
};

require(['all.components'], function () {
    require(['tau/core/global.bus', 'tau/core/event', 'jQuery'], function (gb, eventHelper) {
        signUp(gb.get(), eventHelper, $);
    });
});
