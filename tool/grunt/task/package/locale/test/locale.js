/* *****************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2014 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Richard Sternagel (rsternagel)

***************************************************************************** */

'use strict';

module.exports = {
  setUp: function(done) {
    this.locale = require('../lib/locale.js');
    done();
  },

  getTailoredCldrData : function (test) {
    var cldrData = this.locale.getTailoredCldrData('en');
    var expectedKeys = [
      'quotationStart',
      'quotationEnd',
      'alternateQuotationStart',
      'alternateQuotationEnd',
      'cldr_time_format_full',
      'cldr_time_format_long',
      'cldr_time_format_medium',
      'cldr_time_format_short',
      'cldr_date_format_full',
      'cldr_date_format_long',
      'cldr_date_format_medium',
      'cldr_date_format_short',
      'cldr_date_time_format_EHm',
      'cldr_date_time_format_EHms',
      'cldr_date_time_format_Ed',
      'cldr_date_time_format_Ehm',
      'cldr_date_time_format_Ehms',
      'cldr_date_time_format_Gy',
      'cldr_date_time_format_GyMMM',
      'cldr_date_time_format_GyMMMEd',
      'cldr_date_time_format_GyMMMd',
      'cldr_date_time_format_H',
      'cldr_date_time_format_Hm',
      'cldr_date_time_format_Hms',
      'cldr_date_time_format_M',
      'cldr_date_time_format_MEd',
      'cldr_date_time_format_MMM',
      'cldr_date_time_format_MMMEd',
      'cldr_date_time_format_MMMd',
      'cldr_date_time_format_Md',
      'cldr_date_time_format_d',
      'cldr_date_time_format_h',
      'cldr_date_time_format_hm',
      'cldr_date_time_format_hms',
      'cldr_date_time_format_ms',
      'cldr_date_time_format_y',
      'cldr_date_time_format_yM',
      'cldr_date_time_format_yMEd',
      'cldr_date_time_format_yMMM',
      'cldr_date_time_format_yMMMEd',
      'cldr_date_time_format_yMMMd',
      'cldr_date_time_format_yMd',
      'cldr_date_time_format_yQQQ',
      'cldr_date_time_format_yQQQQ',
      'cldr_day_format_abbreviated_sun',
      'cldr_day_format_abbreviated_mon',
      'cldr_day_format_abbreviated_tue',
      'cldr_day_format_abbreviated_wed',
      'cldr_day_format_abbreviated_thu',
      'cldr_day_format_abbreviated_fri',
      'cldr_day_format_abbreviated_sat',
      'cldr_day_format_wide_sun',
      'cldr_day_format_wide_mon',
      'cldr_day_format_wide_tue',
      'cldr_day_format_wide_wed',
      'cldr_day_format_wide_thu',
      'cldr_day_format_wide_fri',
      'cldr_day_format_wide_sat',
      'cldr_day_format_short_sun',
      'cldr_day_format_short_mon',
      'cldr_day_format_short_tue',
      'cldr_day_format_short_wed',
      'cldr_day_format_short_thu',
      'cldr_day_format_short_fri',
      'cldr_day_format_short_sat',
      'cldr_day_stand-alone_narrow_sun',
      'cldr_day_stand-alone_narrow_mon',
      'cldr_day_stand-alone_narrow_tue',
      'cldr_day_stand-alone_narrow_wed',
      'cldr_day_stand-alone_narrow_thu',
      'cldr_day_stand-alone_narrow_fri',
      'cldr_day_stand-alone_narrow_sat',
      'cldr_month_format_abbreviated_1',
      'cldr_month_format_abbreviated_2',
      'cldr_month_format_abbreviated_3',
      'cldr_month_format_abbreviated_4',
      'cldr_month_format_abbreviated_5',
      'cldr_month_format_abbreviated_6',
      'cldr_month_format_abbreviated_7',
      'cldr_month_format_abbreviated_8',
      'cldr_month_format_abbreviated_9',
      'cldr_month_format_abbreviated_10',
      'cldr_month_format_abbreviated_11',
      'cldr_month_format_abbreviated_12',
      'cldr_month_format_wide_1',
      'cldr_month_format_wide_2',
      'cldr_month_format_wide_3',
      'cldr_month_format_wide_4',
      'cldr_month_format_wide_5',
      'cldr_month_format_wide_6',
      'cldr_month_format_wide_7',
      'cldr_month_format_wide_8',
      'cldr_month_format_wide_9',
      'cldr_month_format_wide_10',
      'cldr_month_format_wide_11',
      'cldr_month_format_wide_12',
      'cldr_month_stand-alone_narrow_1',
      'cldr_month_stand-alone_narrow_2',
      'cldr_month_stand-alone_narrow_3',
      'cldr_month_stand-alone_narrow_4',
      'cldr_month_stand-alone_narrow_5',
      'cldr_month_stand-alone_narrow_6',
      'cldr_month_stand-alone_narrow_7',
      'cldr_month_stand-alone_narrow_8',
      'cldr_month_stand-alone_narrow_9',
      'cldr_month_stand-alone_narrow_10',
      'cldr_month_stand-alone_narrow_11',
      'cldr_month_stand-alone_narrow_12',
      'cldr_number_decimal_separator',
      'cldr_number_group_separator',
      'cldr_number_percent_format',
      'cldr_pm',
      'cldr_am'
    ];

    test.deepEqual(Object.keys(cldrData), expectedKeys);
    test.done();
  }
};
