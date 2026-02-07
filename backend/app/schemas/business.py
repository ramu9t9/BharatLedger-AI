from pydantic import BaseModel


class BusinessCreate(BaseModel):
    name: str
    gstin: str = ""
    business_type: str = "regular"
    address: str = ""


class BusinessUpdate(BaseModel):
    name: str | None = None
    gstin: str | None = None
    business_type: str | None = None
    address: str | None = None


class BusinessResponse(BaseModel):
    id: str
    name: str
    gstin: str
    business_type: str
    address: str

    class Config:
        from_attributes = True
