# MCP (Model Context Protocol) Integration

This project uses **MCP (Model Context Protocol)** during development to integrate AI-assisted coding with project-specific tools and APIs.

## What is MCP?

MCP enables AI coding assistants to interact with external tools and data sources. For this project, MCP was used to:

- Connect the development environment to the FlickGallery API
- Provide the AI assistant with context about the project's structure and endpoints
- Support interactive testing and debugging workflows

## Configuration

The MCP server is configured to run against the local API:

- **Server**: Custom FlickGallery MCP server
- **API base URL**: `http://localhost:3000` (configurable via env)
- **Runtime**: Node.js

## Evidence of Use

This `mcp/` directory and configuration files serve as documentation that MCP was employed as a development tool for this coursework project.
