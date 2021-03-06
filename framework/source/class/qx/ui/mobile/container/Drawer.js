/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christopher Zuendorf (czuendorf)

************************************************************************ */

/**
 * Creates a drawer widget inside the given parent widget. The parent widget can
 * be assigned as a constructor argument. If no parent is set, the application's
 * root will be assumed as parent. A drawer widget can be assigned to left, right,
 * top or bottom edge of its parent by property <code>orientation</code>. The drawer floats
 * in on <code>show()</code> and floats out on <code>hide()</code>. Additionally the drawer is shown by
 * swiping in reverse direction on the parent edge to where the drawer is placed
 * to: Orientation: <code>left</code>, Swipe: <code>right</code> on parents edge: Drawer is shown etc.
 * The drawer is hidden when user taps the parent area outside of the drawer.
 * This behaviour can be deactivated by the property <code>hideOnParentTap</code>.
 *
 * <pre class='javascript'>
 *
 *  var drawer = new qx.ui.mobile.container.Drawer();
 *  drawer.setOrientation("right");
 *  drawer.setTapOffset(100);
 *
 *  var button = new qx.ui.mobile.form.Button("A Button");
 *  drawer.add(button);
 * </pre>
 *
 *
 */
qx.Class.define("qx.ui.mobile.container.Drawer",
{
  extend : qx.ui.mobile.container.Composite,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param parent {qx.ui.mobile.container.Composite?null} The widget to which
   * the drawer should be added, if null it is added to app root.
   * @param layout {qx.ui.mobile.layout.Abstract?null} The layout that should be
   * used for this container.
   */
  construct : function(parent, layout)
  {
    this.base(arguments);

    if (layout) {
      this.setLayout(layout);
    }

    this.initOrientation();
    this.initPositionZ();

    if (parent) {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertInstance(parent, qx.ui.mobile.container.Composite);
      }

      parent.add(this);
    } else {
      qx.core.Init.getApplication().getRoot().add(this);
    }

    this.__parent = this.getLayoutParent();
    this.__parent.addCssClass("drawer-parent");

    this.__parent.addListener("swipe", this._onParentSwipe,this);
    this.__parent.addListener("pointerdown", this._onParentPointerDown,this);

    qx.core.Init.getApplication().addListener("back", this.forceHide, this);

    this.__pointerStartPosition = [0,0];

    this.forceHide();
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired when the drawer changes its size.
     */
    resize : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties : {
    // overridden
    defaultCssClass : {
      refine : true,
      init : "drawer"
    },


    /** Property for setting the orientation of the drawer.
     * Allowed values are: <code>left</code>,<code>right</code>,<code>top</code>,<code>bottom</code> */
    orientation : {
      check : "String",
      init : "left",
      apply : "_applyOrientation"
    },


    /** The size of the drawer in <code>px</code>. This value is interpreted as width if
    * orientation is <code>left | right</code>, as height if orientation is
    * <code>top | bottom</code>. */
    size : {
      check : "Integer",
      init : 300,
      apply : "_applySize",
      event : "resize"
    },


    /** Indicates whether the drawer should hide when the parent area of it is tapped.  */
    hideOnParentTap : {
      check : "Boolean",
      init : true
    },


    /** Sets the size of the tapping area, where the drawer reacts on swipes for opening itself. */
    tapOffset : {
      check : "Integer",
      init : 20
    },


    /** The duration time of the transition between shown/hidden state in ms. */
    transitionDuration : {
      check : "Integer",
      init : 500,
      apply : "_applyTransitionDuration"
    },


    /** Sets the drawer zIndex position relative to its parent. */
    positionZ : {
      check : [ "above", "below"],
      init : "above",
      apply : "_applyPositionZ"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {
    __pointerStartPosition : null,
    __parent : null,
    __transitionEnabled : null,


    // property apply
    _applyOrientation : function(value, old) {
      this.removeCssClass(old);
      this.addCssClass(value);

      // Reapply width of height size depending on orientation.
      this._applySize(this.getSize());
    },


    // property apply
    _applyPositionZ : function(value,old) {
      this.removeCssClass(old);
      this.addCssClass(value);

      if(this.__parent) {
        this.__parent.setTranslateX(0);
        this.__parent.setTranslateY(0);
      }
    },


    /**
    * @deprecated {3.5} Please use setSize() instead.
    * Sets the user value of the property width.
    * @param value {Integer} New value for property
    */
    setWidth : function(value) {
      if (qx.core.Environment.get("qx.debug"))
      {
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,"The method 'setWidth()' is deprecated. Please use 'setSize()' instead.");
      }
      this.setSize(value);
    },


    /**
    * @deprecated {3.5} Please use getSize() instead.
    * Gets the user value of the property width.
    * @return {Integer} the value.
    */
    getWidth : function() {
      if (qx.core.Environment.get("qx.debug"))
      {
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,"The method 'getWidth()' is deprecated. Please use 'getSize()' instead.");
      }
      return this.getSize();
    },


    /**
    * @deprecated {3.5} Please use resetSize() instead.
    * Resets the user value of the property width.
    */
    resetWidth : function() {
      if (qx.core.Environment.get("qx.debug"))
      {
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,"The method 'resetWidth()' is deprecated. Please use 'resetSize()' instead.");
      }
      this.resetSize();
    },


    /**
    * @deprecated {3.5} Please use setSize() instead.
    * Sets the user value of the property height.
    * @param value {Integer} New value for property
    */
    setHeight : function(value) {
      if (qx.core.Environment.get("qx.debug"))
      {
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,"The method 'setHeight()' is deprecated. Please use 'setSize()' instead.");
      }
      this.setSize(value);
    },


    /**
    * @deprecated {3.5} Please use getSize() instead.
    * Gets the user value of the property height.
    * @return {Integer} the value.
    */
    getHeight : function() {
      if (qx.core.Environment.get("qx.debug"))
      {
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,"The method 'getHeight()' is deprecated. Please use 'getSize()' instead.");
      }
      return this.getSize();
    },


    /**
    * @deprecated {3.5} Please use resetSize() instead.
    * Resets the user value of the property height.
    */
    resetHeight : function() {
      if (qx.core.Environment.get("qx.debug"))
      {
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,"The method 'resetHeight()' is deprecated. Please use 'resetSize()' instead.");
      }
      this.resetSize();
    },


    /**
     * @deprecated {3.5} Please use this.__parent.toggleCssClass instead.
     */
    _toggleParentBlockedState : function() {
      this.__parent.toggleCssClass("blocked");
    },


    // property apply
    _applySize : function(value) {
      var height = null;
      var width = null;

      var remSize = (value / 16);

      if (this.getOrientation() == "left" || this.getOrientation() == "right") {
        width = remSize + "rem";
      } else {
        height = remSize + "rem";
      }

      this._setStyle("height", height);
      this._setStyle("width", width);
    },


    /**
    * Handler for the "transitionEnd" event.
    * @param evt {Event} the event.
    */
    _onTransitionEnd : function(evt) {
      if(evt) {
        qx.bom.Element.removeListener(evt.getTarget(), "transitionEnd", this._onTransitionEnd, this);
      }

      this._disableTransition();

      if (this.isHidden()) {
        this.exclude();
        this.__parent.removeCssClass("blocked");
      }
    },


    // property apply
    _applyTransitionDuration : function(value,old) {
      this.__transitionEnabled = value > 0;
    },


    /**
     * Shows the drawer.
     */
    show : function()
    {
      if(!this.isHidden()) {
        return;
      }

      this.base(arguments);

      this.__parent.addCssClass("blocked");

      if (this.getPositionZ() == "below") {
        if (this.getOrientation() == "left") {
          this.__parent.setTranslateX(this.getSize());
        } else if (this.getOrientation() == "right") {
          this.__parent.setTranslateX(-this.getSize());
        } else if (this.getOrientation() == "top") {
          this.__parent.setTranslateY(this.getSize());
        } else if (this.getOrientation() == "bottom") {
          this.__parent.setTranslateY(-this.getSize());
        }
      }

      if (this.getTransitionDuration() > 0) {
        this._enableTransition();
        qx.bom.Element.addListener(this._getTransitionTarget().getContentElement(), "transitionEnd", this._onTransitionEnd, this);
        setTimeout(function() {
          this.removeCssClass("hidden");
        }.bind(this), 0);
      } else {
        this.removeCssClass("hidden");
        this._onTransitionEnd();
      }
    },


    /**
     * Hides the drawer.
     */
    hide : function() {
      if(this.isHidden()) {
        return;
      }

      if (this.getPositionZ() == "below") {
        this.__parent.setTranslateX(0);
        this.__parent.setTranslateY(0);
      }

      if (this.getTransitionDuration() > 0) {
        this._enableTransition();
        qx.bom.Element.addListener(this._getTransitionTarget().getContentElement(), "transitionEnd", this._onTransitionEnd, this);
        setTimeout(function() {
          this.addCssClass("hidden");
        }.bind(this), 0);
      } else {
        this.addCssClass("hidden");
        this._onTransitionEnd();
      }
    },


    /**
     * Strict way to hide this drawer. Removes the blocker from the parent,
     * and hides the drawer without any animation. Should be called when drawer's
     * parent is animated and drawer should hide immediately.
     */
    forceHide : function() {
      this._disableTransition();

      if (this.getPositionZ() == "below") {
        this.__parent.setTranslateX(0);
        this.__parent.setTranslateY(0);
      }

      this.__parent.removeCssClass("blocked");

      this.addCssClass("hidden");
    },


    // overridden
    isHidden : function() {
      return this.hasCssClass("hidden");
    },


    /**
     * Enables the transition on this drawer.
     */
    _enableTransition : function() {
      qx.bom.element.Style.set(this._getTransitionTarget().getContentElement(), "transition", "all "+this.getTransitionDuration()+"ms ease-in-out");
    },


   /**
     * Disables the transition on this drawer.
     */
    _disableTransition : function() {
      qx.bom.element.Style.set(this._getTransitionTarget().getContentElement(),"transition", null);
    },


    /**
    * Returns the target widget which is responsible for the transition handling.
    * @return {qx.ui.mobile.core.Widget} the transition target widget.
    */
    _getTransitionTarget : function() {
      if (this.getPositionZ() == "below") {
        return this.__parent;
      } else {
        return this;
      }
    },


    /**
     * Toggle the visibility of the drawer.
     * @return {Boolean} the new visibility state.
     */
    toggleVisibility : function() {
      if(this.isHidden()) {
        this.show();
        return true;
      } else {
        this.hide();
        return false;
      }
    },


    /**
     * Handles a tap on drawers's root.
     * @param evt {qx.module.event.Pointer} Handled pointer event.
     */
    _onParentPointerDown : function(evt) {
      this.__pointerStartPosition = [evt.getViewportLeft(),evt.getViewportTop()];

      var isShown = !this.hasCssClass("hidden");
      if(isShown && this.isHideOnParentTap()) {
        var location = qx.bom.element.Location.get(this.getContainerElement());
        var orientation = this.getOrientation();
        if (orientation == "left" && this.__pointerStartPosition[0] > location.right
        || orientation == "top" && this.__pointerStartPosition[1] > location.bottom
        || orientation == "bottom" && this.__pointerStartPosition[1] < location.top
        || orientation == "right" && this.__pointerStartPosition[0] < location.left)
        {
          // First event on overlayed page should be ignored.
          evt.preventDefault();

          this.hide();
        }
      }
    },


    /**
     * Handles a swipe on layout parent.
     * @param evt {qx.module.event.Pointer} Handled pointer event.
     */
    _onParentSwipe : function(evt) {
      var direction = evt.getDirection();
      var isHidden = this.hasCssClass("hidden");
      if(isHidden) {
        var location = qx.bom.element.Location.get(this.getContainerElement());

        if (
          (direction == "right"
          && this.getOrientation() == "left"
          && this.__pointerStartPosition[0] < location.right + this.getTapOffset()
          && this.__pointerStartPosition[0] > location.right)
          ||
          (direction == "left"
          && this.getOrientation() == "right"
          && this.__pointerStartPosition[0] > location.left - this.getTapOffset()
          && this.__pointerStartPosition[0] < location.left)
          ||
          (direction == "down"
          && this.getOrientation() == "top"
          && this.__pointerStartPosition[1] < this.getTapOffset() + location.bottom
          && this.__pointerStartPosition[1] > location.bottom)
          ||
          (direction == "up"
          && this.getOrientation() == "bottom"
          && this.__pointerStartPosition[1] > location.top - this.getTapOffset()
          && this.__pointerStartPosition[1] < location.top)
        )
        {
          this.show();
        }
      }
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    qx.core.Init.getApplication().removeListener("back", this.forceHide, this);
    
    this.__parent.removeListener("swipe", this._onParentSwipe, this);
    this.__parent.removeListener("pointerdown", this._onParentPointerDown, this);

    this.__pointerStartPosition = this.__parent = this.__transitionEnabled = null;
  }
});
