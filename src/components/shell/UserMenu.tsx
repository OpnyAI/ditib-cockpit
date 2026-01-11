// src/components/shell/UserMenu.tsx
"use client";

/**
 * Minimaler Build-Fix:
 * - MobileNav importiert { UserMenu } (named export)
 * - Diese Datei hatte keine Exports -> Build Error
 *
 * WICHTIG:
 * - Kein Design/Markup wird verändert, weil wir hier bewusst nichts rendern.
 * - Funktionalität können wir im nächsten Schritt sauber implementieren,
 *   sobald wir den gewünschten UserMenu-UX definieren oder den alten Stand wiederherstellen.
 */
export function UserMenu() {
  return null;
}

export default UserMenu;
