var pos = Number(window.location.href.substring(window.location.href.lastIndexOf("/")+1, window.location.href.length-5));
var tnpos = pos + 1;
var tppos = pos - 1;

if (tnpos < 10)
  tnpos = String("000" + tnpos)
else if (tnpos < 100)
  tnpos = String("00" + tnpos)
else if (tnpos < 1000)
  tnpos = String("0" + tnpos)
else
  tnpos = String(tnpos)

if (tppos < 10)
  tppos = String("000" + tppos)
else if (tppos < 100)
  tppos = String("00" + tppos)
else if (tppos < 1000)
  tppos = String("0" + tppos)
else
  tppos = String(tppos)


document.write('<div id="testHead">qooxdoo: <span>The new era of web interface development</span></div>');
document.write('<div id="testDebug"></div>');
document.write('<div id="testFrame"></div>');
document.write('<div id="testFoot">');
//document.write('[<a href="' + tppos + '.html">Previous</a>|<a href="' + tnpos + '.html">Next</a>] &#160;');
document.write('[<a href="javascript:void(window.application.dispose())">Dispose</a>] &#160;');

if( /\/source\//.test(window.location.href) ) {
  document.write('[<a href="javascript:void(window.location.href=window.location.href.replace(/\\/source\\//, \'\\/public\\/\'))">Public</a>] &#160;');
} else {
document.write('[<a href="javascript:void(window.location.href=window.location.href.replace(/\\/public\\//, \'\\/source\\/\'))">Source</a>] &#160;');
}

if( /\/developer\//.test(window.location.href) ) {
  document.write('[<a href="../user/Index.html">User</a>]');
} else {
  document.write('[<a href="../developer/Index.html">Developer</a>]');
}
document.write('</div>');

function showTestFiles() {

  var str = usrstr;;
  if( window.location.href.search(/\/developer\//)+1 ) {
    str = devstr;
  }

  var arr = str.split(" ");

  document.writeln('<select id="testFiles" onchange="window.location.href=this.options[this.selectedIndex].value">');
  for( var i=1; i<arr.length; i++ ) {
    document.write('<option value="' + arr[i] + '"');
    if( window.location.href.search( new RegExp(arr[i]) )+1 ) {
      document.write(' selected="selected"');
    }
    document.writeln('>' + arr[i].replace(/_/g, " ").replace(/\.html/, "") + '</option>');
  }
  document.writeln('</select>');

}
var devstr = " Application_1.html Atom_1.html Atom_2.html Atom_3.html Auto_Dimensions_1.html Auto_Dimensions_2.html Auto_Dimensions_3.html Auto_Dimensions_4.html Auto_Dimensions_5.html Auto_Dimensions_6.html Clone_1.html Clone_2.html Cross_Browser_1.html Cross_Browser_2.html Data_Handling_1.html Event_Manager_1.html Event_Manager_2.html Focus_Manager_1.html Focus_Manager_2.html Index.html Inline_1.html Overflow_Handling_1.html Popups_1.html Positioning_1.html Widget_2.html Widget_3.html Widget_6.html Widget_7.html Widget_8.html Widget_9.html";
var usrstr = " Atom_1.html Atom_2.html Bar_Selector_1.html Border_1.html Button_1.html Checkbox_1.html Combobox_1.html Drag_And_Drop_1.html Enabled_Disabled_1.html Fieldset_1.html Focus_Manager_1.html Iframe_1.html Image_1.html Index.html List_1.html Listview_1.html Menu_1.html Radiobutton_1.html Tabs_1.html Toolbar_1.html Toolbar_2.html Tooltips_1.html Tree_1.html Widget_1.html";
showTestFiles();
