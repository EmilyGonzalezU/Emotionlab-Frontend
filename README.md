# EmotionLab Frontend

The backend project at `../Emotionlab-Backend` is the shared configuration root. Its ignored `.env` is loaded by Flask and by Vite through `scripts/workspace-paths.mjs`; Vite receives only `VITE_` variables. Never put backend secrets, tokens, Cognito credentials, AWS credentials, or JWT keys in a `VITE_*` variable.

Run `npm ci`, then `npm run dev`. Local development defaults to `http://127.0.0.1:5000` when `VITE_API_URL` is absent. A production build requires a verified HTTPS `VITE_API_URL` in the backend root `.env` or the build process environment. `npm run configure:api` reads the `api_endpoint` output from `../Emotionlab-Backend/infrastructure/terraform/environments/dev` and appends the public URL to the backend `.env` only when it is not already configured. This command may access remote Terraform state; do not run it unless that access is authorized.

Use `npm test`, `npm run lint`, and `npm run build` for local validation.
