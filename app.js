const socket = new WebSocket('ws://localhost:4001');

let dataPoints = [];

socket.onopen = function() {
    console.log('WebSocket connection opened');
};

socket.onclose = function() {
    console.log('WebSocket connection closed');
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);

    dataPoints.push({
        x: data.x,
        y: data.y,
        sentAt: data.sentAt,
        receivedAt: data.receivedAt,
        r: (((data.sentAt - data.receivedAt) / 1000) * 300000) / 1000 // Расчет текущего радиуса
    });

    if (dataPoints.length === 3) {
        const [p1, p2, p3] = dataPoints;
        
        const position = calculatePosition(p1.x, p1.y, p1.r, p2.x, p2.y, p2.r, p3.x, p3.y, p3.r);

        updateGraphWithTriangle(dataPoints, position);

        dataPoints.shift();
    }
};

function calculatePosition(x1, y1, r1, x2, y2, r2, x3, y3, r3) {

    const A = 2 * (x2 - x1);
    const B = 2 * (y2 - y1);
    const C = r1 ** 2 - r2 ** 2 - x1 ** 2 + x2 ** 2 - y1 ** 2 + y2 ** 2;

    const D = 2 * (x3 - x2);
    const E = 2 * (y3 - y2);
    const F = r2 ** 2 - r3 ** 2 - x2 ** 2 + x3 ** 2 - y2 ** 2 + y3 ** 2;

    const x = (C * E - F * B) / (E * A - B * D);
    const y = (C * D - A * F) / (B * D - A * E);

    return { x, y };
}


function updateGraphWithTriangle(points, position) {
    const [p1, p2, p3] = points;

    const pointX = [p1.x, p2.x, p3.x];
    const pointY = [p1.y, p2.y, p3.y];

    const centroidX = [position.x];
    const centroidY = [position.y];

    Plotly.restyle('graphDiv', {
        x: [pointX],
        y: [pointY]
    }, [0]);

    Plotly.restyle('graphDiv', {
        x: [centroidX],
        y: [centroidY]
    }, [1]);

    console.log(`Position calculated at (${position.x}, ${position.y})`);
}

window.onload = function() {
    createGraph();
};

function createGraph() {
    const layout = {
        title: 'Object and Satellites Positions',
        xaxis: { title: 'X', range: [-500, 500] },
        yaxis: { title: 'Y', range: [-500, 500] },
        showlegend: true
    };

    const data = [{
        x: [],
        y: [],
        mode: 'markers',
        type: 'scatter',
        name: 'Triangle Points',
        marker: { size: 5, color: 'red' }
    }, {
        x: [],
        y: [],
        mode: 'markers',
        type: 'scatter',
        name: 'Centroid',
        marker: { size: 5, color: 'green' }
    }];

    Plotly.newPlot('graphDiv', data, layout);
}
