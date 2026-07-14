# Deploying BloodConnect Backend to Render

This guide outlines the steps required to deploy the Node.js/Express/Socket.io backend of the BloodConnect application to Render, and connect it to a cloud MongoDB instance.

---

## Prerequisites

1. A **GitHub** account containing your repository.
2. A **Render** account (free tier works perfectly).
3. A **MongoDB Atlas** account (free Shared Cluster works perfectly).

---

## Step 1: Provision a MongoDB Atlas Database

Since Render does not offer native MongoDB hosting on its platform, the recommended approach is to use MongoDB Atlas (the official hosted MongoDB service).

1. Log in or sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new project (e.g., `BloodConnect`) and build a database:
   - Choose the **M0 (Free)** tier.
   - Choose a cloud provider and region close to you (or standard e.g., AWS us-east-1).
3. **Database Access (Security)**:
   - Create a database user (e.g., `db_user`) and record the password securely.
4. **Network Access (IP Access List)**:
   - Under *Security > Network Access*, click **Add IP Address**.
   - Add **`0.0.0.0/0`** (Allow Access from Anywhere) so Render's dynamic IP servers can connect.
5. **Get your connection string**:
   - Go to *Database > cluster*, click **Connect**.
   - Select **Drivers** (Node.js).
   - Copy the connection string. It will look like:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
     ```
   - Replace `<username>` and `<password>` with your database user credentials. Customize the database name before `?retryWrites` if desired (e.g. name it `bloodconnect` like this: `...mongodb.net/bloodconnect?retryWrites...`).

---

## Step 2: Deploy to Render

You can deploy the backend using **Option A (Blueprint)** or **Option B (Manual)**.

### Option A: Deploy via Blueprint (Recommended & Easiest)

Render Blueprints use the `render.yaml` file we created to configure everything automatically.

1. Go to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository.
4. Render will read the `render.yaml` file. Review the service details:
   - **Service Name**: `bloodconnect-backend`
   - **Environment Variables**:
     - `MONGO_URI`: Paste your MongoDB Atlas connection string.
     - `JWT_SECRET`: Enter a secure random string (e.g., `bloodconnect_prod_secret_998877`).
     - `EMAIL_USER`: (Optional) Your SMTP email username.
     - `EMAIL_PASS`: (Optional) Your SMTP email/app password.
5. Click **Apply**. Render will automatically provision the service, build it, and launch it!

---

### Option B: Deploy Manually via Render Web Service

If you prefer to configure everything manually through the Render UI:

1. Click **New +** on the Render Dashboard and choose **Web Service**.
2. Select **Build and deploy from a Git repository** and connect your repository.
3. Configure the following settings:
   - **Name**: `bloodconnect-backend`
   - **Region**: Select a region close to your target audience.
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Set this depending on your repo structure:
     - If you imported the parent directory containing the subfolders: `bloodconnect/backend`
     - If you imported only the `bloodconnect` folder: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Choose the **Free** instance type.
5. Click **Advanced** and add the following Environment Variables:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: (Your MongoDB Atlas connection string)
   - `JWT_SECRET`: (Your JWT secret string)
   - `PORT`: `5000` (Render will automatically bind to this, or whatever port your app listens to, but setting it explicitly is a good practice).
   - (Optional) `EMAIL_USER` / `EMAIL_PASS`
6. Click **Create Web Service**.

---

## Step 3: Verify the Deployment

1. Once the build finishes and status displays **Live**, Render will show your service's URL (e.g., `https://bloodconnect-backend.onrender.com`).
2. Open that URL in your browser or make a GET request. You should see:
   ```text
   BloodConnect API is running...
   ```
3. To test the API status and DB integration, check your logs in the Render console. It should output:
   ```text
   MongoDB Connected: cluster0-shard-00-00.xxxx.mongodb.net
   Server running in development mode on port 5000
   ```

---

## Free-Tier Considerations & Troubleshooting

- **Cold Starts**: Render's free tier spins down the web service container after 15 minutes of inactivity. When a user visits the site after a down-period, the first request can take 50+ seconds to spin up the server again. 
- **WebSockets (Socket.io)**: Render natively supports WebSockets on its Web Services (even on the free tier). No additional configuration is required.
- **Frontend Configuration**: Once your backend is deployed, remember to update the `VITE_API_URL` or base API URL in your frontend code (e.g. `frontend/src/services/api.js`) to point to your new Render URL instead of `http://localhost:5000`.
