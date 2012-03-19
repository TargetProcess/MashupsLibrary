require(['Underscore', 'jQuery'], function (_, $) {
    var path = window.appHostAndPath;
    var url = path + '/api/v1/impediments.asmx/?skip=0&take=999&include=[id,name,assignable[id]]&where=(entityState.isFinal%20eq%200)';

    var assignables = {};

    var highlightImpediments = function () {

        var keys = _(assignables).keys();
        
        var appendBadge = function () {
            var $id = keys.pop();

            if (!$id) {
                return;
            }

            var $card = $('div.entity:contains("' + $id + '")');
          
          
          if ($('.impBadge', $card).length === 0) {
            var $bubble = $('<div class="impBadge" style="width: 14px; opacity: 0.8; line-height: 14px; color:white; display:none;'
                          + 'font-size:10px; font-weight:bold; text-align: center;'
                + 'position:absolute; height: 14px; border-radius: 15px;'
                + '-moz-box-shadow: inset 0 1px 1px 0 #830000;-webkit-box-shadow: inset 0 1px 1px 0 #830000;'
                + 'top:3px;right:3px; background-color:#9e0b0f;text-shadow: 0 1px 1px #830000;">'
                + assignables[$id].length + '</div>');
            $card.append($bubble);
            $bubble.fadeIn(250);
          
           }
          
            setTimeout(appendBadge, 30); 
        };

        appendBadge();
    };

    var fnProcess = function (r) {
        var impediments = r.Items;
        _.each(impediments, function (i) {
            var ref = i.Assignable;
            if (!ref || ref.length === 0) {
                return;
            }
            var id = ref.Id;
            if (!assignables.hasOwnProperty(id)) {
                assignables[id] = [];
            }
            assignables[id].push(i.Name);
        });

        highlightImpediments();

    };


    $('#zoomBoard').delegate('a', 'click', highlightImpediments);
    $(window).bind('hashchange', highlightImpediments);
  
    $(function () {
        $.ajax({ url: url, dataType: 'json' }).success(fnProcess);
    });

});