'use strict';

module.exports = function(conditions){
  var options = {};

  rowQuery(options);
  sortQuery(options);
  startQuery(options);

  return options;

  function rowQuery(){
    var rows = parseInt(conditions.limit, 10);

    if (isNaN(rows)) return;

    options.maxRows = rows;
  }

  // comes in as:
  // { order: ['propertyName <ASC|DESC>', 'propertyName <ASC|DESC>',...] }
  function sortQuery(){
    if (!conditions.order) conditions.order = "id ASC";

    if (conditions.order.constructor === String){
      if (conditions.order.indexOf(" ") === -1){
        // if no direction provided, default to ascending direction
        conditions.order = [ conditions.order, "ASC" ].join(" ");
      }

      conditions.order = [ conditions.order ];
    }

    if (conditions.order.constructor !== Array)  return;

    var sort = [];

    var specComponents;
    var validDirections = [ "asc", "desc" ];

    conditions.order.forEach(function(orderSpec){
      specComponents = orderSpec.split(" ");

      // exclude invalid directions
      if (validDirections.indexOf(specComponents[1].toLowerCase()) === -1) return;

      sort.push(orderSpec);
    });

    options.sortField = sort.join(", ");
  }

  function startQuery(){
    var start = parseInt(conditions.skip, 10);

    if (isNaN(start)) return;

    options.start = start;
  }
};
