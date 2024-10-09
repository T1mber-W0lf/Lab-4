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

    // Добавляем полученную точку в массив
    dataPoints.push({
        x: data.x,
        y: data.y,
        sentAt: data.sentAt,
        receivedAt: data.receivedAt,
        r: (data.sentAt - data.receivedAt) * 0.3
    });

    // Как только у нас три точки, отображаем их и выполняем расчет финальной точки
    if (dataPoints.length === 3) {
        const [p1, p2, p3] = dataPoints;

        // Сначала обновляем график с тремя точками спутников
        updateGraphWithTriangle([p1, p2, p3]);

        // Затем вычисляем и отображаем финальную точку
        const position = calculatePosition(p1.x, p1.y, p1.r, p2.x, p2.y, p2.r, p3.x, p3.y, p3.r);
        updateGraphWithFinalPoint(position);

        // Очищаем массив точек после вычисления и отображения финальной точки
        dataPoints = [];
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

function updateGraphWithTriangle(points) {
    const [p1, p2, p3] = points;

    const pointX = [p1.x, p2.x, p3.x];
    const pointY = [p1.y, p2.y, p3.y];
    // Обновляем график с тремя точками спутников
    Plotly.restyle('graphDiv', {
        x: [pointX],
        y: [pointY]
    }, [0]);
}

function updateGraphWithFinalPoint(position) {
    const centroidX = position.x !== null ? [position.x] : [];
    const centroidY = position.y !== null ? [position.y] : [];

    // Обновляем график с финальной (зеленой) точкой
    Plotly.restyle('graphDiv', {
        x: [centroidX],
        y: [centroidY]
    }, [1]);

    if (position.x !== null && position.y !== null) {
        console.log(`Position calculated at (${position.x}, ${position.y})`);
    }
}

window.onload = function() {
    createGraph();
    setupParameterUpdate();
};

function createGraph() {
    const layout = {
        title: 'Object and Satellites Positions',
        xaxis: { title: 'X', range: [0, 500] },
        yaxis: { title: 'Y', range: [0, 500] },
        showlegend: true
    };

    const data = [{
        x: [],
        y: [],
        mode: 'markers',
        type: 'scatter',
        name: 'Спутники',
        marker: { size: 8, color: 'red' }
    }, {
        x: [],
        y: [],
        mode: 'markers',
        type: 'scatter',
        name: 'Точка',
        marker: { size: 8, color: 'green' }
    }];

    Plotly.newPlot('graphDiv', data, layout);
}

function setupParameterUpdate() {
    document.getElementById('updateParams').addEventListener('click', function() {
        updateGPSConfig();
    });
}

function updateGPSConfig() {
    const emulationZoneSizeInput = parseInt(document.getElementById('emulationZoneSize').value);
    const messageFrequencyInput = parseInt(document.getElementById('messageFrequency').value);
    const satelliteSpeedInput = parseInt(document.getElementById('satelliteSpeed').value);
    const objectSpeedInput = parseInt(document.getElementById('objectSpeed').value);

    // Валидация введенных данных
    if (isNaN(emulationZoneSizeInput) || emulationZoneSizeInput <= 0) {
        alert('Розмір зони емуляції має бути позитивним числом.');
        return;
    }

    if (isNaN(messageFrequencyInput) || messageFrequencyInput <= 0) {
        alert('Частота передачі повідомлень має бути позитивним числом.');
        return;
    }

    if (isNaN(satelliteSpeedInput) || satelliteSpeedInput <= 0) {
        alert('Швидкість руху супутників має бути позитивним числом.');
        return;
    }

    if (isNaN(objectSpeedInput) || objectSpeedInput <= 0) {
        alert('Швидкість руху об\'єкта має бути позитивним числом.');
        return;
    }

    const configData = {
        emulationZoneSize: emulationZoneSizeInput,
        messageFrequency: messageFrequencyInput,
        satelliteSpeed: satelliteSpeedInput,
        objectSpeed: objectSpeedInput
    };

    // Отправка данных на сервер через API
    fetch('http://localhost:4001/config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Статус: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Параметри GPS оновлено:', data);
        alert('Параметри успішно оновлено!');

        // Обновление графика с новыми размерами зоны
        updateGPSZoneSize(emulationZoneSizeInput);
    })
    .catch(error => {
        console.error('Помилка при оновленні параметрів GPS:', error);
        alert('Сталася помилка при оновленні параметрів. Перевірте консоль для деталей.');
    });
}

// Функция для обновления диапазонов осей (размера зоны GPS) на графике
function updateGPSZoneSize(zoneSize) {
    Plotly.relayout('graphDiv', {
        'xaxis.range': [0, zoneSize],
        'yaxis.range': [0, zoneSize]
    });
}
