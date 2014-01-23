Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

        launch: function() {
	    var context  = this.getContext (); 
	    var currentProject = context.getProject()._ref;
	    console.log('current project:', currentProject);
	    var that = this;
	    var panel = Ext.create('Ext.panel.Panel', {
                layout: 'hbox',
                itemId: 'parentPanel',
                componentCls: 'panel',
                items: [
		    {
                    xtype: 'rallyusersearchcombobox',
                    fieldLabel: 'SELECT USER:',
		    project: currentProject,
                        listeners:{
                            ready: function(combobox){
				console.log('ready');
                                this._onUserSelected(combobox.getRecord());
                           },
                           select: function(combobox){
			    console.log('select');
			    if (this.down('#c').html !== 'No task is selected') {
				Ext.getCmp('c').update('No task is selected');
			    }
                                this._onUserSelected(combobox.getRecord());
                           },
                            scope: this
                        }
                    },
		    {
                    xtype: 'panel',
                    title: 'Tasks',
		    width: 600,
                    itemId: 'childPanel1'
		    },
		    {
                    xtype: 'panel',
                    title: 'Last Revision',
                    itemId: 'childPanel2'
		    }
                ],
            });
	   
	    
            this.add(panel);
	    this.down('#childPanel2').add({
		id: 'c',
		html: 'No task is selected'
	    });
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
             
              Ext.create('Rally.data.WsapiDataStore', {
                 model: 'Task',
                 fetch: [ 'DragAndDropRank','FormattedID','Name','State','RevisionHistory'],
                 autoLoad: true,
                 filters : [filter],
                 sorters:[
                    {
                        property: 'DragAndDropRank',
                        direction: 'ASC'
                    }
                 ],
		 
                 listeners: {
		    load: this._onTaskDataLoaded,
		    scope: this
                 }
             });
           }
	   else{
		console.log('no user');
            
	   }
        },
	
	_onTaskDataLoaded: function(store, data) {
        this._customRecords = [];
        Ext.Array.each(data, function(task, index) {
            this._customRecords.push({
                _ref: task.get('_ref'),
                FormattedID: task.get('FormattedID'),
                Name: task.get('Name'),
                RevisionID: Rally.util.Ref.getOidFromRef(task.get('RevisionHistory')),
                RevisionNumber: 'not loaded'
            });
        }, this);
       this._updateGrid(store,data);
    },

        _updateGrid: function(store, data){
        if (!this.down('#g')) {
   		this._createGrid(store,data);
   	}
   	else{
   		this.down('#g').reconfigure(store);
   	}
   },
        _createGrid: function(store,data){
            var that = this;
   	console.log("_createGrid: store:", store);
	console.log("_createGrid: data:", data);
   	var g = Ext.create('Rally.ui.grid.Grid', {
                id: 'g',
   		store: store,
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
							console.log('r', r.data);
							that._getRevisionHistory(data, r.data);
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
   
    _getRevisionHistory: function(taskList, task) {
	this._task = task;
	console.log('_getRevisionHistory');
		console.log(taskList);
		console.log(task);
                this._revisionModel = Rally.data.ModelFactory.getModel({
                    type: 'RevisionHistory',
                    scope: this,
		    success: this._onModelCreated
		});
       
    },
    _onModelCreated: function(model) {
	console.log('_onModelCreated');
	var that = this;
	console.log('this._task',this._task);
	console.log('this._task rev history',this._task.RevisionHistory);

        model.load(Rally.util.Ref.getOidFromRef(that._task.RevisionHistory._ref),{
            scope: this,
            success: this._onModelLoaded
        });

    },
    
     _onModelLoaded: function(record, operation) {
	console.log('_onModelLoaded - record: ',record );
        record.getCollection('Revisions').load({
            fetch: true,
            scope: this,
            callback: function(revisions, operation, success) {
                this._onRevisionsLoaded(revisions, record);
            }
        }); 
    },
    
    _onRevisionsLoaded: function(revisions, record) {
        var lastRev = _.first(revisions).data;
	console.log('_onRevisionsLoaded: ',lastRev.Description, lastRev.RevisionNumber );
	this._displayLastRevision(lastRev.Description,lastRev.RevisionNumber );
	
    },
    
    _displayLastRevision:function(desc, num){
	Ext.getCmp('c').update('<b>Description:</b>' + desc + '<br /><b>Revision Number:</b>' + num);

    }
});

