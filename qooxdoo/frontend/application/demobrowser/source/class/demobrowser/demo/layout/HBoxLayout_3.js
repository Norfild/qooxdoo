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
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

qx.Class.define("demobrowser.demo.layout.HBoxLayout_3",
{
  extend : qx.application.Standalone,

  members :
  {
    main: function()
    {
      this.base(arguments);

      // auto width + reversed
      var box1 = (new qx.ui.core.Widget).set({decorator: "black", backgroundColor: "yellow", height: 80});
      var layout1 = new qx.ui.layout.HBox();

      layout1.setReversed(true);
      layout1.setSpacing(5);

      var w1 = (new qx.ui.core.Widget).set({decorator: "black", backgroundColor: "blue", maxHeight:60});
      var w2 = (new qx.ui.core.Widget).set({decorator: "black", backgroundColor: "green", maxHeight:60});
      var w3 = (new qx.ui.core.Widget).set({decorator: "black", backgroundColor: "grey", maxHeight:60});

      layout1.add(w1, { align : "top" });
      layout1.add(w2, { align : "middle" });
      layout1.add(w3, { align : "bottom" });

      box1.setLayout(layout1);
      this.getRoot().add(box1, 10, 10);
    }
  }
});
