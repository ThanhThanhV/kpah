export interface AuthSession {
  token: string;
  accountId: string;
  email: string;
  characterId: string;
  expiresAt: string;
}
interface AuthPrincipal { accountId: string; email: string; characterId: string; }
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
