/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * This handler is used to normalize all focus/activation requirements
 * and normalize all cross browser quirks in this area.
 *
 * Notes:
 *
 * * Webkit and Opera (before 9.5) do not support tabIndex for all elements
 * (See also: https://bugs.webkit.org/show_bug.cgi?id=7138)
 *
 * * TabIndex is normally 0, which means all naturally focusable elements are focusable.
 * * TabIndex > 0 means that the element is focusable and tappable
 * * TabIndex < 0 means that the element, even if naturally possible, is not focusable.
 *
 * @use(qx.event.dispatch.DomBubbling)
 */
qx.Class.define("qx.event.handler.Focus",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Create a new instance
   *
   * @param manager {qx.event.Manager} Event manager for the window to use
   */
  construct : function(manager)
  {
    this.base(arguments);

    // Define shorthands
    this._manager = manager;
    this._window = manager.getWindow();
    this._document = this._window.document;
    this._root = this._document.documentElement;
    this._body = this._document.body;

    // Initialize
    this._initObserver();
  },

  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** The active DOM element */
    active :
    {
      apply : "_applyActive",
      nullable : true
    },

    /** The focussed DOM element */
    focus :
    {
      apply : "_applyFocus",
      nullable : true
    }
  },

  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** @type {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_NORMAL,

    /** @type {Map} Supported event types */
    SUPPORTED_TYPES :
    {
      focus : 1,
      blur : 1,
      focusin : 1,
      focusout : 1,
      activate : 1,
      deactivate : 1
    },

    /** @type {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : true,

    /**
     * @type {Map} See: http://msdn.microsoft.com/en-us/library/ms534654(VS.85).aspx
     */
    FOCUSABLE_ELEMENTS : qx.core.Environment.select("engine.name",
    {
      "mshtml|gecko" :
      {
        a : 1,
        body : 1,
        button : 1,
        frame : 1,
        iframe : 1,
        img : 1,
        input : 1,
        object : 1,
        select : 1,
        textarea : 1
      },

      "opera|webkit" :
      {
        button : 1,
        input : 1,
        select : 1,
        textarea : 1
      }
    })
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __onNativeFocusWrapper : null,
    __onNativeBlurWrapper : null,
    __onNativeDragGestureWrapper : null,
    __onNativeSelectStartWrapper : null,
    __onNativeFocusInWrapper : null,
    __onNativeFocusOutWrapper : null,
    __previousFocus : null,
    __previousActive : null,
    __down : "",
    __up : "",

    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER INTERFACE
    ---------------------------------------------------------------------------
    */

    // interface implementation
    canHandleEvent : function(target, type) {},

    // interface implementation
    registerEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },

    // interface implementation
    unregisterEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },

    /*
    ---------------------------------------------------------------------------
      FOCUS/BLUR USER INTERFACE
    ---------------------------------------------------------------------------
    */

    /**
     * Focuses the given DOM element
     *
     * @param element {Element} DOM element to focus
     */
    focus : function(element)
    {
      // Fixed timing issue with IE, see [BUG #3267]
      if ((qx.core.Environment.get("engine.name") == "mshtml"))
      {
        window.setTimeout(function()
        {
          try {
            // focus element before set cursor position
            element.focus();

            // Fixed cursor position issue with IE, only when nothing is selected.
            // See [BUG #3519] for details.
            var selection = qx.bom.Selection.get(element);
            if (selection.length == 0) {
              var textRange = element.createTextRange();
              textRange.moveStart('character', element.value.length);
              textRange.collapse();
              textRange.select();
            }
          } catch(ex) {}
        }, 0);
      }
      else
      {
        try {
          element.focus();
        } catch(ex) {}
      }

      this.setFocus(element);
      this.setActive(element);
    },

    /**
     * Activates the given DOM element
     *
     * @param element {Element} DOM element to activate
     */
    activate : function(element) {
      this.setActive(element);
    },

    /**
     * Blurs the given DOM element
     *
     * @param element {Element} DOM element to focus
     */
    blur : function(element)
    {
      try {
        element.blur();
      } catch(ex) {}

      if (this.getActive() === element) {
        this.resetActive();
      }

      if (this.getFocus() === element) {
        this.resetFocus();
      }
    },

    /**
     * Deactivates the given DOM element
     *
     * @param element {Element} DOM element to activate
     */
    deactivate : function(element)
    {
      if (this.getActive() === element) {
        this.resetActive();
      }
    },

    /**
     * Tries to activate the given element. This checks whether
     * the activation is allowed first.
     *
     * @param element {Element} DOM element to activate
     */
    tryActivate : function(element)
    {
      var active = this.__findActivatableElement(element);
      if (active) {
        this.setActive(active);
      }
    },

    /*
    ---------------------------------------------------------------------------
      HELPER
    ---------------------------------------------------------------------------
    */

    /**
     * Shorthand to fire events from within this class.
     *
     * @param target {Element} DOM element which is the target
     * @param related {Element} DOM element which is the related target
     * @param type {String} Name of the event to fire
     * @param bubbles {Boolean} Whether the event should bubble
     */
    __fireEvent : function(target, related, type, bubbles)
    {
      var Registration = qx.event.Registration;

      var evt = Registration.createEvent(type, qx.event.type.Focus, [target, related, bubbles]);
      Registration.dispatchEvent(target, evt);
    },

    /*
    ---------------------------------------------------------------------------
      WINDOW FOCUS/BLUR SUPPORT
    ---------------------------------------------------------------------------
    */

    /** @type {Boolean} Whether the window is focused currently */
    _windowFocused : true,

    /**
     * Helper for native event listeners to react on window blur
     */
    __doWindowBlur : function()
    {
      // Omit doubled blur events
      // which is a common behavior at least for gecko based clients
      if (this._windowFocused)
      {
        this._windowFocused = false;
        this.__fireEvent(this._window, null, "blur", false);
      }
    },


    /**
     * Helper for native event listeners to react on window focus
     */
    __doWindowFocus : function()
    {
      // Omit doubled focus events
      // which is a common behavior at least for gecko based clients
      if (!this._windowFocused)
      {
        this._windowFocused = true;
        this.__fireEvent(this._window, null, "focus", false);
      }
    },

    /*
    ---------------------------------------------------------------------------
      NATIVE OBSERVER
    ---------------------------------------------------------------------------
    */

    /**
     * Initializes event listeners.
     *
     * @signature function()
     */
    _initObserver : qx.core.Environment.select("engine.name",
    {
      "gecko" : function()
      {
        // Bind methods
        this.__onNativeFocusWrapper = qx.lang.Function.listener(this.__onNativeFocus, this);
        this.__onNativeBlurWrapper = qx.lang.Function.listener(this.__onNativeBlur, this);

        this.__onNativeDragGestureWrapper = qx.lang.Function.listener(this.__onNativeDragGesture, this);

        // Register events
        qx.event.Registration.addListener(this._document, "pointerdown", this.__onNativePointerDown, this, true);
        qx.event.Registration.addListener(this._document, "pointerup", this.__onNativePointerUp, this, true);

        // Capturing is needed for gecko to correctly
        // handle focus of input and textarea fields
        qx.bom.Event.addNativeListener(this._window, "focus", this.__onNativeFocusWrapper, true);
        qx.bom.Event.addNativeListener(this._window, "blur", this.__onNativeBlurWrapper, true);

        // Capture drag events
        qx.bom.Event.addNativeListener(this._window, "draggesture", this.__onNativeDragGestureWrapper, true);
      },

      "mshtml" : function()
      {
        // Bind methods
        this.__onNativeFocusInWrapper = qx.lang.Function.listener(this.__onNativeFocusIn, this);
        this.__onNativeFocusOutWrapper = qx.lang.Function.listener(this.__onNativeFocusOut, this);

        this.__onNativeSelectStartWrapper = qx.lang.Function.listener(this.__onNativeSelectStart, this);


        // Register events
        qx.event.Registration.addListener(this._document, "pointerdown", this.__onNativePointerDown, this, true);
        qx.event.Registration.addListener(this._document, "pointerup", this.__onNativePointerUp, this, true);

        // MSHTML supports their own focusin and focusout events
        // To detect which elements get focus the target is useful
        // The window blur can detected using focusout and look
        // for the toTarget property which is empty in this case.
        qx.bom.Event.addNativeListener(this._document, "focusin", this.__onNativeFocusInWrapper);
        qx.bom.Event.addNativeListener(this._document, "focusout", this.__onNativeFocusOutWrapper);

        // Add selectstart to prevent selection
        qx.bom.Event.addNativeListener(this._document, "selectstart", this.__onNativeSelectStartWrapper);
      },

      "webkit" : function()
      {
        // Bind methods
        this.__onNativeFocusOutWrapper = qx.lang.Function.listener(this.__onNativeFocusOut, this);

        this.__onNativeFocusWrapper = qx.lang.Function.listener(this.__onNativeFocus, this);
        this.__onNativeBlurWrapper = qx.lang.Function.listener(this.__onNativeBlur, this);

        this.__onNativeSelectStartWrapper = qx.lang.Function.listener(this.__onNativeSelectStart, this);


        // Register events
        qx.event.Registration.addListener(this._document, "pointerdown", this.__onNativePointerDown, this, true);
        qx.event.Registration.addListener(this._document, "pointerup", this.__onNativePointerUp, this, true);

        qx.bom.Event.addNativeListener(this._document, "selectstart", this.__onNativeSelectStartWrapper, false);

        qx.bom.Event.addNativeListener(this._window, "DOMFocusOut", this.__onNativeFocusOutWrapper, true);

        qx.bom.Event.addNativeListener(this._window, "focus", this.__onNativeFocusWrapper, true);
        qx.bom.Event.addNativeListener(this._window, "blur", this.__onNativeBlurWrapper, true);
      },

      "opera" : function()
      {
        // Bind methods
        this.__onNativeFocusInWrapper = qx.lang.Function.listener(this.__onNativeFocusIn, this);
        this.__onNativeFocusOutWrapper = qx.lang.Function.listener(this.__onNativeFocusOut, this);

        // Register events
        qx.event.Registration.addListener(this._document, "pointerdown", this.__onNativePointerDown, this, true);
        qx.event.Registration.addListener(this._document, "pointerup", this.__onNativePointerUp, this, true);

        qx.bom.Event.addNativeListener(this._window, "DOMFocusIn", this.__onNativeFocusInWrapper, true);
        qx.bom.Event.addNativeListener(this._window, "DOMFocusOut", this.__onNativeFocusOutWrapper, true);
      }
    }),

    /**
     * Disconnects event listeners.
     *
     * @signature function()
     */
    _stopObserver : qx.core.Environment.select("engine.name",
    {
      "gecko" : function()
      {
        qx.event.Registration.removeListener(this._document, "pointerdown", this.__onNativePointerDown, this, true);
        qx.event.Registration.removeListener(this._document, "pointerup", this.__onNativePointerUp, this, true);

        qx.bom.Event.removeNativeListener(this._window, "focus", this.__onNativeFocusWrapper, true);
        qx.bom.Event.removeNativeListener(this._window, "blur", this.__onNativeBlurWrapper, true);

        qx.bom.Event.removeNativeListener(this._window, "draggesture", this.__onNativeDragGestureWrapper, true);
      },

      "mshtml" : function()
      {
        qx.event.Registration.removeListener(this._document, "pointerdown", this.__onNativePointerDown, this, true);
        qx.event.Registration.removeListener(this._document, "pointerup", this.__onNativePointerUp, this, true);

        qx.bom.Event.removeNativeListener(this._document, "focusin", this.__onNativeFocusInWrapper);
        qx.bom.Event.removeNativeListener(this._document, "focusout", this.__onNativeFocusOutWrapper);
        qx.bom.Event.removeNativeListener(this._document, "selectstart", this.__onNativeSelectStartWrapper);
      },

      "webkit" : function()
      {
        qx.event.Registration.removeListener(this._document, "pointerdown", this.__onNativePointerDown, this, true);
        qx.event.Registration.removeListener(this._document, "pointerup", this.__onNativePointerUp, this, true);
        qx.bom.Event.removeNativeListener(this._document, "selectstart", this.__onNativeSelectStartWrapper, false);

        qx.bom.Event.removeNativeListener(this._window, "DOMFocusOut", this.__onNativeFocusOutWrapper, true);

        qx.bom.Event.removeNativeListener(this._window, "focus", this.__onNativeFocusWrapper, true);
        qx.bom.Event.removeNativeListener(this._window, "blur", this.__onNativeBlurWrapper, true);
      },

      "opera" : function()
      {
        qx.event.Registration.removeListener(this._document, "pointerdown", this.__onNativePointerDown, this, true);
        qx.event.Registration.removeListener(this._document, "pointerup", this.__onNativePointerUp, this, true);

        qx.bom.Event.removeNativeListener(this._window, "DOMFocusIn", this.__onNativeFocusInWrapper, true);
        qx.bom.Event.removeNativeListener(this._window, "DOMFocusOut", this.__onNativeFocusOutWrapper, true);
      }
    }),

    /*
    ---------------------------------------------------------------------------
      NATIVE LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Native event listener for <code>draggesture</code> event
     * supported by gecko. Used to stop native drag and drop when
     * selection is disabled.
     *
     * @see https://developer.mozilla.org/en-US/docs/Drag_and_Drop
     * @signature function(domEvent)
     * @param domEvent {Event} Native event
     */
    __onNativeDragGesture : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "gecko" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (!this.__isSelectable(target)) {
          qx.bom.Event.preventDefault(domEvent);
        }
      },

      "default" : null
    })),

    /**
     * Native event listener for <code>DOMFocusIn</code> or <code>focusin</code>
     * depending on the client's engine.
     *
     * @signature function(domEvent)
     * @param domEvent {Event} Native event
     */
    __onNativeFocusIn : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(domEvent)
      {
        // Force window focus to be the first
        this.__doWindowFocus();

        // Update internal data
        var target = qx.bom.Event.getTarget(domEvent);

        // IE focusin is also fired on elements which are not focusable at all
        // We need to look up for the next focusable element.
        var focusTarget = this.__findFocusableElement(target);
        if (focusTarget) {
          this.setFocus(focusTarget);
        }

        // Make target active
        this.tryActivate(target);
      },

      "opera" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (target == this._document || target == this._window)
        {
          this.__doWindowFocus();

          if (this.__previousFocus)
          {
            this.setFocus(this.__previousFocus);
            delete this.__previousFocus;
          }

          if (this.__previousActive)
          {
            this.setActive(this.__previousActive);
            delete this.__previousActive;
          }
        }
        else
        {
          this.setFocus(target);
          this.tryActivate(target);

          // Clear selection
          if (!this.__isSelectable(target))
          {
            target.selectionStart = 0;
            target.selectionEnd = 0;
          }
        }
      },

      "default" : null
    })),

    /**
     * Native event listener for <code>DOMFocusOut</code> or <code>focusout</code>
     * depending on the client's engine.
     *
     * @signature function(domEvent)
     * @param domEvent {Event} Native event
     */
    __onNativeFocusOut : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(domEvent)
      {
        var relatedTarget = qx.bom.Event.getRelatedTarget(domEvent);

        // If the focus goes to nowhere (the document is blurred)
        if (relatedTarget == null)
        {
          // Update internal representation
          this.__doWindowBlur();

          // Reset active and focus
          this.resetFocus();
          this.resetActive();
        }
      },

      "webkit" : function(domEvent)
      {
        var relatedTarget = qx.bom.Event.getRelatedTarget(domEvent);

        if (relatedTarget == null) {
          var target = qx.bom.Event.getTarget(domEvent);
          if (target === this.getFocus()) {
            this.resetFocus();
          }

          if (target === this.getActive()) {
            this.resetActive();
          }
        }
      },

      "opera" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (target == this._document)
        {
          this.__doWindowBlur();

          // Store old focus/active elements
          // Opera do not fire focus events for them
          // when refocussing the window (in my opinion an error)
          this.__previousFocus = this.getFocus();
          this.__previousActive = this.getActive();

          this.resetFocus();
          this.resetActive();
        }
        else
        {
          if (target === this.getFocus()) {
            this.resetFocus();
          }

          if (target === this.getActive()) {
            this.resetActive();
          }
        }
      },

      "default" : null
    })),

    /**
     * Native event listener for <code>blur</code>.
     *
     * @signature function(domEvent)
     * @param domEvent {Event} Native event
     */
    __onNativeBlur : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "gecko" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (target === this._window || target === this._document)
        {
          this.__doWindowBlur();
          this.resetActive();
          this.resetFocus();
        }
      },

      "webkit" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (target === this._window || target === this._document)
        {
          this.__doWindowBlur();

          // Store old focus/active elements
          // Opera do not fire focus events for them
          // when refocussing the window (in my opinion an error)
          this.__previousFocus = this.getFocus();
          this.__previousActive = this.getActive();

          this.resetActive();
          this.resetFocus();
        }
      },

      "default" : null
    })),

    /**
     * Native event listener for <code>focus</code>.
     *
     * @signature function(domEvent)
     * @param domEvent {Event} Native event
     */
    __onNativeFocus : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "gecko" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);

        if (target === this._window || target === this._document)
        {
          this.__doWindowFocus();

          // Always speak of the body, not the window or document
          target = this._body;
        }

        this.setFocus(target);
        this.tryActivate(target);
      },

      "webkit" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (target === this._window || target === this._document)
        {
          this.__doWindowFocus();

          if (this.__previousFocus)
          {
            this.setFocus(this.__previousFocus);
            delete this.__previousFocus;
          }

          if (this.__previousActive)
          {
            this.setActive(this.__previousActive);
            delete this.__previousActive;
          }
        }
        else
        {
          this.setFocus(target);
          this.tryActivate(target);
        }
      },

      "default" : null
    })),

    /**
     * Event listener for <code>pointerdown</code>.
     *
     * @signature function(event)
     * @param event {qx.event.type.Pointer} Pointer event
     */
    __onNativePointerDown : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(event)
      {
        var target = event.getTarget();

        // Stop events when no focus element available (or blocked)
        var focusTarget = this.__findFocusableElement(target);
        if (focusTarget)
        {
          // Add unselectable to keep selection
          if (!this.__isSelectable(target))
          {
            // The element is not selectable. Block selection.
            target.unselectable = "on";

            // Unselectable may keep the current selection which
            // is not what we like when changing the focus element.
            // So we clear it
            try {
              document.selection.empty();
            } catch (ex) {
              // ignore 'Unknown runtime error'
            }

            // The unselectable attribute stops focussing as well.
            // Do this manually.
            try {
              focusTarget.focus();
            } catch (ex) {
              // ignore "Can't move focus of this control" error
            }
          }
        }
        else
        {
          // Stop event for blocking support
          event.preventDefault();

          // Add unselectable to keep selection
          if (!this.__isSelectable(target)) {
            target.unselectable = "on";
          }
        }
      },

      "webkit|gecko" : function(event) {
        var target = event.getTarget();
        var focusTarget = this.__findFocusableElement(target);

        if (focusTarget) {
          // do not rely on the native focus for mobile safari
          var old = this.getFocus();
          if (old !== focusTarget) {
            if (old) {
              old.blur();
            }
            focusTarget.focus();
            this.setFocus(focusTarget);
          }
        } else {
          event.preventDefault();
        }
      },

      "opera" : function(event)
      {
        var target = event.getTarget();
        var focusTarget = this.__findFocusableElement(target);

        if (!this.__isSelectable(target)) {
          // Prevent the default action for all non-selectable
          // targets. This prevents text selection and context menu.
          event.preventDefault();

          // The stopped event keeps the selection
          // of the previously focused element.
          // We need to clear the old selection.
          if (focusTarget)
          {
            var current = this.getFocus();
            if (current && current.selectionEnd)
            {
              current.selectionStart = 0;
              current.selectionEnd = 0;
              current.blur();
            }

            // The prevented event also stop the focus, do
            // it manually if needed.
            if (focusTarget) {
              this.setFocus(focusTarget);
            }
          }
        } else if (focusTarget) {
          this.setFocus(focusTarget);
        }
      },

      "default" : null
    })),


    /**
     * Event listener for <code>pointerup</code>.
     *
     * @signature function(event)
     * @param event {qx.event.type.Pointer} Pointer event
     */
    __onNativePointerUp : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(event)
      {
        var target = event.getTarget();
        if (target.unselectable) {
          target.unselectable = "off";
        }

        this.tryActivate(this.__fixFocus(target));
      },

      "gecko" : function(event)
      {
        // As of Firefox 3.0:
        // Gecko fires mouseup on XUL elements
        // We only want to deal with real HTML elements
        var target = event.getTarget();
        while (target && target.offsetWidth === undefined) {
          target = target.parentNode;
        }

        if (target) {
          this.tryActivate(target);
        }

      },

      "webkit|opera" : function(event)
      {
        var target = event.getTarget();
        this.tryActivate(this.__fixFocus(target));
      },

      "default" : null
    })),


    /**
     * Fix for bug #2602.
     *
     * @signature function(target)
     * @param target {Element} target element from pointer up event
     * @return {Element} Element to activate;
     */
    __fixFocus : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "mshtml|webkit" : function(target)
      {
        var focusedElement = this.getFocus();
        if (focusedElement && target != focusedElement &&
            (focusedElement.nodeName.toLowerCase() === "input" ||
            focusedElement.nodeName.toLowerCase() === "textarea")) {
          target = focusedElement;
        }

        return target;
      },

      "default" : function(target) {
        return target;
      }
    })),

    /**
     * Native event listener for <code>selectstart</code>.
     *
     *@signature function(domEvent)
     * @param domEvent {Event} Native event
     */
    __onNativeSelectStart : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "mshtml|webkit" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (!this.__isSelectable(target)) {
          qx.bom.Event.preventDefault(domEvent);
        }
      },

      "default" : null
    })),

    /*
    ---------------------------------------------------------------------------
      HELPER METHODS
    ---------------------------------------------------------------------------
    */

    /**
     * Whether the given element is focusable. This is perfectly modeled to the
     * browsers behavior and this way may differ in the various clients.
     *
     * @param el {Element} DOM Element to query
     * @return {Boolean} Whether the element is focusable
     */
    __isFocusable : function(el)
    {
      var index = qx.bom.element.Attribute.get(el, "tabIndex");
      if (index >= 1) {
        return true;
      }

      var focusable = qx.event.handler.Focus.FOCUSABLE_ELEMENTS;
      if (index >= 0 && focusable[el.tagName]) {
        return true;
      }

      return false;
    },


    /**
     * Returns the next focusable parent element of an activated DOM element.
     *
     * @param el {Element} Element to start lookup with.
     * @return {Element|null} The next focusable element.
     */
    __findFocusableElement : function(el)
    {
      while (el && el.nodeType === 1)
      {
        if (el.getAttribute("qxKeepFocus") == "on") {
          return null;
        }

        if (this.__isFocusable(el)) {
          return el;
        }

        el = el.parentNode;
      }

      // This should be identical to the one which is selected when
      // clicking into an empty page area. In mshtml this must be
      // the body of the document.
      return this._body;
    },

    /**
     * Returns the next activatable element. May be the element itself.
     * Works a bit different than the method {@link #__findFocusableElement}
     * as it looks up for a parent which is has a keep focus flag. When
     * there is such a parent it returns null otherwise the original
     * incoming element.
     *
     * @param el {Element} Element to start lookup with.
     * @return {Element} The next activatable element.
     */
    __findActivatableElement : function(el)
    {
      var orig = el;

      while (el && el.nodeType === 1)
      {
        if (el.getAttribute("qxKeepActive") == "on") {
          return null;
        }

        el = el.parentNode;
      }

      return orig;
    },

    /**
     * Whether the given el (or its content) should be selectable
     * by the user.
     *
     * @param node {Element} Node to start lookup with
     * @return {Boolean} Whether the content is selectable.
     */
    __isSelectable : function(node)
    {
      while(node && node.nodeType === 1)
      {
        var attr = node.getAttribute("qxSelectable");
        if (attr != null) {
          return attr === "on";
        }

        node = node.parentNode;
      }

      return true;
    },

    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // apply routine
    _applyActive : function(value, old)
    {
      // Fire events
      if (old) {
        this.__fireEvent(old, value, "deactivate", true);
      }

      if (value) {
        this.__fireEvent(value, old, "activate", true);
      }
      // correct scroll position for iOS 7
      window.scrollTo(0, 0);
    },

    // apply routine
    _applyFocus : function(value, old)
    {
      // Fire bubbling events
      if (old) {
        this.__fireEvent(old, value, "focusout", true);
      }

      if (value) {
        this.__fireEvent(value, old, "focusin", true);
      }

      // Fire after events
      if (old) {
        this.__fireEvent(old, value, "blur", false);
      }

      if (value) {
        this.__fireEvent(value, old, "focus", false);
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
    this._stopObserver();
    this._manager = this._window = this._document = this._root = this._body = null;
  },

  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics)
  {
    qx.event.Registration.addHandler(statics);

    // For faster lookups generate uppercase tag names dynamically
    var focusable = statics.FOCUSABLE_ELEMENTS;
    for (var entry in focusable) {
      focusable[entry.toUpperCase()] = 1;
    }
  }
});