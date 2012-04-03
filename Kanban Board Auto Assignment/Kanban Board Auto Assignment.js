tau.mashups
	.addDependency("libs/jquery/jquery")
    .addMashup(function(config) {

        function assignCard(c) {
            $.ajax({
                url: appHostAndPath+'/api/v1/Assignments',
                type: 'POST',
                contentType: 'application/json',
                data: "{'Assignable': {'Id': "+c.id+"}, 'Role': {'Id': "+c.entityState.roleId+"}, 'GeneralUser': {'Id': "+loggedUser.id+"}}"
            });

            setTimeout(function() {
                if ($('div.kanban-item[id*='+c.id+']').find('div.kanban-avatars').length == 0)
                    $('div.kanban-item[id*='+c.id+']').append('<div class="kanban-avatars"></div>');
                $('div.kanban-item[id*='+c.id+']').find('div.kanban-avatars').append('<div class="kanban-avatar"><img class="shake-me" src="../../../avatar.ashx?size=22&UserId='+loggedUser.id+'&mode=raw"></div>');
            }, 250);
        }

        $(document).ready(function() {
            $.each(Tp.controls.kanbanboard.KanbanboardManager.getInstance().kanbanBoards, function() {
                /* and bind to when cards change columns */
                $(this)[0].controller.on('statechanged', function(b, c) {
                    console.log(c);
                    if ((c.entityState.roleId != null) && (c.entityState.roleId != 0)) {
                        if (c.roles.length != 0) {
                            /* go through the current assignments and assign it to us if we're null */
                            $.each(c.roles, function(r) {
                                if ((r.id == c.entityState.roleId) && (r.first == null)) {
                                    assignCard(c);
                                    return;
                                }
                            });
                        } else {
                            /* we don't have any assignments, so we can assume we can go ahead and assign */
                            assignCard(c);
                        }
                    }
                });
            });            
        });
    }
);


