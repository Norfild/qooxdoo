/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)

************************************************************************ */

/**
 * For a mobile application. Supports the mobile widget set.
 *
 * @require(qx.core.Init)
 * @asset(qx/mobile/css/*)
 */
qx.Class.define("qx.application.Mobile",
{
  extend : qx.core.Object,
  implement : [qx.application.IApplication],
  include : qx.locale.MTranslation,


  construct : function()
  {
    this.base(arguments);
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the method {@link qx.ui.mobile.page.Page#back} is called. Data indicating
     *  whether the action was triggered by a key event or not.
     */
    "back" : "qx.event.type.Data",


    /** Fired when a {@link qx.ui.mobile.dialog.Popup popup} appears on screen. */
    "popup" : "qx.event.type.Event"
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    __root : null,
    __routing : null,


    // interface method
    main : function()
    {
      this.__root = this._createRootWidget();
      this.__routing = this._createRouting();

      if (qx.core.Environment.get("qx.mobile.nativescroll") == false) {
        this.__root.setShowScrollbarY(false);
      }
    },


    /**
     * Returns the application's root widget.
     *
     * @return {qx.ui.mobile.core.Widget} The application's root widget.
     */
    getRoot : function() {
      return this.__root;
    },


    /**
     * Returns the application's routing.
     *
     * @return {qx.application.Routing} The application's routing.
     */
    getRouting : function() {
      return this.__routing;
    },


    /**
      * Creates the application's routing. Override this function to create
      * your own routing.
      * @return {qx.application.Routing} the application's routing.
      */
    _createRouting : function() {
      return new qx.application.Routing();
    },


    /*
    * Default behaviour when a route matches. Displays the corresponding page on screen.
    * @param data {Map} the animation properties 
    */
    _show : function(data) {
      this.show(data.customData);
    },


    /**
     * Creates the application's root widget. Override this function to create
     * your own root widget.
     *
     * @return {qx.ui.mobile.core.Widget} The application's root widget.
     */
    _createRootWidget : function()
    {
      return new qx.ui.mobile.core.Root();
    },


    // interface method
    finalize : function()
    {
      // empty
    },


    // interface method
    close : function()
    {
      // empty
    },


    // interface method
    terminate : function()
    {
      // empty
    }
  },


  destruct : function()
  {
    this.__root = this.__routing = null;
  }
});
