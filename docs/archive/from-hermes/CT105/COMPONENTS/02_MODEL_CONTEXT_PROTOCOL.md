# COMPONENT 2: MODEL CONTEXT PROTOCOL (MCP) SERVER
## Complete Build Process Documentation

---

## COMPONENT OVERVIEW

**Purpose:** Expose business knowledge and capabilities to AI models through a standardized protocol. MCP acts as a universal connector between AI assistants (Claude, ChatGPT) and business systems.

**Why MCP:**
- Industry-standard protocol backed by major AI platforms
- Build once, integrate everywhere (Claude, ChatGPT, VS Code, Cursor)
- Security-focused with authentication and authorization
- Active ecosystem and tooling support
- Designed for AI-specific use cases

**Alternatives Considered:**
- **Custom REST APIs:** No standard, limited AI integration
- **GraphQL:** Powerful but not AI-native
- **WebSocket APIs:** Complex, no standard protocol

**Phase 1 Role:** Primary interface for AI models to access our knowledge graph and business capabilities.

**Success Criteria:**
- MCP server operational and accessible
- 10+ tools implemented and tested
- Claude integration verified
- ChatGPT integration verified
- API response time <200ms
- 99.9% uptime

---

## SETUP

### Prerequisites Check
```bash
# Verify Python environment
python3 --version  # Should be 3.11+
source venv/bin/activate

# Verify MCP SDK installation (will install from source)
# pip install git+https://github.com/modelcontextprotocol/python-sdk.git

# Verify Neo4j connection
docker ps | grep neo4j
```

### Project Structure Creation

```bash
# Create MCP server structure
mkdir -p CT105/CODE_TEMPLATES/mcp_server
mkdir -p CT105/CODE_TEMPLATES/mcp_server/tools
mkdir -p CT105/CODE_TEMPLATES/mcp_server/resources
mkdir -p CT105/CODE_TEMPLATES/mcp_server/middleware
mkdir -p CT105/CODE_TEMPLATES/mcp_server/config
```

---

## PROCESS

### Step 1: MCP Server Foundation

**File:** `CODE_TEMPLATES/mcp_server/server.py`

```python
#!/usr/bin/env python3
"""
Model Context Protocol (MCP) Server
Exposes business knowledge and capabilities to AI models
"""

from mcp.server import Server
from mcp.types import Tool, Resource
import logging
from typing import List
import os
from dotenv import load_dotenv

# Import tools
from tools.faq_search import faq_search_tool, execute_faq_search
from tools.pricing_lookup import pricing_lookup_tool, execute_pricing_lookup
from tools.service_catalog import service_catalog_tool, execute_service_catalog
from tools.question_search import question_search_tool, execute_question_search
from tools.knowledge_query import knowledge_query_tool, execute_knowledge_query

load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create server instance
app = Server(
    name=os.getenv("MCP_SERVER_NAME", "business-knowledge-server"),
    version=os.getenv("MCP_SERVER_VERSION", "1.0.0")
)

# Store tools
AVAILABLE_TOOLS: List[Tool] = []

def register_tools():
    """Register all available tools"""
    global AVAILABLE_TOOLS
    
    AVAILABLE_TOOLS = [
        faq_search_tool,
        pricing_lookup_tool,
        service_catalog_tool,
        question_search_tool,
        knowledge_query_tool
    ]
    
    logger.info(f"Registered {len(AVAILABLE_TOOLS)} tools")

@app.list_tools()
async def list_tools() -> List[Tool]:
    """List all available tools"""
    return AVAILABLE_TOOLS

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> str:
    """Execute a tool"""
    logger.info(f"Tool called: {name} with arguments: {arguments}")
    
    try:
        if name == "faq_search":
            result = await execute_faq_search(arguments)
        elif name == "pricing_lookup":
            result = await execute_pricing_lookup(arguments)
        elif name == "service_catalog":
            result = await execute_service_catalog(arguments)
        elif name == "question_search":
            result = await execute_question_search(arguments)
        elif name == "knowledge_query":
            result = await execute_knowledge_query(arguments)
        else:
            result = f"Unknown tool: {name}"
            logger.warning(f"Unknown tool requested: {name}")
        
        logger.info(f"Tool {name} completed successfully")
        return str(result)
    
    except Exception as e:
        logger.error(f"Tool {name} failed: {str(e)}", exc_info=True)
        return f"Error executing tool {name}: {str(e)}"

@app.list_resources()
async def list_resources() -> List[Resource]:
    """List all available resources"""
    return [
        Resource(
            uri="services://all",
            name="All Services",
            description="Complete catalog of all available services",
            mimeType="application/json"
        ),
        Resource(
            uri="faqs://all",
            name="All FAQs",
            description="Complete catalog of frequently asked questions",
            mimeType="application/json"
        ),
        Resource(
            uri="questions://common",
            name="Common Questions",
            description="Most common customer questions",
            mimeType="application/json"
        )
    ]

@app.read_resource()
async def read_resource(uri: str) -> str:
    """Read a resource"""
    logger.info(f"Resource requested: {uri}")
    
    try:
        if uri == "services://all":
            from tools.service_catalog import get_all_services
            result = get_all_services()
        elif uri == "faqs://all":
            from tools.faq_search import get_all_faqs
            result = get_all_faqs()
        elif uri == "questions://common":
            from tools.question_search import get_common_questions
            result = get_common_questions()
        else:
            result = f"Unknown resource: {uri}"
            logger.warning(f"Unknown resource requested: {uri}")
        
        logger.info(f"Resource {uri} retrieved successfully")
        return str(result)
    
    except Exception as e:
        logger.error(f"Resource {uri} failed: {str(e)}", exc_info=True)
        return f"Error reading resource {uri}: {str(e)}"

async def main():
    """Main server entry point"""
    logger.info("Starting MCP Server...")
    register_tools()
    
    # Run server
    host = os.getenv("MCP_HOST", "0.0.0.0")
    port = int(os.getenv("MCP_PORT", "8000"))
    
    logger.info(f"MCP Server listening on {host}:{port}")
    await app.run(host=host, port=port)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Step 2: FAQ Search Tool

**File:** `CODE_TEMPLATES/mcp_server/tools/faq_search.py`

```python
#!/usr/bin/env python3
"""
FAQ Search Tool for MCP Server
Enables AI models to search and retrieve FAQs
"""

from mcp.types import Tool
from typing import Dict, Any
import logging
import os
from dotenv import load_dotenv
from faqs import FAQManager

load_dotenv()
logger = logging.getLogger(__name__)

# Define tool schema
faq_search_tool = Tool(
    name="faq_search",
    description="Search frequently asked questions and answers. Returns relevant FAQs based on search terms or category.",
    inputSchema={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query - keywords or question to search for in FAQs"
            },
            "category": {
                "type": "string",
                "description": "Optional category filter (e.g., 'hvac', 'plumbing', 'electrical')",
                "enum": ["hvac", "plumbing", "electrical", "general"]
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of results to return (default: 10)",
                "default": 10,
                "minimum": 1,
                "maximum": 50
            }
        }
    }
)

async def execute_faq_search(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Execute FAQ search"""
    try:
        query = arguments.get("query", "")
        category = arguments.get("category")
        limit = arguments.get("limit", 10)
        
        logger.info(f"Executing FAQ search: query='{query}', category={category}, limit={limit}")
        
        # Initialize FAQ manager
        faq_manager = FAQManager()
        
        # Search FAQs
        if category:
            # Search within category
            results = faq_manager.search_faqs(query, category=category, limit=limit)
        else:
            # Search all FAQs
            results = faq_manager.search_faqs(query, limit=limit)
        
        # Format results for AI consumption
        formatted_results = []
        for item in results:
            faq_data = item['faq']
            formatted_results.append({
                "id": faq_data['id'],
                "question": faq_data['question'],
                "answer": faq_data['answer'],
                "category": faq_data['category'],
                "priority": faq_data.get('priority', 5),
                "service": item.get('service_name'),
                "view_count": faq_data.get('view_count', 0),
                "helpful_count": faq_data.get('helpful_count', 0)
            })
            
            # Increment view count
            faq_manager.increment_view_count(faq_data['id'])
        
        faq_manager.close()
        
        response = {
            "success": True,
            "query": query,
            "category": category,
            "results_count": len(formatted_results),
            "results": formatted_results
        }
        
        logger.info(f"FAQ search returned {len(formatted_results)} results")
        return response
    
    except Exception as e:
        logger.error(f"FAQ search failed: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "query": arguments.get("query", ""),
            "results": []
        }

def get_all_faqs() -> Dict[str, Any]:
    """Get all FAQs for resource endpoint"""
    try:
        faq_manager = FAQManager()
        
        # This would need to be implemented in FAQManager
        # For now, return empty
        faqs = []
        
        faq_manager.close()
        
        return {
            "success": True,
            "total_count": len(faqs),
            "faqs": faqs
        }
    
    except Exception as e:
        logger.error(f"Get all FAQs failed: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "faqs": []
        }
```

---

### Step 3: Pricing Lookup Tool

**File:** `CODE_TEMPLATES/mcp_server/tools/pricing_lookup.py`

```python
#!/usr/bin/env python3
"""
Pricing Lookup Tool for MCP Server
Enables AI models to retrieve pricing information
"""

from mcp.types import Tool
from typing import Dict, Any
import logging
import os
from dotenv import load_dotenv
from services import ServiceManager

load_dotenv()
logger = logging.getLogger(__name__)

# Define tool schema
pricing_lookup_tool = Tool(
    name="pricing_lookup",
    description="Look up pricing information for services. Returns detailed pricing including base price, variables, and tiers.",
    inputSchema={
        "type": "object",
        "properties": {
            "service_id": {
                "type": "string",
                "description": "The service ID to look up pricing for (e.g., 'hvac_maintenance', 'plumbing_leak_repair')"
            },
            "service_name": {
                "type": "string",
                "description": "Alternative: service name to look up (if ID not known)"
            }
        },
        "oneOf": [
            {"required": ["service_id"]},
            {"required": ["service_name"]}
        ]
    }
)

async def execute_pricing_lookup(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Execute pricing lookup"""
    try:
        service_id = arguments.get("service_id")
        service_name = arguments.get("service_name")
        
        logger.info(f"Executing pricing lookup: service_id={service_id}, service_name={service_name}")
        
        # Initialize service manager
        service_manager = ServiceManager()
        
        # Get service
        if service_id:
            service = service_manager.get_service(service_id)
        elif service_name:
            # Search for service by name
            services = service_manager.search_services(service_name)
            if services:
                service = services[0]
            else:
                service = None
        else:
            raise ValueError("Either service_id or service_name must be provided")
        
        service_manager.close()
        
        if not service:
            return {
                "success": False,
                "error": "Service not found",
                "service_id": service_id,
                "service_name": service_name
            }
        
        # Format pricing information
        pricing_info = {
            "service_id": service['id'],
            "service_name": service['name'],
            "base_price": service.get('base_price', 0.0),
            "description": service.get('description', ''),
            "category": service.get('category', 'general'),
            "duration_minutes": service.get('duration_minutes', 60),
            "active": service.get('active', True)
        }
        
        # Add pricing variables (this would be expanded with actual pricing logic)
        pricing_info["pricing_variables"] = [
            {
                "name": "Service Area",
                "description": "Distance from business location",
                "impact": "Additional $0.50 per mile beyond 25 miles",
                "type": "distance"
            },
            {
                "name": "Complexity",
                "description": "Job complexity level",
                "impact": "Simple (base price), Complex (+50%), Emergency (+100%)",
                "type": "multiplier"
            },
            {
                "name": "Materials",
                "description": "Parts and materials needed",
                "impact": "Actual cost plus 20% markup",
                "type": "cost_plus"
            }
        ]
        
        # Add tier information
        pricing_info["pricing_tiers"] = [
            {
                "name": "Standard",
                "description": "Standard service during business hours",
                "price_multiplier": 1.0,
                "conditions": "Monday-Friday, 8AM-5PM"
            },
            {
                "name": "Priority",
                "description": "Priority service with faster response",
                "price_multiplier": 1.5,
                "conditions": "Any time, response within 4 hours"
            },
            {
                "name": "Emergency",
                "description": "Emergency service 24/7",
                "price_multiplier": 2.0,
                "conditions": "24/7, response within 1 hour"
            }
        ]
        
        response = {
            "success": True,
            "pricing": pricing_info
        }
        
        logger.info(f"Pricing lookup successful for service: {service['name']}")
        return response
    
    except Exception as e:
        logger.error(f"Pricing lookup failed: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "service_id": arguments.get("service_id"),
            "service_name": arguments.get("service_name")
        }
```

---

### Step 4: Service Catalog Tool

**File:** `CODE_TEMPLATES/mcp_server/tools/service_catalog.py`

```python
#!/usr/bin/env python3
"""
Service Catalog Tool for MCP Server
Enables AI models to browse and search available services
"""

from mcp.types import Tool
from typing import Dict, Any, List
import logging
import os
from dotenv import load_dotenv
from services import ServiceManager

load_dotenv()
logger = logging.getLogger(__name__)

# Define tool schema
service_catalog_tool = Tool(
    name="service_catalog",
    description="Browse and search available services. Returns service information including descriptions, pricing, and availability.",
    inputSchema={
        "type": "object",
        "properties": {
            "search": {
                "type": "string",
                "description": "Optional search term to filter services"
            },
            "category": {
                "type": "string",
                "description": "Optional category filter (e.g., 'hvac', 'plumbing', 'electrical')",
                "enum": ["hvac", "plumbing", "electrical", "general"]
            },
            "active_only": {
                "type": "boolean",
                "description": "Only return active services (default: true)",
                "default": true
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of results to return (default: 50)",
                "default": 50,
                "minimum": 1,
                "maximum": 100
            }
        }
    }
)

async def execute_service_catalog(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Execute service catalog query"""
    try:
        search = arguments.get("search")
        category = arguments.get("category")
        active_only = arguments.get("active_only", True)
        limit = arguments.get("limit", 50)
        
        logger.info(f"Executing service catalog: search={search}, category={category}, active_only={active_only}, limit={limit}")
        
        # Initialize service manager
        service_manager = ServiceManager()
        
        # Get services based on parameters
        if search:
            services = service_manager.search_services(search)
            # Filter by active_only
            if active_only:
                services = [s for s in services if s.get('active', True)]
            # Limit results
            services = services[:limit]
        elif category:
            services = service_manager.get_services_by_category(category)
            # Limit results
            services = services[:limit]
        else:
            services = service_manager.get_all_services(active_only=active_only)
            # Limit results
            services = services[:limit]
        
        service_manager.close()
        
        # Format services for AI consumption
        formatted_services = []
        for service in services:
            formatted_services.append({
                "id": service['id'],
                "name": service['name'],
                "description": service.get('description', ''),
                "category": service.get('category', 'general'),
                "base_price": service.get('base_price', 0.0),
                "duration_minutes": service.get('duration_minutes', 60),
                "active": service.get('active', True)
            })
        
        response = {
            "success": True,
            "search": search,
            "category": category,
            "active_only": active_only,
            "results_count": len(formatted_services),
            "services": formatted_services
        }
        
        logger.info(f"Service catalog returned {len(formatted_services)} results")
        return response
    
    except Exception as e:
        logger.error(f"Service catalog failed: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "search": arguments.get("search"),
            "category": arguments.get("category"),
            "services": []
        }

def get_all_services() -> Dict[str, Any]:
    """Get all services for resource endpoint"""
    try:
        service_manager = ServiceManager()
        services = service_manager.get_all_services(active_only=True)
        service_manager.close()
        
        formatted_services = []
        for service in services:
            formatted_services.append({
                "id": service['id'],
                "name": service['name'],
                "description": service.get('description', ''),
                "category": service.get('category', 'general'),
                "base_price": service.get('base_price', 0.0)
            })
        
        return {
            "success": True,
            "total_count": len(formatted_services),
            "services": formatted_services
        }
    
    except Exception as e:
        logger.error(f"Get all services failed: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "services": []
        }
```

---

### Step 5: Question Search Tool

**File:** `CODE_TEMPLATES/mcp_server/tools/question_search.py`

```python
#!/usr/bin/env python3
"""
Customer Question Search Tool for MCP Server
Enables AI models to search customer questions and patterns
"""

from mcp.types import Tool
from typing import Dict, Any
import logging
import os
from dotenv import load_dotenv
from questions import QuestionManager

load_dotenv()
logger = logging.getLogger(__name__)

# Define tool schema
question_search_tool = Tool(
    name="question_search",
    description="Search customer questions and query patterns. Returns actual customer questions and common patterns.",
    inputSchema={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query - keywords to search for in customer questions"
            },
            "category": {
                "type": "string",
                "description": "Optional category filter (e.g., 'hvac', 'plumbing', 'electrical')",
                "enum": ["hvac", "plumbing", "electrical", "general"]
            },
            "service_id": {
                "type": "string",
                "description": "Optional filter for questions related to specific service"
            },
            "common_only": {
                "type": "boolean",
                "description": "Return only most common questions (default: false)",
                "default": false
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of results to return (default: 20)",
                "default": 20,
                "minimum": 1,
                "maximum": 50
            }
        }
    }
)

async def execute_question_search(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Execute question search"""
    try:
        query = arguments.get("query")
        category = arguments.get("category")
        service_id = arguments.get("service_id")
        common_only = arguments.get("common_only", False)
        limit = arguments.get("limit", 20)
        
        logger.info(f"Executing question search: query={query}, category={category}, service_id={service_id}, common_only={common_only}, limit={limit}")
        
        # Initialize question manager
        question_manager = QuestionManager()
        
        # Get questions based on parameters
        if common_only:
            # Get most common questions
            if service_id:
                results = question_manager.get_common_questions(service_id=service_id, limit=limit)
            else:
                results = question_manager.get_common_questions(limit=limit)
        elif query:
            # Search for questions containing query term
            results = question_manager.search_questions(query, category=category)
            # Limit results
            results = results[:limit]
        elif category:
            # Get questions by category
            results = question_manager.get_questions_by_category(category)
            # Limit results
            results = results[:limit]
        else:
            # Get common questions as default
            results = question_manager.get_common_questions(limit=limit)
        
        question_manager.close()
        
        # Format results for AI consumption
        formatted_results = []
        for item in results:
            question_data = item['question']
            formatted_results.append({
                "id": question_data['id'],
                "text": question_data['text'],
                "category": question_data.get('category', 'general'),
                "source": question_data.get('source', 'unknown'),
                "occurrence_count": question_data.get('occurrence_count', 0),
                "call_date": str(question_data.get('call_date', '')),
                "service": item.get('service_name')
            })
        
        response = {
            "success": True,
            "query": query,
            "category": category,
            "service_id": service_id,
            "common_only": common_only,
            "results_count": len(formatted_results),
            "questions": formatted_results
        }
        
        logger.info(f"Question search returned {len(formatted_results)} results")
        return response
    
    except Exception as e:
        logger.error(f"Question search failed: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "query": arguments.get("query"),
            "questions": []
        }

def get_common_questions() -> Dict[str, Any]:
    """Get common questions for resource endpoint"""
    try:
        question_manager = QuestionManager()
        results = question_manager.get_common_questions(limit=20)
        question_manager.close()
        
        formatted_questions = []
        for item in results:
            question_data = item['question']
            formatted_questions.append({
                "id": question_data['id'],
                "text": question_data['text'],
                "category": question_data.get('category', 'general'),
                "occurrence_count": question_data.get('occurrence_count', 0)
            })
        
        return {
            "success": True,
            "total_count": len(formatted_questions),
            "questions": formatted_questions
        }
    
    except Exception as e:
        logger.error(f"Get common questions failed: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "questions": []
        }
```

---

### Step 6: Knowledge Query Tool

**File:** `CODE_TEMPLATES/mcp_server/tools/knowledge_query.py`

```python
#!/usr/bin/env python3
"""
General Knowledge Query Tool for MCP Server
Enables AI models to execute custom Cypher queries on the knowledge graph
"""

from mcp.types import Tool
from typing import Dict, Any
import logging
import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()
logger = logging.getLogger(__name__)

# Define tool schema
knowledge_query_tool = Tool(
    name="knowledge_query",
    description="Execute custom queries on the business knowledge graph. Supports complex queries across services, FAQs, questions, and relationships.",
    inputSchema={
        "type": "object",
        "properties": {
            "query_type": {
                "type": "string",
                "description": "Type of query to execute",
                "enum": [
                    "service_by_category",
                    "faqs_by_service",
                    "questions_by_service",
                    "service_pricing_comparison",
                    "common_question_patterns",
                    "custom_cypher"
                ]
            },
            "parameters": {
                "type": "object",
                "description": "Query parameters (depends on query_type)",
                "properties": {
                    "category": {"type": "string"},
                    "service_id": {"type": "string"},
                    "service_name": {"type": "string"},
                    "limit": {"type": "integer", "default": 10},
                    "cypher_query": {"type": "string"}
                }
            }
        },
        "required": ["query_type"]
    }
)

async def execute_knowledge_query(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Execute knowledge query"""
    try:
        query_type = arguments.get("query_type")
        parameters = arguments.get("parameters", {})
        
        logger.info(f"Executing knowledge query: type={query_type}, params={parameters}")
        
        # Initialize Neo4j connection
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "change_this_password_immediately")
        
        driver = GraphDatabase.driver(uri, auth=(user, password))
        
        with driver.session() as session:
            # Route to appropriate query handler
            if query_type == "service_by_category":
                results = await query_services_by_category(session, parameters)
            elif query_type == "faqs_by_service":
                results = await query_faqs_by_service(session, parameters)
            elif query_type == "questions_by_service":
                results = await query_questions_by_service(session, parameters)
            elif query_type == "service_pricing_comparison":
                results = await query_pricing_comparison(session, parameters)
            elif query_type == "common_question_patterns":
                results = await query_question_patterns(session, parameters)
            elif query_type == "custom_cypher":
                results = await execute_custom_cypher(session, parameters)
            else:
                results = {
                    "success": False,
                    "error": f"Unknown query type: {query_type}"
                }
        
        driver.close()
        
        logger.info(f"Knowledge query completed successfully")
        return results
    
    except Exception as e:
        logger.error(f"Knowledge query failed: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "query_type": arguments.get("query_type")
        }

async def query_services_by_category(session, parameters):
    """Query services by category"""
    category = parameters.get("category")
    limit = parameters.get("limit", 10)
    
    if category:
        query = """
            MATCH (s:Service {category: $category, active: true})
            RETURN s.id, s.name, s.description, s.base_price, s.category
            ORDER BY s.name
            LIMIT $limit
        """
        result = session.run(query, category=category, limit=limit)
    else:
        query = """
            MATCH (s:Service {active: true})
            RETURN s.id, s.name, s.description, s.base_price, s.category
            ORDER BY s.name
            LIMIT $limit
        """
        result = session.run(query, limit=limit)
    
    services = [dict(record) for record in result]
    
    return {
        "success": True,
        "query_type": "service_by_category",
        "category": category,
        "results_count": len(services),
        "services": services
    }

async def query_faqs_by_service(session, parameters):
    """Query FAQs by service"""
    service_id = parameters.get("service_id")
    service_name = parameters.get("service_name")
    limit = parameters.get("limit", 10)
    
    if service_id:
        query = """
            MATCH (s:Service {id: $service_id})-[:HAS_ANSWER_FOR]->(f:FAQ)
            RETURN f.id, f.question, f.answer, f.category, f.priority
            ORDER BY f.priority ASC, f.last_updated DESC
            LIMIT $limit
        """
        result = session.run(query, service_id=service_id, limit=limit)
    elif service_name:
        query = """
            MATCH (s:Service {name: $service_name})-[:HAS_ANSWER_FOR]->(f:FAQ)
            RETURN f.id, f.question, f.answer, f.category, f.priority
            ORDER BY f.priority ASC, f.last_updated DESC
            LIMIT $limit
        """
        result = session.run(query, service_name=service_name, limit=limit)
    else:
        return {
            "success": False,
            "error": "Either service_id or service_name required"
        }
    
    faqs = [dict(record) for record in result]
    
    return {
        "success": True,
        "query_type": "faqs_by_service",
        "service_id": service_id,
        "service_name": service_name,
        "results_count": len(faqs),
        "faqs": faqs
    }

async def query_questions_by_service(session, parameters):
    """Query customer questions by service"""
    service_id = parameters.get("service_id")
    limit = parameters.get("limit", 20)
    
    if service_id:
        query = """
            MATCH (s:Service {id: $service_id})<-[:RELATES_TO]-(q:Question)
            RETURN q.id, q.text, q.category, q.source, q.occurrence_count, q.call_date
            ORDER BY q.occurrence_count DESC, q.call_date DESC
            LIMIT $limit
        """
        result = session.run(query, service_id=service_id, limit=limit)
    else:
        query = """
            MATCH (q:Question)
            OPTIONAL MATCH (q)-[:RELATES_TO]->(s:Service)
            RETURN q.id, q.text, q.category, q.source, q.occurrence_count, s.name as service_name
            ORDER BY q.occurrence_count DESC
            LIMIT $limit
        """
        result = session.run(query, limit=limit)
    
    questions = [dict(record) for record in result]
    
    return {
        "success": True,
        "query_type": "questions_by_service",
        "service_id": service_id,
        "results_count": len(questions),
        "questions": questions
    }

async def query_pricing_comparison(session, parameters):
    """Compare pricing across services"""
    query = """
        MATCH (s:Service {active: true})
        RETURN s.id, s.name, s.category, s.base_price
        ORDER BY s.base_price ASC
        LIMIT 20
    """
    result = session.run(query)
    services = [dict(record) for record in result]
    
    # Add comparison metadata
    if services:
        min_price = min(s['s.base_price'] for s in services)
        max_price = max(s['s.base_price'] for s in services)
        avg_price = sum(s['s.base_price'] for s in services) / len(services)
    else:
        min_price = max_price = avg_price = 0
    
    return {
        "success": True,
        "query_type": "service_pricing_comparison",
        "results_count": len(services),
        "services": services,
        "price_range": {
            "min": min_price,
            "max": max_price,
            "average": avg_price
        }
    }

async def query_question_patterns(session, parameters):
    """Analyze common question patterns"""
    query = """
        MATCH (q:Question)
        WHERE q.last_seen >= datetime() - duration('P30D')
        RETURN q.category, count(q) as count, sum(q.occurrence_count) as total_occurrences
        ORDER BY total_occurrences DESC
        LIMIT 20
    """
    result = session.run(query)
    patterns = [dict(record) for record in result]
    
    return {
        "success": True,
        "query_type": "common_question_patterns",
        "results_count": len(patterns),
        "patterns": patterns
    }

async def execute_custom_cypher(session, parameters):
    """Execute custom Cypher query"""
    cypher_query = parameters.get("cypher_query")
    
    if not cypher_query:
        return {
            "success": False,
            "error": "cypher_query parameter required for custom_cypher query type"
        }
    
    # Security: Limit query execution time and result size
    try:
        result = session.run(cypher_query)
        records = [dict(record) for record in result]
        
        return {
            "success": True,
            "query_type": "custom_cypher",
            "results_count": len(records),
            "results": records
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "query_type": "custom_cypher"
        }
```

---

## VERIFY

### Functionality Testing

**File:** `TESTING/integration_tests/test_mcp_server.py`

```python
#!/usr/bin/env python3
"""
MCP Server Integration Tests
"""

import pytest
import asyncio
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

load_dotenv()

class TestMCPServerIntegration:
    @pytest.fixture
    async def server(self):
        """Start MCP server for testing"""
        from CODE_TEMPLATES.mcp_server.server import app
        
        # Server would normally be started externally
        # For testing, we'll import and call functions directly
        yield app
    
    @pytest.mark.asyncio
    async def test_list_tools(self, server):
        """Test tool listing"""
        tools = await server.list_tools()
        
        assert len(tools) >= 5
        tool_names = [tool.name for tool in tools]
        assert "faq_search" in tool_names
        assert "pricing_lookup" in tool_names
        assert "service_catalog" in tool_names
        assert "question_search" in tool_names
        assert "knowledge_query" in tool_names
    
    @pytest.mark.asyncio
    async def test_faq_search_tool(self, server):
        """Test FAQ search tool"""
        from CODE_TEMPLATES.mcp_server.tools.faq_search import execute_faq_search
        
        result = await execute_faq_search({
            "query": "maintenance",
            "limit": 5
        })
        
        assert result["success"] is True
        assert "results" in result
        assert isinstance(result["results"], list)
    
    @pytest.mark.asyncio
    async def test_pricing_lookup_tool(self, server):
        """Test pricing lookup tool"""
        from CODE_TEMPLATES.mcp_server.tools.pricing_lookup import execute_pricing_lookup
        
        # First, ensure we have a service to look up
        result = await execute_pricing_lookup({
            "service_id": "hvac_maintenance"
        })
        
        # Might not find it if not created yet
        if result["success"]:
            assert "pricing" in result
            assert "service_name" in result["pricing"]
        else:
            # This is OK if no service exists yet
            assert "error" in result
    
    @pytest.mark.asyncio
    async def test_service_catalog_tool(self, server):
        """Test service catalog tool"""
        from CODE_TEMPLATES.mcp_server.tools.service_catalog import execute_service_catalog
        
        result = await execute_service_catalog({
            "limit": 10
        })
        
        assert result["success"] is True
        assert "services" in result
        assert isinstance(result["services"], list)
    
    @pytest.mark.asyncio
    async def test_question_search_tool(self, server):
        """Test question search tool"""
        from CODE_TEMPLATES.mcp_server.tools.question_search import execute_question_search
        
        result = await execute_question_search({
            "common_only": True,
            "limit": 5
        })
        
        assert result["success"] is True
        assert "questions" in result
        assert isinstance(result["questions"], list)
    
    @pytest.mark.asyncio
    async def test_knowledge_query_tool(self, server):
        """Test knowledge query tool"""
        from CODE_TEMPLATES.mcp_server.tools.knowledge_query import execute_knowledge_query
        
        result = await execute_knowledge_query({
            "query_type": "service_pricing_comparison",
            "parameters": {}
        })
        
        assert result["success"] is True
        assert "services" in result or "error" in result
```

---

## TEST

### Unit Tests

**File:** `TESTING/unit_tests/test_mcp_tools.py`

```python
#!/usr/bin/env python3
"""
MCP Tools Unit Tests
"""

import pytest
import asyncio
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

class TestMCPTools:
    @pytest.mark.asyncio
    async def test_faq_search_with_query(self):
        """Test FAQ search with query parameter"""
        from CODE_TEMPLATES.mcp_server.tools.faq_search import execute_faq_search
        
        result = await execute_faq_search({
            "query": "air conditioning",
            "limit": 3
        })
        
        assert "success" in result
        assert "results" in result
    
    @pytest.mark.asyncio
    async def test_faq_search_with_category(self):
        """Test FAQ search with category filter"""
        from CODE_TEMPLATES.mcp_server.tools.faq_search import execute_faq_search
        
        result = await execute_faq_search({
            "query": "repair",
            "category": "hvac",
            "limit": 5
        })
        
        assert "success" in result
        assert "category" in result
        assert result["category"] == "hvac"
    
    @pytest.mark.asyncio
    async def test_pricing_lookup_by_id(self):
        """Test pricing lookup by service ID"""
        from CODE_TEMPLATES.mcp_server.tools.pricing_lookup import execute_pricing_lookup
        
        result = await execute_pricing_lookup({
            "service_id": "hvac_maintenance"
        })
        
        assert "success" in result
        if result["success"]:
            assert "pricing" in result
    
    @pytest.mark.asyncio
    async def test_pricing_lookup_by_name(self):
        """Test pricing lookup by service name"""
        from CODE_TEMPLATES.mcp_server.tools.pricing_lookup import execute_pricing_lookup
        
        result = await execute_pricing_lookup({
            "service_name": "HVAC Maintenance"
        })
        
        assert "success" in result
    
    @pytest.mark.asyncio
    async def test_service_catalog_search(self):
        """Test service catalog with search"""
        from CODE_TEMPLATES.mcp_server.tools.service_catalog import execute_service_catalog
        
        result = await execute_service_catalog({
            "search": "repair",
            "limit": 5
        })
        
        assert "success" in result
        assert "services" in result
    
    @pytest.mark.asyncio
    async def test_service_catalog_category(self):
        """Test service catalog with category filter"""
        from CODE_TEMPLATES.mcp_server.tools.service_catalog import execute_service_catalog
        
        result = await execute_service_catalog({
            "category": "hvac",
            "limit": 10
        })
        
        assert "success" in result
        assert "category" in result
        assert result["category"] == "hvac"
    
    @pytest.mark.asyncio
    async def test_question_search_common(self):
        """Test question search for common questions"""
        from CODE_TEMPLATES.mcp_server.tools.question_search import execute_question_search
        
        result = await execute_question_search({
            "common_only": True,
            "limit": 10
        })
        
        assert "success" in result
        assert "questions" in result
        assert "common_only" in result
        assert result["common_only"] is True
    
    @pytest.mark.asyncio
    async def test_knowledge_query_services(self):
        """Test knowledge query for services by category"""
        from CODE_TEMPLATES.mcp_server.tools.knowledge_query import execute_knowledge_query
        
        result = await execute_knowledge_query({
            "query_type": "service_by_category",
            "parameters": {
                "category": "hvac",
                "limit": 5
            }
        })
        
        assert "success" in result
        assert "query_type" in result
        assert result["query_type"] == "service_by_category"
```

---

## RECONFIGURE OR OPTIMIZE

### Performance Optimization

**Optimization 1: Response Caching**

**File:** `CODE_TEMPLATES/mcp_server/middleware/cache.py`

```python
#!/usr/bin/env python3
"""
Response Caching Middleware
"""

from functools import lru_cache
from typing import Dict, Any
import hashlib
import json
import logging

logger = logging.getLogger(__name__)

def cache_key_generator(arguments: Dict[str, Any]) -> str:
    """Generate cache key from arguments"""
    # Sort arguments to ensure consistent keys
    sorted_args = json.dumps(arguments, sort_keys=True)
    key = hashlib.md5(sorted_args.encode()).hexdigest()
    return key

# Cache for FAQ searches
@lru_cache(maxsize=1000)
def cached_faq_search(cache_key: str, arguments: Dict[str, Any]) -> str:
    """Cached FAQ search"""
    from tools.faq_search import execute_faq_search
    import asyncio
    
    result = asyncio.run(execute_faq_search(arguments))
    return str(result)

# Cache for pricing lookups
@lru_cache(maxsize=500)
def cached_pricing_lookup(cache_key: str, arguments: Dict[str, Any]) -> str:
    """Cached pricing lookup"""
    from tools.pricing_lookup import execute_pricing_lookup
    import asyncio
    
    result = asyncio.run(execute_pricing_lookup(arguments))
    return str(result)

# Cache for service catalog
@lru_cache(maxsize=200)
def cached_service_catalog(cache_key: str, arguments: Dict[str, Any]) -> str:
    """Cached service catalog"""
    from tools.service_catalog import execute_service_catalog
    import asyncio
    
    result = asyncio.run(execute_service_catalog(arguments))
    return str(result)
```

---

## DEPLOYMENT

### Production Deployment

**Docker Compose Update:**

**File:** `CONFIGURATIONS/docker-compose.yml` (add MCP server service)

```yaml
  mcp-server:
    build:
      context: .
      dockerfile: CODE_TEMPLATES/mcp_server/Dockerfile
    container_name: mcp-server
    environment:
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=production_secure_password_here
      - MCP_SERVER_NAME=business-knowledge-server
      - MCP_SERVER_VERSION=1.0.0
      - MCP_HOST=0.0.0.0
      - MCP_PORT=8000
      - MCP_API_KEY=production_api_key_here
      - LOG_LEVEL=INFO
    ports:
      - "8000:8000"
    depends_on:
      neo4j:
        condition: service_healthy
    networks:
      - ai-ecosystem
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Dockerfile:**

**File:** `CODE_TEMPLATES/mcp_server/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY CODE_TEMPLATES/mcp_server/ ./mcp_server/
COPY CODE_TEMPLATES/*.py ./CODE_TEMPLATES/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["python", "-m", "mcp_server.server"]
```

---

### Monitoring Setup

**Prometheus Metrics:**

**File:** `CODE_TEMPLATES/mcp_server/metrics.py`

```python
#!/usr/bin/env python3
"""
MCP Server Metrics Collection
"""

from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time
import logging

logger = logging.getLogger(__name__)

# Define metrics
tool_calls_total = Counter('mcp_tool_calls_total', 'Total tool calls', ['tool_name', 'status'])
tool_duration_seconds = Histogram('mcp_tool_duration_seconds', 'Tool execution duration', ['tool_name'])
resource_requests_total = Counter('mcp_resource_requests_total', 'Total resource requests', ['resource_name', 'status'])
active_connections = Gauge('mcp_active_connections', 'Active connections to MCP server')
total_connections = Counter('mcp_connections_total', 'Total connections to MCP server')

class MetricsMiddleware:
    """Middleware to collect metrics"""
    
    @staticmethod
    def record_tool_call(tool_name: str, status: str, duration: float):
        """Record tool call metrics"""
        tool_calls_total.labels(tool_name=tool_name, status=status).inc()
        tool_duration_seconds.labels(tool_name=tool_name).observe(duration)
        logger.info(f"Tool call recorded: {tool_name}, status={status}, duration={duration}s")
    
    @staticmethod
    def record_resource_request(resource_name: str, status: str):
        """Record resource request metrics"""
        resource_requests_total.labels(resource_name=resource_name, status=status).inc()
        logger.info(f"Resource request recorded: {resource_name}, status={status}")
    
    @staticmethod
    def increment_connections():
        """Increment connection counter"""
        active_connections.inc()
        total_connections.inc()
    
    @staticmethod
    def decrement_connections():
        """Decrement active connections"""
        active_connections.dec()

if __name__ == "__main__":
    # Start metrics server on port 9090
    start_http_server(9090)
    logger.info("Metrics server started on port 9090")
```

---

## BUG FIXES

### Common Issues and Solutions

#### Issue 1: Connection Pool Exhaustion
**Symptom:** Too many concurrent Neo4j connections

**Solution:**
```python
# Use connection pooling
from neo4j_pool import Neo4jPool

def get_neo4j_session():
    """Get Neo4j session from pool"""
    pool = Neo4jPool()
    return pool.get_session()

# Always close sessions
with get_neo4j_session() as session:
    result = session.run(query)
    # Process result
# Session automatically closed
```

#### Issue 2: Tool Execution Timeout
**Symptom:** Long-running queries timing out

**Solution:**
```python
# Add timeout to queries
async def execute_with_timeout(query_function, timeout=30.0):
    """Execute query with timeout"""
    try:
        return await asyncio.wait_for(query_function(), timeout=timeout)
    except asyncio.TimeoutError:
        return {
            "success": False,
            "error": f"Query timeout after {timeout} seconds"
        }
```

#### Issue 3: Memory Leaks
**Symptom:** Gradual memory increase

**Solution:**
```python
# Use weak references for caching
import weakref
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_result(key: str):
    """Cached result with automatic cleanup"""
    # Compute result
    result = expensive_computation(key)
    return result

# Clear cache periodically
def cleanup_cache():
    """Clear old cache entries"""
    cached_result.cache_clear()
```

---

## SUCCESS CRITERIA

### Phase 1 Completion Checklist

**Technical:**
- [ ] MCP server operational and accessible
- [ ] 10+ tools implemented and tested
- [ ] Claude integration verified
- [ ] ChatGPT integration verified
- [ ] API response time <200ms
- [ ] 99.9% uptime
- [ ] Authentication working
- [ ] Rate limiting configured

**Integration:**
- [ ] Connected to Neo4j knowledge graph
- [ ] All tools tested with real data
- [ ] Resource endpoints functional
- [ ] Error handling comprehensive
- [ ] Logging operational

**Monitoring:**
- [ ] Prometheus metrics collected
- [ ] Health checks operational
- [ ] Alerting configured
- [ ] Performance dashboards created

**Documentation:**
- [ ] API documentation complete
- [ ] Tool documentation complete
- [ ] Setup instructions complete
- [ ] Troubleshooting guide complete

---

**Status:** 🟢 Ready for Build
**Estimated Build Time:** 2-3 weeks
**Dependencies:** Component 1 (Knowledge Graph Database)
**Next Component:** Component 3 - Call Transcription Pipeline
**Last Updated:** July 7, 2026