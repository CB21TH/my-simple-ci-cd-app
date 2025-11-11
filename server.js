        const express = require('express');
        const { Pool } = require('pg');
        require('dotenv').config(); // Загружает переменные из .env файла
        const app = express();

        const PORT = process.env.APP_PORT || 3000;

        // Настройки подключения к базе данных из переменных окружения
        const pool = new Pool({
          user: process.env.DB_USER,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          password: process.env.DB_PASSWORD,
          port: process.env.DB_PORT,
        });

        // Функция для инициализации БД (создание таблицы и добавление данных)
        async function initDb() {
          try {
            await pool.query(`
              CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL
              );
            `);
            const res = await pool.query('SELECT COUNT(*) FROM items');
            if (parseInt(res.rows[0].count) === 0) {
              await pool.query("INSERT INTO items (name) VALUES ('Item 1'), ('Item 2'), ('Item 3');");
              console.log('Initial data inserted.');
            }
          } catch (err) {
            console.error('Error initializing database:', err);
          }
        }

        // Health check endpoint
        app.get('/health', (req, res) => {
          res.status(200).send('OK');
        });

        // API endpoint для получения всех элементов
        app.get('/api/data', async (req, res) => {
          try {
            const client = await pool.connect();
            const result = await client.query('SELECT * FROM items');
            client.release();
            res.json(result.rows);
          } catch (err) {
            console.error('Error fetching data:', err);
            res.status(500).send('Database error');
          }
        });

        // API endpoint для получения количества элементов
        app.get('/api/items/count', async (req, res) => {
          try {
            const client = await pool.connect();
            const result = await client.query('SELECT COUNT(*) FROM items');
            client.release();
            res.send(result.rows[0].count);
          } catch (err) {
            console.error('Error fetching item count:', err);
            res.status(500).send('Database error');
          }
        });

        app.listen(PORT, () => {
          console.log(`App listening on port ${PORT}`);
          initDb(); // Инициализируем БД при старте
        });
