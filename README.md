# RipePulse AI

## Predict. Prioritize. Prevent Produce Waste.

RipePulse AI is an AI-enabled produce supply-chain operations platform. It connects warehouse inventory, produce-risk prediction, dispatch planning, route feasibility, shipment tracking, rerouting, destination receiving, alerts, and audit logging in one role-based application.

The platform is designed around a complete operational workflow:

```text
Batch Creation
    -> Inventory Monitoring
    -> AI Risk Prediction
    -> Dispatch Planning
    -> Route Check and Assignment
    -> Shipment Tracking
    -> Rerouting When Required
    -> Destination Verification
    -> Receipt Confirmation
    -> Audit and System Monitoring
```

## Live Deployment

- Frontend: [ripepulse-ai-1.onrender.com](https://ripepulse-ai-1.onrender.com)
- Backend API: [ripepulse-ai.onrender.com](https://ripepulse-ai.onrender.com)
- API documentation: [OpenAPI / Swagger](https://ripepulse-ai.onrender.com/docs)
- Health check: [Backend health](https://ripepulse-ai.onrender.com/health)

The frontend uses these production endpoints:

```text
VITE_API_BASE_URL=https://ripepulse-ai.onrender.com/api
VITE_WS_URL=wss://ripepulse-ai.onrender.com/ws
```

## What It Solves

Produce losses are often caused by delayed transport, poor inventory visibility, route disruption, short remaining shelf life, quantity mismatch, and disconnected warehouse and receiving workflows. RipePulse AI gives each stakeholder the operational view and actions needed to respond earlier.

## Key Features & Innovation

### Key Features

- **AI-Based Shelf-Life Prediction** - Predicts usable life for each produce batch.
- **Freshness-Aware Risk Scoring** - Classifies batches as Low, Medium, High, or Critical risk.
- **Intelligent Dispatch Planning** - Prioritizes vulnerable batches beyond traditional FIFO.
- **Route and ETA Monitoring** - Compares transit ETA with remaining shelf life.
- **Destination Ranking and Rerouting** - Identifies feasible alternate destinations when risk arises.
- **Role-Based Supply Dashboards** - Coordinates decisions across warehouse, supply chain, receiver, and admin teams.

### Innovation

> RipePulse AI shifts produce logistics from reactive FIFO movement to predictive decision-making.

- Combines batch intelligence, telemetry, AI prediction, and route analysis.
- Detects the critical mismatch between remaining shelf life and delivery ETA.
- Supports proactive intervention before spoilage occurs.
- Integrates AI recommendations with human approval and operational execution.

### Uniqueness

> Freshness, not just first-in-first-out.

- Goes beyond traditional static inventory tracking.
- Treats every produce batch as an individual risk profile.
- Connects warehouse, transport, and destination operations in one decision loop.
- Uses AI-assisted recommendations with human-in-the-loop control.
- Focuses on preventing waste before it becomes unavoidable.

## Role-Based Dashboards

### Warehouse Manager

- Create and manage produce batches
- Record quantity, storage zone, and produce conditions
- Monitor inventory and IoT telemetry
- Run AI-powered shelf-life and risk prediction
- Identify high-risk and urgent batches

### Supply Chain Manager

- View at-risk batches and pending reroute decisions
- Create dispatches with source, destination, quantity, and vehicle details
- Check route feasibility and assign routes
- Track active shipments and lifecycle status
- Simulate a route issue for demonstration and testing
- Approve persisted reroutes without creating duplicate dispatches
- Review reroute history and transit alerts

### Destination Receiver

- View incoming shipments
- Compare expected and received quantities
- Record damaged or missing quantities
- Accept, partially accept, or reject shipments
- Submit receipt verification
- Update destination inventory

### System Administrator

- Monitor system-wide batches, dispatches, alerts, and receipts
- Review operational analytics
- Inspect audit logs
- Oversee role-based workflows and system activity

## AI Risk Prediction

The backend uses a model-backed risk engine with XGBoost and supporting scikit-learn tooling. It combines produce type, storage conditions, telemetry, age, and shelf-life information to estimate remaining shelf life and operational risk.

Risk categories include:

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

Example:

```text
Batch: Roma Tomatoes
Quantity: 500 kg
Remaining shelf life: 48 hours
Risk: HIGH
Operational recommendation: Prioritize dispatch and select a feasible route
```

The prototype uses simulated and research-informed telemetry. A production deployment should be calibrated with real historical quality data, sensor data, and field validation.

## Dispatch and Reroute Lifecycle

Normal dispatch flow:

```text
PLANNED
   -> DISPATCHED
   -> IN_TRANSIT
   -> ARRIVED
   -> DELIVERED / ACCEPTED
```

Demo route-issue flow:

```text
IN_TRANSIT
   -> Simulate Route Issue (Demo)
   -> Reroute Required
   -> Approve Reroute
   -> REROUTED
   -> Shipment History / Active Dispatches
```

The demo action is persisted in SQLite. It sets:

```text
route_issue=true
reroute_required=true
reroute_status=pending
issue_reason=Simulated route blockage/delay
status=IN_TRANSIT
```

Approving the reroute updates the existing dispatch record, rather than creating a duplicate. It sets:

```text
is_rerouted=true
reroute_required=false
route_issue=false
reroute_status=completed
status=REROUTED
```

A successful reroute also updates the route, creates an audit event, removes the item from pending decisions, and keeps it available in active shipment data and reroute history.

## Receiving Workflow

The receiver can record three outcomes:

- **Accepted:** expected quantity matches received quantity.
- **Partially accepted:** some quantity is missing or damaged.
- **Rejected:** the shipment is unsuitable or no usable quantity is received.

Receipt records include quantities, product condition, verification notes, receiver identity, facility, and timestamp.

## Alerts and Audit Logging

Operational alerts may cover:

- High-risk or expiring batches
- Dispatch urgency
- Transit delay
- Route issue and reroute requirement
- Quantity mismatch
- Partial acceptance or rejection

Audit logs record important actions, including batch creation, dispatch creation, status updates, route issues, completed reroutes, and receipt decisions.

## Technology Stack

### Frontend

- React 19
- Vite
- JavaScript and JSX
- Tailwind CSS
- React Router
- Axios
- Lucide React
- Leaflet and React-Leaflet
- Recharts
- CSS keyframe animations

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- REST APIs
- WebSocket telemetry endpoint
- XGBoost, scikit-learn, pandas, NumPy, and joblib

### Data

- SQLite
- Persistent tables for batches, telemetry, destinations, dispatches, receipts, alerts, inquiries, inventory, and audit logs

## Project Structure

```text
HarvestIQ/
├── backend/
│   ├── main.py
│   ├── auth_middleware.py
│   ├── config.py
│   ├── requirements.txt
│   ├── database/
│   │   ├── db.py
│   │   └── seed_data.py
│   ├── model/
│   │   ├── model_loader.py
│   │   └── *.pkl
│   ├── routes/
│   │   ├── batches.py
│   │   ├── prediction.py
│   │   ├── routing.py
│   │   ├── receipts.py
│   │   └── audit.py
│   ├── services/
│   │   ├── batch_service.py
│   │   ├── dispatch_service.py
│   │   ├── routing_service.py
│   │   ├── receipt_service.py
│   │   ├── alert_service.py
│   │   ├── audit_service.py
│   │   └── risk_engine.py
│   └── simulator/
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── public/
    └── src/
        ├── App.jsx
        ├── context/
        ├── components/
        ├── pages/
        ├── services/
        └── utils/
```

## Requirements

- Python 3.10 or newer
- Node.js 18 or newer
- npm
- Git
- A modern browser

## Local Setup

### Clone the repository

```bash
git clone https://github.com/Mansikumawat-code/RipePulse-AI.git
cd RipePulse-AI
```

### Start the backend

Windows PowerShell:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

macOS/Linux:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend URLs:

```text
http://localhost:8000
http://localhost:8000/docs
http://localhost:8000/health
```

### Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend normally runs at:

```text
http://localhost:5173
```

For local development, use `frontend/.env` if needed:

```text
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

## Main API Surface

The backend mounts routes under `/api` and also exposes compatible non-prefixed paths.

```text
GET    /api/health
GET    /api/batches
GET    /api/batches/{batch_id}
GET    /api/batches/at-risk
POST   /api/batches
GET    /api/destinations
GET    /api/dispatches
POST   /api/dispatches
GET    /api/dispatches/{dispatch_id}
PATCH  /api/dispatches/{dispatch_id}/status
GET    /api/shipments/active
POST   /api/routes/check
POST   /api/dispatches/{dispatch_id}/assign-route
POST   /api/dispatches/{dispatch_id}/simulate-route-issue
POST   /api/dispatches/{dispatch_id}/reroute
GET    /api/reroutes/pending
GET    /api/alerts
GET    /api/audit-logs
```

## Demo Test Flow

1. Sign in as Supply Chain Manager.
2. Open **Active Dispatches**.
3. Move a shipment to `IN_TRANSIT` if necessary.
4. Click **Simulate Route Issue (Demo)**.
5. Open **Reroute Decisions**.
6. Review the shipment, issue reason, ETA, and suggested destination.
7. Click **Approve Reroute**.
8. Confirm the shipment disappears from pending decisions.
9. Confirm it remains in Active Dispatches and Reroute History.
10. Refresh the browser and verify the persisted state remains correct.
11. Open Admin Audit Logs and verify the route issue and completed reroute events.

## Render Deployment

The repository includes a `render.yaml` Blueprint for separate frontend and backend services.

### Backend web service

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
```

### Frontend static site

```text
Root Directory: frontend
Build Command: npm ci && npm run build
Publish Directory: dist
```

Production environment variables:

```text
VITE_API_BASE_URL=https://ripepulse-ai.onrender.com/api
VITE_WS_URL=wss://ripepulse-ai.onrender.com/ws
```

For React Router, configure this Render rewrite:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

The frontend live link is:

https://ripepulse-ai-1.onrender.com

## Security and Production Notes

The current project uses demo role selection through request headers and is intended as a prototype. Production hardening should include JWT or session authentication, password hashing, stricter authorization, secret management, rate limiting, and restricted CORS origins.

SQLite is convenient for local development and demonstration, but a normal Render filesystem is not durable across all restarts and redeployments. For persistent production data, use a Render Persistent Disk or migrate the database to PostgreSQL.

## Limitations and Future Enhancements

- Real GPS and traffic integrations
- Calibrated IoT sensor ingestion
- Production authentication and user management
- PostgreSQL or another managed production database
- Automated unit and integration tests
- Weather and traffic-aware route optimization
- Email, SMS, or WhatsApp notifications
- Advanced analytics and reporting
- Mobile application support

## Contributing

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

3. Make and test your changes.
4. Commit them with a clear message.
5. Push the branch and open a pull request.

## License

This project is provided for educational, research, prototype, and innovation purposes. Add an open-source license if the project will be distributed under defined licensing terms.
