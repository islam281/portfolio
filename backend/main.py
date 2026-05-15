import os
import re
import smtplib
from email.message import EmailMessage
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import database as db

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    env_path = db.ROOT_DIR / "backend" / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


class Payload(BaseModel):
    data: Dict[str, Any]


class ContactMessage(BaseModel):
    name: str
    email: str
    subject: str = ""
    message: str


app = FastAPI(title="Dynamic Portfolio CMS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    db.init_db()


def with_conn(callback):
    with db.get_connection() as conn:
        return callback(conn)


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def validate_contact(payload: ContactMessage):
    name = payload.name.strip()
    email = payload.email.strip()
    subject = payload.subject.strip() or "New portfolio contact message"
    message = payload.message.strip()
    email_pattern = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"

    errors = {}
    if not name:
        errors["name"] = "Name is required"
    if not email:
        errors["email"] = "Email is required"
    elif not re.match(email_pattern, email):
        errors["email"] = "Email is invalid"
    if not message:
        errors["message"] = "Message is required"

    if errors:
        raise HTTPException(status_code=422, detail=errors)

    return {"name": name, "email": email, "subject": subject, "message": message}


@app.post("/api/contact")
def send_contact_message(payload: ContactMessage):
    data = validate_contact(payload)

    mail_host = os.getenv("MAIL_HOST", "").strip()
    mail_port = int(os.getenv("MAIL_PORT", "587"))
    mail_username = os.getenv("MAIL_USERNAME", "").strip()
    mail_password = os.getenv("MAIL_PASSWORD", "").strip()
    mail_from = os.getenv("MAIL_FROM_ADDRESS", "").strip()
    mail_from_name = os.getenv("MAIL_FROM_NAME", "Portfolio Contact").strip()
    contact_to = os.getenv("CONTACT_TO_EMAIL", "").strip()
    use_tls = env_bool("MAIL_USE_TLS", True)
    use_ssl = env_bool("MAIL_USE_SSL", False)

    missing = [
        name
        for name, value in {
            "MAIL_HOST": mail_host,
            "MAIL_FROM_ADDRESS": mail_from,
            "CONTACT_TO_EMAIL": contact_to,
        }.items()
        if not value or value == "ضع_إيميلك_هنا"
    ]
    if missing:
        raise HTTPException(
            status_code=503,
            detail=f"Email service is not configured. Missing: {', '.join(missing)}",
        )

    email = EmailMessage()
    email["Subject"] = data["subject"]
    email["From"] = f"{mail_from_name} <{mail_from}>"
    email["To"] = contact_to
    email["Reply-To"] = data["email"]
    email.set_content(
        "\n".join(
            [
                "New message from portfolio contact form:",
                "",
                f"Name: {data['name']}",
                f"Email: {data['email']}",
                f"Subject: {data['subject']}",
                "",
                "Message:",
                data["message"],
            ]
        )
    )

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(mail_host, mail_port, timeout=20) as server:
                if mail_username:
                    server.login(mail_username, mail_password)
                server.send_message(email)
        else:
            with smtplib.SMTP(mail_host, mail_port, timeout=20) as server:
                if use_tls:
                    server.starttls()
                if mail_username:
                    server.login(mail_username, mail_password)
                server.send_message(email)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not send email. Check SMTP settings.") from exc

    return {"message": "Message sent successfully"}


@app.get("/api/public/profile")
def public_profile():
    return with_conn(db.get_profile)


@app.get("/api/public/skills")
def public_skills():
    return with_conn(db.list_skills_public)


@app.get("/api/public/projects")
def public_projects():
    return with_conn(db.list_projects)


@app.get("/api/public/education")
def public_education():
    return with_conn(db.list_education)


@app.get("/api/public/courses")
def public_courses():
    return with_conn(db.list_courses)


@app.get("/api/public/experience")
def public_experience():
    return with_conn(db.list_experience)


@app.get("/api/admin/profile")
def admin_profile():
    return with_conn(db.get_profile_admin)


@app.put("/api/admin/profile")
def admin_update_profile(payload: Payload):
    return with_conn(lambda conn: db.upsert_profile(conn, payload.data))


@app.get("/api/admin/skill-categories")
def admin_skill_categories():
    return with_conn(db.list_skill_categories)


@app.post("/api/admin/skill-categories")
def admin_create_skill_category(payload: Payload):
    return with_conn(lambda conn: {"id": db.create_skill_category(conn, payload.data)})


@app.put("/api/admin/skill-categories/{category_id}")
def admin_update_skill_category(category_id: int, payload: Payload):
    item = with_conn(lambda conn: db.update_skill_category(conn, category_id, payload.data))
    if not item:
        raise HTTPException(status_code=404, detail="Skill category not found")
    return item


@app.delete("/api/admin/skill-categories/{category_id}")
def admin_delete_skill_category(category_id: int):
    with_conn(lambda conn: db.delete_skill_category(conn, category_id))
    return {"message": "Skill category deleted"}


@app.post("/api/admin/skills")
def admin_create_skill(payload: Payload):
    return with_conn(lambda conn: {"id": db.create_skill(conn, payload.data)})


@app.put("/api/admin/skills/{skill_id}")
def admin_update_skill(skill_id: int, payload: Payload):
    item = with_conn(lambda conn: db.update_skill(conn, skill_id, payload.data))
    if not item:
        raise HTTPException(status_code=404, detail="Skill not found")
    return item


@app.delete("/api/admin/skills/{skill_id}")
def admin_delete_skill(skill_id: int):
    with_conn(lambda conn: db.delete_skill(conn, skill_id))
    return {"message": "Skill deleted"}


@app.get("/api/admin/projects")
def admin_projects():
    return with_conn(db.list_projects)


@app.post("/api/admin/projects")
def admin_create_project(payload: Payload):
    return with_conn(lambda conn: {"id": db.create_project(conn, payload.data)})


@app.put("/api/admin/projects/{project_id}")
def admin_update_project(project_id: int, payload: Payload):
    with_conn(lambda conn: db.update_project(conn, project_id, payload.data))
    return {"message": "Project updated"}


@app.delete("/api/admin/projects/{project_id}")
def admin_delete_project(project_id: int):
    with_conn(lambda conn: db.delete_project(conn, project_id))
    return {"message": "Project deleted"}


@app.get("/api/admin/courses")
def admin_courses():
    return with_conn(db.list_courses)


@app.post("/api/admin/courses")
def admin_create_course(payload: Payload):
    return with_conn(lambda conn: {"id": db.create_course(conn, payload.data)})


@app.put("/api/admin/courses/{course_id}")
def admin_update_course(course_id: int, payload: Payload):
    with_conn(lambda conn: db.update_course(conn, course_id, payload.data))
    return {"message": "Course updated"}


@app.delete("/api/admin/courses/{course_id}")
def admin_delete_course(course_id: int):
    with_conn(lambda conn: db.delete_item(conn, "courses", course_id))
    return {"message": "Course deleted"}


@app.get("/api/admin/education")
def admin_education():
    return with_conn(db.list_education)


@app.post("/api/admin/education")
def admin_create_education(payload: Payload):
    return with_conn(lambda conn: {"id": db.create_education(conn, payload.data)})


@app.put("/api/admin/education/{education_id}")
def admin_update_education(education_id: int, payload: Payload):
    with_conn(lambda conn: db.update_education(conn, education_id, payload.data))
    return {"message": "Education updated"}


@app.delete("/api/admin/education/{education_id}")
def admin_delete_education(education_id: int):
    with_conn(lambda conn: db.delete_item(conn, "education", education_id))
    return {"message": "Education deleted"}


@app.get("/api/admin/experience")
def admin_experience():
    return with_conn(db.list_experience)


@app.post("/api/admin/experience")
def admin_create_experience(payload: Payload):
    return with_conn(lambda conn: {"id": db.create_experience(conn, payload.data)})


@app.put("/api/admin/experience/{experience_id}")
def admin_update_experience(experience_id: int, payload: Payload):
    with_conn(lambda conn: db.update_experience(conn, experience_id, payload.data))
    return {"message": "Experience updated"}


@app.delete("/api/admin/experience/{experience_id}")
def admin_delete_experience(experience_id: int):
    with_conn(lambda conn: db.delete_item(conn, "experience", experience_id))
    return {"message": "Experience deleted"}


app.mount("/admin", StaticFiles(directory=db.ROOT_DIR / "admin", html=True), name="admin")
app.mount("/", StaticFiles(directory=db.PORTFOLIO_DIR, html=True), name="portfolio")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
