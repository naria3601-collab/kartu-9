# 👿🐉 DEMON DRAGON — Card Game Multiplayer

Versi digital dari permainan kartu legendaris. Multiplayer online real-time via WebSocket.

## Cara Jalankan Lokal

### 1. Install dependencies
```bash
npm install
```

### 2. Jalankan server
```bash
npm start
```

### 3. Buka browser
```
http://localhost:3000
```

Bagikan link ke teman di jaringan yang sama untuk main bareng!

---

## Deploy Online (Gratis)

### Opsi A: Railway.app (Paling Mudah)
1. Daftar di https://railway.app
2. Klik "New Project" → "Deploy from GitHub"
3. Upload folder ini atau connect ke GitHub repo
4. Railway otomatis detect Node.js dan deploy!
5. Dapatkan URL publik seperti `https://demon-dragon-xxx.railway.app`

### Opsi B: Render.com
1. Daftar di https://render.com
2. New → Web Service
3. Connect repo GitHub
4. Start command: `node server.js`
5. Deploy!

### Opsi C: Fly.io
```bash
npm install -g flyctl
fly auth login
fly launch
fly deploy
```

---

## Struktur File

```
card-game/
├── server.js          ← Backend Node.js + Socket.io
├── src/
│   └── gameEngine.js  ← Semua logika permainan
├── public/
│   └── index.html     ← Frontend (UI lengkap)
└── package.json
```

---

## Fitur
- ✅ Multiplayer online real-time (2-4 pemain)
- ✅ Sistem lobby dengan kode room
- ✅ Semua 36 kartu (9 jenis × 4 bintang)
- ✅ Semua aturan counter standar
- ✅ Bonus Dragon (kalah 1 bintang)
- ✅ Bonus Demon (kalah 2 bintang)
- ✅ Demon ⭐4 spesial (counter semua + main bonus)
- ✅ Skip turn otomatis jika tidak bisa counter
- ✅ Main Baru setelah pemain skip atau menang
- ✅ Urutan kemenangan (1st, 2nd, 3rd, kalah)
- ✅ Log aksi game real-time
- ✅ Highlight kartu yang bisa dimainkan

## Aturan Lengkap
Lihat dokumen aturan game yang sudah kamu buat.
