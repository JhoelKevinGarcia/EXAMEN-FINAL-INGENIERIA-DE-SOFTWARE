const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/empresa', require('./routes/empresa'));
app.use('/api/tanques', require('./routes/tanques'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/ingresos', require('./routes/ingresos'));
app.use('/api/ventas', require('./routes/ventas'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
