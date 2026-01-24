#!/bin/bash
curl -X POST http://localhost:3000/api/auth/logout \
-H "Content-Type: application/json" \
-d '{ "userId": "test-id" }' -v
