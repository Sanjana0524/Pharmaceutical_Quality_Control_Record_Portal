from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security settings
SECRET_KEY = os.environ.get('SECRET_KEY', 'pharma-qc-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Pharmaceutical QC Portal")
api_router = APIRouter(prefix="/api")

# ============ Models ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    role: str  # Admin, QC Manager, QC Analyst, Auditor
    full_name: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_active: bool = True

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str
    full_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class BatchInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    batch_number: str
    product_name: str
    manufacturing_date: str
    expiry_date: str
    batch_size: str
    batch_quantity: str
    manufacturing_location: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_by: str

class TestRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    batch_id: str
    batch_number: str
    product_name: str
    test_type: str
    test_method: str
    equipment_used: str
    test_date: str
    test_time: str
    analyst_name: str
    analyst_id: str
    result_value: str
    result_unit: str
    specification_min: str
    specification_max: str
    pass_fail_status: str
    comments: str = ""
    deviation_notes: str = ""
    retest_required: bool = False
    attachments: List[str] = []
    signature: Optional[str] = None
    signature_date: Optional[str] = None
    reviewed_by: Optional[str] = None
    review_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TestRecordCreate(BaseModel):
    batch_id: str
    batch_number: str
    product_name: str
    test_type: str
    test_method: str
    equipment_used: str
    test_date: str
    test_time: str
    result_value: str
    result_unit: str
    specification_min: str
    specification_max: str
    comments: str = ""
    deviation_notes: str = ""
    retest_required: bool = False

class ElectronicSignature(BaseModel):
    test_id: str
    username: str
    password: str
    meaning: str  # e.g., "Tested by", "Reviewed by", "Approved by"
    comments: str = ""

class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action: str
    entity_type: str
    entity_id: str
    user_id: str
    username: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    details: Dict[str, Any] = {}
    ip_address: Optional[str] = None

class Specification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_name: str
    test_type: str
    min_limit: str
    max_limit: str
    unit: str
    method_reference: str

class Equipment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    equipment_name: str
    equipment_id: str
    calibration_status: str
    last_calibration_date: str
    next_calibration_date: str

# ============ Helper Functions ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

async def log_audit(action: str, entity_type: str, entity_id: str, user: User, details: Dict = None):
    audit_log = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user.id,
        username=user.username,
        details=details or {}
    )
    await db.audit_logs.insert_one(audit_log.model_dump())

# ============ Authentication Routes ============

@api_router.post("/auth/register", response_model=User)
async def register_user(user_data: UserCreate):
    # Check if username exists
    existing_user = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email exists
    existing_email = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user_data.model_dump()
    hashed_password = hash_password(user_dict.pop("password"))
    user_dict["hashed_password"] = hashed_password
    
    user = User(**user_dict)
    await db.users.insert_one({**user.model_dump(), "hashed_password": hashed_password})
    
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user_doc = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if not verify_password(user_data.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if not user_doc.get("is_active", True):
        raise HTTPException(status_code=401, detail="User account is inactive")
    
    # Create access token
    access_token = create_access_token(data={"sub": user_doc["id"]})
    
    user = User(**user_doc)
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# ============ Batch Routes ============

@api_router.post("/batches", response_model=BatchInfo)
async def create_batch(batch: BatchInfo, current_user: User = Depends(get_current_user)):
    batch_dict = batch.model_dump()
    batch_dict["created_by"] = current_user.username
    
    await db.batches.insert_one(batch_dict)
    await log_audit("CREATE", "batch", batch.id, current_user, {"batch_number": batch.batch_number})
    
    return batch

@api_router.get("/batches", response_model=List[BatchInfo])
async def get_batches(current_user: User = Depends(get_current_user)):
    batches = await db.batches.find({}, {"_id": 0}).to_list(1000)
    return batches

@api_router.get("/batches/{batch_id}", response_model=BatchInfo)
async def get_batch(batch_id: str, current_user: User = Depends(get_current_user)):
    batch = await db.batches.find_one({"id": batch_id}, {"_id": 0})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch

# ============ Test Record Routes ============

@api_router.post("/tests", response_model=TestRecord)
async def create_test_record(test_data: TestRecordCreate, current_user: User = Depends(get_current_user)):
    test_dict = test_data.model_dump()
    test_dict["analyst_name"] = current_user.full_name
    test_dict["analyst_id"] = current_user.id
    
    # Auto-calculate pass/fail status
    try:
        result = float(test_dict["result_value"])
        min_limit = float(test_dict["specification_min"]) if test_dict["specification_min"] else float('-inf')
        max_limit = float(test_dict["specification_max"]) if test_dict["specification_max"] else float('inf')
        
        if min_limit <= result <= max_limit:
            test_dict["pass_fail_status"] = "Pass"
        else:
            test_dict["pass_fail_status"] = "Fail"
    except ValueError:
        test_dict["pass_fail_status"] = "Pending Review"
    
    test_record = TestRecord(**test_dict)
    await db.tests.insert_one(test_record.model_dump())
    await log_audit("CREATE", "test", test_record.id, current_user, 
                   {"batch_number": test_record.batch_number, "test_type": test_record.test_type})
    
    return test_record

@api_router.get("/tests", response_model=List[TestRecord])
async def get_test_records(current_user: User = Depends(get_current_user)):
    tests = await db.tests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return tests

@api_router.get("/tests/{test_id}", response_model=TestRecord)
async def get_test_record(test_id: str, current_user: User = Depends(get_current_user)):
    test = await db.tests.find_one({"id": test_id}, {"_id": 0})
    if not test:
        raise HTTPException(status_code=404, detail="Test record not found")
    return test

@api_router.put("/tests/{test_id}", response_model=TestRecord)
async def update_test_record(test_id: str, test_data: dict, current_user: User = Depends(get_current_user)):
    test = await db.tests.find_one({"id": test_id}, {"_id": 0})
    if not test:
        raise HTTPException(status_code=404, detail="Test record not found")
    
    await db.tests.update_one({"id": test_id}, {"$set": test_data})
    await log_audit("UPDATE", "test", test_id, current_user, {"updated_fields": list(test_data.keys())})
    
    updated_test = await db.tests.find_one({"id": test_id}, {"_id": 0})
    return updated_test

# ============ Electronic Signature Routes ============

@api_router.post("/tests/{test_id}/sign")
async def sign_test_record(test_id: str, signature_data: ElectronicSignature, current_user: User = Depends(get_current_user)):
    # Verify test exists
    test = await db.tests.find_one({"id": test_id}, {"_id": 0})
    if not test:
        raise HTTPException(status_code=404, detail="Test record not found")
    
    # Verify user credentials
    user_doc = await db.users.find_one({"username": signature_data.username}, {"_id": 0})
    if not user_doc or not verify_password(signature_data.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials for electronic signature")
    
    # Apply signature
    signature_info = {
        "signature": f"{signature_data.meaning} by {signature_data.username}",
        "signature_date": datetime.now(timezone.utc).isoformat(),
        "signature_meaning": signature_data.meaning,
        "signature_comments": signature_data.comments
    }
    
    await db.tests.update_one({"id": test_id}, {"$set": signature_info})
    await log_audit("SIGN", "test", test_id, current_user, 
                   {"meaning": signature_data.meaning, "signer": signature_data.username})
    
    return {"message": "Test record signed successfully", "signature": signature_info}

# ============ Analytics Routes ============

@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: User = Depends(get_current_user)):
    # Get all tests
    all_tests = await db.tests.find({}, {"_id": 0}).to_list(1000)
    
    total_tests = len(all_tests)
    pass_tests = len([t for t in all_tests if t.get("pass_fail_status") == "Pass"])
    fail_tests = len([t for t in all_tests if t.get("pass_fail_status") == "Fail"])
    pending_tests = len([t for t in all_tests if t.get("pass_fail_status") == "Pending Review"])
    
    # Test types distribution
    test_types = {}
    for test in all_tests:
        test_type = test.get("test_type", "Unknown")
        test_types[test_type] = test_types.get(test_type, 0) + 1
    
    # Recent tests (last 7 days)
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_tests = [t for t in all_tests if t.get("created_at", "") >= seven_days_ago]
    
    # Product-wise statistics
    product_stats = {}
    for test in all_tests:
        product = test.get("product_name", "Unknown")
        if product not in product_stats:
            product_stats[product] = {"total": 0, "pass": 0, "fail": 0}
        product_stats[product]["total"] += 1
        if test.get("pass_fail_status") == "Pass":
            product_stats[product]["pass"] += 1
        elif test.get("pass_fail_status") == "Fail":
            product_stats[product]["fail"] += 1
    
    return {
        "total_tests": total_tests,
        "pass_tests": pass_tests,
        "fail_tests": fail_tests,
        "pending_tests": pending_tests,
        "pass_rate": round((pass_tests / total_tests * 100) if total_tests > 0 else 0, 2),
        "test_types_distribution": test_types,
        "recent_tests_count": len(recent_tests),
        "product_statistics": product_stats
    }

# ============ Audit Log Routes ============

@api_router.get("/audit-logs", response_model=List[AuditLog])
async def get_audit_logs(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["Admin", "QC Manager", "Auditor"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return logs

# ============ Specifications Routes ============

@api_router.get("/specifications", response_model=List[Specification])
async def get_specifications(current_user: User = Depends(get_current_user)):
    specs = await db.specifications.find({}, {"_id": 0}).to_list(1000)
    return specs

@api_router.post("/specifications", response_model=Specification)
async def create_specification(spec: Specification, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["Admin", "QC Manager"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    await db.specifications.insert_one(spec.model_dump())
    await log_audit("CREATE", "specification", spec.id, current_user, 
                   {"product": spec.product_name, "test_type": spec.test_type})
    
    return spec

# ============ Equipment Routes ============

@api_router.get("/equipment", response_model=List[Equipment])
async def get_equipment(current_user: User = Depends(get_current_user)):
    equipment = await db.equipment.find({}, {"_id": 0}).to_list(1000)
    return equipment

@api_router.post("/equipment", response_model=Equipment)
async def create_equipment(equip: Equipment, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["Admin", "QC Manager"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    await db.equipment.insert_one(equip.model_dump())
    await log_audit("CREATE", "equipment", equip.id, current_user, 
                   {"equipment_name": equip.equipment_name})
    
    return equip

# ============ Search and Filter Routes ============

@api_router.post("/tests/search")
async def search_tests(filters: dict, current_user: User = Depends(get_current_user)):
    query = {}
    
    if filters.get("batch_number"):
        query["batch_number"] = {"$regex": filters["batch_number"], "$options": "i"}
    
    if filters.get("product_name"):
        query["product_name"] = {"$regex": filters["product_name"], "$options": "i"}
    
    if filters.get("test_type"):
        query["test_type"] = filters["test_type"]
    
    if filters.get("pass_fail_status"):
        query["pass_fail_status"] = filters["pass_fail_status"]
    
    if filters.get("date_from"):
        query["test_date"] = {"$gte": filters["date_from"]}
    
    if filters.get("date_to"):
        if "test_date" in query:
            query["test_date"]["$lte"] = filters["date_to"]
        else:
            query["test_date"] = {"$lte": filters["date_to"]}
    
    tests = await db.tests.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return tests

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
