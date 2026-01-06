// src/lib/http/auth.ts
// Ten plik zarządza tokenami JWT w localStorage (lub sessionStorage).
// Możesz go łatwo przerobić pod cookies / Secure Storage / IndexedDB.
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
/**
 * Pobiera aktualny access token z localStorage.
 * Używane przez HttpClient do dodania nagłówka Authorization.
 */
export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}
/**
 * Zapisuje tokeny po udanym logowaniu lub odświeżeniu.
 */
export function setTokens(accessToken, refreshToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken)
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}
/**
 * Usuwa tokeny (np. przy wylogowaniu).
 */
export function clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}
/**
 * Funkcja wywoływana automatycznie przez HttpClient, gdy backend zwróci 401.
 * Próbuje odświeżyć token przy użyciu refresh_token.
 */
export async function refreshToken() {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refresh)
        return null;
    try {
        const response = await fetch(`${import.meta.env.VITE_API_AUTH}/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken: refresh }),
            credentials: "include", // jeśli serwer używa cookies
        });
        if (!response.ok) {
            console.warn("❌ Refresh token invalid, clearing tokens...");
            clearTokens();
            return null;
        }
        const data = await response.json();
        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;
        setTokens(newAccessToken, newRefreshToken);
        console.info("✅ Access token refreshed successfully");
        return newAccessToken;
    }
    catch (error) {
        console.error("⚠️ Token refresh failed:", error);
        clearTokens();
        return null;
    }
}
/**
 * Prosty helper do loginu (dla przykładu)
 * - W praktyce zrobisz to w module auth API.
 */
export async function login(username, password) {
    const response = await fetch(`${import.meta.env.VITE_API_AUTH}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
    });
    if (!response.ok)
        return false;
    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
}
/**
 * Wylogowanie użytkownika
 */
export async function logout() {
    try {
        await fetch(`${import.meta.env.VITE_API_AUTH}/auth/logout`, {
            method: "POST",
            credentials: "include",
        });
    }
    catch {
        // ignorujemy błąd, np. jeśli użytkownik jest offline
    }
    finally {
        clearTokens();
    }
}
