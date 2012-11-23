/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Andreas Parusel (anpar)

************************************************************************ */


/* ************************************************************************

#asset(pushtestreporter/*)

************************************************************************ */

/**
 * This is the main application class of your custom application "pushtestreporter"
 */
qx.Class.define("pushtestreporter.Application",
{
  extend : qx.application.Standalone,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // __toolbar : null,
    
    /**
     * This method contains the initial application code and gets called 
     * during startup of the application
     * 
     * @lint ignoreDeprecated(alert)
     */
    main : function()
    {
      // Call super class
      this.base(arguments);

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug"))
      {
        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;
        // support additional cross-browser console. Press F7 to toggle visibility
        qx.log.appender.Console;
      }

      /*
      -------------------------------------------------------------------------
        Below is your actual application code...
      -------------------------------------------------------------------------
      */
      
      var es = new EventSource('/master');
      var clients = [];
      
      var rootContainer = new qx.ui.container.Composite()
      rootContainer.setLayout(new qx.ui.layout.VBox(5));
      
      var scroll = new qx.ui.container.Scroll();
      
      var toolbar = new pushtestreporter.ToolBar();
      
      var mainContainer = new qx.ui.container.Composite()
      mainContainer.setLayout(new qx.ui.layout.HBox(5));
      mainContainer.setPadding(10);
      this.getRoot().add(rootContainer, {edge: 0});
      rootContainer.add(toolbar);
      rootContainer.add(scroll, {flex : 1});
      scroll.add(mainContainer);
    
      es.addEventListener('open', function (event) {
      });
      
      es.addEventListener('clientJoined', function (event) {
        var client = JSON.parse(event.data);
        
        var container = clients[client.id] = new qx.ui.container.Composite();
        container.setLayout(new qx.ui.layout.VBox(5));
        
        var clientLabel = new qx.ui.basic.Label();
        clientLabel.setRich(true);
        clientLabel.setValue("<b>Client " + client.id + ": " + client.device + "</b>")
        container.add(clientLabel);
        
        var list = new qx.ui.list.List(null);
        list.setWidth(300);
        list.setHeight(180);
        container.add(list);
        
        var textArea = new qx.ui.form.TextArea();
        textArea.setWidth(300);
        textArea.setHeight(180);
        container.add(textArea);
        
        mainContainer.add(container);
                
        if (mainContainer.indexOf(container) != 0) {
          
          var ownScrollBar = container.getChildren()[1].getChildControl("scrollbar-y");
          var firstScrollBar = mainContainer.getChildren()[0].getChildren()[1].getChildControl("scrollbar-y");
          
          ownScrollBar.bind("position", firstScrollBar, "position");
          firstScrollBar.bind("position", ownScrollBar, "position");
        }
        
        toolbar.setStatus("clientJoined");
        
      });
        
       
        

      
      es.addEventListener('clientLeft', function (event) {
        if(clients[event.data] != undefined) {

          mainContainer.remove(clients[event.data]);
          delete clients[event.data];
          
          if(mainContainer.hasChildren()) {
            var firstScrollBar = mainContainer.getChildren()[0].getChildren()[1].getChildControl("scrollbar-y");
            for(var i = 1; i < mainContainer.getChildren().length; i++) {
              var ownScrollBar = mainContainer.getChildren()[i].getChildren()[1].getChildControl("scrollbar-y");
              ownScrollBar.bind("position", firstScrollBar, "position");
              firstScrollBar.bind("position", ownScrollBar, "position");
            }
            toolbar.setStatus("clientLeft");
          }
          else {
             toolbar.setStatus("lastLeft");
          }
        }
      });
      
      var self = this;
	  
	    es.addEventListener('results', function (event) {
                
        var result = JSON.parse(event.data);
        var model = qx.data.marshal.Json.createModel(result);
 
        var container = clients[result.client];
                
        var array = new qx.data.Array();

        for (var test in result.tests) {
          array.push(test);
        }
        var list = container.getChildren()[1];
        list.setModel(model.getTests());
        
        list.setDelegate({
          bindItem : function(controller, item, id) {
            controller.bindProperty("name", "label", {}, item, id);
            var colorOptions = {
              converter : function(value) {
                switch(value) {
                  case "success":
                    return "#007F00";
                  case "skip":
                    return "#666666";
                  default:
                    return "#9E0000";
                }
              }
            };
            controller.bindProperty("state", "textColor", colorOptions, item, id);
          }
        });
        
        
        list.getSelection().addListener('change', function (e) {
          
          // // needed if only one textArea exists
          // for(var i = 0; i < mainContainer.getChildren().length; i++) {
          //   if(mainContainer.indexOf(container) != i) {
          //     mainContainer.getChildren()[i].getChildren()[1].getSelection().removeAll();
          //   }
          // }
          
          var selection = list.getSelection();
          
            var message = "";
            for (var x = 0; x < selection.length; x++) {
              var item = selection.getItem(x);
              var exceptions = item.getExceptions();
              for (var i = 0; i < exceptions.length; i++) {
                message += exceptions.getItem(i).getMessage();
              }
            }
            
            var textArea = container.getChildren()[2];
            textArea.setValue(message);
        }, this);
       toolbar.setStatus("results"); 
	    });
	  
      es.addEventListener('error', function (event) {
      });      

    }
  }
  
  // destruct : function() {
  //    this.__list = null;
  //  }
});
