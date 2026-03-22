# 06 — Backend API Endpoints (Controllers)

In this chapter, you will create the **controllers** — the code that defines your API's URL endpoints. Controllers receive HTTP requests, call the appropriate service, and return responses.

---

## What Is a Controller?

A controller is a class that maps URLs to actions. When someone visits `GET /api/verseoftheday`, the framework finds the matching controller and method, runs it, and sends back the result.

Think of controllers as a receptionist: they take the request, route it to the right department (service), and deliver the response back.

---

## Step 1: Verse of the Day Controller

Create `src/Timilehin.Api/Controllers/VerseOfTheDayController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using Timilehin.Api.Services;

namespace Timilehin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VerseOfTheDayController : ControllerBase
{
    private readonly IBibleService _bibleService;

    public VerseOfTheDayController(IBibleService bibleService)
    {
        _bibleService = bibleService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var verse = await _bibleService.GetVerseOfTheDayAsync();
        return Ok(verse);
    }
}
```

**Breaking it down:**

| Code | Meaning |
|------|---------|
| `[ApiController]` | Tells the framework "this is an API controller" (enables automatic model validation) |
| `[Route("api/[controller]")]` | The URL path. `[controller]` is replaced by the class name minus "Controller", so this becomes `/api/verseoftheday` |
| `ControllerBase` | A base class that provides helper methods like `Ok()`, `NotFound()`, etc. |
| `IBibleService _bibleService` | The service is "injected" by the framework (dependency injection — the framework creates it for you) |
| `[HttpGet]` | This method handles GET requests |
| `Ok(verse)` | Returns HTTP status 200 with the verse data as JSON |

**What happens when a request comes in:**
1. Browser/frontend sends `GET /api/verseoftheday`
2. Framework finds `VerseOfTheDayController.Get()`
3. The method calls `_bibleService.GetVerseOfTheDayAsync()`
4. The service checks the database cache, optionally calls bible-api.com
5. The service returns a `VerseOfTheDayDto`
6. The controller wraps it in `Ok()` and sends back HTTP 200 with JSON

---

## Step 2: Bible Reader Controller

Create `src/Timilehin.Api/Controllers/BibleController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using Timilehin.Api.Services;

namespace Timilehin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BibleController : ControllerBase
{
    private readonly IBibleService _bibleService;

    public BibleController(IBibleService bibleService)
    {
        _bibleService = bibleService;
    }

    [HttpGet("{book}/{chapter:int}")]
    public async Task<IActionResult> GetChapter(string book, int chapter)
    {
        var result = await _bibleService.GetChapterAsync(book, chapter);
        if (result is null)
            return NotFound(new { message = $"Could not find {book} chapter {chapter}." });

        return Ok(result);
    }
}
```

**New concepts:**

| Code | Meaning |
|------|---------|
| `"{book}/{chapter:int}"` | URL parameters. `{book}` captures any text, `{chapter:int}` captures a number. So `/api/bible/Genesis/1` gives `book = "Genesis"` and `chapter = 1` |
| `NotFound(new { message = ... })` | Returns HTTP 404 with a JSON error message |
| `result is null` | If the service returned null (book not found), return 404 |

---

## Step 3: Devotionals Controller

This is the largest controller because it handles all CRUD operations.

Create `src/Timilehin.Api/Controllers/DevotionalsController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using Timilehin.Api.DTOs;
using Timilehin.Api.Services;

namespace Timilehin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevotionalsController : ControllerBase
{
    private readonly IDevotionalService _devotionalService;

    public DevotionalsController(IDevotionalService devotionalService)
    {
        _devotionalService = devotionalService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize is < 1 or > 50) pageSize = 10;

        var result = await _devotionalService.GetAllAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var devotional = await _devotionalService.GetByIdAsync(id);
        if (devotional is null)
            return NotFound();

        return Ok(devotional);
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetToday()
    {
        var devotional = await _devotionalService.GetTodayAsync();
        if (devotional is null)
            return NotFound(new { message = "No devotional available for today." });

        return Ok(devotional);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDevotionalDto dto)
    {
        var devotional = await _devotionalService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById),
            new { id = devotional.Id }, devotional);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id, [FromBody] UpdateDevotionalDto dto)
    {
        var devotional = await _devotionalService.UpdateAsync(id, dto);
        if (devotional is null)
            return NotFound();

        return Ok(devotional);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _devotionalService.DeleteAsync(id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
}
```

### Understanding Each Endpoint

#### GET /api/devotionals (List with Pagination)
```
GET /api/devotionals?page=1&pageSize=10
```
- `[FromQuery]` means the values come from the URL's query string (after the `?`)
- Default values: `page = 1`, `pageSize = 10`
- Input validation: page must be >= 1, pageSize between 1 and 50

#### GET /api/devotionals/{id} (Get One)
```
GET /api/devotionals/5
```
- `{id:int}` captures the number from the URL
- Returns 404 if no devotional with that ID exists

#### GET /api/devotionals/today (Today's Devotional)
```
GET /api/devotionals/today
```
- A special endpoint that finds the devotional for today's date
- Returns 404 with a message if none exists for today

#### POST /api/devotionals (Create)
```
POST /api/devotionals
Body: { "title": "...", "date": "2026-03-22", ... }
```
- `[FromBody]` means the data comes from the request body (as JSON)
- `CreatedAtAction` returns HTTP 201 (Created) with a `Location` header pointing to the new resource

#### PUT /api/devotionals/{id} (Update)
```
PUT /api/devotionals/5
Body: { "title": "New Title" }
```
- Only the fields you send are updated
- Returns 404 if the ID does not exist

#### DELETE /api/devotionals/{id} (Delete)
```
DELETE /api/devotionals/5
```
- `NoContent()` returns HTTP 204 (success, but no data to return)
- Returns 404 if the ID does not exist

---

## The Complete API Surface

| Method | Route | Response | Description |
|--------|-------|----------|-------------|
| GET | `/api/verseoftheday` | 200 | Today's verse |
| GET | `/api/bible/{book}/{chapter}` | 200 or 404 | A Bible chapter |
| GET | `/api/devotionals?page=&pageSize=` | 200 | Paginated list |
| GET | `/api/devotionals/{id}` | 200 or 404 | One devotional |
| GET | `/api/devotionals/today` | 200 or 404 | Today's devotional |
| POST | `/api/devotionals` | 201 | Create devotional |
| PUT | `/api/devotionals/{id}` | 200 or 404 | Update devotional |
| DELETE | `/api/devotionals/{id}` | 204 or 404 | Delete devotional |

---

## Alternative Stack: Python (Flask)

```python
# app/routes/bible.py
from flask import Blueprint, jsonify
from app.services.bible_service import get_verse_of_the_day, get_chapter

bible_bp = Blueprint('bible', __name__)

@bible_bp.route('/verseoftheday')
def verse_of_the_day():
    return jsonify(get_verse_of_the_day())

@bible_bp.route('/bible/<book>/<int:chapter>')
def bible_chapter(book, chapter):
    result = get_chapter(book, chapter)
    if result is None:
        return jsonify({"message": f"Could not find {book} chapter {chapter}"}), 404
    return jsonify(result)
```

```python
# app/routes/devotionals.py
from flask import Blueprint, jsonify, request
from app.services.devotional_service import (
    get_all, get_by_id, get_today, create, update, delete
)

devotionals_bp = Blueprint('devotionals', __name__)

@devotionals_bp.route('/devotionals')
def list_devotionals():
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('pageSize', 10, type=int)
    return jsonify(get_all(page, page_size))

@devotionals_bp.route('/devotionals/<int:id>')
def get_devotional(id):
    result = get_by_id(id)
    if result is None:
        return '', 404
    return jsonify(result)

@devotionals_bp.route('/devotionals/today')
def today_devotional():
    result = get_today()
    if result is None:
        return jsonify({"message": "No devotional for today"}), 404
    return jsonify(result)

@devotionals_bp.route('/devotionals', methods=['POST'])
def create_devotional():
    data = request.get_json()
    result = create(data)
    return jsonify(result), 201

@devotionals_bp.route('/devotionals/<int:id>', methods=['PUT'])
def update_devotional(id):
    data = request.get_json()
    result = update(id, data)
    if result is None:
        return '', 404
    return jsonify(result)

@devotionals_bp.route('/devotionals/<int:id>', methods=['DELETE'])
def delete_devotional(id):
    if not delete(id):
        return '', 404
    return '', 204
```

## Alternative Stack: Node.js (Express)

```javascript
// routes/bible.js
const express = require('express');
const router = express.Router();
const { getVerseOfTheDay, getChapter } = require('../services/bibleService');

router.get('/verseoftheday', async (req, res) => {
  const verse = await getVerseOfTheDay(req.app.locals.db);
  res.json(verse);
});

router.get('/bible/:book/:chapter', async (req, res) => {
  const result = await getChapter(req.params.book, parseInt(req.params.chapter));
  if (!result) {
    return res.status(404).json({
      message: `Could not find ${req.params.book} chapter ${req.params.chapter}`
    });
  }
  res.json(result);
});

module.exports = router;
```

## Alternative Stack: Java (Spring Boot)

```java
// controller/BibleController.java
@RestController
@RequestMapping("/api")
public class BibleController {
    private final BibleService bibleService;

    public BibleController(BibleService bibleService) {
        this.bibleService = bibleService;
    }

    @GetMapping("/verseoftheday")
    public ResponseEntity<?> getVerseOfTheDay() {
        return ResponseEntity.ok(bibleService.getVerseOfTheDay());
    }

    @GetMapping("/bible/{book}/{chapter}")
    public ResponseEntity<?> getChapter(
            @PathVariable String book,
            @PathVariable int chapter) {
        var result = bibleService.getChapter(book, chapter);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }
}
```

---

[<<< Back to Backend Services](05-backend-services.md) | [Next: Backend Configuration >>>](07-backend-configuration.md)
