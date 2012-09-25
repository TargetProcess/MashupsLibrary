tau.mashups
 .addDependency('jQuery')
 .addDependency('Underscore')
 .addDependency('tau/configurator')
.addDependency("tau/ui/templates/board.plus/ui.template.boardplus.card.skeleton")
 .addMashup(function ($, _, configurator, config) {

     function prioritizePopup() {
     }

     prioritizePopup.prototype = {
         apiUri: '/api/v2/',
         selectors: {
             'Bug': '{id,numericPriority,name,entityType.name as type,tags,effort,assignedUser.Select({id,firstName,lastName,avatarUri}) as assignedUsers,impediments.Count(entityState.IsFinal != true) as openImpedimentsCount,severity.name as severityName}',
             'UserStory': '{id,numericPriority,name,entityType.name as type,tags,effort,assignedUser.Select({id,firstName,lastName,avatarUri}) as assignedUsers,tasks.Count() as allTasks,tasks.Count(entityState.IsFinal != true) as openTasks,bugs.Count() as allBugs, bugs.Count(entityState.IsFinal != true) as openBugs,impediments.Count(entityState.IsFinal != true) as openImpedimentsCount}'
         },

         popupMarkup: [
             '<div id="priorPopup" class="ui-popup"  style="display:none">',
                '<p class="label"><span>Enter filter</span></p>',
                '<input id="filterPrior" class="input" style="width:80%;-moz-box-sizing: border-box;border: 1px solid #9EA4AD;border-radius: 3px 3px 3px 3px;box-shadow: 0 1px 1px #DDDDDD inset;padding: 5px 6px;" type="text" value="' +

                 'entityState.isInitial == true and project.id=40863' +

                 '" name="FilterPrior">',
                '<button id="filterRefresh" class="button big" onclick="javascript:void(0);return false;">Refresh</button>',

                '<div class="i-role-placeholder">',
                    '<div class="i-role-total">Total <span></span></div>',
                    '<div class="i-role-cardsholder" style="font-size:16px;">',
                        '<span></span><span></span>',
                    '</div>',
                    '<div class="i-role-result"></div>',
                '</div>',
            '</div>'
         ].join(''),

         render: function () {
             var self = this;

             var $popup = this.$el = $(this.popupMarkup);
             this.$cardsHolder = this.$el.find('.i-role-cardsholder span');

             $('body').append("<link type='text/css' href='" + configurator.getApplicationPath() + "/JavaScript/tau/css.board/css/cards.css' rel='stylesheet' />");

             $('body').append($popup);

             $('#filterRefresh').on('click', $.proxy(this.onRefresh, this))


             var $link = $('<li><a id="priorLink">Prioritize</a></li>');
             $link.insertBefore($('li.avatar'));

             $link.on('click', _.bind(self.onPopup, self));


         },

         onPopup: function () {

             var self = this;

             $(document).bind('keydown.prpopup', function (evt) {
                 
                 if (evt.which == jQuery.ui.keyCode.ESCAPE) {

                     self.$el.hide();
                     $(document).unbind('keydown.prpopup');
                 }
              });
         

             $('#priorPopup').show();
         },

         onRefresh: function () {
             var filter = $('#filterPrior').val();


             var url = new Tp.URL(window.location.href);
             var card = "UserStory";
             var rawUrl = new Tp.WebServiceURL(this.apiUri + card + '/?where=' + filter + '&take=10000&select=' + this.selectors[card]).url;

             $.getJSON(rawUrl, _.bind(this._onAllItems, this));
         },

         _onAllItems: function (data) {

             var items = data.items;

             this.$el.find('.i-role-total span').text(items.length);

             var rootAncess = { left: null };

             this.rootPointer = new NodePointer(rootAncess, true);
             this.prioritize(this.rootPointer, items[0], items.slice(1))
         },

         prioritize:function(nodePointer, head, tail){
             if (!nodePointer.node()){
                 nodePointer.setToParent(new Node(head));
                 this.$el.find('.i-role-total span').text(tail.length);
                 this.renderResult()
                 if (tail.length) {
                     this.prioritize(this.rootPointer, tail[0], tail.slice(1))
                 }
                 else {
                     this.finishPrioritize();
                 }
             }
             else {
                 this.renderCards(nodePointer, head, tail);
             }
         },

         finishPrioritize: function () {
    
             
             this.renderResult();
             
         },

         renderResult: function(){

             
             var root = this.rootPointer.node();

             var list = [];

             var traverse = function(node, cb){
                 if (node) {
                     traverse(node.left, cb);
                     cb(node)
                     traverse(node.right, cb);
                 } 
             }
             
             this.$cardsHolder.empty();
             var $result = this.$el.find('.i-role-result').empty();
             var self = this;

             traverse(root, function (v) {

                 var $card = self.createCard(v.data).prependTo($result)

                 list.push(_.pick(v.data, 'id', 'name'))
             });

         },


         renderCards: function (nodePointer, candidate, tail) {
         
             var self = this;


             //this.$cardsHolder.html("");

             var $card1 = this.$cardsHolder.eq(0).html(this.createCard(nodePointer.node().data)).children();
             var $card2 = this.$cardsHolder.eq(1).html(this.createCard(candidate)).children();

             $card1.click(function () {
                 self.prioritize(nodePointer.node().getLeftPointer(), candidate, tail)
             });

             $card2.click(function () {
                 self.prioritize(nodePointer.node().getRightPointer(), candidate, tail)
             });
         },

         createCard: function(data){
         
             return configurator.getTemplateFactory().get("boardplus.card.skeleton").bind({}, {
                data: data
             });
         }
     };

     var Node = function (data) {
         this.left = null;
         this.right = null;
         this.data = data;
     }

     Node.prototype.getLeftPointer = function () {
         return new NodePointer(this, true);
     }
     Node.prototype.getRightPointer = function () {
         return new NodePointer(this, false);
     }


     var NodePointer = function (parent, isLeft) {
         this.parent = parent;
         this.isLeft = isLeft;
     }

     NodePointer.prototype.setToParent = function (node) {
         if (this.isLeft)
             this.parent.left = node;
         else
             this.parent.right = node;
     }
     NodePointer.prototype.node = function () {
         if (this.isLeft)
             return this.parent.left;
         else
             return this.parent.right;
     }

     new prioritizePopup().render();

 })
