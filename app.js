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

    console.log('Data received:', data);

    dataPoints.push({
        x: data.x,
        y: data.y,
        sentAt: data.sentAt,
        receivedAt: data.receivedAt
    });

    if (dataPoints.length === 3) {
        updateGraphWithTriangle(dataPoints);
        dataPoints.shift();
    }
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

function updateGraphWithTriangle(points) {
    const [p1, p2, p3] = points;

    const centroid = {
        x: (p1.x + p2.x + p3.x) / 3,
        y: (p1.y + p2.y + p3.y) / 3
    };

    const pointX = [p1.x, p2.x, p3.x];
    const pointY = [p1.y, p2.y, p3.y];

    const centroidX = [centroid.x];
    const centroidY = [centroid.y];

    Plotly.restyle('graphDiv', {
        x: [pointX],
        y: [pointY]
    }, [0]);

    Plotly.restyle('graphDiv', {
        x: [centroidX],
        y: [centroidY]
    }, [1]);

    console.log(`Centroid calculated at (${centroid.x}, ${centroid.y})`);
}

window.onload = function() {
    createGraph();
};
