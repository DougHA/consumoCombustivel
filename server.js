const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// --- Middlewares ---
app.use(cors()); // Permite requisições de outras origens (seu frontend)
app.use(express.json()); // Permite que o servidor entenda JSON
app.use(express.static(path.join(__dirname, 'public'))); // Serve os arquivos estáticos (HTML, CSS, JS)

// --- Configuração do Banco de Dados ---
const dbDir = path.join(__dirname, 'database');
const dbPath = path.join(dbDir, 'database.db');

// Garante que o diretório do banco de dados exista
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// --- Conexão com o Banco de Dados ---
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// --- Criação das Tabelas (se não existirem) ---
db.serialize(() => {
    // Tabela de abastecimentos (existente)
    db.run(`CREATE TABLE IF NOT EXISTS abastecimentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        odometro REAL NOT NULL,
        litros REAL NOT NULL,
        valor_abastecido REAL,
        valor_litro REAL,
        tipo_combustivel TEXT
    )`);

    // NOVA Tabela de veículos
    db.run(`CREATE TABLE IF NOT EXISTS veiculos (
        id INTEGER PRIMARY KEY,
        modelo TEXT NOT NULL,
        ano INTEGER NOT NULL,
        odometro_inicial REAL NOT NULL,
        nome_usuario TEXT
    )`);
});

// --- Rotas da API ---

// --- API para Veículo ---

// GET /api/veiculo - Busca o veículo configurado
app.get('/api/veiculo', (req, res) => {
    // Como o app é para um único veículo, sempre buscamos o primeiro (id=1)
    db.get('SELECT * FROM veiculos ORDER BY id ASC LIMIT 1', [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            res.json(row);
        } else {
            // Se não encontrar, retorna 404 para o frontend saber que precisa configurar
            res.status(404).json({ error: 'Nenhum veículo configurado.' });
        }
    });
});

// POST /api/veiculo - Salva a configuração do veículo
app.post('/api/veiculo', (req, res) => {
    const { modelo, ano, odometroInicial, nome_usuario } = req.body;
    // Usamos REPLACE INTO para inserir se não existir, ou substituir se já existir (com id=1)
    const sql = `REPLACE INTO veiculos (id, modelo, ano, odometro_inicial, nome_usuario) VALUES (?, ?, ?, ?, ?)`;
    // Forçamos o id=1 para garantir que sempre haverá apenas um registro de veículo
    db.run(sql, [1, modelo, ano, odometroInicial, nome_usuario], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ id: 1, modelo, ano, odometro_inicial: odometroInicial, nome_usuario });
    });
});

// --- API para Abastecimentos (existente) ---

// GET /api/abastecimentos
app.get('/api/abastecimentos', (req, res) => {
    db.all('SELECT * FROM abastecimentos ORDER BY odometro DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows });
    });
});

// POST /api/abastecimentos
app.post('/api/abastecimentos', (req, res) => {
    const { data, odometro, litros, valor_abastecido, valor_litro, tipo_combustivel } = req.body;
    const sql = `INSERT INTO abastecimentos (data, odometro, litros, valor_abastecido, valor_litro, tipo_combustivel) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [data, odometro, litros, valor_abastecido, valor_litro, tipo_combustivel], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});

// --- Iniciar o Servidor ---
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});