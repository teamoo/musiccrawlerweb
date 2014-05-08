(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages\circular-progress\template.circular_progress.js                                              //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
                                                                                                         // 1
Template.__define__("circularProgress", (function() {                                                    // 2
  var self = this;                                                                                       // 3
  var template = this;                                                                                   // 4
  return HTML.DIV({                                                                                      // 5
    "class": function() {                                                                                // 6
      return Spacebars.mustache(self.lookup("outerDivClass"));                                           // 7
    }                                                                                                    // 8
  }, "\n        ", HTML.DIV({                                                                            // 9
    id: "svg-progress-container",                                                                        // 10
    "class": function() {                                                                                // 11
      return Spacebars.mustache(self.lookup("innerDivClass"));                                           // 12
    }                                                                                                    // 13
  }), "\n    ");                                                                                         // 14
}));                                                                                                     // 15
                                                                                                         // 16
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages\circular-progress\circular_progress.js                                                       //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Template.circularProgress.rendered = function() {                                                        // 1
                                                                                                         // 2
    // parametrizable options                                                                            // 3
    // CSS classes used: progress-outer, progress-inner, progress-text                                   // 4
    if (!this.data)                                                                                      // 5
        this.data = {}                                                                                   // 6
    var textPadding = this.data.textPadding || 0;                                                        // 7
    var outerPadding = this.data.outerPadding || 20;                                                     // 8
    var canvasSize = this.data.canvasSize || 300;                                                        // 9
    var spacer = this.data.spacer || 5;                                                                  // 10
    var arcWidth = this.data.arcWidth || 10;                                                             // 11
    var sessionValueKey = this.data.sessionValueKey || 'progressPercent';                                // 12
    var sessionTextKey = this.data.sessionTextKey || 'progressText';                                     // 13
    var borderClass = this.data.borderClass || 'progress-border';                                        // 14
    var progressClass = this.data.progressClass || 'progress-circular-bar';                              // 15
    var textClass = this.data.textClass || 'progress-text';                                              // 16
    var tweenDuration = this.data.tweenDuration || 750;                                                  // 17
                                                                                                         // 18
    // internal variables                                                                                // 19
    var pi = Math.PI;                                                                                    // 20
    var midPoint = canvasSize/2;                                                                         // 21
    var circleRadius = (canvasSize/2) - outerPadding;                                                    // 22
    var outerRadius = circleRadius - spacer;                                                             // 23
    var innerRadius = outerRadius - arcWidth;                                                            // 24
    var center = midPoint.toString()+','+midPoint.toString();                                            // 25
    var svg = d3.select('#svg-progress-container').append('svg')                                         // 26
                .attr('width', canvasSize)                                                               // 27
                .attr('height', canvasSize);                                                             // 28
                                                                                                         // 29
    var lineHeight = $('#svg-progress-container').css('line-height').split('px')[0];                     // 30
    var fontSize = $('#svg-progress-container').css('font-size').split('px')[0];                         // 31
                                                                                                         // 32
    var maxCharCount = Math.floor((2*innerRadius) / (fontSize / 2) - textPadding);                       // 33
                                                                                                         // 34
    // append the outer circle                                                                           // 35
                                                                                                         // 36
    svg.append('circle')                                                                                 // 37
        .attr('cx',midPoint)                                                                             // 38
        .attr('cy',midPoint)                                                                             // 39
        .attr('r',circleRadius)                                                                          // 40
        .attr('fill', 'none')                                                                            // 41
        .attr('stroke-width', 1)                                                                         // 42
        .attr('stroke','#aaa')                                                                           // 43
        .attr('class',borderClass);                                                                      // 44
                                                                                                         // 45
    // same as above, create the arc without the end angle, since we don't know it yet                   // 46
                                                                                                         // 47
    var arc = d3.svg.arc()                                                                               // 48
                .innerRadius(innerRadius)                                                                // 49
                .outerRadius(outerRadius)                                                                // 50
                .startAngle(0*(pi/180));                                                                 // 51
                                                                                                         // 52
    var progressBar = svg.append('path')                                                                 // 53
                        .datum({endAngle: 0*(pi/180)})                                                   // 54
                        .attr('d', arc)                                                                  // 55
                        .attr('fill', 'green')                                                           // 56
                        .attr('class', progressClass)                                                    // 57
                        .attr('transform', 'translate('+center+')');                                     // 58
                                                                                                         // 59
    // function to enable moving the end angle back and forth as needed, using the same arc              // 60
                                                                                                         // 61
    var arcTween = function (transition, newAngle) {                                                     // 62
        transition.attrTween("d", function(d) {                                                          // 63
            var interpolate = d3.interpolate(d.endAngle, newAngle);                                      // 64
            return function(t) {                                                                         // 65
              d.endAngle = interpolate(t);                                                               // 66
              return arc(d);                                                                             // 67
          };                                                                                             // 68
      });                                                                                                // 69
    }                                                                                                    // 70
                                                                                                         // 71
    // function transform a string into an variable-length array of words, based on a given char count   // 72
                                                                                                         // 73
    var wordWrap = function(str, charCount) {                                                            // 74
        charCount = charCount || 50;                                                                     // 75
        cut = cut || false;                                                                              // 76
        var regex = '.{1,' +charCount+ '}(\\s|$)' + (cut ? '|.{' +charCount+ '}|.+$' : '|\\S+?(\\s|$)'); // 77
        return str.match(RegExp(regex,'g')) || [];                                                       // 78
    };                                                                                                   // 79
                                                                                                         // 80
    // set up the reactive animation                                                                     // 81
                                                                                                         // 82
    Deps.autorun(function() {                                                                            // 83
        var percent = Session.get(sessionValueKey) || 0;                                                 // 84
        var radians = (percent/100*360) * (pi/180);                                                      // 85
        progressBar.transition()                                                                         // 86
            .duration(tweenDuration)                                                                     // 87
            .call(arcTween, radians);                                                                    // 88
    });                                                                                                  // 89
                                                                                                         // 90
    // set up the reactive text                                                                          // 91
                                                                                                         // 92
    Deps.autorun(function() {                                                                            // 93
        var text = Session.get(sessionTextKey) || '';                                                    // 94
        var wrapText = wordWrap(text, maxCharCount);                                                     // 95
        var startPoint = midPoint - (fontSize * wrapText.length / 2);                                    // 96
        d3.selectAll('#svg-progress-container text').remove();                                           // 97
        for (var i = 0; i < wrapText.length; i++) {                                                      // 98
            svg.append('text')                                                                           // 99
                .attr('x', midPoint)                                                                     // 100
                .attr('y', startPoint + (i * lineHeight))                                                // 101
                .attr('class', textClass)                                                                // 102
                .attr('text-anchor', 'middle')                                                           // 103
                .text(wrapText[i]);                                                                      // 104
        };                                                                                               // 105
    });                                                                                                  // 106
}                                                                                                        // 107
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
