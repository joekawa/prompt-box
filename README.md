# Prompt Box

A secure, enterprise-grade prompt sharing service designed to help teams collaborate on and version control their LLM prompts.

## Project Overview

Prompt Box allows enterprise teams to:
- Store and organize prompts in a central repository
- Version control prompts
- Share prompts securely across teams
- Integrate with various LLM providers

## Tech Stack

**Frontend**
- React 18
- TypeScript
- Vite
- Tailwind CSS

**Backend**
- Python / Django
- FastAPI

## Project Structure

This repository is organized as a monorepo:

- `frontend/`: React-based web application
- `backend/`: Django/Python backend services
- `infra/`: Infrastructure configuration (Terraform)
- `docs/`: Project documentation

## Getting Started

### Prerequisites
- Node.js (Latest LTS)
- Python 3.8+
- Docker (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/joekawa/prompt-box.git
   ```

2. Install Frontend Dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Install Backend Dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

## Contributing

Please refer to `AGENTS.MD` for development guidelines and coding standards.
