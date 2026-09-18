# COMPONENT 1: KNOWLEDGE GRAPH DATABASE (Neo4j)
## Complete Build Process Documentation

---

## COMPONENT OVERVIEW

**Purpose:** Central repository for structured business knowledge that AI agents can query reliably. Knowledge graphs excel at representing complex relationships between services, pricing, FAQs, and business entities.

**Why Neo4j:**
- Industry-leading graph database with mature Cypher query language
- Excellent for hierarchical and networked data
- Strong AI ecosystem integration (LangChain, LlamaIndex)
- Active community and enterprise support
- Supports both self-hosted and cloud deployment

**Alternatives Considered:**
- **Weaviate:** Better for vector search, weaker for complex relationships
- **Pinecone:** Excellent for vector similarity, no graph capabilities
- **Supabase:** Good relational + vector, limited graph features

**Phase 1 Role:** Foundation for all other components. All tools, agents, and systems will query this knowledge graph.

**Success Criteria:**
- All core entities defined and implemented
- Relationships established and validated
- Query performance <100ms for common queries
- Data integrity >99%
- 500+ nodes, 1,000+ edges by end of Phase 1

---

## SETUP

### Prerequisites Check
```bash
# Check Python version
python3 --version  # Should be 3.11+

# Check Docker
docker --version  # Should be 20.10+

# Check available memory
free -h  # Should have 8GB+ available

# Check disk space
df -h  # Should have 50GB+ available
```

### Installation Options

#### Option A: Docker (Recommended for Development)
```bash
# Create Docker network
docker network create ai-ecosystem

# Create data volume
docker volume create neo4j-data

# Run Neo4j container
docker run -d \
  --name neo4j \
  --network ai-ecosystem \
  -p 7474:7474 \
  -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/change_this_password_immediately \
  -e NEO4J_PLUGINS='["apoc"]' \
  -e NEO4J_dbms_memory_heap_initial__size=512m \
  -e NEO4J_dbms_memory_heap_max__size=2g \
  -e NEO4J_dbms_memory_pagecache_size=1g \
  -v neo4j-data:/data \
  neo4j:5.15-community

# Wait for Neo4j to start (30-60 seconds)
sleep 45

# Verify Neo4j is running
curl http://localhost:7474

# Test connection
docker exec -it neo4j cypher-shell -u neo4j -p change_this_password_immediately
```

#### Option B: Local Installation (Production)
```bash
# For Ubuntu/Debian
wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
echo 'deb https://debian.neo4j.com stable latest' | sudo tee /etc/apt/sources.list.d/neo4j.list
sudo apt update
sudo apt install neo4j

# Start service
sudo systemctl start neo4j
sudo systemctl enable neo4j

# Set initial password
sudo -u neo4j neo4j-admin set-initial-password change_this_password_immediately
```

#### Option C: Neo4j AuraDB (Cloud - Managed)
```bash
# Sign up at https://aura.neo4j.com
# Create free instance (1 instance, 200k nodes)
# Get connection string: bolt+ssc://xxxx.databases.neo4j.io:7687
# Get credentials
# Skip to verification step
```

### Python Driver Installation
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Neo4j driver
pip install neo4j pydantic python-dotenv

# Verify installation
python3 -c "from neo4j import GraphDatabase; print('Neo4j driver installed successfully')"
```

---

## PROCESS

### Step 1: Initial Database Setup

**File:** `CODE_TEMPLATES/neo4j_setup.py`

```python
#!/usr/bin/env python3
"""
Neo4j Initial Setup Script
Creates database schema, constraints, and indexes
"""

from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

class Neo4jSetup:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "change_this_password_immediately")
        self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
    
    def close(self):
        self.driver.close()
    
    def create_constraints(self):
        """Create uniqueness constraints for entities"""
        constraints = [
            # Service constraints
            "CREATE CONSTRAINT service_id IF NOT EXISTS FOR (s:Service) REQUIRE s.id IS UNIQUE",
            "CREATE CONSTRAINT service_name IF NOT EXISTS FOR (s:Service) REQUIRE s.name IS UNIQUE",
            
            # FAQ constraints
            "CREATE CONSTRAINT faq_id IF NOT EXISTS FOR (f:FAQ) REQUIRE f.id IS UNIQUE",
            
            # Pricing constraints
            "CREATE CONSTRAINT pricing_id IF NOT EXISTS FOR (p:Pricing) REQUIRE p.id IS UNIQUE",
            
            # Question constraints
            "CREATE CONSTRAINT question_id IF NOT EXISTS FOR (q:Question) REQUIRE q.id IS UNIQUE",
            
            # Customer constraints
            "CREATE CONSTRAINT customer_id IF NOT EXISTS FOR (c:Customer) REQUIRE c.id IS UNIQUE",
            
            # Staff constraints
            "CREATE CONSTRAINT staff_id IF NOT EXISTS FOR (st:Staff) REQUIRE st.id IS UNIQUE",
            
            # Case Study constraints
            "CREATE CONSTRAINT case_study_id IF NOT EXISTS FOR (cs:CaseStudy) REQUIRE cs.id IS UNIQUE"
        ]
        
        with self.driver.session() as session:
            for constraint in constraints:
                try:
                    session.run(constraint)
                    print(f"✓ Created: {constraint}")
                except Exception as e:
                    print(f"✗ Failed: {constraint}")
                    print(f"  Error: {e}")
    
    def create_indexes(self):
        """Create indexes for common query patterns"""
        indexes = [
            # Service indexes
            "CREATE INDEX service_category IF NOT EXISTS FOR (s:Service) ON (s.category)",
            "CREATE INDEX service_base_price IF NOT EXISTS FOR (s:Service) ON (s.base_price)",
            
            # FAQ indexes
            "CREATE INDEX faq_category IF NOT EXISTS FOR (f:FAQ) ON (f.category)",
            "CREATE INDEX faq_updated IF NOT EXISTS FOR (f:FAQ) ON (f.last_updated)",
            
            # Question indexes
            "CREATE INDEX question_category IF NOT EXISTS FOR (q:Question) ON (q.category)",
            "CREATE INDEX question_source IF NOT EXISTS FOR (q:Question) ON (q.source)",
            "CREATE INDEX question_date IF NOT EXISTS FOR (q:Question) ON (q.call_date)",
            
            # Pricing indexes
            "CREATE INDEX pricing_service_id IF NOT EXISTS FOR (p:Pricing) ON (p.service_id)",
            
            # Staff indexes
            "CREATE INDEX staff_specialization IF NOT EXISTS FOR (st:Staff) ON (st.specialization)"
        ]
        
        with self.driver.session() as session:
            for index in indexes:
                try:
                    session.run(index)
                    print(f"✓ Created: {index}")
                except Exception as e:
                    print(f"✗ Failed: {index}")
                    print(f"  Error: {e}")
    
    def verify_setup(self):
        """Verify database setup"""
        with self.driver.session() as session:
            # Check constraints
            constraints = session.run("SHOW CONSTRAINTS").data()
            print(f"\n✓ Constraints created: {len(constraints)}")
            
            # Check indexes
            indexes = session.run("SHOW INDEXES").data()
            print(f"✓ Indexes created: {len(indexes)}")
            
            # Check node counts
            service_count = session.run("MATCH (s:Service) RETURN count(s) as count").single()['count']
            faq_count = session.run("MATCH (f:FAQ) RETURN count(f) as count").single()['count']
            
            print(f"\nCurrent Node Counts:")
            print(f"  Services: {service_count}")
            print(f"  FAQs: {faq_count}")

if __name__ == "__main__":
    setup = Neo4jSetup()
    
    print("Starting Neo4j Setup...")
    print("\n1. Creating Constraints...")
    setup.create_constraints()
    
    print("\n2. Creating Indexes...")
    setup.create_indexes()
    
    print("\n3. Verifying Setup...")
    setup.verify_setup()
    
    print("\n✓ Setup Complete!")
    setup.close()
```

**Execution:**
```bash
# Create environment file
cat > .env << EOF
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=change_this_password_immediately
EOF

# Run setup script
python3 CODE_TEMPLATES/neo4j_setup.py
```

---

### Step 2: Service Entity Implementation

**File:** `CODE_TEMPLATES/services.py`

```python
#!/usr/bin/env python3
"""
Service Entity Management
Handles CRUD operations for Service entities
"""

from neo4j import GraphDatabase
from datetime import datetime
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class ServiceManager:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "change_this_password_immediately")
        self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
    
    def close(self):
        self.driver.close()
    
    def create_service(self, service_data: Dict) -> str:
        """Create a new service"""
        with self.driver.session() as session:
            result = session.run("""
                MERGE (s:Service {id: $id})
                SET s.name = $name,
                    s.description = $description,
                    s.category = $category,
                    s.base_price = $base_price,
                    s.duration_minutes = $duration_minutes,
                    s.active = $active,
                    s.created_at = datetime(),
                    s.updated_at = datetime()
                RETURN s.id as id
            """, 
            id=service_data['id'],
            name=service_data['name'],
            description=service_data.get('description', ''),
            category=service_data.get('category', 'general'),
            base_price=service_data.get('base_price', 0.0),
            duration_minutes=service_data.get('duration_minutes', 60),
            active=service_data.get('active', True)
            )
            return result.single()['id']
    
    def get_service(self, service_id: str) -> Optional[Dict]:
        """Get a service by ID"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (s:Service {id: $id})
                RETURN s
            """, id=service_id)
            
            record = result.single()
            if record:
                return dict(record['s'])
            return None
    
    def get_all_services(self, active_only: bool = True) -> List[Dict]:
        """Get all services"""
        query = """
            MATCH (s:Service)
        """
        if active_only:
            query += " WHERE s.active = true"
        
        query += " RETURN s ORDER BY s.name"
        
        with self.driver.session() as session:
            result = session.run(query)
            return [dict(record['s']) for record in result]
    
    def get_services_by_category(self, category: str) -> List[Dict]:
        """Get services by category"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (s:Service {category: $category, active: true})
                RETURN s
                ORDER BY s.name
            """, category=category)
            return [dict(record['s']) for record in result]
    
    def update_service(self, service_id: str, update_data: Dict) -> bool:
        """Update a service"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (s:Service {id: $id})
                SET s += $updates,
                    s.updated_at = datetime()
                RETURN count(s) as count
            """, 
            id=service_id,
            updates=update_data
            )
            return result.single()['count'] > 0
    
    def delete_service(self, service_id: str) -> bool:
        """Delete a service (soft delete by setting active=false)"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (s:Service {id: $id})
                SET s.active = false,
                    s.updated_at = datetime(),
                    s.deleted_at = datetime()
                RETURN count(s) as count
            """, id=service_id)
            return result.single()['count'] > 0
    
    def search_services(self, search_term: str) -> List[Dict]:
        """Search services by name or description"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (s:Service)
                WHERE s.active = true
                AND (toLower(s.name) CONTAINS toLower($term)
                     OR toLower(s.description) CONTAINS toLower($term))
                RETURN s
                ORDER BY s.name
                LIMIT 20
            """, term=search_term)
            return [dict(record['s']) for record in result]
    
    def get_service_stats(self) -> Dict:
        """Get service statistics"""
        with self.driver.session() as session:
            total_count = session.run("""
                MATCH (s:Service)
                WHERE s.active = true
                RETURN count(s) as count
            """).single()['count']
            
            category_counts = session.run("""
                MATCH (s:Service)
                WHERE s.active = true
                RETURN s.category as category, count(s) as count
                ORDER BY count DESC
            """).data()
            
            return {
                'total_count': total_count,
                'by_category': category_counts
            }
```

**Test Data File:** `CODE_TEMPLATES/sample_services.json`

```json
[
    {
        "id": "hvac_maintenance",
        "name": "HVAC Maintenance",
        "description": "Regular maintenance and tune-up for heating and cooling systems",
        "category": "hvac",
        "base_price": 149.00,
        "duration_minutes": 90,
        "active": true
    },
    {
        "id": "hvac_repair",
        "name": "HVAC Repair",
        "description": "Diagnostic and repair services for HVAC systems",
        "category": "hvac",
        "base_price": 199.00,
        "duration_minutes": 120,
        "active": true
    },
    {
        "id": "plumbing_leak_repair",
        "name": "Plumbing Leak Repair",
        "description": "Detection and repair of water leaks",
        "category": "plumbing",
        "base_price": 149.00,
        "duration_minutes": 60,
        "active": true
    },
    {
        "id": "electrical_outlet_repair",
        "name": "Electrical Outlet Repair",
        "description": "Repair and replacement of electrical outlets",
        "category": "electrical",
        "base_price": 99.00,
        "duration_minutes": 45,
        "active": true
    }
]
```

**Import Script:** `CODE_TEMPLATES/import_services.py`

```python
#!/usr/bin/env python3
"""
Import sample services into Neo4j
"""

import json
from services import ServiceManager

def import_services():
    # Load sample services
    with open('CODE_TEMPLATES/sample_services.json', 'r') as f:
        services = json.load(f)
    
    # Create service manager
    manager = ServiceManager()
    
    # Import services
    imported_count = 0
    for service in services:
        service_id = manager.create_service(service)
        print(f"✓ Imported: {service['name']} (ID: {service_id})")
        imported_count += 1
    
    print(f"\n✓ Total services imported: {imported_count}")
    
    # Display statistics
    stats = manager.get_service_stats()
    print(f"\nService Statistics:")
    print(f"  Total: {stats['total_count']}")
    print(f"  By Category:")
    for cat in stats['by_category']:
        print(f"    {cat['category']}: {cat['count']}")
    
    manager.close()

if __name__ == "__main__":
    import_services()
```

---

### Step 3: FAQ Entity Implementation

**File:** `CODE_TEMPLATES/faqs.py`

```python
#!/usr/bin/env python3
"""
FAQ Entity Management
Handles CRUD operations for FAQ entities
"""

from neo4j import GraphDatabase
from datetime import datetime
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class FAQManager:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "change_this_password_immediately")
        self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
    
    def close(self):
        self.driver.close()
    
    def create_faq(self, faq_data: Dict) -> str:
        """Create a new FAQ"""
        with self.driver.session() as session:
            result = session.run("""
                MERGE (f:FAQ {id: $id})
                SET f.question = $question,
                    f.answer = $answer,
                    f.category = $category,
                    f.priority = $priority,
                    f.view_count = 0,
                    f.helpful_count = 0,
                    f.not_helpful_count = 0,
                    f.created_at = datetime(),
                    f.last_updated = datetime()
                RETURN f.id as id
            """,
            id=faq_data['id'],
            question=faq_data['question'],
            answer=faq_data['answer'],
            category=faq_data.get('category', 'general'),
            priority=faq_data.get('priority', 5)
            )
            
            faq_id = result.single()['id']
            
            # Link to service if provided
            if faq_data.get('service_id'):
                session.run("""
                    MATCH (f:FAQ {id: $faq_id})
                    MATCH (s:Service {id: $service_id})
                    MERGE (s)-[:HAS_ANSWER_FOR]->(f)
                """, faq_id=faq_id, service_id=faq_data['service_id'])
            
            return faq_id
    
    def get_faq(self, faq_id: str) -> Optional[Dict]:
        """Get an FAQ by ID"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (f:FAQ {id: $id})
                OPTIONAL MATCH (s:Service)-[:HAS_ANSWER_FOR]->(f)
                RETURN f, s.name as service_name
            """, id=faq_id)
            
            record = result.single()
            if record:
                faq = dict(record['f'])
                faq['service_name'] = record['service_name']
                return faq
            return None
    
    def search_faqs(self, query: str, category: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """Search FAQs by question text"""
        cypher_query = """
            MATCH (f:FAQ)
            WHERE toLower(f.question) CONTAINS toLower($query)
        """
        
        if category:
            cypher_query += " AND f.category = $category"
        
        cypher_query += """
            OPTIONAL MATCH (s:Service)-[:HAS_ANSWER_FOR]->(f)
            RETURN f, s.name as service_name
            ORDER BY f.priority ASC, f.last_updated DESC
            LIMIT $limit
        """
        
        with self.driver.session() as session:
            result = session.run(cypher_query, query=query, category=category, limit=limit)
            return [{'faq': dict(record['f']), 'service_name': record['service_name']} 
                    for record in result]
    
    def get_faqs_by_service(self, service_id: str) -> List[Dict]:
        """Get FAQs for a specific service"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (s:Service {id: $service_id})-[:HAS_ANSWER_FOR]->(f:FAQ)
                RETURN f
                ORDER BY f.priority ASC, f.view_count DESC
            """, service_id=service_id)
            return [dict(record['f']) for record in result]
    
    def increment_view_count(self, faq_id: str):
        """Increment FAQ view count"""
        with self.driver.session() as session:
            session.run("""
                MATCH (f:FAQ {id: $id})
                SET f.view_count = coalesce(f.view_count, 0) + 1
            """, id=faq_id)
    
    def mark_helpful(self, faq_id: str, helpful: bool):
        """Mark FAQ as helpful or not helpful"""
        with self.driver.session() as session:
            if helpful:
                session.run("""
                    MATCH (f:FAQ {id: $id})
                    SET f.helpful_count = coalesce(f.helpful_count, 0) + 1
                """, id=faq_id)
            else:
                session.run("""
                    MATCH (f:FAQ {id: $id})
                    SET f.not_helpful_count = coalesce(f.not_helpful_count, 0) + 1
                """, id=faq_id)
    
    def get_faq_stats(self) -> Dict:
        """Get FAQ statistics"""
        with self.driver.session() as session:
            total_count = session.run("MATCH (f:FAQ) RETURN count(f) as count").single()['count']
            
            category_counts = session.run("""
                MATCH (f:FAQ)
                RETURN f.category as category, count(f) as count
                ORDER BY count DESC
            """).data()
            
            top_viewed = session.run("""
                MATCH (f:FAQ)
                RETURN f.id, f.question, f.view_count
                ORDER BY f.view_count DESC
                LIMIT 10
            """).data()
            
            return {
                'total_count': total_count,
                'by_category': category_counts,
                'top_viewed': top_viewed
            }
```

---

### Step 4: Customer Question Implementation

**File:** `CODE_TEMPLATES/questions.py`

```python
#!/usr/bin/env python3
"""
Customer Question Entity Management
Handles CRUD operations for customer questions
"""

from neo4j import GraphDatabase
from datetime import datetime
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class QuestionManager:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "change_this_password_immediately")
        self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
    
    def close(self):
        self.driver.close()
    
    def create_question(self, question_data: Dict) -> str:
        """Create a new customer question"""
        with self.driver.session() as session:
            result = session.run("""
                MERGE (q:Question {id: $id})
                SET q.text = $text,
                    q.category = $category,
                    q.source = $source,
                    q.call_date = $call_date,
                    q.call_duration = $call_duration,
                    q.occurrence_count = coalesce(q.occurrence_count, 0) + 1,
                    q.created_at = datetime(),
                    q.last_seen = datetime()
                RETURN q.id as id
            """,
            id=question_data['id'],
            text=question_data['text'],
            category=question_data.get('category', 'general'),
            source=question_data.get('source', 'unknown'),
            call_date=question_data.get('call_date'),
            call_duration=question_data.get('call_duration', 0)
            )
            
            question_id = result.single()['id']
            
            # Link to service if provided
            if question_data.get('service_id'):
                session.run("""
                    MATCH (q:Question {id: $question_id})
                    MATCH (s:Service {id: $service_id})
                    MERGE (q)-[:RELATES_TO]->(s)
                """, question_id=question_id, service_id=question_data['service_id'])
            
            return question_id
    
    def get_question(self, question_id: str) -> Optional[Dict]:
        """Get a question by ID"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (q:Question {id: $id})
                OPTIONAL MATCH (q)-[:RELATES_TO]->(s:Service)
                RETURN q, s.name as service_name
            """, id=question_id)
            
            record = result.single()
            if record:
                question = dict(record['q'])
                question['service_name'] = record['service_name']
                return question
            return None
    
    def search_questions(self, search_term: str, category: Optional[str] = None) -> List[Dict]:
        """Search questions by text"""
        cypher_query = """
            MATCH (q:Question)
            WHERE toLower(q.text) CONTAINS toLower($search_term)
        """
        
        if category:
            cypher_query += " AND q.category = $category"
        
        cypher_query += """
            OPTIONAL MATCH (q)-[:RELATES_TO]->(s:Service)
            RETURN q, s.name as service_name
            ORDER BY q.occurrence_count DESC, q.last_seen DESC
            LIMIT 20
        """
        
        with self.driver.session() as session:
            result = session.run(cypher_query, search_term=search_term, category=category)
            return [{'question': dict(record['q']), 'service_name': record['service_name']} 
                    for record in result]
    
    def get_common_questions(self, service_id: Optional[str] = None, limit: int = 20) -> List[Dict]:
        """Get most common questions"""
        if service_id:
            query = """
                MATCH (s:Service {id: $service_id})<-[:RELATES_TO]-(q:Question)
                RETURN q, s.name as service_name
                ORDER BY q.occurrence_count DESC
                LIMIT $limit
            """
            params = {'service_id': service_id, 'limit': limit}
        else:
            query = """
                MATCH (q:Question)
                OPTIONAL MATCH (q)-[:RELATES_TO]->(s:Service)
                RETURN q, s.name as service_name
                ORDER BY q.occurrence_count DESC
                LIMIT $limit
            """
            params = {'limit': limit}
        
        with self.driver.session() as session:
            result = session.run(query, **params)
            return [{'question': dict(record['q']), 'service_name': record['service_name']} 
                    for record in result]
    
    def get_questions_by_category(self, category: str) -> List[Dict]:
        """Get questions by category"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (q:Question {category: $category})
                OPTIONAL MATCH (q)-[:RELATES_TO]->(s:Service)
                RETURN q, s.name as service_name
                ORDER BY q.occurrence_count DESC
            """, category=category)
            return [{'question': dict(record['q']), 'service_name': record['service_name']} 
                    for record in result]
    
    def get_question_trends(self, days: int = 30) -> List[Dict]:
        """Get question trends over time"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (q:Question)
                WHERE q.last_seen >= datetime() - duration('P' + $days + 'D')
                RETURN q.category as category, count(q) as count, sum(q.occurrence_count) as total_occurrences
                ORDER BY total_occurrences DESC
            """, days=days)
            return list(result.data())
```

---

## VERIFY

### Data Integrity Checks

**File:** `TESTING/integration_tests/test_knowledge_graph.py`

```python
#!/usr/bin/env python3
"""
Knowledge Graph Integrity Tests
"""

import pytest
from services import ServiceManager
from faqs import FAQManager
from questions import QuestionManager
from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

class TestKnowledgeGraphIntegrity:
    @pytest.fixture
    def service_manager(self):
        manager = ServiceManager()
        yield manager
        manager.close()
    
    @pytest.fixture
    def faq_manager(self):
        manager = FAQManager()
        yield manager
        manager.close()
    
    @pytest.fixture
    def question_manager(self):
        manager = QuestionManager()
        yield manager
        manager.close()
    
    def test_service_constraints(self, service_manager):
        """Test service uniqueness constraints"""
        # Create first service
        service_data = {
            'id': 'test_service_001',
            'name': 'Test Service',
            'description': 'Test Description',
            'category': 'test',
            'base_price': 100.0
        }
        service_manager.create_service(service_data)
        
        # Try to create duplicate
        service_manager.create_service(service_data)
        
        # Verify only one exists
        services = service_manager.search_services('Test Service')
        assert len(services) == 1
    
    def test_faq_service_relationship(self, faq_manager, service_manager):
        """Test FAQ-Service relationship"""
        # Create service
        service_data = {
            'id': 'test_service_002',
            'name': 'Test Service 2',
            'description': 'Test Description',
            'category': 'test'
        }
        service_manager.create_service(service_data)
        
        # Create FAQ linked to service
        faq_data = {
            'id': 'test_faq_001',
            'question': 'Test question?',
            'answer': 'Test answer',
            'category': 'test',
            'service_id': 'test_service_002'
        }
        faq_manager.create_faq(faq_data)
        
        # Verify relationship
        faqs = faq_manager.get_faqs_by_service('test_service_002')
        assert len(faqs) == 1
        assert faqs[0]['id'] == 'test_faq_001'
    
    def test_question_service_relationship(self, question_manager, service_manager):
        """Test Question-Service relationship"""
        # Create service
        service_data = {
            'id': 'test_service_003',
            'name': 'Test Service 3',
            'description': 'Test Description',
            'category': 'test'
        }
        service_manager.create_service(service_data)
        
        # Create question linked to service
        question_data = {
            'id': 'test_question_001',
            'text': 'Test question',
            'category': 'test',
            'service_id': 'test_service_003'
        }
        question_manager.create_question(question_data)
        
        # Verify relationship
        questions = question_manager.get_common_questions('test_service_003')
        assert len(questions) == 1
        assert questions[0]['question']['id'] == 'test_question_001'
    
    def test_data_validation(self, service_manager):
        """Test data validation"""
        # Try to create service with invalid price
        invalid_service = {
            'id': 'test_service_004',
            'name': 'Invalid Service',
            'description': 'Test',
            'category': 'test',
            'base_price': -100.0  # Invalid negative price
        }
        
        # Should still create but with negative price (validation should be at application level)
        service_id = service_manager.create_service(invalid_service)
        assert service_id is not None
        
        # Retrieve and verify
        service = service_manager.get_service('test_service_004')
        assert service['base_price'] == -100.0  # Neo4j allows negative numbers
```

### Performance Verification

**File:** `TESTING/load_tests/test_performance.py`

```python
#!/usr/bin/env python3
"""
Knowledge Graph Performance Tests
"""

import pytest
import time
from services import ServiceManager
from faqs import FAQManager
from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

class TestKnowledgeGraphPerformance:
    @pytest.fixture
    def service_manager(self):
        manager = ServiceManager()
        yield manager
        manager.close()
    
    @pytest.fixture
    def faq_manager(self):
        manager = FAQManager()
        yield manager
        manager.close()
    
    def test_simple_lookup_performance(self, service_manager):
        """Test simple service lookup performance"""
        # Create test service
        service_data = {
            'id': 'perf_test_service',
            'name': 'Performance Test Service',
            'description': 'Test',
            'category': 'test'
        }
        service_manager.create_service(service_data)
        
        # Measure lookup time
        start_time = time.time()
        service = service_manager.get_service('perf_test_service')
        end_time = time.time()
        
        lookup_time = (end_time - start_time) * 1000  # Convert to ms
        
        # Should complete in <100ms
        assert lookup_time < 100, f"Lookup took {lookup_time}ms, expected <100ms"
    
    def test_search_performance(self, faq_manager):
        """Test FAQ search performance"""
        # Create test FAQs
        for i in range(100):
            faq_data = {
                'id': f'perf_test_faq_{i}',
                'question': f'Performance test question {i}?',
                'answer': f'Answer {i}',
                'category': 'test'
            }
            faq_manager.create_faq(faq_data)
        
        # Measure search time
        start_time = time.time()
        results = faq_manager.search_faqs('performance')
        end_time = time.time()
        
        search_time = (end_time - start_time) * 1000  # Convert to ms
        
        # Should complete in <500ms
        assert search_time < 500, f"Search took {search_time}ms, expected <500ms"
        assert len(results) > 0
```

---

## TEST

### Unit Tests

**File:** `TESTING/unit_tests/test_services.py`

```python
#!/usr/bin/env python3
"""
Service Entity Unit Tests
"""

import pytest
from services import ServiceManager

class TestServiceManager:
    @pytest.fixture
    def manager(self):
        manager = ServiceManager()
        yield manager
        manager.close()
    
    def test_create_service(self, manager):
        """Test creating a service"""
        service_data = {
            'id': 'unit_test_001',
            'name': 'Unit Test Service',
            'description': 'Test Description',
            'category': 'test',
            'base_price': 100.0,
            'duration_minutes': 60,
            'active': True
        }
        
        service_id = manager.create_service(service_data)
        assert service_id == 'unit_test_001'
    
    def test_get_service(self, manager):
        """Test retrieving a service"""
        # Create service first
        service_data = {
            'id': 'unit_test_002',
            'name': 'Unit Test Service 2',
            'description': 'Test Description',
            'category': 'test',
            'base_price': 150.0
        }
        manager.create_service(service_data)
        
        # Retrieve service
        service = manager.get_service('unit_test_002')
        
        assert service is not None
        assert service['name'] == 'Unit Test Service 2'
        assert service['base_price'] == 150.0
    
    def test_update_service(self, manager):
        """Test updating a service"""
        # Create service first
        service_data = {
            'id': 'unit_test_003',
            'name': 'Unit Test Service 3',
            'description': 'Test Description',
            'category': 'test',
            'base_price': 100.0
        }
        manager.create_service(service_data)
        
        # Update service
        updated = manager.update_service('unit_test_003', {'base_price': 200.0})
        assert updated is True
        
        # Verify update
        service = manager.get_service('unit_test_003')
        assert service['base_price'] == 200.0
    
    def test_delete_service(self, manager):
        """Test deleting a service"""
        # Create service first
        service_data = {
            'id': 'unit_test_004',
            'name': 'Unit Test Service 4',
            'description': 'Test Description',
            'category': 'test',
            'base_price': 100.0
        }
        manager.create_service(service_data)
        
        # Delete service
        deleted = manager.delete_service('unit_test_004')
        assert deleted is True
        
        # Verify deletion (should not appear in active services)
        services = manager.get_all_services(active_only=True)
        service_ids = [s['id'] for s in services]
        assert 'unit_test_004' not in service_ids
    
    def test_search_services(self, manager):
        """Test searching services"""
        # Create test services
        services = [
            {'id': 'search_test_001', 'name': 'Air Conditioning Repair', 'description': 'Fix AC', 'category': 'hvac'},
            {'id': 'search_test_002', 'name': 'Air Duct Cleaning', 'description': 'Clean ducts', 'category': 'hvac'},
            {'id': 'search_test_003', 'name': 'Plumbing Service', 'description': 'Fix pipes', 'category': 'plumbing'}
        ]
        
        for service in services:
            manager.create_service(service)
        
        # Search for "air"
        results = manager.search_services('air')
        
        assert len(results) >= 2
        service_names = [r['name'] for r in results]
        assert 'Air Conditioning Repair' in service_names
        assert 'Air Duct Cleaning' in service_names
```

---

## RECONFIGURE OR OPTIMIZE

### Performance Optimization

**Optimization 1: Query Optimization**

**Before (Slow):**
```cypher
MATCH (s:Service)-[:HAS_ANSWER_FOR]->(f:FAQ)
WHERE f.question CONTAINS 'maintenance'
RETURN f.question, f.answer, s.name
```

**After (Fast):**
```cypher
MATCH (f:FAQ)
WHERE f.question CONTAINS 'maintenance'
MATCH (f)<-[:HAS_ANSWER_FOR]-(s:Service)
RETURN f.question, f.answer, s.name
```

**Optimization 2: Connection Pooling**

```python
# CODE_TEMPLATES/neo4j_pool.py
from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

class Neo4jPool:
    _instance = None
    _driver = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Neo4jPool, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._driver is None:
            uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
            user = os.getenv("NEO4J_USER", "neo4j")
            password = os.getenv("NEO4J_PASSWORD", "change_this_password_immediately")
            
            self._driver = GraphDatabase.driver(
                uri,
                auth=(user, password),
                max_connection_pool_size=50,
                connection_timeout=30.0,
                max_transaction_retry_time=30.0
            )
    
    def get_session(self):
        return self._driver.session()
    
    def close(self):
        if self._driver:
            self._driver.close()
            self._driver = None

# Singleton instance
neo4j_pool = Neo4jPool()
```

**Optimization 3: Memory Configuration**

```conf
# neo4j.conf additions for performance
dbms.memory.heap.initial_size=512m
dbms.memory.heap.max_size=2g
dbms.memory.pagecache.size=1g
dbms.query_cache_size=200m
dbms.cypher.min_replan_interval=5m
```

---

## DEPLOYMENT

### Production Deployment

**Docker Compose for Production:**

**File:** `CONFIGURATIONS/docker-compose.yml`

```yaml
version: '3.8'

services:
  neo4j:
    image: neo4j:5.15-enterprise
    container_name: neo4j
    environment:
      - NEO4J_AUTH=neo4j/production_secure_password_here
      - NEO4J_ACCEPT_EULA=yes
      - NEO4J_dbms_memory_heap_initial__size=1g
      - NEO4J_dbms_memory_heap_max__size=4g
      - NEO4J_dbms_memory_pagecache_size=2g
      - NEO4J_dbms_connector_bolt_advertised__address=neo4j:7687
      - NEO4J_dbms_connector_http_advertised__address=neo4j:7474
    ports:
      - "7474:7474"
      - "7687:7687"
    volumes:
      - neo4j-data:/data
      - neo4j-logs:/logs
      - neo4j-plugins:/plugins
      - neo4j-import:/import
      - neo4j-metrics:/metrics
    networks:
      - ai-ecosystem
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "cypher-shell", "-u", "neo4j", "-p", "production_secure_password_here", "RETURN 1"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  neo4j-data:
    driver: local
  neo4j-logs:
    driver: local
  neo4j-plugins:
    driver: local
  neo4j-import:
    driver: local
  neo4j-metrics:
    driver: local

networks:
  ai-ecosystem:
    driver: bridge
```

**Kubernetes Deployment:**

**File:** `CONFIGURATIONS/kubernetes/neo4j-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: neo4j
  labels:
    app: neo4j
spec:
  serviceName: neo4j
  replicas: 1
  selector:
    matchLabels:
      app: neo4j
  template:
    metadata:
      labels:
        app: neo4j
    spec:
      containers:
      - name: neo4j
        image: neo4j:5.15-enterprise
        ports:
        - containerPort: 7474
          name: http
        - containerPort: 7687
          name: bolt
        env:
        - name: NEO4J_AUTH
          valueFrom:
            secretKeyRef:
              name: neo4j-secrets
              key: auth
        - name: NEO4J_ACCEPT_EULA
          value: "yes"
        - name: NEO4J_dbms_memory_heap_initial__size
          value: "1g"
        - name: NEO4J_dbms_memory_heap_max__size
          value: "4g"
        - name: NEO4J_dbms_memory_pagecache_size
          value: "2g"
        resources:
          requests:
            memory: "4Gi"
            cpu: "1"
          limits:
            memory: "8Gi"
            cpu: "2"
        volumeMounts:
        - name: neo4j-data
          mountPath: /data
        livenessProbe:
          exec:
            command:
            - cypher-shell
            - -u
            - neo4j
            - -p
            - $(NEO4J_AUTH)
            - "RETURN 1"
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          exec:
            command:
            - cypher-shell
            - -u
            - neo4j
            - -p
            - $(NEO4J_AUTH)
            - "RETURN 1"
          initialDelaySeconds: 30
          periodSeconds: 10
  volumeClaimTemplates:
  - metadata:
      name: neo4j-data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 200Gi

---
apiVersion: v1
kind: Service
metadata:
  name: neo4j
spec:
  selector:
    app: neo4j
  ports:
  - name: http
    port: 7474
    targetPort: 7474
  - name: bolt
    port: 7687
    targetPort: 7687
  type: ClusterIP

---
apiVersion: v1
kind: Secret
metadata:
  name: neo4j-secrets
type: Opaque
stringData:
  auth: "neo4j/production_secure_password_here"
```

---

### Monitoring Setup

**Prometheus Metrics Exporter:**

**File:** `CODE_TEMPLATES/neo4j_monitoring.py`

```python
#!/usr/bin/env python3
"""
Neo4j Monitoring and Metrics Collection
"""

from prometheus_client import start_http_server, Gauge, Histogram
import time
from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

# Define metrics
neo4j_nodes = Gauge('neo4j_nodes_total', 'Total number of nodes in database')
neo4j_relationships = Gauge('neo4j_relationships_total', 'Total number of relationships')
neo4j_query_time = Histogram('neo4j_query_duration_seconds', 'Query execution time')
neo4j_service_count = Gauge('neo4j_services_total', 'Total number of services')
neo4j_faq_count = Gauge('neo4j_faqs_total', 'Total number of FAQs')
neo4j_question_count = Gauge('neo4j_questions_total', 'Total number of questions')

class Neo4jMonitor:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "change_this_password_immediately")
        self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
    
    def collect_metrics(self):
        """Collect and update metrics"""
        with self.driver.session() as session:
            # Node counts
            total_nodes = session.run("MATCH (n) RETURN count(n) as count").single()['count']
            neo4j_nodes.set(total_nodes)
            
            # Relationship counts
            total_relationships = session.run("MATCH ()-[r]->() RETURN count(r) as count").single()['count']
            neo4j_relationships.set(total_relationships)
            
            # Entity counts
            service_count = session.run("MATCH (s:Service) RETURN count(s) as count").single()['count']
            neo4j_service_count.set(service_count)
            
            faq_count = session.run("MATCH (f:FAQ) RETURN count(f) as count").single()['count']
            neo4j_faq_count.set(faq_count)
            
            question_count = session.run("MATCH (q:Question) RETURN count(q) as count").single()['count']
            neo4j_question_count.set(question_count)
    
    def start_monitoring(self, interval: int = 60):
        """Start continuous monitoring"""
        while True:
            self.collect_metrics()
            time.sleep(interval)

if __name__ == "__main__":
    # Start Prometheus metrics server
    start_http_server(8000)
    
    # Start monitoring
    monitor = Neo4jMonitor()
    monitor.start_monitoring()
```

---

## BUG FIXES

### Common Issues and Solutions

#### Issue 1: Connection Timeouts
**Symptom:** Neo4j connections timing out under load

**Diagnosis:**
```python
# Check connection pool status
driver = GraphDatabase.driver(uri, auth=(user, password))
print(f"Max pool size: {driver._pool.max_size}")
print(f"Active connections: {driver._pool.active_size}")
```

**Solution:**
```python
# Increase connection pool size and timeout
driver = GraphDatabase.driver(
    uri,
    auth=(user, password),
    max_connection_lifetime=3600,
    max_connection_pool_size=100,
    connection_acquisition_timeout=60,
    max_transaction_retry_time=30.0
)
```

#### Issue 2: Memory Leaks
**Symptom:** Gradual memory increase over time

**Diagnosis:**
```python
# Monitor memory usage
import psutil
process = psutil.Process()
print(f"Memory usage: {process.memory_info().rss / 1024 / 1024} MB")
```

**Solution:**
```python
# Use context managers properly
def get_service(service_id: str) -> Optional[Dict]:
    with self.driver.session() as session:
        result = session.run("MATCH (s:Service {id: $id}) RETURN s", id=service_id)
        record = result.single()
        if record:
            return dict(record['s'])
    # Session automatically closed when context exits
    return None
```

#### Issue 3: Slow Queries
**Symptom:** Queries taking >10 seconds

**Diagnosis:**
```cypher
// Identify slow queries
CALL dbms.queryLog("latest") 
YIELD query, parameters, queryExecutionTime
WHERE queryExecutionTime > 1000
RETURN query, parameters, queryExecutionTime
ORDER BY queryExecutionTime DESC
LIMIT 10
```

**Solution:**
```cypher
// Add appropriate indexes
CREATE INDEX FOR (s:Service) ON (s.id);
CREATE INDEX FOR (f:FAQ) ON (f.category);
CREATE INDEX FOR (q:Question) ON (q.call_date);

// Use PROFILE to analyze query plan
PROFILE MATCH (s:Service)-[:HAS_ANSWER_FOR]->(f:FAQ)
WHERE f.question CONTAINS 'maintenance'
RETURN f.question, f.answer

// Optimize query based on PROFILE results
```

#### Issue 4: Data Inconsistency
**Symptom:** FAQs not connected to services

**Diagnosis:**
```cypher
// Find orphaned FAQs
MATCH (f:FAQ)
WHERE NOT (f)<-[:HAS_ANSWER_FOR]-(:Service)
RETURN f.id, f.question
```

**Solution:**
```python
# Add validation in import process
def validate_relationships(self):
    with self.driver.session() as session:
        orphaned = session.run("""
            MATCH (f:FAQ)
            WHERE NOT (f)<-[:HAS_ANSWER_FOR]-(:Service)
            RETURN count(f) as orphaned_count
        """).single()['orphaned_count']
        
        if orphaned > 0:
            self.logger.warning(f"Found {orphaned} orphaned FAQs")
            # Trigger remediation process
            self.repair_orphaned_faqs()
```

---

## SUCCESS CRITERIA

### Phase 1 Completion Checklist

**Technical:**
- [ ] Neo4j installed and operational
- [ ] All constraints created and verified
- [ ] All indexes created and verified
- [ ] Core entities implemented (Service, FAQ, Question)
- [ ] Relationships established and validated
- [ ] Query performance <100ms for common queries
- [ ] Data integrity >99%
- [ ] 500+ nodes, 1,000+ edges

**Testing:**
- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] Performance tests passing
- [ ] Load tests passing
- [ ] Security tests passing

**Documentation:**
- [ ] API documentation complete
- [ ] Schema documentation complete
- [ ] Setup instructions complete
- [ ] Troubleshooting guide complete
- [ ] Runbooks complete

**Operations:**
- [ ] Monitoring operational
- [ ] Alerting configured
- [ ] Backup procedures established
- [ ] Disaster recovery tested
- [ ] Support team trained

---

**Status:** 🟢 Ready for Build
**Estimated Build Time:** 2-3 weeks
**Dependencies:** None (foundational component)
**Next Component:** Component 2 - Model Context Protocol Server
**Last Updated:** July 7, 2026