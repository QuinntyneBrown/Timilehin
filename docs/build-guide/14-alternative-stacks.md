# 14 — Alternative Technology Stacks

Throughout this guide, you have seen snippets of how to build GraceWord in other technologies. This chapter provides complete, coherent starting points for four alternative stacks.

---

## Why Consider Alternatives?

The technology used in this project (.NET + Angular) is one of many valid choices. The best technology depends on:

| Factor | Consideration |
|--------|--------------|
| **Your experience** | Build with what you (or your team) already know |
| **Community** | Larger communities mean more tutorials and help |
| **Hosting** | Some platforms favor certain technologies |
| **Performance needs** | Different tools excel in different scenarios |
| **Project size** | Simpler tools for smaller projects, structured tools for larger ones |

The *architecture* (backend API + frontend SPA + database) stays the same regardless of technology.

---

## Stack 1: Python + Flask + React

**Best for:** Data scientists, beginners, rapid prototyping

### Backend: Flask

```
graceword-api/
├── app/
│   ├── __init__.py
│   ├── models.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── bible.py
│   │   └── devotionals.py
│   └── services/
│       ├── __init__.py
│       ├── bible_service.py
│       └── devotional_service.py
├── app.py
├── requirements.txt
└── config.py
```

**requirements.txt:**
```
flask==3.1.0
flask-cors==5.0.0
flask-sqlalchemy==3.1.1
requests==2.32.0
```

**app.py (complete):**
```python
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///graceword.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])
    db.init_app(app)

    from app.routes.bible import bible_bp
    from app.routes.devotionals import devotionals_bp

    app.register_blueprint(bible_bp, url_prefix='/api')
    app.register_blueprint(devotionals_bp, url_prefix='/api')

    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(port=5256, debug=True)
```

**app/models.py (complete):**
```python
from app import db
from datetime import date, datetime

class Devotional(db.Model):
    __tablename__ = 'devotionals'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False, unique=True)
    scripture_reference = db.Column(db.String(100), nullable=False)
    reflection_text = db.Column(db.Text, nullable=False)
    prayer_prompt = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_summary(self):
        excerpt = self.reflection_text[:150] + '...' if len(self.reflection_text) > 150 else self.reflection_text
        return {
            'id': self.id,
            'title': self.title,
            'date': self.date.isoformat(),
            'scriptureReference': self.scripture_reference,
            'excerpt': excerpt
        }

    def to_detail(self):
        return {
            'id': self.id,
            'title': self.title,
            'date': self.date.isoformat(),
            'scriptureReference': self.scripture_reference,
            'reflectionText': self.reflection_text,
            'prayerPrompt': self.prayer_prompt
        }

class VerseOfTheDay(db.Model):
    __tablename__ = 'verses_of_the_day'

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True)
    reference = db.Column(db.String(100), nullable=False)
    text = db.Column(db.Text, nullable=False)
```

**app/services/bible_service.py (complete):**
```python
import requests
from datetime import date
from app import db
from app.models import VerseOfTheDay

DAILY_VERSES = [
    "John 3:16", "Psalm 23:1-6", "Philippians 4:13", "Jeremiah 29:11",
    "Romans 8:28", "Isaiah 40:31", "Proverbs 3:5-6", "Psalm 46:10",
    "Matthew 11:28", "Romans 12:2", "Galatians 5:22-23", "Psalm 119:105",
    "2 Timothy 1:7", "Joshua 1:9", "Ephesians 2:8-9", "Psalm 37:4",
    "Matthew 6:33", "1 Corinthians 13:4-7", "Hebrews 11:1", "Psalm 91:1-2",
]

def get_verse_of_the_day():
    today = date.today()
    cached = VerseOfTheDay.query.filter_by(date=today).first()
    if cached:
        return {'reference': cached.reference, 'text': cached.text}

    verse_ref = DAILY_VERSES[today.timetuple().tm_yday % len(DAILY_VERSES)]

    try:
        response = requests.get(
            f'https://bible-api.com/{verse_ref}', timeout=10)
        response.raise_for_status()
        data = response.json()

        entry = VerseOfTheDay(
            date=today,
            reference=data['reference'],
            text=data['text'].strip()
        )
        db.session.add(entry)
        db.session.commit()

        return {'reference': data['reference'], 'text': data['text'].strip()}
    except Exception:
        return {'reference': verse_ref, 'text': 'Unable to load verse.'}

def get_chapter(book, chapter):
    try:
        response = requests.get(
            f'https://bible-api.com/{book}+{chapter}', timeout=10)
        if response.status_code != 200:
            return None
        data = response.json()
        return {
            'reference': data['reference'],
            'verses': [
                {'verse': v['verse'], 'text': v['text'].strip()}
                for v in data.get('verses', [])
            ],
            'translation': data.get('translation_name', 'WEB')
        }
    except Exception:
        return None
```

**app/routes/devotionals.py (complete):**
```python
from flask import Blueprint, jsonify, request
from datetime import date
from app import db
from app.models import Devotional
from math import ceil

devotionals_bp = Blueprint('devotionals', __name__)

@devotionals_bp.route('/devotionals')
def list_devotionals():
    page = max(1, request.args.get('page', 1, type=int))
    page_size = min(50, max(1, request.args.get('pageSize', 10, type=int)))

    query = Devotional.query.order_by(Devotional.date.desc())
    total_count = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = ceil(total_count / page_size) if page_size > 0 else 0

    return jsonify({
        'items': [d.to_summary() for d in items],
        'totalCount': total_count,
        'page': page,
        'pageSize': page_size,
        'totalPages': total_pages,
        'hasNextPage': page < total_pages,
        'hasPreviousPage': page > 1
    })

@devotionals_bp.route('/devotionals/<int:id>')
def get_devotional(id):
    d = db.session.get(Devotional, id)
    if d is None:
        return '', 404
    return jsonify(d.to_detail())

@devotionals_bp.route('/devotionals/today')
def today_devotional():
    today = date.today()
    d = Devotional.query.filter_by(date=today).first()
    if d is None:
        return jsonify({'message': 'No devotional for today'}), 404
    return jsonify(d.to_detail())

@devotionals_bp.route('/devotionals', methods=['POST'])
def create_devotional():
    data = request.get_json()
    d = Devotional(
        title=data['title'],
        date=date.fromisoformat(data['date']),
        scripture_reference=data['scriptureReference'],
        reflection_text=data['reflectionText'],
        prayer_prompt=data['prayerPrompt']
    )
    db.session.add(d)
    db.session.commit()
    return jsonify(d.to_detail()), 201

@devotionals_bp.route('/devotionals/<int:id>', methods=['PUT'])
def update_devotional(id):
    d = db.session.get(Devotional, id)
    if d is None:
        return '', 404

    data = request.get_json()
    if 'title' in data: d.title = data['title']
    if 'date' in data: d.date = date.fromisoformat(data['date'])
    if 'scriptureReference' in data: d.scripture_reference = data['scriptureReference']
    if 'reflectionText' in data: d.reflection_text = data['reflectionText']
    if 'prayerPrompt' in data: d.prayer_prompt = data['prayerPrompt']

    db.session.commit()
    return jsonify(d.to_detail())

@devotionals_bp.route('/devotionals/<int:id>', methods=['DELETE'])
def delete_devotional(id):
    d = db.session.get(Devotional, id)
    if d is None:
        return '', 404
    db.session.delete(d)
    db.session.commit()
    return '', 204
```

### Frontend: React

```bash
npx create-react-app graceword-web --template typescript
cd graceword-web
npm install axios react-router-dom
```

Add a proxy in `package.json`:
```json
"proxy": "http://localhost:5256"
```

---

## Stack 2: Node.js + Express + Vue

**Best for:** JavaScript-only teams, real-time features

### Backend: Express

```
graceword-api/
├── server.js
├── routes/
│   ├── bible.js
│   └── devotionals.js
├── services/
│   └── bibleService.js
├── db.js
└── package.json
```

**package.json dependencies:**
```json
{
  "dependencies": {
    "express": "^5.0.0",
    "cors": "^2.8.5",
    "better-sqlite3": "^11.0.0",
    "axios": "^1.7.0"
  }
}
```

**server.js (complete):**
```javascript
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('graceword.db');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS devotionals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL UNIQUE,
    scripture_reference TEXT NOT NULL,
    reflection_text TEXT NOT NULL,
    prayer_prompt TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS verses_of_the_day (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    reference TEXT NOT NULL,
    text TEXT NOT NULL
  );
`);

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));
app.use(express.json());

// Make db accessible to routes
app.locals.db = db;

// Routes
app.use('/api', require('./routes/bible'));
app.use('/api', require('./routes/devotionals'));

app.listen(5256, () => {
  console.log('GraceWord API running on http://localhost:5256');
});
```

**routes/devotionals.js (complete):**
```javascript
const express = require('express');
const router = express.Router();

router.get('/devotionals', (req, res) => {
  const db = req.app.locals.db;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));

  const totalCount = db.prepare('SELECT COUNT(*) as count FROM devotionals').get().count;
  const totalPages = Math.ceil(totalCount / pageSize);

  const items = db.prepare(`
    SELECT id, title, date, scripture_reference, reflection_text
    FROM devotionals ORDER BY date DESC LIMIT ? OFFSET ?
  `).all(pageSize, (page - 1) * pageSize);

  res.json({
    items: items.map(d => ({
      id: d.id,
      title: d.title,
      date: d.date,
      scriptureReference: d.scripture_reference,
      excerpt: d.reflection_text.length > 150
        ? d.reflection_text.substring(0, 150) + '...'
        : d.reflection_text
    })),
    totalCount,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  });
});

router.get('/devotionals/today', (req, res) => {
  const db = req.app.locals.db;
  const today = new Date().toISOString().split('T')[0];
  const d = db.prepare('SELECT * FROM devotionals WHERE date = ?').get(today);

  if (!d) return res.status(404).json({ message: 'No devotional for today' });

  res.json({
    id: d.id, title: d.title, date: d.date,
    scriptureReference: d.scripture_reference,
    reflectionText: d.reflection_text,
    prayerPrompt: d.prayer_prompt
  });
});

router.get('/devotionals/:id', (req, res) => {
  const db = req.app.locals.db;
  const d = db.prepare('SELECT * FROM devotionals WHERE id = ?')
    .get(req.params.id);
  if (!d) return res.status(404).end();

  res.json({
    id: d.id, title: d.title, date: d.date,
    scriptureReference: d.scripture_reference,
    reflectionText: d.reflection_text,
    prayerPrompt: d.prayer_prompt
  });
});

router.post('/devotionals', (req, res) => {
  const db = req.app.locals.db;
  const { title, date, scriptureReference, reflectionText, prayerPrompt } = req.body;

  const result = db.prepare(`
    INSERT INTO devotionals (title, date, scripture_reference, reflection_text, prayer_prompt)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, date, scriptureReference, reflectionText, prayerPrompt);

  const d = db.prepare('SELECT * FROM devotionals WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json({
    id: d.id, title: d.title, date: d.date,
    scriptureReference: d.scripture_reference,
    reflectionText: d.reflection_text,
    prayerPrompt: d.prayer_prompt
  });
});

router.put('/devotionals/:id', (req, res) => {
  const db = req.app.locals.db;
  const d = db.prepare('SELECT * FROM devotionals WHERE id = ?')
    .get(req.params.id);
  if (!d) return res.status(404).end();

  const updates = req.body;
  if (updates.title) db.prepare('UPDATE devotionals SET title = ? WHERE id = ?')
    .run(updates.title, d.id);
  if (updates.scriptureReference)
    db.prepare('UPDATE devotionals SET scripture_reference = ? WHERE id = ?')
      .run(updates.scriptureReference, d.id);
  if (updates.reflectionText)
    db.prepare('UPDATE devotionals SET reflection_text = ? WHERE id = ?')
      .run(updates.reflectionText, d.id);
  if (updates.prayerPrompt)
    db.prepare('UPDATE devotionals SET prayer_prompt = ? WHERE id = ?')
      .run(updates.prayerPrompt, d.id);

  const updated = db.prepare('SELECT * FROM devotionals WHERE id = ?').get(d.id);
  res.json({
    id: updated.id, title: updated.title, date: updated.date,
    scriptureReference: updated.scripture_reference,
    reflectionText: updated.reflection_text,
    prayerPrompt: updated.prayer_prompt
  });
});

router.delete('/devotionals/:id', (req, res) => {
  const db = req.app.locals.db;
  const result = db.prepare('DELETE FROM devotionals WHERE id = ?')
    .run(req.params.id);
  if (result.changes === 0) return res.status(404).end();
  res.status(204).end();
});

module.exports = router;
```

### Frontend: Vue

```bash
npm create vue@latest graceword-web -- --typescript --vue-router
cd graceword-web
npm install axios
```

---

## Stack 3: Java + Spring Boot + Svelte

**Best for:** Enterprise teams, large organizations

### Backend: Spring Boot

Generate from [start.spring.io](https://start.spring.io):
- **Project:** Maven
- **Language:** Java 21
- **Dependencies:** Spring Web, Spring Data JPA, SQLite JDBC Driver

**model/Devotional.java:**
```java
package com.graceword.api.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "devotionals")
public class Devotional {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private LocalDate date;

    @Column(nullable = false)
    private String scriptureReference;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reflectionText;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prayerPrompt;

    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters and setters omitted for brevity
    // Generate them with your IDE or use Lombok @Data
}
```

**repository/DevotionalRepository.java:**
```java
package com.graceword.api.repository;

import com.graceword.api.model.Devotional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface DevotionalRepository extends JpaRepository<Devotional, Long> {
    Page<Devotional> findAllByOrderByDateDesc(Pageable pageable);
    Optional<Devotional> findByDate(LocalDate date);
}
```

**controller/DevotionalsController.java:**
```java
package com.graceword.api.controller;

import com.graceword.api.model.Devotional;
import com.graceword.api.repository.DevotionalRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/devotionals")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class DevotionalsController {
    private final DevotionalRepository repo;

    public DevotionalsController(DevotionalRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        var result = repo.findAllByOrderByDateDesc(
            PageRequest.of(Math.max(0, page - 1), Math.min(50, Math.max(1, pageSize))));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return repo.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/today")
    public ResponseEntity<?> getToday() {
        return repo.findByDate(LocalDate.now())
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Devotional d) {
        var saved = repo.save(d);
        return ResponseEntity.status(201).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
```

---

## Stack 4: Go + htmx (No Separate Frontend)

**Best for:** Simplicity, minimal JavaScript, fast performance

This approach is radically different — instead of a separate frontend app, the server renders HTML directly and uses htmx for interactivity.

```go
// main.go
package main

import (
    "database/sql"
    "html/template"
    "log"
    "net/http"

    _ "modernc.org/sqlite"
)

var db *sql.DB
var templates *template.Template

func main() {
    var err error
    db, err = sql.Open("sqlite", "graceword.db")
    if err != nil {
        log.Fatal(err)
    }

    // Create tables
    db.Exec(`
        CREATE TABLE IF NOT EXISTS devotionals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            date TEXT NOT NULL UNIQUE,
            scripture_reference TEXT NOT NULL,
            reflection_text TEXT NOT NULL,
            prayer_prompt TEXT NOT NULL
        )
    `)

    templates = template.Must(template.ParseGlob("templates/*.html"))

    http.HandleFunc("/", homeHandler)
    http.HandleFunc("/bible", bibleHandler)
    http.HandleFunc("/devotionals", devotionalsHandler)

    log.Println("Server running on http://localhost:5256")
    log.Fatal(http.ListenAndServe(":5256", nil))
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    templates.ExecuteTemplate(w, "home.html", nil)
}
```

With htmx, clicking a button can load new content without writing JavaScript:

```html
<!-- templates/home.html -->
<button hx-get="/api/verseoftheday" hx-target="#verse-area">
  Load Today's Verse
</button>
<div id="verse-area"></div>
```

---

## Stack Comparison Summary

| Aspect | .NET + Angular | Python + Flask + React | Node.js + Express + Vue | Java + Spring Boot | Go + htmx |
|--------|---------------|----------------------|------------------------|-------------------|-----------|
| **Learning curve** | Steep | Gentle | Moderate | Steep | Moderate |
| **Typing** | Strong (C#, TS) | Dynamic (Python) | Dynamic (JS) or TS | Strong (Java) | Strong (Go) |
| **Performance** | Very high | Moderate | High | Very high | Excellent |
| **Ecosystem** | Large | Massive | Massive | Massive | Growing |
| **Hosting options** | Azure, AWS, any | Anywhere | Anywhere | AWS, Azure, any | Anywhere |
| **Best for** | Enterprise apps | Startups, data | Full-stack JS teams | Large organizations | Simplicity |
| **Frontend complexity** | Separate SPA | Separate SPA | Separate SPA | Separate SPA | Server-rendered |

---

## What Stays the Same Across All Stacks

Regardless of technology choice, these architectural decisions remain constant:

1. **REST API pattern** — standard HTTP methods and status codes
2. **Separation of concerns** — models, services/logic, controllers/routes
3. **Database with ORM** — models mapped to tables
4. **External API proxy** — backend calls bible-api.com, not the frontend
5. **Caching** — verse of the day cached per day
6. **Pagination** — paginated list endpoints
7. **Component-based UI** — reusable, composable UI pieces
8. **Responsive design** — mobile, tablet, desktop layouts
9. **Error handling** — graceful fallbacks, not crashes

These are the *real* skills. The specific syntax of C# vs Python vs JavaScript is just the surface layer.

---

## You Did It!

If you have followed this entire guide, you now understand:
- How web applications are structured (frontend + backend + database)
- How REST APIs work (HTTP methods, status codes, JSON)
- How databases store and retrieve data (models, ORM, queries)
- How frontends are built from components
- How to test at every level (unit, integration, end-to-end)
- How the same architecture translates across different technologies

This knowledge transfers to any web project you work on in the future.

---

[<<< Back to Running & Testing](13-running-and-testing.md) | [Back to Overview](00-overview.md)
