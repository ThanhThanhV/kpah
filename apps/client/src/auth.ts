export interface AuthSession {
  token: string;
  accountId: string;
  email: string;
  characterId: string;
  expiresAt: string;
}
interface AuthPrincipal { accountId: string; email: string; characterId: string; }
export interface CharacterSummary { characterId: string; name: string; classCode: string; mapId: string; hp: number; experience: number; }
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json() as { message?: string; detail?: string; error?: string };
    return body.message || body.detail || body.error || "Request failed (" + response.status + ")";
  } catch { return "Request failed (" + response.status + ")"; }
}

export async function restoreAuthSession(): Promise<AuthSession | null> {
  const token = localStorage.getItem("kpah.sessionToken");
  if (!token) return null;
  const response = await fetch(API_BASE + "/api/auth/me", {
    headers: { Authorization: "Bearer " + token }
  });
  if (!response.ok) {
    localStorage.removeItem("kpah.sessionToken");
    localStorage.removeItem("kpah.characterId");
    return null;
  }
  const principal = await response.json() as AuthPrincipal;
  const session: AuthSession = {
    token, accountId: principal.accountId, email: principal.email,
    characterId: principal.characterId, expiresAt: ""
  };
  localStorage.setItem("kpah.characterId", session.characterId);
  return session;
}

export async function authenticate(
  mode: "login" | "register", email: string, password: string
): Promise<AuthSession> {
  const response = await fetch(API_BASE + "/api/auth/" + mode, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  const session = await response.json() as AuthSession;
  localStorage.setItem("kpah.sessionToken", session.token);
  localStorage.setItem("kpah.characterId", session.characterId);
  return session;
}

export async function revokeAuthSession(): Promise<void> {
  const token = localStorage.getItem("kpah.sessionToken");
  if (token) {
    await fetch(API_BASE + "/api/auth/logout", {
      method: "POST", headers: { Authorization: "Bearer " + token }
    }).catch(() => undefined);
  }
  localStorage.removeItem("kpah.sessionToken");
  localStorage.removeItem("kpah.characterId");
}

export function renderAuthScreen(
  root: HTMLElement, onAuthenticated: (session: AuthSession) => void
): void {
  let mode: "login" | "register" = "login";
  root.hidden = false;
  root.innerHTML = `
    <section class="auth-card">
      <div class="auth-kicker">KPAH-STYLE MMORPG · ACCOUNT</div>
      <h1 id="auth-title">Welcome back</h1>
      <p id="auth-description">Sign in to continue your adventure.</p>
      <form id="auth-form">
        <label for="auth-email">Email</label>
        <input id="auth-email" name="email" type="email" autocomplete="email"
          maxlength="254" placeholder="you@example.com" required />
        <label for="auth-password">Password</label>
        <input id="auth-password" name="password" type="password"
          autocomplete="current-password" minlength="10" maxlength="128"
          placeholder="At least 10 characters" required />
        <p id="auth-error" role="alert" aria-live="polite"></p>
        <button id="auth-submit" type="submit">Sign in</button>
      </form>
      <button id="auth-toggle" class="auth-link" type="button">Create a new account</button>
      <small>Sessions expire after 30 days. Use HTTPS when deployed publicly.</small>
    </section>`;
  const form = root.querySelector<HTMLFormElement>("#auth-form")!;
  const title = root.querySelector<HTMLHeadingElement>("#auth-title")!;
  const description = root.querySelector<HTMLParagraphElement>("#auth-description")!;
  const submit = root.querySelector<HTMLButtonElement>("#auth-submit")!;
  const toggle = root.querySelector<HTMLButtonElement>("#auth-toggle")!;
  const password = root.querySelector<HTMLInputElement>("#auth-password")!;
  const error = root.querySelector<HTMLElement>("#auth-error")!;
  toggle.addEventListener("click", () => {
    mode = mode === "login" ? "register" : "login";
    title.textContent = mode === "login" ? "Welcome back" : "Create your account";
    description.textContent = mode === "login"
      ? "Sign in to continue your adventure."
      : "Your character and progress will be saved to this account.";
    submit.textContent = mode === "login" ? "Sign in" : "Create account";
    toggle.textContent = mode === "login" ? "Create a new account" : "I already have an account";
    password.autocomplete = mode === "login" ? "current-password" : "new-password";
    error.textContent = "";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const secret = String(data.get("password") || "");
    submit.disabled = true;
    submit.textContent = mode === "login" ? "Signing in…" : "Creating account…";
    error.textContent = "";
    try { onAuthenticated(await authenticate(mode, email, secret)); }
    catch (failure) {
      error.textContent = failure instanceof Error ? failure.message : "Unable to authenticate.";
      submit.disabled = false;
      submit.textContent = mode === "login" ? "Sign in" : "Create account";
    }
  });
}

async function authenticatedRequest<T>(path: string, session: AuthSession, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(API_BASE + path, {
    method,
    headers: {
      Authorization: "Bearer " + session.token,
      ...(body === undefined ? {} : { "Content-Type": "application/json" })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as T;
}

export async function listCharacters(session: AuthSession): Promise<CharacterSummary[]> {
  return authenticatedRequest<CharacterSummary[]>("/api/auth/characters", session);
}

export async function createCharacter(
  session: AuthSession, name: string, classCode: string
): Promise<CharacterSummary> {
  return authenticatedRequest<CharacterSummary>("/api/auth/characters", session, "POST", { name, classCode });
}

export async function selectCharacter(
  session: AuthSession, characterId: string
): Promise<AuthSession> {
  const principal = await authenticatedRequest<AuthPrincipal>(
    "/api/auth/select-character", session, "POST", { characterId }
  );
  const selected = { ...session, characterId: principal.characterId };
  localStorage.setItem("kpah.characterId", selected.characterId);
  return selected;
}

export function renderCharacterSelection(
  root: HTMLElement, session: AuthSession, onSelected: (session: AuthSession) => void
): void {
  root.hidden = false;
  root.innerHTML = `
    <section class="auth-card character-select-card">
      <div id="character-account" class="auth-kicker">ACCOUNT</div>
      <h1>Choose your character</h1>
      <p>Each account can keep up to three characters. Your progress is saved separately.</p>
      <div id="character-list" class="character-list">Loading characters…</div>
      <form id="character-create-form" class="character-create-form">
        <h2>Create a character</h2>
        <label for="character-name">Character name</label>
        <input id="character-name" name="name" minlength="3" maxlength="20"
          placeholder="3–20 characters" required />
        <label for="character-class">Class</label>
        <select id="character-class" name="classCode">
          <option value="warrior">Warrior · 120 HP · +3 ATK · +2 DEF</option>
          <option value="mage">Mage · 90 HP · +8 ATK</option>
          <option value="archer">Archer · 100 HP · +5 ATK · +1 DEF</option>
        </select>
        <p id="character-error" role="alert" aria-live="polite"></p>
        <button type="submit">Create character</button>
      </form>
    </section>`;
  root.querySelector<HTMLElement>("#character-account")!.textContent = "ACCOUNT · " + session.email;
  const list = root.querySelector<HTMLElement>("#character-list")!;
  const form = root.querySelector<HTMLFormElement>("#character-create-form")!;
  const error = root.querySelector<HTMLElement>("#character-error")!;

  const enter = async (characterId: string, button: HTMLButtonElement) => {
    button.disabled = true;
    button.textContent = "Entering…";
    try { onSelected(await selectCharacter(session, characterId)); }
    catch (failure) {
      error.textContent = failure instanceof Error ? failure.message : "Unable to select character.";
      button.disabled = false;
      button.textContent = "Enter world";
    }
  };

  const refresh = async () => {
    const characters = await listCharacters(session);
    list.innerHTML = "";
    characters.forEach((character) => {
      const card = document.createElement("article");
      card.className = "character-card";
      const details = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = character.name;
      const meta = document.createElement("span");
      const classStats = {
        warrior: "120 HP · +3 ATK · +2 DEF",
        mage: "90 HP · +8 ATK",
        archer: "100 HP · +5 ATK · +1 DEF"
      }[character.classCode] ?? "";
      meta.textContent = character.classCode.toUpperCase() + " · " + classStats
        + " · Lv " + (Math.floor(character.experience / 100) + 1);
      details.append(name, meta);
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Enter world";
      button.addEventListener("click", () => void enter(character.characterId, button));
      card.append(details, button);
      list.append(card);
    });
    form.hidden = characters.length >= 3;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const classCode = String(data.get("classCode") || "warrior");
    const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
    button.disabled = true;
    error.textContent = "";
    try {
      const created = await createCharacter(session, name, classCode);
      await enter(created.characterId, button);
    } catch (failure) {
      error.textContent = failure instanceof Error ? failure.message : "Unable to create character.";
      button.disabled = false;
    }
  });

  void refresh().catch((failure) => {
    list.textContent = failure instanceof Error ? failure.message : "Unable to load characters.";
  });
}
