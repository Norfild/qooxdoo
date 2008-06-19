window.qxloader =
{
  parts : %PARTS%,
  uris : %URIS%,
  boot : %BOOT%,

  runningParts : {},
  loadedParts : {},
  runningPackages : {},
  loadedPackages : {},
  runningScripts : {},
  loadedScripts : {},

  //Maps part names to array of callback descriptor structures. One structure for each 
  //callback interested in events for the part with given name.
  __callbacksByPartname : {},

  scriptQueue : [],
  inFlushQueue : false,


  // Simple log wrapper
  _log : function(msg, type)
  {
    if (window.qxvariants && qxvariants["qx.debug"] == "off") {
      return;
    }

    if (window.qx && qx.core && qx.core.Variant && qx.core.Variant.get("qx.debug") == "off") {
      return;
    }

    if (!type) {
      type = "debug";
    }

    if (window.qx && qx.core && qx.core.Log) {
      return qx.core.Log[type](msg);
    }

    if (window.console && console[type]) {
      console[type](msg);
    }
  },


  // Main method to manage part loading
  // see qx.core.Package.loadPart() for details
  loadPart : function(name, callback, self)
  {
    if (callback && !self) {
      self = window;
    }

    if (this.parts[name]==null)
    {
      this._log("No such part: " + name, "warn");

      if (callback) {
        callback.call(self);
      }

      return;
    }

    if (this.loadedParts[name])
    {
      // this._log("Part " + name + " is already loaded...");
      if (callback) {
        callback.call(self);
      }

      return;
    }

    if (this.runningParts[name])
    {
      this._log("The part " + name + " is already in loading state... checking callback");

      if (callback)
      {
        for (var i=0, a=this.__getCallbacksForPart(name), l=a.length; i<l; i++)
        {          
          if (a[i].callback == callback && a[i].self == self)
          {
            this._log("Callback is already registered.");
            return;
          }
        }

        // this._log("Registering callback");
        this.__getCallbacksForPart(name).push({
          callback : callback,
          self : self || null
        });
      }

      return;
    }

    this.runningParts[name] = true;

    this._log("Loading part " + name + "...");

    var pkgs = this.parts[name];
    var pkg;
    var uris;
    var scripts = [];

    for (var i=0; i<pkgs.length; i++)
    {
      pkg = pkgs[i];

      if (this.loadedPackages[pkg])
      {
        // this._log("Package: " + pkg + " is already loaded...");
        continue;
      }

      if (this.runningPackages[pkg]) {
        continue;
      }

      // this._log("Loading package: " + pkg);
      this.runningPackages[pkg] = true;

      uris = this.uris[pkg];
      // this._log("Queueing " + uris.length + " files");
      this.scriptQueue.push.apply(this.scriptQueue, uris);
    }



    if (this.scriptQueue.length == 0)
    {
      this.loadedParts[name] = true;

      if (callback) {
        self ? callback.call(self) : callback();
      }

      return;
    }

    if (callback)
    {
      // this._log("Registering callback");
      this.__getCallbacksForPart(name).push({
        callback : callback,
        self : self || null
      });
    }

    if (!this.inFlushQueue) {
      this._flushQueue();
    }
  },


  _flushQueue : function()
  {
    this.inFlushQueue = true;

    var queue = this.scriptQueue;

    // Queue empty?
    if (queue.length == 0)
    {
      // this._log("Queue flushed successfully!");

      // Move running packages to loaded packages
      for (var pkg in this.runningPackages)
      {
        // this._log("Package " + pkg + " successfully loaded");
        this.loadedPackages[pkg] = true;
      }
      this.runningPackages = {};

      for (var part in this.runningParts)
      {
        this._log("Part " + part + " successfully loaded");
        this.loadedParts[part] = true;
      }
      this.runningParts = {};

      // Clear flag
      this.inFlushQueue = false;

      // Execute callbacks
      var callbacks = this.__getCallbacksForPart(part).concat();
      delete this.__callbacksByPartname[part];
      for (var i=0, l=callbacks.length; i<l; i++) {
        callbacks[i].callback.call(callbacks[i].self);
      }

      // Is this the boot module? => start init process
      if (part == this.boot && this._pageLoaded && window.qx && qx.core && qx.core.Init) {
        qx.core.Init.getInstance()._onload();
      }

      // Finally return
      return;
    }

    // Load next script
    var next = queue.shift();

    this.loadScript(next, this._flushQueue, this);
  },

  // see qx.core.Package.loadScript() for details
  loadScript : function(uri, callback, self)
  {
    if (callback && !self) {
      self = window;
    }

    if (this.loadedScripts[uri])
    {
      // this._log("Script is already loaded: " + uri);

      if (callback) {
        callback.call(self);
      }

      return;
    }

    // This needs a better implementation!
    if (this.runningScripts[uri]) {
      throw new Error("Script is already loading.");
    }

    this.runningScripts[uri] = true;

    var head = document.getElementsByTagName("head")[0];
    var elem = document.createElement("script");

    elem.charset = "utf-8";
    elem.src = uri;

    // Assign listener
    elem.onreadystatechange = elem.onload = function()
    {
      if (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")
      {
        // Remove listeners (mem leak prevention)
        elem.onreadystatechange = elem.onload = null;

        // Remember
        delete qxloader.runningScripts[uri];
        qxloader.loadedScripts[uri] = true;

        // Execute callback
        if (callback) {
          callback.call(self);
        }
      }
    };

    head.appendChild(elem);
  },


  _pageLoad : function()
  {
    qxloader._pageLoaded = true;

    if (window.addEventListener) {
      window.removeEventListener("load", qxloader._pageLoad, false);
    } else {
      window.detachEvent("onload", qxloader._pageLoad);
    }
  },

  /**
   * Returns the array holding callbacks interested in events for part with given name.
   * Array may be modified and is guaranteed not be null (if unknown / new part name
   * is given, an empty array will be created and returned).
   * 
   * @param {String} part name
   * @return {Map[]} array of callback descriptor structures 
   * 
   */
  __getCallbacksForPart : function(partName)   
  {
    var array = this.__callbacksByPartname[partName];
    if (array == null){
      array = [];
      this.__callbacksByPartname[partName] = array;
    }
    return array;
  },


  init : function() {
    this.loadPart(this.boot);
  }
};

if (window.addEventListener) {
  window.addEventListener("load", qxloader._pageLoad, false);
} else {
  window.attachEvent("onload", qxloader._pageLoad);
}

qxloader.init();
