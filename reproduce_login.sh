#!/bin/bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
    "mobile": "admin",
    "password": "admin"
}' -v
