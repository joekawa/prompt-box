# Workflow Requirements

## Overview
A workflow is a sequence of prompts that are executed in a specific order to achieve a goal.  The goal of the workflow is to provide a way to execute multiple prompts in a specific order to achieve a goal.

## Context
This feature is part of the Prompt Box application, which is a platform for managing and executing AI prompts.  The workflow feature allows users to create, edit, and delete workflows, as well as add, remove, and reorder prompts in a workflow.  This feature is intended to simplify AI management for non-technical users in organizations.

--
## Features
1. Users can create, edit, and delete workflows
2. Users can add, remove, and reorder prompts in a workflow
3. The system will track changes to workflows and provide users with a history of changes
4. Workflows will be executed in the order specified by the user
5. Workflows should have permissions to control who can view, edit, and execute them
6. Users should only see workflows they have permission to view
7. Users should only see workflows that belong to their organization


## Features out of scope
1. Workflows should have a way to pass data from one prompt to the next
2. Workflows should have a way to handle errors and retries
3. Workflows should have a way to be scheduled to run at specific times
4. Workflows should have a way to be triggered by events
5. Workflows should have a way to be executed in parallel
6. Workflows should have an output that can be used by other workflows or can be exported to a file

