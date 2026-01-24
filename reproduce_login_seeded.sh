#!/bin/bash
# 1. Run Seed
node seed_admin.js

# 2. Call Login with Correct Creds
echo "Calling Login..."
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
    "mobile": "9876543210",
    "password": "admin",
    "role": "ADMIN"
}' -v
