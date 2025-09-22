# Notion MCP (Model Context Protocol) Integration

This integration allows you to create tasks and projects in Notion using natural language commands through your AI assistant.

## Setup Instructions

### 1. Create a Notion Integration

1. Go to [Notion Developers](https://developers.notion.com/)
2. Click "Create a new integration"
3. Give your integration a name (e.g., "AI Task Creator")
4. Select the appropriate workspace
5. Choose the integration type (Internal integration is recommended)
6. Copy the **Internal Integration Token** - this will be your `NOTION_API_TOKEN`

### 2. Create a Notion Database

1. Create a new database in Notion (or use an existing one)
2. The database should have the following properties (you can customize these):
   - **Name** (Title property - required)
   - **Description** (Rich text)
   - **Status** (Select: Todo, In Progress, Done, etc.)
   - **Due Date** (Date)
   - **Priority** (Select: Low, Medium, High)
   - **Type** (Select: Task, Project)

### 3. Share Database with Integration

1. Open your database in Notion
2. Click the **Share** button
3. Search for your integration by name
4. Grant access to the integration
5. Copy the **Database ID** from the URL (the long string between the last `/` and `?`)

### 4. Configure Environment Variables

Add these environment variables to your backend `.env` file:

```bash
NOTION_API_TOKEN=your_integration_token_here
NOTION_DATABASE_ID=your_database_id_here
```

### 5. Restart Your Backend

Restart your backend server to load the new environment variables.

## Usage

### Natural Language Commands

You can use natural language to create tasks and projects:

#### Task Examples:
- "Create a task to review the quarterly budget"
- "Add task: Call client about project update due tomorrow"
- "Remind me to finish the report by Friday high priority"
- "Need to schedule team meeting next week"

#### Project Examples:
- "Create a new project called Website Redesign"
- "Start project: Mobile App Development"
- "Make project Marketing Campaign with high priority"

### API Endpoints

#### Process Natural Language Command
```http
POST /api/notion/command
Content-Type: application/json

{
  "command": "Create a task to review the budget by Friday"
}
```

#### Create Task Directly
```http
POST /api/notion/tasks
Content-Type: application/json

{
  "title": "Review Budget",
  "description": "Review the quarterly budget report",
  "status": "Todo",
  "dueDate": "2024-01-31",
  "priority": "High"
}
```

#### Create Project Directly
```http
POST /api/notion/projects
Content-Type: application/json

{
  "name": "Website Redesign",
  "description": "Complete redesign of company website",
  "status": "Planning",
  "startDate": "2024-02-01",
  "endDate": "2024-03-01"
}
```

#### List Tasks
```http
GET /api/notion/tasks
GET /api/notion/tasks?status=Todo
```

#### Update Task
```http
PUT /api/notion/tasks/{taskId}
Content-Type: application/json

{
  "status": "In Progress",
  "description": "Updated description"
}
```

## Frontend Integration

The `NotionMCP` React component provides a complete UI for interacting with the Notion integration:

```tsx
import { NotionMCP } from './components/Notion/NotionMCP';

// Use in your app
<NotionMCP />
```

## Command Parsing Features

The system automatically extracts:
- **Task/Project Type**: Distinguishes between tasks and projects
- **Titles/Names**: Extracts the main title or name
- **Due Dates**: Recognizes dates, relative terms (tomorrow, next week)
- **Priority**: Identifies priority levels (high, medium, low, urgent)
- **Status**: Recognizes status keywords (in progress, todo, done)
- **Description**: Uses remaining text as description when applicable

## Error Handling

The system provides clear error messages for:
- Missing configuration
- Invalid commands
- API failures
- Network issues

## Security Considerations

- Store API tokens securely as environment variables
- Never commit tokens to version control
- Use HTTPS for production deployments
- Consider rate limiting for API endpoints

## Troubleshooting

### "Notion integration not configured"
- Verify `NOTION_API_TOKEN` and `NOTION_DATABASE_ID` are set in `.env`
- Restart the backend server
- Check that the integration has access to the database

### "Failed to create task/project"
- Verify the database schema matches expected properties
- Check that the integration has write permissions
- Review Notion API rate limits

### Command not recognized
- Try rephrasing the command
- Use simpler language
- Check the examples in the component

## Database Schema

Your Notion database should have these properties for full functionality:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| Name | Title | Yes | Task/project title |
| Description | Text | No | Detailed description |
| Status | Select | No | Current status (Todo, In Progress, Done, etc.) |
| Due Date | Date | No | When the task is due |
| Priority | Select | No | Priority level (Low, Medium, High) |
| Type | Select | No | Task or Project classification |

## Extending the Integration

You can extend this integration by:
- Adding more command patterns
- Supporting additional Notion properties
- Integrating with other Notion databases
- Adding voice command support
- Creating custom workflows

## Support

For issues with the Notion integration:
1. Check the backend logs for detailed error messages
2. Verify your Notion integration permissions
3. Test the Notion API directly with your credentials
4. Review the Notion API documentation

---

This MCP integration provides a seamless way to create and manage tasks and projects in Notion using natural language commands through your AI assistant.
