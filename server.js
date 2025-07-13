const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// --- Middlewares ---
app.use(cors()); // Permite requisições de origens diferentes (frontend).
app.use(express.json()); // Permite que o servidor entenda JSON no corpo das requisições.
app.use(express.static(path.join(__dirname, 'public'))); // Serve os arquivos estáticos da pasta 'public'.

// --- Conexão com o Banco de Dados SQLite ---
const dbPath = path.join(__dirname, 'database', 'historico.db'); // Caminho para o banco de dados SQLite.
const db = new sqlite3.Database(dbPath, (err) => { // Cria uma nova instância do banco de dados SQLite.
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message); // Exibe erro se houver problema na conexão.
    } else { // Se a conexão for bem-sucedida, exibe mensagem de sucesso.
        console.log('Conectado ao banco de dados SQLite.');
        // Cria a tabela se ela não existir
        db.run(`CREATE TABLE IF NOT EXISTS abastecimentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            odometro REAL NOT NULL,
            litros REAL NOT NULL,
            valor_litro REAL,
            tipo_combustivel TEXT
        )`);
    }
});

// --- Rotas da API ---

// Rota para obter todos os abastecimentos.
app.get('/api/abastecimentos', (req, res) => { // Endpoint para buscar todos os abastecimentos.
    const sql = "SELECT * FROM abastecimentos ORDER BY odometro DESC"; // Consulta SQL para selecionar todos os abastecimentos ordenados pelo odômetro em ordem decrescente.
    db.all(sql, [], (err, rows) => { // Executa a consulta SQL.
        if (err) { // Se ocorrer um erro ao executar a consulta, retorna erro 500.
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({ // Retorna os dados dos abastecimentos em formato JSON.
            "message": "success",
            "data": rows
        });
    });
});

// Rota para adicionar um novo abastecimento.
app.post('/api/abastecimentos', (req, res) => { // Endpoint para adicionar um novo abastecimento.
    // Verifica se os campos obrigatórios estão presentes no corpo da requisição.
    const { data, odometro, litros, valor_litro, tipo_combustivel } = req.body;
    if (!data || !odometro || !litros) {
        return res.status(400).json({ "error": "Campos data, odometro e litros são obrigatórios." });
    }
// Verifica se os valores são válidos.
    const sql = `INSERT INTO abastecimentos (data, odometro, litros, valor_litro, tipo_combustivel) VALUES (?, ?, ?, ?, ?)`;
    const params = [data, odometro, litros, valor_litro, tipo_combustivel];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ "error": err.message }); // Se ocorrer um erro ao inserir, retorna erro 500.
            return;
        }
        res.status(201).json({
            "message": "success", // Retorna mensagem de sucesso.
            "data": { id: this.lastID, ...req.body } // Retorna o novo abastecimento adicionado com o ID gerado.
        });
    });
});


// --- Iniciar o Servidor ---
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`); // Exibe mensagem no console indicando que o servidor está rodando.
});
