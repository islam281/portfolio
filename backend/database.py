import json
import sqlite3
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
PORTFOLIO_DIR = ROOT_DIR / "portfolio"
DATA_DIR = PORTFOLIO_DIR / "data"
DB_PATH = BASE_DIR / "portfolio.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def row_to_dict(row):
    return dict(row) if row else None


def load_json(name, fallback):
    path = DATA_DIR / f"{name}.json"
    if not path.exists():
        return fallback
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def init_db():
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS profile (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                name TEXT NOT NULL,
                title TEXT NOT NULL,
                hero_title TEXT NOT NULL,
                hero_subtitle TEXT NOT NULL,
                about_primary TEXT NOT NULL,
                about_secondary TEXT NOT NULL,
                image TEXT NOT NULL,
                email TEXT NOT NULL,
                location TEXT NOT NULL,
                phone TEXT NOT NULL,
                linkedin TEXT NOT NULL,
                github TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS skill_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                icon TEXT NOT NULL DEFAULT 'fas fa-star',
                sort_order INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                icon TEXT NOT NULL DEFAULT 'fas fa-check',
                sort_order INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (category_id) REFERENCES skill_categories(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                class_name TEXT NOT NULL DEFAULT '',
                icon TEXT NOT NULL DEFAULT 'fas fa-project-diagram',
                summary TEXT NOT NULL DEFAULT '',
                repo_link TEXT NOT NULL DEFAULT '#',
                demo_link TEXT NOT NULL DEFAULT '#',
                sort_order INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS project_details (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                label TEXT NOT NULL,
                value TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS project_tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS education (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                year TEXT NOT NULL,
                title TEXT NOT NULL,
                org TEXT NOT NULL,
                icon TEXT NOT NULL DEFAULT 'fas fa-graduation-cap',
                description TEXT NOT NULL DEFAULT '',
                sort_order INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS education_tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                education_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (education_id) REFERENCES education(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                year TEXT NOT NULL,
                title TEXT NOT NULL,
                org TEXT NOT NULL,
                icon TEXT NOT NULL DEFAULT 'fas fa-certificate',
                description TEXT NOT NULL DEFAULT '',
                sort_order INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS course_tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS experience (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                company TEXT NOT NULL,
                duration TEXT NOT NULL,
                icon TEXT NOT NULL DEFAULT 'fas fa-briefcase',
                sort_order INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS experience_descriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                experience_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (experience_id) REFERENCES experience(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS experience_skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                experience_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (experience_id) REFERENCES experience(id) ON DELETE CASCADE
            );
            """
        )
        seeded = conn.execute("SELECT COUNT(*) AS count FROM profile").fetchone()["count"]
        if seeded == 0:
            seed_from_json(conn)


def seed_from_json(conn):
    profile = load_json("profile", {})
    hero = profile.get("hero", {})
    about = profile.get("about", {})
    socials = profile.get("socials", {})
    upsert_profile(
        conn,
        {
            "name": profile.get("name", ""),
            "title": profile.get("title", ""),
            "hero_title": hero.get("title", ""),
            "hero_subtitle": hero.get("subtitle", ""),
            "about_primary": about.get("text_primary", ""),
            "about_secondary": about.get("text_secondary", ""),
            "image": about.get("image", "assets/profile.jpg"),
            "email": socials.get("email", ""),
            "location": socials.get("location", ""),
            "phone": socials.get("phone", ""),
            "linkedin": socials.get("linkedin", ""),
            "github": socials.get("github", ""),
        },
    )

    for idx, category in enumerate(load_json("skills", []), start=1):
        category_id = create_skill_category(
            conn,
            {"title": category.get("title", ""), "icon": category.get("icon", ""), "sort_order": idx},
        )
        for sidx, skill in enumerate(category.get("skills", []), start=1):
            create_skill(
                conn,
                {
                    "category_id": category_id,
                    "name": skill.get("name", ""),
                    "icon": skill.get("icon", ""),
                    "sort_order": sidx,
                },
            )

    for idx, project in enumerate(load_json("projects", []), start=1):
        create_project(conn, {**project, "sort_order": idx})

    for idx, item in enumerate(load_json("education", []), start=1):
        create_education(conn, {**item, "sort_order": idx})

    for idx, item in enumerate(load_json("courses", []), start=1):
        create_course(conn, {**item, "sort_order": idx})

    for idx, item in enumerate(load_json("experience", []), start=1):
        create_experience(conn, {**item, "sort_order": idx})


def get_profile(conn):
    row = conn.execute("SELECT * FROM profile WHERE id = 1").fetchone()
    data = row_to_dict(row) or {}
    return {
        "name": data.get("name", ""),
        "title": data.get("title", ""),
        "hero": {"title": data.get("hero_title", ""), "subtitle": data.get("hero_subtitle", "")},
        "about": {
            "text_primary": data.get("about_primary", ""),
            "text_secondary": data.get("about_secondary", ""),
            "image": data.get("image", "assets/profile.jpg"),
        },
        "socials": {
            "email": data.get("email", ""),
            "location": data.get("location", ""),
            "phone": data.get("phone", ""),
            "linkedin": data.get("linkedin", ""),
            "github": data.get("github", ""),
        },
    }


def get_profile_admin(conn):
    return row_to_dict(conn.execute("SELECT * FROM profile WHERE id = 1").fetchone())


def upsert_profile(conn, data):
    conn.execute(
        """
        INSERT INTO profile (
            id, name, title, hero_title, hero_subtitle, about_primary, about_secondary,
            image, email, location, phone, linkedin, github
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            title=excluded.title,
            hero_title=excluded.hero_title,
            hero_subtitle=excluded.hero_subtitle,
            about_primary=excluded.about_primary,
            about_secondary=excluded.about_secondary,
            image=excluded.image,
            email=excluded.email,
            location=excluded.location,
            phone=excluded.phone,
            linkedin=excluded.linkedin,
            github=excluded.github
        """,
        (
            data.get("name", ""),
            data.get("title", ""),
            data.get("hero_title", ""),
            data.get("hero_subtitle", ""),
            data.get("about_primary", ""),
            data.get("about_secondary", ""),
            data.get("image", "assets/profile.jpg"),
            data.get("email", ""),
            data.get("location", ""),
            data.get("phone", ""),
            data.get("linkedin", ""),
            data.get("github", ""),
        ),
    )
    conn.commit()
    return get_profile_admin(conn)


def list_skill_categories(conn):
    categories = []
    rows = conn.execute("SELECT * FROM skill_categories ORDER BY sort_order, id").fetchall()
    for row in rows:
        category = row_to_dict(row)
        category["skills"] = [
            row_to_dict(skill)
            for skill in conn.execute(
                "SELECT * FROM skills WHERE category_id = ? ORDER BY sort_order, id",
                (category["id"],),
            ).fetchall()
        ]
        categories.append(category)
    return categories


def list_skills_public(conn):
    return [
        {
            "title": category["title"],
            "icon": category["icon"],
            "skills": [{"name": skill["name"], "icon": skill["icon"]} for skill in category["skills"]],
        }
        for category in list_skill_categories(conn)
    ]


def create_skill_category(conn, data):
    cur = conn.execute(
        "INSERT INTO skill_categories (title, icon, sort_order) VALUES (?, ?, ?)",
        (data.get("title", ""), data.get("icon", "fas fa-star"), data.get("sort_order", 0)),
    )
    conn.commit()
    return cur.lastrowid


def update_skill_category(conn, category_id, data):
    conn.execute(
        "UPDATE skill_categories SET title = ?, icon = ?, sort_order = ? WHERE id = ?",
        (data.get("title", ""), data.get("icon", "fas fa-star"), data.get("sort_order", 0), category_id),
    )
    conn.commit()
    return row_to_dict(conn.execute("SELECT * FROM skill_categories WHERE id = ?", (category_id,)).fetchone())


def delete_skill_category(conn, category_id):
    conn.execute("DELETE FROM skill_categories WHERE id = ?", (category_id,))
    conn.commit()


def create_skill(conn, data):
    cur = conn.execute(
        "INSERT INTO skills (category_id, name, icon, sort_order) VALUES (?, ?, ?, ?)",
        (
            data.get("category_id"),
            data.get("name", ""),
            data.get("icon", "fas fa-check"),
            data.get("sort_order", 0),
        ),
    )
    conn.commit()
    return cur.lastrowid


def update_skill(conn, skill_id, data):
    conn.execute(
        "UPDATE skills SET category_id = ?, name = ?, icon = ?, sort_order = ? WHERE id = ?",
        (
            data.get("category_id"),
            data.get("name", ""),
            data.get("icon", "fas fa-check"),
            data.get("sort_order", 0),
            skill_id,
        ),
    )
    conn.commit()
    return row_to_dict(conn.execute("SELECT * FROM skills WHERE id = ?", (skill_id,)).fetchone())


def delete_skill(conn, skill_id):
    conn.execute("DELETE FROM skills WHERE id = ?", (skill_id,))
    conn.commit()


def list_projects(conn):
    projects = []
    rows = conn.execute("SELECT * FROM projects ORDER BY sort_order, id").fetchall()
    for row in rows:
        project = row_to_dict(row)
        project["class"] = project.pop("class_name")
        project["details"] = {
            detail["label"]: detail["value"]
            for detail in conn.execute(
                "SELECT label, value FROM project_details WHERE project_id = ? ORDER BY sort_order, id",
                (project["id"],),
            ).fetchall()
        }
        project["tags"] = [
            tag["name"]
            for tag in conn.execute(
                "SELECT name FROM project_tags WHERE project_id = ? ORDER BY sort_order, id",
                (project["id"],),
            ).fetchall()
        ]
        projects.append(project)
    return projects


def create_project(conn, data):
    cur = conn.execute(
        """
        INSERT INTO projects (slug, title, class_name, icon, summary, repo_link, demo_link, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data.get("slug") or data.get("id", ""),
            data.get("title", ""),
            data.get("class") or data.get("class_name", ""),
            data.get("icon", "fas fa-project-diagram"),
            data.get("summary", ""),
            data.get("repo_link", "#"),
            data.get("demo_link", "#"),
            data.get("sort_order", 0),
        ),
    )
    project_id = cur.lastrowid
    replace_project_children(conn, project_id, data)
    conn.commit()
    return project_id


def update_project(conn, project_id, data):
    conn.execute(
        """
        UPDATE projects
        SET slug = ?, title = ?, class_name = ?, icon = ?, summary = ?,
            repo_link = ?, demo_link = ?, sort_order = ?
        WHERE id = ?
        """,
        (
            data.get("slug") or data.get("id", ""),
            data.get("title", ""),
            data.get("class") or data.get("class_name", ""),
            data.get("icon", "fas fa-project-diagram"),
            data.get("summary", ""),
            data.get("repo_link", "#"),
            data.get("demo_link", "#"),
            data.get("sort_order", 0),
            project_id,
        ),
    )
    conn.execute("DELETE FROM project_details WHERE project_id = ?", (project_id,))
    conn.execute("DELETE FROM project_tags WHERE project_id = ?", (project_id,))
    replace_project_children(conn, project_id, data)
    conn.commit()
    return project_id


def replace_project_children(conn, project_id, data):
    details = data.get("details", {}) or {}
    for idx, (label, value) in enumerate(details.items(), start=1):
        conn.execute(
            "INSERT INTO project_details (project_id, label, value, sort_order) VALUES (?, ?, ?, ?)",
            (project_id, label, value, idx),
        )
    for idx, tag in enumerate(data.get("tags", []) or [], start=1):
        conn.execute(
            "INSERT INTO project_tags (project_id, name, sort_order) VALUES (?, ?, ?)",
            (project_id, tag, idx),
        )


def delete_project(conn, project_id):
    conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()


def list_tagged_items(conn, table, tag_table, fk_name):
    items = []
    rows = conn.execute(f"SELECT * FROM {table} ORDER BY sort_order, id").fetchall()
    for row in rows:
        item = row_to_dict(row)
        item["tags"] = [
            tag["name"]
            for tag in conn.execute(
                f"SELECT name FROM {tag_table} WHERE {fk_name} = ? ORDER BY sort_order, id",
                (item["id"],),
            ).fetchall()
        ]
        items.append(item)
    return items


def create_tagged_item(conn, table, tag_table, fk_name, data):
    cur = conn.execute(
        f"INSERT INTO {table} (year, title, org, icon, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
        (
            data.get("year", ""),
            data.get("title", ""),
            data.get("org", ""),
            data.get("icon", "fas fa-certificate"),
            data.get("description", ""),
            data.get("sort_order", 0),
        ),
    )
    item_id = cur.lastrowid
    replace_tags(conn, tag_table, fk_name, item_id, data.get("tags", []) or [])
    conn.commit()
    return item_id


def update_tagged_item(conn, table, tag_table, fk_name, item_id, data):
    conn.execute(
        f"UPDATE {table} SET year = ?, title = ?, org = ?, icon = ?, description = ?, sort_order = ? WHERE id = ?",
        (
            data.get("year", ""),
            data.get("title", ""),
            data.get("org", ""),
            data.get("icon", "fas fa-certificate"),
            data.get("description", ""),
            data.get("sort_order", 0),
            item_id,
        ),
    )
    conn.execute(f"DELETE FROM {tag_table} WHERE {fk_name} = ?", (item_id,))
    replace_tags(conn, tag_table, fk_name, item_id, data.get("tags", []) or [])
    conn.commit()
    return item_id


def replace_tags(conn, tag_table, fk_name, item_id, tags):
    for idx, tag in enumerate(tags, start=1):
        conn.execute(
            f"INSERT INTO {tag_table} ({fk_name}, name, sort_order) VALUES (?, ?, ?)",
            (item_id, tag, idx),
        )


def delete_item(conn, table, item_id):
    conn.execute(f"DELETE FROM {table} WHERE id = ?", (item_id,))
    conn.commit()


def list_courses(conn):
    return list_tagged_items(conn, "courses", "course_tags", "course_id")


def create_course(conn, data):
    return create_tagged_item(conn, "courses", "course_tags", "course_id", data)


def update_course(conn, course_id, data):
    return update_tagged_item(conn, "courses", "course_tags", "course_id", course_id, data)


def list_education(conn):
    return list_tagged_items(conn, "education", "education_tags", "education_id")


def create_education(conn, data):
    return create_tagged_item(conn, "education", "education_tags", "education_id", data)


def update_education(conn, education_id, data):
    return update_tagged_item(conn, "education", "education_tags", "education_id", education_id, data)


def list_experience(conn):
    items = []
    rows = conn.execute("SELECT * FROM experience ORDER BY sort_order, id").fetchall()
    for row in rows:
        item = row_to_dict(row)
        item["description"] = [
            desc["text"]
            for desc in conn.execute(
                "SELECT text FROM experience_descriptions WHERE experience_id = ? ORDER BY sort_order, id",
                (item["id"],),
            ).fetchall()
        ]
        item["skills"] = [
            skill["name"]
            for skill in conn.execute(
                "SELECT name FROM experience_skills WHERE experience_id = ? ORDER BY sort_order, id",
                (item["id"],),
            ).fetchall()
        ]
        items.append(item)
    return items


def create_experience(conn, data):
    cur = conn.execute(
        "INSERT INTO experience (role, company, duration, icon, sort_order) VALUES (?, ?, ?, ?, ?)",
        (
            data.get("role", ""),
            data.get("company", ""),
            data.get("duration", ""),
            data.get("icon", "fas fa-briefcase"),
            data.get("sort_order", 0),
        ),
    )
    item_id = cur.lastrowid
    replace_experience_children(conn, item_id, data)
    conn.commit()
    return item_id


def update_experience(conn, item_id, data):
    conn.execute(
        "UPDATE experience SET role = ?, company = ?, duration = ?, icon = ?, sort_order = ? WHERE id = ?",
        (
            data.get("role", ""),
            data.get("company", ""),
            data.get("duration", ""),
            data.get("icon", "fas fa-briefcase"),
            data.get("sort_order", 0),
            item_id,
        ),
    )
    conn.execute("DELETE FROM experience_descriptions WHERE experience_id = ?", (item_id,))
    conn.execute("DELETE FROM experience_skills WHERE experience_id = ?", (item_id,))
    replace_experience_children(conn, item_id, data)
    conn.commit()
    return item_id


def replace_experience_children(conn, item_id, data):
    for idx, text in enumerate(data.get("description", []) or [], start=1):
        conn.execute(
            "INSERT INTO experience_descriptions (experience_id, text, sort_order) VALUES (?, ?, ?)",
            (item_id, text, idx),
        )
    for idx, skill in enumerate(data.get("skills", []) or [], start=1):
        conn.execute(
            "INSERT INTO experience_skills (experience_id, name, sort_order) VALUES (?, ?, ?)",
            (item_id, skill, idx),
        )
