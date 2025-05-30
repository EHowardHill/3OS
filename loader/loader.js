const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use('/modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/system', express.static(path.join(__dirname, 'system')));
app.use('/disk', express.static(path.join(__dirname, '../media/sd')));

app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});