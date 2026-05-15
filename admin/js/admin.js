const API_ORIGIN = location.protocol === "file:" || !location.host ? "http://127.0.0.1:8000" : "";
const API = `${API_ORIGIN}/api/admin`;

const state = {
    section: "profile",
    editing: null,
    categories: [],
};

const copy = (value) => JSON.parse(JSON.stringify(value));
const $ = (selector) => document.querySelector(selector);
const panel = (name) => document.getElementById(`${name}-panel`);

const sectionMeta = {
    profile: ["Profile", "Edit the main hero, about, and contact information."],
    skills: ["Skills", "Manage categories and individual skills."],
    projects: ["Projects", "Create project cards with details, tags, and links."],
    courses: ["Courses", "Manage courses and certificates shown in the portfolio."],
    experience: ["Experience", "Manage work experience accordion items."],
};

document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => setSection(tab.dataset.section));
});

function setStatus(message, type = "") {
    const status = $("#status");
    status.textContent = message || "";
    status.className = `status ${type}`.trim();
}

async function request(path, options = {}) {
    let response;
    try {
        response = await fetch(`${API}${path}`, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });
    } catch (error) {
        throw new Error(`Cannot reach API at ${API}. Start the FastAPI server first.`);
    }
    if (!response.ok) {
        throw new Error(await response.text());
    }
    return response.status === 204 ? null : response.json();
}

function payload(data) {
    return JSON.stringify({ data });
}

function linesToArray(value) {
    return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function arrayToLines(value = []) {
    return value.join("\n");
}

function detailsToText(details = {}) {
    return Object.entries(details).map(([key, value]) => `${key}: ${value}`).join("\n");
}

function textToDetails(value) {
    return Object.fromEntries(
        value.split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const index = line.indexOf(":");
                if (index === -1) return [line, ""];
                return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
            })
    );
}

function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

async function setSection(section) {
    state.section = section;
    state.editing = null;
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.section === section));
    document.querySelectorAll(".panel").forEach((item) => item.classList.toggle("active", item.id === `${section}-panel`));
    $("#section-title").textContent = sectionMeta[section][0];
    $("#section-help").textContent = sectionMeta[section][1];
    setStatus("Loading...");
    try {
        await renderSection();
        setStatus("Loaded", "ok");
    } catch (error) {
        setStatus(error.message || "Could not load data", "error");
        console.error(error);
    }
}

async function renderSection() {
    if (state.section === "profile") return renderProfile();
    if (state.section === "skills") return renderSkills();
    if (state.section === "projects") return renderProjects();
    if (state.section === "courses") return renderCourses();
    if (state.section === "experience") return renderExperience();
}

async function renderProfile() {
    const data = await request("/profile");
    panel("profile").innerHTML = `
        <form class="card" id="profile-form">
            <div class="grid">
                ${input("name", "Name", data.name)}
                ${input("title", "Title", data.title)}
                ${input("hero_title", "Hero title", data.hero_title)}
                ${input("hero_subtitle", "Hero subtitle", data.hero_subtitle)}
                ${textarea("about_primary", "About primary", data.about_primary)}
                ${textarea("about_secondary", "About secondary", data.about_secondary)}
                ${input("image", "Image path", data.image)}
                ${input("email", "Email", data.email)}
                ${input("location", "Location", data.location)}
                ${input("phone", "Phone", data.phone)}
                ${input("linkedin", "LinkedIn", data.linkedin)}
                ${input("github", "GitHub", data.github)}
            </div>
            <div class="form-actions">
                <button class="btn" type="submit"><i class="fas fa-save"></i> Save Profile</button>
            </div>
        </form>
    `;
    $("#profile-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        await request("/profile", { method: "PUT", body: payload(formData(event.currentTarget)) });
        setStatus("Profile saved", "ok");
    });
}

async function renderSkills() {
    state.categories = await request("/skill-categories");
    const selectedCategory = state.categories[0]?.id || "";
    panel("skills").innerHTML = `
        <div class="card">
            <h3>Skill Category</h3>
            <form id="category-form">
                <div class="grid">
                    ${input("title", "Category title")}
                    ${input("icon", "Icon class", "fas fa-star")}
                    ${input("sort_order", "Sort order", "0", "number")}
                </div>
                <div class="form-actions">
                    <button class="btn" type="submit">Add Category</button>
                </div>
            </form>
        </div>
        <div class="card">
            <h3>Skill</h3>
            <form id="skill-form">
                <div class="grid">
                    ${select("category_id", "Category", state.categories.map((cat) => [cat.id, cat.title]), selectedCategory)}
                    ${input("name", "Skill name")}
                    ${input("icon", "Icon class", "fas fa-check")}
                    ${input("sort_order", "Sort order", "0", "number")}
                </div>
                <div class="form-actions">
                    <button class="btn" type="submit">Add Skill</button>
                </div>
            </form>
        </div>
        <div class="card">
            <h3>Current Skills</h3>
            <div class="list">
                ${state.categories.map(renderCategoryRow).join("")}
            </div>
        </div>
    `;
    $("#category-form").addEventListener("submit", saveCategory);
    $("#skill-form").addEventListener("submit", saveSkill);
    panel("skills").querySelectorAll("[data-action]").forEach((btn) => btn.addEventListener("click", handleSkillsAction));
}

function renderCategoryRow(category) {
    return `
        <div class="row">
            <div>
                <h3><i class="${category.icon}"></i> ${category.title}</h3>
                <p class="meta">Category #${category.id} · Order ${category.sort_order}</p>
                <p class="meta">${category.skills.map((skill) => skill.name).join(", ") || "No skills yet"}</p>
            </div>
            <div class="row-actions">
                <button class="btn secondary" data-action="edit-category" data-id="${category.id}">Edit</button>
                <button class="btn danger" data-action="delete-category" data-id="${category.id}">Delete</button>
            </div>
            ${category.skills.map((skill) => `
                <div class="row">
                    <div>
                        <h3><i class="${skill.icon}"></i> ${skill.name}</h3>
                        <p class="meta">Skill #${skill.id} · Order ${skill.sort_order}</p>
                    </div>
                    <div class="row-actions">
                        <button class="btn secondary" data-action="edit-skill" data-id="${skill.id}" data-category="${category.id}">Edit</button>
                        <button class="btn danger" data-action="delete-skill" data-id="${skill.id}">Delete</button>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

async function handleSkillsAction(event) {
    const action = event.currentTarget.dataset.action;
    const id = Number(event.currentTarget.dataset.id);
    if (action === "delete-category" && confirm("Delete this category and its skills?")) {
        await request(`/skill-categories/${id}`, { method: "DELETE" });
        return setSection("skills");
    }
    if (action === "delete-skill" && confirm("Delete this skill?")) {
        await request(`/skills/${id}`, { method: "DELETE" });
        return setSection("skills");
    }
    if (action === "edit-category") {
        const category = state.categories.find((item) => item.id === id);
        $("#category-form").innerHTML = `
            <div class="grid">
                ${input("title", "Category title", category.title)}
                ${input("icon", "Icon class", category.icon)}
                ${input("sort_order", "Sort order", category.sort_order, "number")}
            </div>
            <div class="form-actions">
                <button class="btn" type="submit">Save Category</button>
                <button class="btn secondary" type="button" onclick="setSection('skills')">Cancel</button>
            </div>
        `;
        $("#category-form").onsubmit = async (event) => {
            event.preventDefault();
            await request(`/skill-categories/${id}`, { method: "PUT", body: payload(formData(event.currentTarget)) });
            setSection("skills");
        };
    }
    if (action === "edit-skill") {
        const category = state.categories.find((item) => item.id === Number(event.currentTarget.dataset.category));
        const skill = category.skills.find((item) => item.id === id);
        $("#skill-form").innerHTML = `
            <div class="grid">
                ${select("category_id", "Category", state.categories.map((cat) => [cat.id, cat.title]), skill.category_id)}
                ${input("name", "Skill name", skill.name)}
                ${input("icon", "Icon class", skill.icon)}
                ${input("sort_order", "Sort order", skill.sort_order, "number")}
            </div>
            <div class="form-actions">
                <button class="btn" type="submit">Save Skill</button>
                <button class="btn secondary" type="button" onclick="setSection('skills')">Cancel</button>
            </div>
        `;
        $("#skill-form").onsubmit = async (event) => {
            event.preventDefault();
            const data = formData(event.currentTarget);
            data.category_id = Number(data.category_id);
            await request(`/skills/${id}`, { method: "PUT", body: payload(data) });
            setSection("skills");
        };
    }
}

async function saveCategory(event) {
    event.preventDefault();
    await request("/skill-categories", { method: "POST", body: payload(formData(event.currentTarget)) });
    setSection("skills");
}

async function saveSkill(event) {
    event.preventDefault();
    const data = formData(event.currentTarget);
    data.category_id = Number(data.category_id);
    await request("/skills", { method: "POST", body: payload(data) });
    setSection("skills");
}

async function renderProjects() {
    const items = await request("/projects");
    renderCrudPanel("projects", items, projectForm, projectRow, saveProject, deleteProject, "Add Project");
}

function projectForm(item = {}) {
    return `
        <form class="card" id="entity-form">
            <div class="grid">
                ${input("slug", "Slug", item.slug || item.id || "")}
                ${input("title", "Title", item.title)}
                ${input("class", "Visual class", item.class)}
                ${input("icon", "Icon class", item.icon || "fas fa-project-diagram")}
                ${textarea("summary", "Summary", item.summary)}
                ${input("repo_link", "Repository link", item.repo_link || "#")}
                ${input("demo_link", "Demo link", item.demo_link || "#")}
                ${input("sort_order", "Sort order", item.sort_order || 0, "number")}
                ${textarea("details", "Details", detailsToText(item.details), "One detail per line: Label: value")}
                ${textarea("tags", "Tags", arrayToLines(item.tags), "One tag per line")}
            </div>
            ${formActions(Boolean(item.id))}
        </form>
    `;
}

function projectRow(item) {
    return `<h3>${item.title}</h3><p class="meta">${item.summary}</p><p class="meta">${(item.tags || []).join(", ")}</p>`;
}

async function saveProject(event) {
    event.preventDefault();
    const data = formData(event.currentTarget);
    data.details = textToDetails(data.details || "");
    data.tags = linesToArray(data.tags || "");
    const id = state.editing;
    await request(`/projects${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body: payload(data) });
    state.editing = null;
    setSection("projects");
}

async function deleteProject(id) {
    await request(`/projects/${id}`, { method: "DELETE" });
}

async function renderCourses() {
    const items = await request("/courses");
    renderCrudPanel("courses", items, taggedForm, taggedRow, saveTagged("courses"), deleteTagged("courses"), "Add Course");
}

async function renderExperience() {
    const items = await request("/experience");
    renderCrudPanel("experience", items, experienceForm, experienceRow, saveExperience, deleteExperience, "Add Experience");
}

function taggedForm(item = {}) {
    return `
        <form class="card" id="entity-form">
            <div class="grid">
                ${input("year", "Year", item.year)}
                ${input("title", "Title", item.title)}
                ${input("org", "Organization", item.org)}
                ${input("icon", "Icon class", item.icon || "fas fa-certificate")}
                ${input("sort_order", "Sort order", item.sort_order || 0, "number")}
                ${textarea("description", "Description", item.description)}
                ${textarea("tags", "Tags", arrayToLines(item.tags), "One tag per line")}
            </div>
            ${formActions(Boolean(item.id))}
        </form>
    `;
}

function taggedRow(item) {
    return `<h3>${item.title}</h3><p class="meta">${item.year} · ${item.org}</p><p class="meta">${(item.tags || []).join(", ")}</p>`;
}

function saveTagged(section) {
    return async (event) => {
        event.preventDefault();
        const data = formData(event.currentTarget);
        data.tags = linesToArray(data.tags || "");
        const id = state.editing;
        await request(`/${section}${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body: payload(data) });
        state.editing = null;
        setSection(section);
    };
}

function deleteTagged(section) {
    return async (id) => request(`/${section}/${id}`, { method: "DELETE" });
}

function experienceForm(item = {}) {
    return `
        <form class="card" id="entity-form">
            <div class="grid">
                ${input("role", "Role", item.role)}
                ${input("company", "Company", item.company)}
                ${input("duration", "Duration", item.duration)}
                ${input("icon", "Icon class", item.icon || "fas fa-briefcase")}
                ${input("sort_order", "Sort order", item.sort_order || 0, "number")}
                ${textarea("description", "Description bullets", arrayToLines(item.description), "One bullet per line")}
                ${textarea("skills", "Skills", arrayToLines(item.skills), "One skill per line")}
            </div>
            ${formActions(Boolean(item.id))}
        </form>
    `;
}

function experienceRow(item) {
    return `<h3>${item.role}</h3><p class="meta">${item.company} · ${item.duration}</p><p class="meta">${(item.skills || []).join(", ")}</p>`;
}

async function saveExperience(event) {
    event.preventDefault();
    const data = formData(event.currentTarget);
    data.description = linesToArray(data.description || "");
    data.skills = linesToArray(data.skills || "");
    const id = state.editing;
    await request(`/experience${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body: payload(data) });
    state.editing = null;
    setSection("experience");
}

async function deleteExperience(id) {
    await request(`/experience/${id}`, { method: "DELETE" });
}

function renderCrudPanel(section, items, makeForm, makeRow, saveHandler, deleteHandler, addTitle) {
    panel(section).innerHTML = `
        ${makeForm()}
        <div class="card">
            <h3>${addTitle.replace("Add", "Current")}</h3>
            <div class="list">
                ${items.map((item) => `
                    <div class="row">
                        <div>${makeRow(item)}</div>
                        <div class="row-actions">
                            <button class="btn secondary" data-edit="${item.id}">Edit</button>
                            <button class="btn danger" data-delete="${item.id}">Delete</button>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
    $("#entity-form").addEventListener("submit", saveHandler);
    panel(section).querySelectorAll("[data-edit]").forEach((button) => {
        button.addEventListener("click", () => {
            state.editing = Number(button.dataset.edit);
            const item = copy(items.find((entry) => entry.id === state.editing));
            panel(section).querySelector("#entity-form").outerHTML = makeForm(item);
            $("#entity-form").addEventListener("submit", saveHandler);
        });
    });
    panel(section).querySelectorAll("[data-delete]").forEach((button) => {
        button.addEventListener("click", async () => {
            if (!confirm("Delete this item?")) return;
            await deleteHandler(Number(button.dataset.delete));
            state.editing = null;
            setSection(section);
        });
    });
}

function formActions(editing) {
    return `
        <div class="form-actions">
            <button class="btn" type="submit">${editing ? "Save Changes" : "Add Item"}</button>
            ${editing ? `<button class="btn secondary" type="button" onclick="setSection('${state.section}')">Cancel</button>` : ""}
        </div>
    `;
}

function input(name, label, value = "", type = "text") {
    return `
        <label>
            ${label}
            <input type="${type}" name="${name}" value="${escapeAttr(value ?? "")}">
        </label>
    `;
}

function textarea(name, label, value = "", hint = "") {
    return `
        <label>
            ${label}
            ${hint ? `<span class="hint">${hint}</span>` : ""}
            <textarea name="${name}">${escapeHtml(value ?? "")}</textarea>
        </label>
    `;
}

function select(name, label, options, value = "") {
    return `
        <label>
            ${label}
            <select name="${name}">
                ${options.map(([optionValue, optionLabel]) => `
                    <option value="${optionValue}" ${String(optionValue) === String(value) ? "selected" : ""}>${escapeHtml(optionLabel)}</option>
                `).join("")}
            </select>
        </label>
    `;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
    return escapeHtml(value).replaceAll("'", "&#039;");
}

setSection("profile");
