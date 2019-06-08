// set the dimensions and margins of the graph
var svgWidth = window.innerWidth * .5;
var svgHeight = window.innerHeight * .5;

var margin = {
  top: 100,
  right: 100,
  bottom: 100,
  left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "poverty";
var chosenYAxis = "healthcare";

// function used for updating x-scale var upon click on axis label
function xScale(stateData, chosenXAxis) {
  // create scales
  if (chosenXAxis != "income"){
    var xLinearScale = d3.scaleLinear()
    // .domain(d3.extent(stateData, d => d[chosenXAxis]))
    .domain([d3.min(stateData, d => d[chosenXAxis])-1,d3.max(stateData, d => d[chosenXAxis])+1]) //this makes a buffer so circles are not on the edge of the graph
    .range([0, width]);
  } else {
    var xLinearScale = d3.scaleLinear()
    // .domain(d3.extent(stateData, d => d[chosenXAxis]))
    .domain([d3.min(stateData, d => d[chosenXAxis])-10000,d3.max(stateData, d => d[chosenXAxis])+10000])
    .range([0, width]);
  }


  return xLinearScale;

}

function yScale(stateData, chosenYAxis) {
  // create scales
  var yLinearScale = d3.scaleLinear()
    // .domain(d3.extent(stateData, d => d[chosenYAxis]))
    .domain([d3.min(stateData, d => d[chosenYAxis])-1,d3.max(stateData, d => d[chosenYAxis])+1])
    .range([height,0]);

  return yLinearScale;

}

// function used for updating axes var upon click on axis label
function renderXAxis(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

function renderYAxis(newYScale,yAxis) {
  var leftAxis = d3.axisLeft(newYScale);

    yAxis.transition()
    .duration(1000)
    .call(leftAxis);

  return yAxis;
}

function trendlineAdd(data) {
  console.log(data);
  // returns slope, intercept and r-square of the line
      function leastSquares(xSeries, ySeries) {
        var reduceSumFunc = function(prev, cur) { return prev + cur; };
        
        var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
        var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;
    
        var ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
          .reduce(reduceSumFunc);
        
        var ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
          .reduce(reduceSumFunc);
          
        var ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); })
          .reduce(reduceSumFunc);
          
        var slope = ssXY / ssXX;
        var intercept = yBar - (xBar * slope);
        var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);
        
        return [slope, intercept, rSquare];
      }
  		// extract the x labels for the axis and scale domain
      var xLabels = data.map(d => d[chosenXAxis]);
	
      // xScale.domain(xLabels);
      // yScale.domain([0, Math.round(d3.max(data, d => d[chosenYAxis]))]);
      
      var line = d3.line()
        .x(d => xScale(d[chosenXAxis]))
        .y(d => yScale(d[chosenYAxis]));
      
      svg.append("path")
        .datum(data)
        .attr("class","line")
        .attr("d", line);

      
      // get the x and y values for least squares
      var xSeries = d3.range(1, xLabels.length + 1);
      var ySeries = data.map(d => d[chosenYAxis]);
      
      var leastSquaresCoeff = leastSquares(xLabels, ySeries);
      
      // apply the reults of the least squares regression
      var x1 = xLabels[0];
      var y1 = leastSquaresCoeff[0] + leastSquaresCoeff[1];
      var x2 = xLabels[xLabels.length - 1];
      var y2 = leastSquaresCoeff[0] * xSeries.length + leastSquaresCoeff[1];
      var trendData = [[x1,y1,x2,y2]];
      
      var trendline = svg.selectAll(".trendline")
        .data(trendData);
        
      trendline.enter()
        .append("line")
        .attr("class", "trendline")
        .attr("x1", function(d) { return xScale(d[0]); })
        .attr("y1", function(d) { return yScale(d[1]); })
        .attr("x2", function(d) { return xScale(d[2]); })
        .attr("y2", function(d) { return yScale(d[3]); })
        .attr("stroke", "black")
        .attr("stroke-width", 1);
      
      // display equation on the chart
      svg.append("text")
        .text(`eq: ${leastSquaresCoeff[0]} x: ${leastSquaresCoeff[1]}`)
        .attr("class", "text-label")
        .attr("x", function(d) {return xScale(x2) - 60;})
        .attr("y", function(d) {return yScale(y2) - 30;});
      
      // display r-square on the chart
      svg.append("text")
        .text(`r-sq: ${leastSquaresCoeff[2]}`)
        .attr("class", "text-label")
        .attr("x", function(d) {return xScale(x2) - 60;})
        .attr("y", function(d) {return yScale(y2) - 10;});
    };

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, newYScale,chosenXaxis,chosenYAxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]))
    .attr("cy", d => newYScale(d[chosenYAxis]));

  return circlesGroup;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis,chosenYAxis, circlesGroup, data) {
  var xLabel = ''
  var yLabel = ''
  // console.log(chosenXAxis);
  switch(chosenXAxis){
    
    case "poverty":
      xLabel = "Percentage in Poverty";
      break;
    case "income":
      xLabel = "Median Income";
      break;
    case "age":
      xLabel = "Median Age";
      break;
   
  }
  switch(chosenYAxis){
    case "obesity":
      yLabel = "Percentage Obese";
      break;
    case "healthcare":
      yLabel = "Percentage that Lacks Healthcare";
      break;
    case "smokes":
      yLabel = "Percentage of Smokers";
      break;
  }
  // console.log(xLabel);

  var toolTip = d3.tip()
    .attr("class", "tooltip")
    .offset([85, -60])
    .html(function(d) {
      return (`${d.state}<br>${yLabel}: ${d[chosenYAxis]}<br>${xLabel}: ${d[chosenXAxis]}`);
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", (d,i,n) => toolTip.show(d,n[i]));
  circlesGroup.on("mouseout", (d,i,n) => toolTip.hide(d,n[i]));

  return circlesGroup;
}
//Read the data
d3.csv("assets/data/data.csv").then(function(stateData) {

    // parse data
    stateData.forEach(function(data) {
      data.poverty = +data.poverty;
      data.age = +data.age;
      data.income = +data.income;
      data.healthcare = +data.healthcare;
      data.obesity = +data.obesity;
      data.smokes = +data.smokes;
    });

  var xLinearScale = xScale(stateData, chosenXAxis);
  var yLinearScale = xScale(stateData, chosenYAxis);

  // Create initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // append x axis
  var xAxis = chartGroup.append("g")
  .classed("x-axis", true)
  .attr("transform", `translate(0, ${height})`)
  .call(bottomAxis);

  // append y axis
  var yAxis = chartGroup.append("g")
    .classed("y-axis",true)
    .call(leftAxis);

  // append initial circles
  var circlesGroup = chartGroup.selectAll("circle")
    .data(stateData)
    .enter()
    .append("circle")
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d[chosenYAxis]))
    .attr("r", 10)
    .attr("fill", "#69b3a2")
    .attr("opacity", ".5");

  circlesGroup.append("text")
    .text(d => d.abbr)
    .attr("fill","#343a40");  

  // Create group for  3 x- axis labels
  var xLabelsGroup = chartGroup.append("g")
  .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var povertyLabel = xLabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty") // value to grab for event listener
    .classed("active", true)
    .text("Percentage in Poverty");

  var incomeLabel = xLabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "income") // value to grab for event listener
    .classed("inactive", true)
    .text("Median Income");

  var ageLabel = xLabelsGroup.append("text")
  .attr("x", 0)
  .attr("y", 60)
  .attr("value", "age") // value to grab for event listener
  .classed("inactive", true)
  .text("Median Age");

  // Create group for  3 y- axis labels
  var yLabelsGroup = chartGroup.append("g")
  .attr("transform", "rotate(-90)")
  .attr("y", 0 - margin.left)
  .attr("x", 0 - (height / 2))
  .attr("dy", "1em")
  .classed("axis-text", true)
  .style("text-anchor","middle")

  var obesityLabel = yLabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", -20)
    .attr("value", "obesity") // value to grab for event listener
    .classed("active", true)
    .text("Percentage Obese");

  var healthcareLabel = yLabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", -40)
    .attr("value", "healthcare") // value to grab for event listener
    .classed("inactive", true)
    .text("Percentage that Lack Healthcare");

    var smokerLabel = yLabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", -60)
    .attr("value", "smokes") // value to grab for event listener
    .classed("inactive", true)
    .text("Percentage of Smokers");
  // updateToolTip function above csv import
  var circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup,stateData);
    
  // x axis labels event listener
  xLabelsGroup.selectAll("text")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== chosenXAxis) {

        // replaces chosenXAxis with value
        chosenXAxis = value;

        // console.log(chosenXAxis);

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale = xScale(stateData, chosenXAxis);

        // updates x axis with transition
        xAxis = renderXAxis(xLinearScale, xAxis);

        // updates circles with new x values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, chosenXAxis,chosenYAxis);
        
        // updates tooltips with new info
        circlesGroup = updateToolTip(chosenXAxis,chosenYAxis, circlesGroup);

        // changes classes to change bold text
        switch(chosenXAxis){
          case "poverty":
          povertyLabel
            .classed("active", true)
            .classed("inactive", false);
          incomeLabel
            .classed("active", false)
            .classed("inactive", true);
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
            break;
          case "age":
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", false)
            .classed("inactive", true);
          ageLabel
            .classed("active", true)
            .classed("inactive", false);
            break;
          case "income":
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", true)
            .classed("inactive", false);
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
            break;
        }
      }
  // y axis labels event listener
  yLabelsGroup.selectAll("text")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== chosenYAxis) {

        // replaces chosenXAxis with value
        chosenYAxis = value;

        // console.log(chosenYAxis);

        // functions here found above csv import
        // updates y scale for new data
        yLinearScale = yScale(stateData, chosenYAxis);

        // updates y axis with transition
        yAxis = renderYAxis(yLinearScale, yAxis);

        // updates circles with new y values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, chosenXAxis,chosenYAxis);
        
        // updates tooltips with new info
        circlesGroup = updateToolTip(chosenXAxis,chosenYAxis, circlesGroup);

        // changes classes to change bold text
        switch(chosenYAxis){
          case "obesity":
          obesityLabel
            .classed("active", true)
            .classed("inactive", false);
          smokerLabel
            .classed("active", false)
            .classed("inactive", true);
          healthcareLabel
            .classed("active", false)
            .classed("inactive", true);
            break;
          case "smokes":
            obesityLabel
            .classed("active", false)
            .classed("inactive", true);
          smokerLabel
          .classed("active", true)
          .classed("inactive", false);
          healthcareLabel
            .classed("active", false)
            .classed("inactive", true);
            break;
          case "healthcare":
            obesityLabel
            .classed("active", false)
            .classed("inactive", true);
          smokerLabel
            .classed("active", false)
            .classed("inactive", true);
          healthcareLabel
          .classed("active", true)
          .classed("inactive", false);
          break;
        }
      }
    });
    });
   trendlineAdd(stateData); 
});