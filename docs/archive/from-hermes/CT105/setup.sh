#!/bin/bash
# QUICK START SCRIPT FOR CT105
# Run this to set up the development environment

set -e

echo "🚀 Setting up AI-First Business Ecosystem Development Environment"
echo "=================================================================="

# Check Python version
echo "📋 Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $PYTHON_VERSION"

# Create virtual environment
echo "🔧 Creating virtual environment..."
python3 -m venv venv
echo "✓ Virtual environment created"

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip setuptools wheel
echo "✓ Pip upgraded"

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt
echo "✓ Dependencies installed"

# Create .env file from example
echo "🔐 Creating environment configuration..."
if [ ! -f .env ]; then
    cp CONFIGURATIONS/env_examples/.env.example .env
    echo "✓ .env file created from .env.example"
    echo "⚠️  IMPORTANT: Edit .env and fill in your API keys before proceeding!"
else
    echo "✓ .env file already exists"
fi

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p logs
mkdir -p data/audio_files
mkdir -p data/transcriptions
mkdir -p data/backups
mkdir -p data/exports
echo "✓ Directory structure created"

# Check Docker
echo "🐳 Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo "✓ Docker is installed"
    docker --version
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        echo "✓ Docker Compose is installed"
        docker-compose --version
    else
        echo "⚠️  Docker Compose not found. Install it for easy infrastructure setup."
    fi
    
    # Start Neo4j if not running
    echo "🔍 Checking Neo4j container..."
    if ! docker ps | grep -q neo4j; then
        echo "🚀 Starting Neo4j container..."
        docker-compose -f CONFIGURATIONS/docker-compose.yml up -d neo4j
        echo "⏳ Waiting for Neo4j to start (45 seconds)..."
        sleep 45
        echo "✓ Neo4j should be ready"
    else
        echo "✓ Neo4j container is already running"
    fi
else
    echo "⚠️  Docker not found. Install Docker for containerized infrastructure."
fi

# Run database setup
echo "🗄️  Setting up Neo4j database..."
python3 CODE_TEMPLATES/neo4j_setup.py
echo "✓ Database setup complete"

# Run initial tests
echo "🧪 Running initial tests..."
pytest TESTING/unit_tests/ -v --tb=short || echo "⚠️  Some tests failed. This is expected if components aren't built yet."

echo ""
echo "=================================================================="
echo "✅ Setup Complete!"
echo ""
echo "Next Steps:"
echo "1. Edit .env file and add your API keys"
echo "2. Review README.md for architecture overview"
echo "3. Start with COMPONENTS/01_KNOWLEDGE_GRAPH_DATABASE.md"
echo "4. Run 'source venv/bin/activate' to activate environment"
echo "5. Run 'python3 CODE_TEMPLATES/import_services.py' to load sample data"
echo ""
echo "Quick Commands:"
echo "  - Activate environment: source venv/bin/activate"
echo "  - Run tests: pytest TESTING/unit_tests/"
echo "  - Start Neo4j: docker-compose up -d neo4j"
echo "  - Stop Neo4j: docker-compose down neo4j"
echo "  - View logs: docker-compose logs -f neo4j"
echo ""
echo "Documentation:"
echo "  - README.md - Project overview"
echo "  - 00_MASTER_STRATEGIC_ARCHITECTURE.md - Strategic vision"
echo "  - 01_PHASE_1_FOUNDATION.md - Execution plan"
echo "  - COMPONENTS/ - Component build guides"
echo ""
echo "=================================================================="