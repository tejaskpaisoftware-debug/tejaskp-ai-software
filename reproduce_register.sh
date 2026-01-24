#!/bin/bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
    "role": "STUDENT",
    "fullName": "Test User 500",
    "mobile": "9999999999",
    "email": "test500@example.com",
    "address": "Gujarat University",
    "joiningDate": "2026-01-24",
    "details": ""
}' -v
