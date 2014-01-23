Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

        launch: function() {
	    var context  = this.getContext (); // Rally.app.App.getContext
	    var currentProject = context.getProject()._ref;
	    console.log('current project:', currentProject);
	    var panel = Ext.create('Ext.panel.Panel', {
                layout: 'hbox',
                itemId: 'parentPanel',
                componentCls: 'panel',
                items: [
		    {
                    xtype: 'rallyusersearchcombobox',
                    fieldLabel: 'select user',
		    project: currentProject,
                        listeners:{
                            ready: function(combobox){
                                this._onUserSelected(combobox.getRecord());
                           },
                           select: function(combobox){
                                this._onUserSelected(combobox.getRecord());
                           },
                            scope: this
                        }
                    },
		    {
                    xtype: 'panel',
                    title: 'Tasks',
		    width: 400,
                    itemId: 'childPanel1'
		    },
		    {
                    xtype: 'panel',
                    title: 'Revisions',
                    itemId: 'childPanel2'
		    }
                ],
            });
            this.add(panel);  
        },
        
        _onUserSelected:function(record){
            var user = record.data['_ref'];
            
           if(user){
	    console.log('user', user);
            var filter = Ext.create('Rally.data.QueryFilter', {
                                 property: 'Owner',
                                 operator: '=',
                                 value: user
                             });
                             
                             filter = filter.and({
                                 property: 'State',
                                 operator: '<',
                                 value: 'Completed'  
                             });
                             filter.toString();
             
              var _store = Ext.create('Rally.data.WsapiDataStore', {
                 model: 'Task',
                 fetch: [ 'DragAndDropRank','FormattedID','Name','State','RevisionHistory'],
                 autoLoad: true,
                 filters : [filter],
                 sorters:[
                    {
                        property: 'DragAndDropRank',
                        direction: 'ASC'
                        //direction: 'DESC'
                    }
                 ],
		 
                 listeners: {
                     load: function(store,records, success){
                        this._updateGrid(_store);
                     },
                        scope: this
                 }
             });
           }
	   else{
		console.log('no user');
            
	   }
        },

        _updateGrid: function(_store){
        if (!this.down('#g')) {
   		this._createGrid(_store);
   	}
   	else{
   		this.down('#g').reconfigure(_store);
   	}
   },
        _createGrid: function(_store){
            var that = this;
   	console.log("load grid", _store);
   	var g = Ext.create('Rally.ui.grid.Grid', {
                id: 'g',
   		store: _store,
                enableRanking: true,
                columnCfgs: [
                                    {text: 'Formatted ID', dataIndex: 'FormattedID'},
                                    {text: 'Name', dataIndex: 'Name'},
                                    {text: 'State', dataIndex: 'State'},
				    {text: 'Last Revision',
					 renderer: function (v, m, r) {
					    var id = Ext.id();
					    Ext.defer(function () {
						Ext.widget('button', {
						    renderTo: id,
						    text: 'see',
						    width: 50,
						    handler: function () {
							//Ext.Msg.alert('Info', r.get('RevisionHistory')._ref)
				                        that.getRevisions(r.get('RevisionHistory')._ref); 
						    }
						});
					    }, 50);
					    return Ext.String.format('<div id="{0}"></div>', id);
					}
					 
				    }
                                ],
   		height: 400,
   	});
   	this.down('#childPanel1').add(g); 
   },
   
   getRevisions:function(refRevisions){
	console.log('refRevisions', refRevisions);
   
	},
});