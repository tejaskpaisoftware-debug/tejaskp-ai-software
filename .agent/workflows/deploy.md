---
description: Ensure changes are built and deployed to Vercel
---

1. Build the project locally to catch errors early
// turbo
sh -c "npm run build"

2. Stage all changes
// turbo
sh -c "git add ."

3. Commit changes with a timestamp
// turbo
sh -c "git commit -m 'Update: $(date +'%Y-%m-%d %H:%M:%S')'"

4. Push changes to trigger Vercel deployment
// turbo
sh -c "git push origin main"

5. Verify deployment status
// turbo
npx vercel list --prod
