'use strict';

var svg, path;

var NODE_WIDTH = 36,
    COLLAPSER = {
        RADIUS: NODE_WIDTH / 2,
        SPACING: 2
    },
    OUTER_MARGIN = 10,
    MARGIN = {
        TOP: 2 * (COLLAPSER.RADIUS + OUTER_MARGIN),
        RIGHT: OUTER_MARGIN,
        BOTTOM: OUTER_MARGIN,
        LEFT: OUTER_MARGIN
    },
    HEIGHT = 600 - MARGIN.TOP - MARGIN.BOTTOM,
    WIDTH = 800 - MARGIN.LEFT - MARGIN.RIGHT;


svg = d3.select("#chart").append("svg")
    .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
    .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)
    .append("g");

svg.append("g").attr("id", "links");
svg.append("g").attr("id", "nodes");

var exampleNodes = [];

var exampleLinks = []

function dragInit() {
    var eleSvg = document.getElementById("chart"),
        eleList = document.getElementsByClassName("list-item"),
        lDrags = eleList.length,
        eleDrag = null;
    for (var i = 0; i < lDrags; i += 1) {
        eleList[i].onselectstart = function () {
            return false;
        };
        eleList[i].ondragstart = function (ev) {
            eleSvg.ondragover = function (ev) {
                console.log(111)
                ev.preventDefault();
                return true;
            };
            eleSvg.ondrop = function (ev) {
                if (eleDrag) {
                    initNode(ev);
                }
                return false;
            };

            ev.dataTransfer.effectAllowed = "move";
            ev.dataTransfer.setDragImage(ev.target, 0, 0);
            ev.dataTransfer.setData('content', this.innerText);
            ev.dataTransfer.setData('type', this.dataset.type);

            eleDrag = ev.target;
            return true;
        };
        eleList[i].ondragend = function (ev) {
            eleSvg.ondragover = function (ev) {
                return true
            };
            eleSvg.ondrop = function (ev) {
                return true
            };
            eleDrag = null;
            return false
        };
    }

}

dragInit();

function initNode(ev) {
    var type = ev.dataTransfer.getData('type');
    var id = document.getElementsByClassName(type).length + 1;
    exampleNodes.push({type: type, id: id, name: type + '-' + id});
    var newnode = d3.select('#chart')
        .append('div')
        .style('transform', "translate(" + ev.pageX + "px," + ev.pageY + "px)")
        .attr('class', 'svg-item ' + type)
        .attr('data-type', type)
        .attr('id', type + '-' + id)
        .html(ev.dataTransfer.getData('content'));
    newnode.append('div')
        .attr('class', 'dot-up');
    newnode.append('div')
        .attr('class', 'dot-down');

    newnode.append('div')
        .attr('class', 'line-in')
        .attr('draggable', true)
        .attr('data-name', type + '-' + id)
        .attr('data-inX', ev.pageX + 70)
        .attr('data-inY', ev.pageY);


    newnode.append('div')
        .attr('class', 'line-out')
        .attr('draggable', true)
        .attr('data-name', type + '-' + id)
        .attr('data-outX', ev.pageX + 70)
        .attr('data-outY', ev.pageY + 28)

    var lineGenerator = null,
        lineString = null,
        startX = 0,
        startY = 0,
        endX = 0,
        endY = 0,
        source = null,
        target = null;

    var started = function (ev) {
        startX = endX = parseInt(ev.target.dataset.outx, 10);
        startY = endY = parseInt(ev.target.dataset.outy, 10);

        lineGenerator = d3.line();
        lineGenerator.curve(d3.curveBundle.beta(0.6));

        lineString = lineGenerator([[startX, startY], [startX, startY + (endY - startY) / 3], [endX, endY - (endY - startY) / 3], [endX, endY]]);
        source = ev.target.dataset.name;
        d3.select('#links')
            .append('path')
            .attr('id', 'dragging')
            .attr('d', lineString)
            .attr('style', "fill:none;stroke:grey;stroke-width=6px;cursor: default;");
    }

    var dragged = function (ev) {
        endX = ev.pageX;
        endY = ev.pageY;
        d3.select('#dragging').remove();
        lineString = lineGenerator([[startX, startY], [startX, startY + (endY - startY) / 3], [endX, endY - (endY - startY) / 3], [endX, endY]]);
        d3.select('#links')
            .append('path')
            .attr('id', 'dragging')
            .attr('d', lineString)
            .attr('style', "fill:none;stroke:grey;stroke-width=6px;cursor: default;")
    }

    var ended = function (inx,iny,name) {
        endX = parseInt(inx,10);
        endY = parseInt(iny,10);
        console.log(startX, startY, endX, endY);
        d3.select('#dragging').remove()
        lineString = lineGenerator([[startX, startY], [startX, startY + (endY - startY) / 3], [endX, endY - (endY - startY) / 3], [endX, endY]]);
        target = name;
        exampleLinks.push({'source':source,'target':target});
        d3.select('#links')
            .append('path')
            .attr('id', source+'&'+target)
            .attr('d', lineString)
            .attr('style', "fill:none;stroke:grey;stroke-width=6px;cursor: default;")

        lineGenerator = null, lineString = null, startX = 0, startY = 0, endX = 0, endY = 0, source = null, target = null;
    }

    // in
    var eleinList = document.getElementsByClassName("line-in"),
        lDrags = eleinList.length;
    for (var i = 0; i < lDrags; i += 1) {
        eleinList[i].ondragstart = function (ev) {
            ev.preventDefault();
            return true;
        };
        eleinList[i].ondragover = function (ev) {
            ev.preventDefault();
            return true;
        };
        eleinList[i].ondrop = function (ev) {
            ended(this.dataset.inx,this.dataset.iny,this.dataset.name);
            return false;
        };
    }


    // out
    var eleoutList = document.getElementsByClassName("line-out"),
        eleSvg = document.getElementById("chart"),
        lFlags = eleoutList.length,
        eleflag = null;
    for (var j = 0; j < lFlags; j += 1) {
        eleoutList[j].onselectstart = function () {
            return false;
        };
        eleoutList[j].ondragstart = function (ev) {
            ev.target.style.opacity = 0;
            ev.dataTransfer.effectAllowed = "move";
            ev.dataTransfer.setDragImage(ev.target, 0, 0);

            started(ev);
            eleflag = ev.target;

            eleSvg.ondragover = function (ev) {
                ev.preventDefault();
                dragged(ev)
                return true;
            };

            eleSvg.ondrop = function (ev) {
                d3.select('#dragging').remove();
                return true
            };

            return true;
        };
        eleoutList[j].ondragend = function (ev) {
            eleSvg.ondragover = function (ev) {
                return true
            };
            eleSvg.ondrop = function (ev) {
                return true
            };
            eleflag = null;
            return false
        };
        eleoutList[j].ondragover = function (ev) {
            ev.preventDefault();
            dragged(ev);
            return true;
        };
    }
}

// tree to json

