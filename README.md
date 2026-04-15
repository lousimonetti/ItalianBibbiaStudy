# Italian Bible Study

A 37-week Italian Bible study tracker (La Bibbia CEI 2008) — built as a PWA with React + Vite.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output is written to `dist/`.

---

## Deploying to Azure Static Web Apps

### Option 1: Azure Portal + GitHub Actions (recommended)

1. Push your repo to GitHub.

2. In the [Azure Portal](https://portal.azure.com), create a new **Static Web App**:
   - **Hosting plan:** Free
   - **Source:** GitHub — authorize and select your repo + branch (`main`)
   - **Build preset:** Vite
   - **App location:** `/`
   - **Api location:** *(leave blank)*
   - **Output location:** `dist`

3. Azure will commit a GitHub Actions workflow file (`.github/workflows/azure-static-web-apps-*.yml`) to your repo automatically.

4. Every push to `main` triggers a build and deploy. The live URL is shown on the Static Web App overview page in the portal.

---

### Option 2: Azure CLI (manual deploy)

**Prerequisites:** [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) and the SWA CLI.

```bash
npm install -g @azure/static-web-apps-cli
az login
```

**Build and deploy:**

```bash
npm run build
swa deploy ./dist \
  --app-name <your-static-web-app-name> \
  --resource-group <your-resource-group>
```

To find your deployment token (needed for CI or non-interactive deploys):

```bash
az staticwebapp secrets list --name <your-static-web-app-name> --query "properties.apiKey"
```

Then deploy with the token:

```bash
swa deploy ./dist --deployment-token <token>
```

---

### Option 3: VS Code Extension

1. Install the [Azure Static Web Apps extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurestaticwebapps).
2. Open the Azure panel, click **+** to create a Static Web App, and follow the wizard.
3. Set **output location** to `dist` when prompted.

---

### Routing

The `public/staticwebapp.config.json` file configures Azure to fall back to `index.html` for all routes, which is required for React client-side routing to work correctly.
