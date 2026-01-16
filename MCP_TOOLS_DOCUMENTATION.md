
# Mio MCP Tools Documentation

## Overview

The mcp.mio.fyi - Mio MCP server provides tools for managing structured data (tabular skills), semantic search (vector skills), and web search functionality. All tools require authentication via WorkOS user_id or OAuth JWT token.

---

## Authentication

**Required Header:**
```
Authorization: Bearer <workos_user_id or jwt_token>
```

Supports two authentication methods:
1. WorkOS user_id (format: `user_*`)
2. WorkOS OAuth JWT token

---

## Tool Categories

### 1. Discovery & Information
### 2. Tabular Skills (Structured Data)
### 3. Vector Skills (Semantic Search)
### 4. Web Search

---

## 1. Discovery & Information Tools

### `list_available_tools`

Lists all available MCP tools on this server.

**Signature:**
```python
def list_available_tools() -> str
```

**Parameters:** None

**Returns:**
- `str`: Formatted list of all available tools with descriptions

**Example Response:**
```
Available tools:
- list_available_tools - List all available tools
- search_web - Search the web for current information
- create_tabular_skill - Create structured data skills
- create_vector_skill - Create text-heavy skills for semantic search
...
```

**When to Use:**
- Getting an overview of server capabilities
- Before using other tools to understand what's available

---

### `list_skills`

List all skills (both tabular and vector) that have been created.

**Signature:**
```python
def list_skills() -> dict
```

**Parameters:** None

**Returns:**
```json
{
  "success": true,
  "my_skills": [
    {
      "name": "todos",
      "type": "table",
      "instructions": "..."
    }
  ],
  "count": 5,
  "table_count": 3,
  "vector_count": 2
}
```

**When to Use:**
- **REQUIRED**: Call this BEFORE using `add_tabular_item`, `get_tabular_items`, `update_tabular_items`, `add_vector_item`, or `search_vectors`
- To see what skills are available and their correct names
- To avoid errors from using non-existent skill names

---

## 2. Tabular Skills (Structured Data)

### `create_tabular_skill`

Create a new tabular skill for structured data with consistent fields.

**When to Use:**
- Data with numeric/quantifiable values (calories, weights, counts, prices, ratings)
- Items tracked with consistent fields (todos, grocery lists, wishlists)
- Data requiring calculations/aggregations (sum calories, count items, average ratings)
- Records queried by exact field matching (completed=true, priority=1, date ranges)

**Examples:** meals (calories tracking), exercises, weight logs, todo lists, grocery lists, wishlists, recipes, workout sessions

**Signature:**
```python
def create_tabular_skill(
    skill_name: str,
    first_record: dict,
    description: str = "",
    examples: list[str] = [],
    relationships: list[str] = [],
    notes: str = ""
) -> dict
```

**Parameters:**
- `skill_name` (str, required): Name for the skill (lowercase, letters/numbers/underscores only, must start with letter)
  - Examples: `"todos"`, `"meals"`, `"recipes"`, `"workouts"`
- `first_record` (dict, required): **Actual first record data** that defines the structure
  - The LLM MUST ask the user for real data - cannot make up sample data
- `description` (str, optional): Description of what this skill tracks
- `examples` (list[str], optional): SQL query examples showing common usage patterns
- `relationships` (list[str], optional): Relationships to other tables
- `notes` (str, optional): Additional usage notes and best practices

**Example Request:**
```python
create_tabular_skill(
    skill_name="todos",
    first_record={
        "task": "Buy groceries",
        "completed": False,
        "priority": 1
    },
    description="Tracks daily tasks and to-do items",
    examples=[
        "SELECT * FROM todos WHERE completed = false",
        "SELECT * FROM todos WHERE priority = 1"
    ],
    notes="Use priority 1 for urgent tasks"
)
```

**Returns:**
```json
{
  "success": true,
  "message": "Created the 'todos' skill with your first record",
  "skill_name": "todos",
  "how_to_use": "Add items: add_tabular_item(skill='todos', data={...})",
  "data_structure": "task (VARCHAR), completed (BOOLEAN), priority (INTEGER)",
  "initial_record_id": "abc123"
}
```

---

### `add_tabular_item`

Add an item to an existing tabular skill.

**Signature:**
```python
def add_tabular_item(
    skill: str,
    data: dict
) -> dict
```

**Parameters:**
- `skill` (str, required): Name of the tabular skill to use
- `data` (dict, required): The item data as a dictionary

**Before Calling:** Run `list_skills()` first to see available skill names and their fields.

**Example Request:**
```python
add_tabular_item(
    skill="meals",
    data={
        "food": "two vanilla wafers",
        "calories": 100
    }
)
```

**Returns:**
```json
{
  "success": true,
  "message": "Record inserted into meals",
  "table_name": "meals",
  "record_id": "xyz789",
  "table_existed": true,
  "data": {"food": "two vanilla wafers", "calories": 100}
}
```

---

### `get_tabular_items`

Query items from a tabular skill with optional filtering and sorting.

**Signature:**
```python
def get_tabular_items(
    skill: str,
    filters: Optional[str] = None,
    order_by: Optional[str] = None,
    limit: Optional[int] = None
) -> dict
```

**Parameters:**
- `skill` (str, required): Name of the tabular skill
- `filters` (str, optional): SQL WHERE conditions (e.g., `"completed = false"`, `"rating > 4"`)
- `order_by` (str, optional): Sort order (e.g., `"created_at DESC"`, `"name ASC"`)
- `limit` (int, optional): Maximum number of items to return

**Before Calling:** Run `list_skills()` first.

**Example Requests:**
```python
# Get incomplete todos
get_tabular_items(skill="todos", filters="completed = false")

# Get top recipes
get_tabular_items(skill="recipes", filters="rating >= 4", limit=5)

# Get recent meals
get_tabular_items(skill="meals", order_by="created_at DESC", limit=10)
```

**Returns:**
```json
{
  "success": true,
  "table_name": "todos",
  "data": [
    {"id": 1, "task": "Buy groceries", "completed": false, "priority": 1},
    {"id": 2, "task": "Call mom", "completed": false, "priority": 2}
  ],
  "row_count": 2,
  "query_info": {
    "columns": "id, task, completed, priority, created_at",
    "where_clause": "completed = false",
    "order_by": null,
    "limit": null
  }
}
```

---

### `update_tabular_items`

Update items in a tabular skill.

**Signature:**
```python
def update_tabular_items(
    skill: str,
    where_clause: str,
    data: dict
) -> dict
```

**Parameters:**
- `skill` (str, required): Name of the tabular skill
- `where_clause` (str, required): SQL WHERE conditions to identify records (e.g., `"id = 1"`, `"task = 'Buy groceries'"`)
- `data` (dict, required): Dictionary with column names as keys and new values

**Before Calling:** Run `list_skills()` first.

**Example Requests:**
```python
# Mark todo complete
update_tabular_items(
    skill="todos",
    where_clause="id = 1",
    data={"completed": True}
)

# Update recipe rating
update_tabular_items(
    skill="recipes",
    where_clause="id = 5",
    data={"rating": 5}
)
```

**Returns:**
```json
{
  "success": true,
  "message": "Successfully updated record(s) in todos",
  "table_name": "todos",
  "where": {"id": 1},
  "data": {"completed": true}
}
```

**Note:** Vector skills cannot be updated - they are append-only.

---

## 3. Vector Skills (Semantic Search)

### `create_vector_skill`

Create a new vector skill for text-heavy, unstructured content requiring semantic search.

**When to Use:**
- Text-heavy entries without consistent structured fields
- Content searched by meaning/concept rather than exact values
- Queries like "where did I eat Italian food" or "memories about my dog"
- Data retrieved by similarity/relevance rather than exact matching

**Examples:** memories, journal entries, personal notes, favorite quotes, experiences, book/movie reviews, travel stories, reflections

**Signature:**
```python
def create_vector_skill(
    tableName: str,
    content: str,
    category: str = "general",
    subcategory: str = "",
    tags: str = "",
    location: str = "",
    people: str = "",
    context: str = "",
    skill_description: str = None,
    skill_metadata_fields: list = None,
    skill_search_examples: list = None,
    skill_filter_examples: list = None,
    skill_notes: str = None
) -> str
```

**Parameters:**
- `tableName` (str, required): Name of the vector skill (e.g., `"memories"`, `"journal_entries"`)
- `content` (str, required): The text content to save as the first item
- `category` (str, optional): Category for filtering
- `subcategory` (str, optional): Subcategory for filtering
- `tags` (str, optional): Comma-separated tags
- `location` (str, optional): Location associated with content
- `people` (str, optional): People mentioned in content
- `context` (str, optional): Additional context
- `skill_description` (str, optional): Description for SKILL.md
- `skill_metadata_fields` (list, optional): Metadata field definitions
- `skill_search_examples` (list, optional): Example search queries
- `skill_filter_examples` (list, optional): Example filter queries
- `skill_notes` (str, optional): Additional notes

**Example Request:**
```python
create_vector_skill(
    tableName="memories",
    content="I had an amazing time hiking in Yosemite with Sarah last summer. The views were breathtaking.",
    category="travel",
    subcategory="hiking",
    tags="yosemite, hiking, nature, sarah",
    location="Yosemite National Park",
    people="Sarah",
    skill_description="Personal memories and experiences",
    skill_search_examples=["Find memories about hiking", "Show me travel memories"]
)
```

**Returns:**
```json
{
  "success": true,
  "message": "Saved to memories",
  "tableName": "memories",
  "text": "I had an amazing time hiking in Yosemite...",
  "category": "travel",
  "subcategory": "hiking",
  "tags": "yosemite, hiking, nature, sarah"
}
```

---

### `add_vector_item`

Add a new item to an existing vector skill.

**Signature:**
```python
def add_vector_item(
    tableName: str,
    content: str,
    category: str = "general",
    subcategory: str = "",
    tags: str = "",
    location: str = "",
    people: str = "",
    context: str = ""
) -> str
```

**Parameters:**
- `tableName` (str, required): Name of the existing vector skill
- `content` (str, required): The text content to save
- `category` (str, optional): Category for filtering
- `subcategory` (str, optional): Subcategory for filtering
- `tags` (str, optional): Comma-separated tags
- `location` (str, optional): Location
- `people` (str, optional): People mentioned
- `context` (str, optional): Additional context

**Example Request:**
```python
add_vector_item(
    tableName="memories",
    content="Celebrated my birthday with friends at a rooftop restaurant in Brooklyn.",
    category="personal",
    tags="birthday, friends, brooklyn, celebration",
    location="Brooklyn, NY",
    people="friends"
)
```

---

### `search_vectors`

Search through a vector collection using semantic search.

**IMPORTANT USAGE PATTERN:**
1. **Always start with semantic search ONLY** (no filters) to see what results exist
2. **Only add filters in subsequent searches** if you need to narrow down too many results
3. **Filters can cause 0 results** if metadata doesn't match exactly

**Signature:**
```python
def search_vectors(
    tableName: str,
    query: str,
    limit: int = 5,
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    location: Optional[str] = None,
    people: Optional[str] = None,
    tags: Optional[str] = None,
    custom_filter: Optional[str] = None
) -> str
```

**Parameters:**
- `tableName` (str, required): Name of the vector table to search
- `query` (str, required): What to search for (semantic query)
- `limit` (int, optional): Maximum results to return (default: 5)
- `category` (str, optional): Filter by category **USE ONLY FOR REFINEMENT**
- `subcategory` (str, optional): Filter by subcategory **USE ONLY FOR REFINEMENT**
- `location` (str, optional): Filter by location **USE ONLY FOR REFINEMENT**
- `people` (str, optional): Filter by people mentioned **USE ONLY FOR REFINEMENT**
- `tags` (str, optional): Filter by tags **USE ONLY FOR REFINEMENT**
- `custom_filter` (str, optional): Custom SQL-like filter **USE ONLY FOR REFINEMENT**

**Example Requests:**
```python
# ✅ CORRECT: Start with semantic search only
search_vectors(
    tableName="favorites",
    query="my favorite bands",
    limit=10
)

# ❌ WRONG: Don't filter on first search - may get 0 results
search_vectors(
    tableName="favorites",
    query="my favorite bands",
    category="band",  # This might not match actual category value!
    limit=10
)

# ✅ CORRECT: Refine after seeing initial results
# First call returned 50 results, now narrow down:
search_vectors(
    tableName="memories",
    query="time with Sarah",
    people="Sarah",  # Now we know results exist, refine them
    limit=5
)

# ✅ CORRECT: Travel search without assuming category
search_vectors(
    tableName="memories",
    query="vacation experiences in Italy",  # Include context in query instead
    limit=10
)
```

**Returns:**
```json
{
  "success": true,
  "tableName": "memories",
  "query": "hiking mountains nature",
  "result_count": 2,
  "results": [
    {
      "text": "I had an amazing time hiking in Yosemite...",
      "category": "travel",
      "subcategory": "hiking",
      "tags": "yosemite, hiking, nature, sarah",
      "location": "Yosemite National Park",
      "people": "Sarah",
      "context": "",
      "created_at": "2025-01-15T10:30:00",
      "similarity_score": 0.892
    }
  ]
}
```

---

## 4. Web Search Tools

### `search_web`

Search the web for current information using Serper.dev Google Search API.

**Signature:**
```python
def search_web(
    query: str,
    max_results: int = 10
) -> dict
```

**Parameters:**
- `query` (str, required): The search query string
- `max_results` (int, optional): Maximum number of results (default: 10, max: 10)

**Example Request:**
```python
search_web(
    query="latest news about AI",
    max_results=5
)
```

**Returns:**
```json
{
  "success": true,
  "query": "latest news about AI",
  "answer": "AI has seen significant developments...",
  "results": [
    {
      "title": "AI Breakthrough in 2025",
      "url": "https://example.com/article",
      "content": "Recent developments in AI...",
      "published_date": "2025-01-20"
    }
  ],
  "total_results": 5,
  "search_metadata": {
    "search_time": "0.45s",
    "total_results_available": "1,250,000"
  }
}
```

**Requirements:**
- Requires `SERPER_API_KEY` environment variable

---

## Error Handling

All tools return structured error responses:

```json
{
  "success": false,
  "error": "Error description",
  "details": "Additional error details (if available)"
}
```

Common errors:
- `"User not authenticated"` - Missing or invalid auth token
- `"Table 'xyz' does not exist"` - Skill name not found
- `"skill_name must start with a lowercase letter"` - Invalid skill name format
- `"first_record is required"` - Missing required parameter for create_tabular_skill

---

## Best Practices

### Tabular Skills
1. Always call `list_skills()` before using skill-specific tools
2. Use descriptive skill names (e.g., `"meal_tracking"` not `"data"`)
3. Ask users for real data when creating skills - don't make up examples
4. Use consistent field names across related skills
5. Add helpful examples and notes when creating skills

### Vector Skills
1. Use for text-heavy, unstructured content
2. Add relevant metadata (category, tags, people, location) for better filtering
3. Use semantic queries (meaning-based) not keyword matching
4. Combine semantic search with metadata filters for precision

### General
1. Check return values for `"success": true` before processing results
2. Handle errors gracefully with user-friendly messages
3. Use appropriate skill type (tabular vs vector) based on data structure

---

## Environment Variables Required

```bash
# WorkOS Authentication
AUTHKIT_DOMAIN=your-authkit-domain

# Web Search
SERPER_API_KEY=your-serper-api-key

# Backend API
# (Used internally by the server)
```

---

## API Base URL

When implementing, use the deployed MCP server URL:
```
https://your-replit-app.replit.dev
```

All tool calls go through the MCP protocol endpoint.
