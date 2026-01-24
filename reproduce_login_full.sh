#!/bin/bash

# 1. Register User
echo "Registering User..."
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
    "role": "STUDENT",
    "fullName": "Login Tester",
    "mobile": "8888888888",
    "email": "loginteste88@example.com",
    "address": "Test University",
    "joiningDate": "2026-01-24", 
    "details": ""
}' -s > /dev/null

echo "Registration done. Waiting..."
sleep 1

# 2. Login
echo "Logging in..."
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
    "mobile": "8888888888",
    "password": "", 
    "role": "STUDENT"
}' -v
